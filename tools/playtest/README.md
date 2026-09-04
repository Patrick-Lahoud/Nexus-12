# AI Playtesting & Balance Bot

Headless AI playtesting for **Boundless Blade** against the *real* game engine
(no browser, no canvas, no audio). Drives full CAMPAIGN attempts (rooms 1–100,
boss every 10) with probabilistic human-like player policies, audits
progression against the spec's attempt benchmarks, and can micro-adjust global
enemy difficulty with delta caps + rollback.

## Usage

```bash
npm run playtest                      # 20 attempts, policies rotate, dry-run audit
npm run audit:balance                 # alias: 20 attempts, all policies

npx tsx tools/playtest/run.ts --runs=100 --tune --batch=10   # + auto-tune
npx tsx tools/playtest/run.ts --runs=10 --policy=defensive
npx tsx tools/playtest/run.ts --runs=1 --seed=42             # deterministic

# Validation-only QA levers (clearly separated from balance tuning):
npx tsx tools/playtest/run.ts --runs=1 --hp-mult=0.003 --dmg-mult=0.008 \
  --player-hp-mult=40      # exercises deep rooms / boss 100 / victory path
```

Flags: `--runs`, `--policy=all|aggressive|defensive|glasscannon`, `--tune`,
`--seed`, `--batch` (audit window, default 10), `--room-cap`/`--total-cap`
(sim-second stall caps), `--outdir`. Reports (JSON + Markdown + a
`compendium-sync.md`) land in `tools/playtest/reports/`.

## Architecture

| File | Role |
| --- | --- |
| `run.ts` | CLI: shims → attempts → batch audits → tuning → reports |
| `shims.ts` | localStorage/window/AudioContext stubs + fake `Date.now` sim clock |
| `campaign.ts` | Driver: replicates App.tsx campaign sequencing per attempt |
| `campaignUpgrade.ts` | Headless mirror of App's campaign upgrade application |
| `policies.ts` | Probabilistic policies: movement intent + dodging + picks |
| `audit.ts` | Batch verdicts (5% band), tuning decisions, rollback, 500-run cap |
| `src/game/balance.ts` | Neutral (1.0) tunables registry consumed by the engine |

Engine changes are confined to choke points: enemy/boss HP at spawn and
player-damage application (including the three raw damage paths — TESLA_COIL
zaps, PLASMA_STORMER ion zones, BIO_LEECH drains — which otherwise bypass the
damage pipeline). All knobs default to 1.0, so shipping gameplay is unchanged.

## Spec mapping & assumptions

- **Attempts 5/10/15/20 gates** (rooms 40 / boss 50 / 70 / boss 100) are
  reported per attempt; periodic tuning runs every `--batch` attempts (default
  10). Batch target pass-rates are calibration defaults in `audit.ts`
  (`reach_40` 90%, `clear_50` 75%, `reach_70` 70%, `clear_100` 50%).
- **Delta cap** ±2% per iteration; knobs bounded to `[0.5, 2.0]`.
- **Rollback** restores the pre-tweak snapshot when a tweak drops aggregate
  pass rate by >5%.
- **Session cap**: 500 runs; the CLI refuses to exceed it and prints a manual
  confirmation log line.
- **Fidelity assumptions** (documented, not hidden): upgrade application and
  room formulas mirror App.tsx 1:1 for the campaign path; mid-run shop/credit
  spending and the revive mechanic are not modeled; one upgrade pick per clear
  (boss rooms grant the pool's boss-reward weighting, not an extra pick).
- Cooldowns keyed on `Date.now()` are driven by a fake sim clock, so weapons,
  abilities, and enemy attacks obey their real cadence at any sim speed
  (~300× realtime on this machine).

## Findings from the first sessions

- The AI policies are intentionally imperfect; at neutral balance they clear
  ~13–26 rooms and die by attrition. The tuning loop therefore eases enemies
  each batch — an expected calibration outcome, not an engine fault.
- Mechanic validation passed end-to-end: a full 100-room run including all
  bosses and the room-100 ultra boss completes without crashes or desync
  (~16 sim-minutes).
- Late-game crossfire chip damage (rooms 60+) is the dominant pressure source;
  it bypassed the old single choke point (fixed by scaling the raw damage
  paths above).
