/**
 * Balance Tunables Registry
 * -------------------------
 * Shared between the game engine and the AI playtest/balance bot
 * (tools/playtest/*). Defaults are neutral (1.0), so shipping gameplay is
 * unaffected. The playtest harness mutates these values within a single
 * Node process to run balance experiments, with delta caps + rollback
 * enforced by tools/playtest/audit.ts.
 */
export interface BalanceTunables {
  /** Global multiplier applied to enemy (and boss) max HP at spawn. */
  enemyHpMult: number;
  /** Global multiplier applied to incoming damage dealt to the player. */
  enemyDmgMult: number;
}

export const balance: BalanceTunables = {
  enemyHpMult: 1.0,
  enemyDmgMult: 1.0,
};

/** Reset both knobs to neutral. */
export function resetBalance(): void {
  balance.enemyHpMult = 1.0;
  balance.enemyDmgMult = 1.0;
}

export function snapshotBalance(): BalanceTunables {
  return { enemyHpMult: balance.enemyHpMult, enemyDmgMult: balance.enemyDmgMult };
}

export function restoreBalance(snap: BalanceTunables): void {
  balance.enemyHpMult = snap.enemyHpMult;
  balance.enemyDmgMult = snap.enemyDmgMult;
}
