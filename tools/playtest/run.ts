#!/usr/bin/env tsx
/**
 * AI Playtesting & Balance Bot — CLI entry point.
 *
 * Usage:
 *   npm run playtest -- --runs=20 --policy=all
 *   npm run playtest -- --runs=100 --tune --seed=42 --outdir=tools/playtest/reports
 *
 * Runs headless HARDCORE-style attempts against the REAL game engine (rooms
 * 1..100, boss rooms every 10) with probabilistic human-like policies.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installShims } from './shims.ts';
import { makePolicy, type Policy, type PolicyName } from './policies.ts';
import { runAttempt, type AttemptResult } from './campaign.ts';
import {
  auditBatch,
  decideTweak,
  summarize,
  SESSION_RUN_CAP,
  TOLERANCE,
  MAX_DELTA,
  MILESTONES,
  type TuneDecision,
} from './audit.ts';
import { balance as balanceKnobs, snapshotBalance, resetBalance } from '../../src/game/balance.ts';
import type { GameEngine } from '../../src/game/engine.ts';

interface Args {
  runs: number;
  policy: PolicyName | 'all';
  tune: boolean;
  seed?: number;
  batch: number;
  outdir: string;
  quiet: boolean;
  roomCap: number;
  totalCap: number;
  hpMult: number | null;
  dmgMult: number | null;
  /** Validation-only QA lever: multiply player max HP after engine creation. */
  playerHpMult: number | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    runs: 20,
    policy: 'all',
    tune: false,
    batch: 10,
    outdir: 'tools/playtest/reports',
    quiet: false,
    roomCap: 300,
    totalCap: 3600,
    hpMult: null,
    dmgMult: null,
    playerHpMult: null,
  };
  for (const a of argv) {
    const [k, v] = a.split('=');
    if (k === '--runs') args.runs = parseInt(v, 10);
    else if (k === '--policy') args.policy = v as Args['policy'];
    else if (k === '--tune') args.tune = true;
    else if (k === '--seed') args.seed = parseInt(v, 10);
    else if (k === '--batch') args.batch = Math.max(1, parseInt(v, 10));
    else if (k === '--outdir') args.outdir = v;
    else if (k === '--quiet') args.quiet = true;
    else if (k === '--room-cap') args.roomCap = parseFloat(v);
    else if (k === '--total-cap') args.totalCap = parseFloat(v);
    else if (k === '--hp-mult') args.hpMult = parseFloat(v);
    else if (k === '--dmg-mult') args.dmgMult = parseFloat(v);
    else if (k === '--player-hp-mult') args.playerHpMult = parseFloat(v);
  }
  return args;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // ---- browser shims + fake sim clock MUST precede engine module load ----
  installShims();
  if (args.seed !== undefined) {
    Math.random = mulberry32(args.seed);
  }
  const engineModule = await import('../../src/game/engine.ts');
  const GameEngine: typeof import('../../src/game/engine.ts').GameEngine = engineModule.GameEngine;

  if (args.runs > SESSION_RUN_CAP) {
    console.log(`\n[guard] session cap is ${SESSION_RUN_CAP} runs — refusing ${args.runs}.`);
    console.log('[guard] MANUAL CONFIRMATION REQUIRED to extend a session beyond the cap.');
    process.exit(1);
  }

  resetBalance();
  if (args.hpMult !== null) balanceKnobs.enemyHpMult = args.hpMult;
  if (args.dmgMult !== null) balanceKnobs.enemyDmgMult = args.dmgMult;
  mkdirSync(args.outdir, { recursive: true });

  const policies: Policy[] =
    args.policy === 'all'
      ? (['aggressive', 'defensive', 'glasscannon'] as PolicyName[]).map(p => makePolicy(p))
      : [makePolicy(args.policy)];

  const playerHpMult = args.playerHpMult;
  const createEngine = () => {
    const eng = new GameEngine(800, 600) as GameEngine;
    if (playerHpMult && playerHpMult > 1) {
      eng.player.maxHp = Math.round(eng.player.maxHp * playerHpMult);
      eng.player.hp = eng.player.maxHp;
    }
    return eng;
  };

  const tuneState = { prevTunables: null as any, prevRates: null as any, prevTuneApplied: false };
  const runs: AttemptResult[] = [];
  const tuneLog: TuneDecision[] = [];
  let tweakCount = 0;
  const startedAt = performance.now();

  const stamp = (s: string) => {
    if (!args.quiet) console.log(s);
  };

  for (let attempt = 1; attempt <= args.runs; attempt++) {
    const policy = policies[(attempt - 1) % policies.length];
    const t0 = performance.now();
    const res = runAttempt({
      attempt,
      policy,
      createEngine,
      roomTimeCapSec: args.roomCap,
      totalTimeCapSec: args.totalCap,
    });
    const wallMs = Math.round(performance.now() - t0);
    runs.push(res);
    const depth = res.outcome === 'victory' ? 100 : res.roomsCleared;
    const status = res.outcome === 'victory' ? '🏆 VICTORY' : res.outcome === 'death' ? `died room ${res.diedAtRoom}` : `STALL room ${res.diedAtRoom}`;
    stamp(`attempt ${attempt} [${res.policy.padEnd(12)}] cleared ${String(depth).padStart(3)} ${status.padEnd(22)} sim ${(res.simSeconds / 60).toFixed(1)}m wall ${wallMs}ms`);

    // periodic batch audit every `batch` attempts
    if (attempt % args.batch === 0) {
      const batchRuns = runs.slice(attempt - args.batch, attempt);
      const verdicts = auditBatch(batchRuns);
      const failing = verdicts.filter(v => v.verdict !== 'ok');
      stamp(`  batch ${attempt / args.batch} (attempts ${attempt - args.batch + 1}-${attempt}): ` +
        verdicts.map(v => `${v.milestone.label}: ${Math.round(v.passRate * 100)}% (target ${Math.round(v.milestone.targetRate * 100)}%)`).join(' | '));

      if (args.tune) {
        const decision = decideTweak(tuneState, verdicts, batchRuns, tweakCount);
        if (decision.action !== 'none') {
          tuneLog.push(decision);
          tweakCount++;
          stamp(`  → tune [${decision.action}] ${decision.knob}=${decision.appliedTo} — ${decision.reason}`);
        }
      }
    }
  }

  // ----------------------------- report -----------------------------
  const summary = summarize(runs);
  const finalBalance = snapshotBalance();
  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
    runs: runs.length,
    seed: args.seed ?? null,
    policies: args.policy,
    toleranceBand: TOLERANCE,
    maxDeltaPerTweak: MAX_DELTA,
    tuneEnabled: args.tune,
    sessionCap: SESSION_RUN_CAP,
    validationLevers: { playerHpMult: args.playerHpMult },
  },
    balanceTunables: finalBalance,
    summary,
    milestones: MILESTONES.map(m => ({
      key: m.key,
      label: m.label,
      firstGateAttempt: m.firstGateAttempt,
      targetRate: m.targetRate,
      attemptsToDate: runs.length,
    })),
    tuneLog,
    runs: runs.map(r => ({
      attempt: r.attempt,
      policy: r.policy,
      outcome: r.outcome,
      roomsCleared: r.roomsCleared,
      diedAtRoom: r.diedAtRoom,
      clearedBoss50: r.clearedBoss50,
      clearedBoss100: r.clearedBoss100,
      simMinutes: Math.round(r.simSeconds / 60 * 10) / 10,
      damageTaken: r.damageTaken,
      hpLeft: r.hpLeft,
      maxHp: r.maxHp,
      rooms: r.rooms.map(rm => ({ room: rm.room, boss: rm.isBoss, timeSec: rm.simSeconds, dmg: rm.damageTaken, hpEnd: rm.hpEnd })),
    })),
  };

  const jsonPath = join(args.outdir, `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = renderMarkdown(report);
  const mdPath = join(args.outdir, `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  writeFileSync(mdPath, md);
  writeFileSync(join(args.outdir, 'compendium-sync.md'), renderCompendiumSync(report));

  console.log('\n================ PLAYTEST AUDIT ================');
  console.log(renderConsoleSummary(report));
  console.log(`reports: ${jsonPath}\n         ${mdPath}`);
  console.log(`elapsed ${Math.round((performance.now() - startedAt) / 1000)}s (${args.runs} runs)`);
  if (args.runs >= SESSION_RUN_CAP) {
    console.log(`\n[guard] ${SESSION_RUN_CAP}-run session cap reached. MANUAL CONFIRMATION REQUIRED before any further tuning.`);
  }
}

function renderConsoleSummary(report: any): string {
  const s = report.summary;
  const lines = [
    `runs           : ${s.attempts}`,
    `avg rooms      : ${s.avgRoomsCleared}`,
    `victories      : ${s.victories} (${s.victoryRate}%)`,
    `avg sim length : ${s.avgSimMinutes}m per attempt`,
    `tunables       : enemyHpMult=${report.balanceTunables.enemyHpMult} enemyDmgMult=${report.balanceTunables.enemyDmgMult}`,
    `attempt 5 depth (expect ≥40) : ${s.attempt5Depth ?? 'n/a'}`,
    `attempt 10 depth (expect 50 boss clear) : ${s.attempt10Depth ?? 'n/a'}`,
    `attempt 15 depth (expect ≥70) : ${s.attempt15Depth ?? 'n/a'}`,
    `attempt 20 depth (expect 100 boss clear) : ${s.attempt20Depth ?? 'n/a'}`,
  ];
  if (report.tuneLog.length) {
    lines.push('tune log:');
    report.tuneLog.forEach((d: any) => lines.push(`  - [${d.action}] ${d.knob} = ${d.appliedTo} (${d.reason})`));
  }
  return lines.join('\n');
}

function renderMarkdown(report: any): string {
  const s = report.summary;
  const rows = report.runs
    .map(
      (r: any) =>
        `| ${r.attempt} | ${r.policy} | ${r.outcome} | ${r.roomsCleared} | ${r.diedAtRoom ?? '-'} | ${r.clearedBoss50 ? '✅' : '—'} | ${r.clearedBoss100 ? '✅' : '—'} | ${r.simMinutes} | ${r.damageTaken} |`,
    )
    .join('\n');
  return `# AI Playtest Audit
- runs: ${s.attempts}, avg rooms cleared: ${s.avgRoomsCleared}, victories: ${s.victories} (${s.victoryRate}%)
- tunables: enemyHpMult=${report.balanceTunables.enemyHpMult}, enemyDmgMult=${report.balanceTunables.enemyDmgMult}
- benchmarks: attempt5=${s.attempt5Depth ?? '-'} (≥40), attempt10=${s.attempt10Depth ?? '-'} (boss 50), attempt15=${s.attempt15Depth ?? '-'} (≥70), attempt20=${s.attempt20Depth ?? '-'} (boss 100)

| attempt | policy | outcome | cleared | diedAt | boss50 | boss100 | simMin | dmgTaken |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

/** Mechanic Validation + Compendium sync entry point (spec section 4). */
function renderCompendiumSync(report: any): string {
  const s = report.summary;
  return `# Compendium Balance Sync (auto-generated)

> Generated by the AI Playtest & Balance Bot. Player-facing entries below reflect
> the CURRENT validated balance state in real-time.

## Validated mechanics (this session)
- Campaign depth benchmarks (rooms 40 / 50 / 70 / 100) exercised headlessly over ${s.attempts} attempts.
- Average depth reached: ${s.avgRoomsCleared} rooms (target 100).
- Victory rate vs boss 100: ${s.victoryRate}%.

## Live balance state
| Attribute | Value |
| --- | --- |
| Enemy global HP multiplier | ${report.balanceTunables.enemyHpMult} |
| Enemy global damage multiplier | ${report.balanceTunables.enemyDmgMult} |
| Delta cap / iteration | ±${MAX_DELTA * 100}% |
| Session run cap | ${SESSION_RUN_CAP} |

## Tuning history this session
${report.tuneLog.length ? report.tuneLog.map((d: any) => `- [${d.action}] ${d.knob} → ${d.appliedTo} — ${d.reason}`).join('\n') : '- none'}
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(err => {
    console.error('playtest failed:', err);
    process.exit(1);
  });
}
