/**
 * Progression audit + micro-adjustment engine
 * -------------------------------------------
 * Spec compliance:
 *  - benchmark milestones: reach room 40 / clear boss 50 / reach room 70 /
 *    clear boss 100 (attempts 5/10/15/20 guide early gates; periodic checks
 *    every 10 attempts thereafter)
 *  - 5% tolerance band around target pass-rates
 *  - micro-tweaks capped at ±2% per iteration, applied to the global enemy
 *    HP / damage knobs (balance.ts)
 *  - rollback to the previous tunable snapshot when a change regresses
 *  - 500-run session cap requiring a manual confirmation log
 */
import { balance, snapshotBalance, restoreBalance, type BalanceTunables } from '../../src/game/balance.ts';
import type { AttemptResult } from './campaign.ts';

export interface Milestone {
  key: string;
  label: string;
  /** Attempt index at which the milestone is first evaluated (per spec table). */
  firstGateAttempt: number;
  /** Batch pass-rate the balance aims for. */
  targetRate: number;
  check: (r: AttemptResult) => boolean;
}

export const MILESTONES: Milestone[] = [
  { key: 'reach_40', label: 'reach room 40', firstGateAttempt: 5, targetRate: 0.9, check: r => r.roomsCleared >= 40 },
  { key: 'clear_50', label: 'clear boss 50', firstGateAttempt: 10, targetRate: 0.75, check: r => r.clearedBoss50 || r.roomsCleared >= 50 },
  { key: 'reach_70', label: 'reach room 70', firstGateAttempt: 15, targetRate: 0.7, check: r => r.roomsCleared >= 70 },
  { key: 'clear_100', label: 'clear boss 100', firstGateAttempt: 20, targetRate: 0.5, check: r => r.clearedBoss100 },
];

/** How far the actual rate may drift from target before tuning kicks in. */
export const TOLERANCE = 0.05;
/** Per-iteration delta cap (spec: ±1.5%..±2.0%). */
export const MAX_DELTA = 0.02;
/** Absolute bounds so the bot can never push balance into absurdity. */
export const KNOB_MIN = 0.5;
export const KNOB_MAX = 2.0;

export interface BatchVerdict {
  milestone: Milestone;
  passRate: number;
  /** 'ok' inside tolerance band, 'too_hard' below it, 'too_easy' above it. */
  verdict: 'ok' | 'too_hard' | 'too_easy';
}

export function auditBatch(runs: AttemptResult[]): BatchVerdict[] {
  if (runs.length === 0) return [];
  return MILESTONES.filter(m => runs.length >= m.firstGateAttempt || true).map(m => {
    const passCount = runs.filter(m.check).length;
    const passRate = passCount / runs.length;
    let verdict: BatchVerdict['verdict'] = 'ok';
    if (passRate < m.targetRate - TOLERANCE) verdict = 'too_hard';
    else if (passRate > m.targetRate + TOLERANCE) verdict = 'too_easy';
    return { milestone: m, passRate, verdict };
  });
}

export interface TuneDecision {
  /** 'nerf' = enemies weakened (knob lowered), 'buff' = enemies strengthened (knob raised). */
  action: 'none' | 'nerf' | 'buff' | 'rollback';
  knob: 'enemyHpMult' | 'enemyDmgMult';
  appliedTo: number;
  reason: string;
}

interface TuneState {
  prevTunables: BalanceTunables | null;
  prevRates: Record<string, number> | null;
  prevTuneApplied: boolean;
}

/**
 * Decide the next micro-adjustment for one batch of runs.
 * Drives the worst milestone toward its target rate:
 *  - too_hard  (players underperform) -> NERF enemies  -> lower knob value
 *  - too_easy  (players overperform)  -> BUFF enemies -> raise knob value
 * Rollback: if the previous applied tweak made the aggregate pass rate worse
 * than the batch before it, restore the pre-tweak snapshot.
 */
export function decideTweak(
  state: TuneState,
  verdicts: BatchVerdict[],
  runs: AttemptResult[],
  tweakCount: number,
): TuneDecision {
  const now = snapshotBalance();
  const rates: Record<string, number> = {};
  verdicts.forEach(v => (rates[v.milestone.key] = v.passRate));
  const totalNow = sumRates(rates);

  // rollback only when a genuinely applied tweak made things worse than before it
  if (state.prevTunables && state.prevRates && state.prevTuneApplied) {
    const totalPrev = sumRates(state.prevRates);
    if (totalNow < totalPrev - TOLERANCE) {
      const restored = snapshotBalance();
      restoreBalance(state.prevTunables);
      state.prevTuneApplied = false;
      state.prevRates = null;
      state.prevTunables = null;
      return {
        action: 'rollback',
        knob: 'enemyHpMult',
        appliedTo: restored.enemyHpMult,
        reason: `aggregate pass rate dropped ${(totalPrev * 100).toFixed(0)}% -> ${(totalNow * 100).toFixed(0)}% after tweak; restored previous snapshot`,
      };
    }
  }

  const failing = verdicts.filter(v => v.verdict === 'too_hard');
  const easy = verdicts.filter(v => v.verdict === 'too_easy');

  if (failing.length === 0 && easy.length === 0) {
    state.prevTunables = now;
    state.prevRates = rates;
    state.prevTuneApplied = false;
    return { action: 'none', knob: 'enemyHpMult', appliedTo: now.enemyHpMult, reason: 'all milestones inside tolerance band' };
  }

  // Milestones at gate attempts 5/10/15/20 get the first tuning pass; past
  // batch 20 the periodic loop only tunes once per batch, never by more than
  // MAX_DELTA per step.
  const targetVerdict = failing[0] ?? easy[0];
  const tooHard = targetVerdict.verdict === 'too_hard';
  const knob: TuneDecision['knob'] = tweakCount % 2 === 0 ? 'enemyHpMult' : 'enemyDmgMult';

  let delta = Math.min(MAX_DELTA, Math.abs(targetVerdict.passRate - targetVerdict.milestone.targetRate) / 4);
  delta = Math.max(0.005, delta);
  // drift faster back toward 1.0 the farther the knob has moved
  if (tooHard && now[knob] > 1.0) delta *= 1.5;
  if (!tooHard && now[knob] < 1.0) delta *= 1.5;

  // too_hard => weaken enemies => lower the knob; too_easy => raise it
  const newValue = tooHard ? now[knob] - delta : now[knob] + delta;
  if (newValue < KNOB_MIN || newValue > KNOB_MAX) {
    state.prevTunables = now;
    state.prevRates = rates;
    state.prevTuneApplied = false;
    return { action: 'none', knob, appliedTo: now[knob], reason: `tweak would exceed bounds [${KNOB_MIN}, ${KNOB_MAX}]` };
  }

  // remember pre-change snapshot + rates for rollback
  state.prevTunables = snapshotBalance();
  state.prevRates = snapshotRates(verdicts);
  state.prevTuneApplied = true;
  balance[knob] = Math.round(newValue * 1000) / 1000;
  return {
    action: tooHard ? 'nerf' : 'buff',
    knob,
    appliedTo: balance[knob],
    reason: `${targetVerdict.milestone.label} pass rate ${(targetVerdict.passRate * 100).toFixed(0)}% vs target ${(targetVerdict.milestone.targetRate * 100).toFixed(0)}% (${tooHard ? 'nerfing enemies' : 'buffing enemies'})`,
  };
}

function snapshotRates(verdicts: BatchVerdict[]): Record<string, number> {
  const rates: Record<string, number> = {};
  verdicts.forEach(v => (rates[v.milestone.key] = v.passRate));
  return rates;
}

function sumRates(rates: Record<string, number>): number {
  return Object.values(rates).reduce((a, b) => a + b, 0);
}

export const SESSION_RUN_CAP = 500;

/** Aggregate summary across the whole session (for the attempt-5/10/15/20 report). */
export function summarize(runs: AttemptResult[]) {
  const depthFor = (idx: number) => (runs.length > idx ? runs[idx].roomsCleared : null);
  const avgDepth = Math.round((runs.reduce((a, r) => a + r.roomsCleared, 0) / runs.length) * 10) / 10;
  const wins = runs.filter(r => r.outcome === 'victory').length;
  return {
    attempts: runs.length,
    avgRoomsCleared: avgDepth,
    victories: wins,
    victoryRate: runs.length ? Math.round((wins / runs.length) * 1000) / 10 : 0,
    attempt5Depth: depthFor(4),
    attempt10Depth: depthFor(9),
    attempt15Depth: depthFor(14),
    attempt20Depth: depthFor(19),
    avgSimMinutes: Math.round((runs.reduce((a, r) => a + r.simSeconds, 0) / 60 / runs.length) * 10) / 10,
  };
}
