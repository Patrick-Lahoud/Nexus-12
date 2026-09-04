/**
 * Probabilistic player policies (headless)
 * ---------------------------------------
 * Emulates natural human input rather than perfect play:
 *  - intent changes at 170-330ms cadence (reaction time)
 *  - steering toward the current intent is continuous per-frame
 *  - occasional misinputs, wasted abilities, dud picks
 *  - archetype-specific positioning bands & build preferences
 */
import type { GameEngine } from '../../src/game/engine.ts';
import type { Upgrade } from '../../src/game/upgrades.ts';
import { WeaponType, AbilityType } from '../../src/game/types.ts';

export type PolicyName = 'aggressive' | 'defensive' | 'glasscannon';

export interface PolicyCtx {
  engine: GameEngine;
  /** Wall-clock sim time in ms (fake Date.now). */
  now: number;
}

export interface Policy {
  name: PolicyName;
  /** Called every sim frame to steer toward the current intent. */
  onFrame(ctx: PolicyCtx, dt: number): void;
  /** Choose one upgrade from the offered pool. */
  pick(ctx: PolicyCtx, pool: Upgrade[]): Upgrade;
  /** Cooldown between intent changes in ms (reaction time), randomized each tick. */
  reactionMs(): number;
}

// ---------------------------------------------------------------- movement

const W = 800;
const H = 600;

function clampToArena(x: number, y: number, margin: number): { x: number; y: number } {
  return {
    x: Math.min(W - margin, Math.max(margin, x)),
    y: Math.min(H - margin, Math.max(margin, y)),
  };
}

function steerToward(engine: GameEngine, target: { x: number; y: number }, maxSpeed: number, accel: number, dt: number): void {
  const p = engine.player;
  const dx = target.x - p.pos.x;
  const dy = target.y - p.pos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const approachFactor = dist < 90 ? dist / 90 : 1; // ease off near the waypoint
  const desiredX = (dx / dist) * maxSpeed * approachFactor;
  const desiredY = (dy / dist) * maxSpeed * approachFactor;
  // acceleration-limited approach; velocity persists between intents so the
  // player does not teleport or change direction instantly
  const k = Math.min(1, (accel * dt) / Math.max(1, Math.hypot(desiredX - p.vel.x, desiredY - p.vel.y)));
  p.vel.x += (desiredX - p.vel.x) * k;
  p.vel.y += (desiredY - p.vel.y) * k;
}

function nearestEnemyInfo(engine: GameEngine): { dist: number; x: number; y: number; isBoss: boolean } | null {
  let best: { dist: number; x: number; y: number; isBoss: boolean } | null = null;
  for (const e of engine.enemies) {
    if (e.isDead) continue;
    const d = Math.hypot(e.pos.x - engine.player.pos.x, e.pos.y - engine.player.pos.y);
    if (!best || d < best.dist) best = { dist: d, x: e.pos.x, y: e.pos.y, isBoss: !!e.isBoss };
  }
  return best;
}

function threatCentroid(engine: GameEngine, maxDist: number): { x: number; y: number; count: number } {
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (const e of engine.enemies) {
    if (e.isDead) continue;
    const d = Math.hypot(e.pos.x - engine.player.pos.x, e.pos.y - engine.player.pos.y);
    if (d <= maxDist) {
      cx += e.pos.x;
      cy += e.pos.y;
      count++;
    }
  }
  return count === 0 ? { x: engine.player.pos.x, y: engine.player.pos.y, count: 0 } : { x: cx / count, y: cy / count, count };
}

interface Threat {
  etaMs: number;
  tx: number;
  ty: number;
}

/** Most imminent player-aimed projectile and the perpendicular dodge axis. */
function projectileThreat(engine: GameEngine, horizonMs: number): Threat | null {
  const p = engine.player;
  let best: Threat | null = null;
  for (const proj of engine.projectiles) {
    if (proj.ownerId === 'player') continue;
    const dx = p.pos.x - proj.pos.x;
    const dy = p.pos.y - proj.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 700) continue;
    const closing = (dx / (dist || 1)) * proj.vel.x + (dy / (dist || 1)) * proj.vel.y;
    if (closing <= 0) continue;
    const eta = (dist / closing) * 1000;
    if (eta < horizonMs && (!best || eta < best.etaMs)) {
      const px = -proj.vel.y;
      const py = proj.vel.x;
      const plen = Math.hypot(px, py) || 1;
      // pick the perpendicular side pointing toward open space
      const cxp = engine.width / 2 - p.pos.x;
      const cyp = engine.height / 2 - p.pos.y;
      const side = (px / plen) * cxp + (py / plen) * cyp < 0 ? -1 : 1;
      best = { etaMs: eta, tx: (px / plen) * side, ty: (py / plen) * side };
    }
  }
  return best;
}

// ------------------------------------------------------- archetype configs

export interface ArchetypeConfig {
  bandMin: number;
  bandMax: number;
  /** 1 = charge the swarm, -1 = flee it */
  aggression: number;
  maxSpeedFactor: number;
  abilityPrefs: AbilityType[];
  weaponAffinity: WeaponType[];
  statAffinity: Record<string, number>;
  misclickRate: number;
}

const CONTACT: WeaponType[] = [
  WeaponType.SPINNING_BLADE,
  WeaponType.CHAIN_ARC_SWORD,
  WeaponType.PLASMA_RAZOR,
  WeaponType.ICE_SWORD,
  WeaponType.FIRE_SWORD,
  WeaponType.GRAVITY_BEAM,
  WeaponType.VORTEX_SCYTHE,
  WeaponType.ARC_WHIP,
  WeaponType.NEUTRINO_SHREDDER,
  WeaponType.GOD_SLAYER_WHEEL,
  WeaponType.CHRONO_REAPER,
  WeaponType.THUNDER_GOD,
];
const RANGED: WeaponType[] = [
  WeaponType.SHOTGUN,
  WeaponType.MAGIC_BLASTER,
  WeaponType.PHOTON_REPEATER,
  WeaponType.LANCE_ARRAY,
  WeaponType.RICOCHET_CANNON,
  WeaponType.RAIL_GUN,
  WeaponType.ION_CANNON,
  WeaponType.MAGIC_BURST,
  WeaponType.OMEGA_BEAM,
  WeaponType.BOMB_LAUNCHER,
  WeaponType.FLAK_CANNON,
  WeaponType.OBLITERATOR_CANNON,
  WeaponType.ECHO_STRIKE,
  WeaponType.REFRACTION_LANCE,
  WeaponType.HYPER_LIGHT_ARRAY,
];
const ORBITAL_AOE: WeaponType[] = [
  WeaponType.ORBITAL_SHIELD,
  WeaponType.TESLA_COIL,
  WeaponType.AUTO_TURRET,
  WeaponType.MINE_LAYER,
  WeaponType.FIRE_TRAIL,
  WeaponType.CLONE_PROJECTION,
];

const DEFENSIVE_ABILITIES: AbilityType[] = [
  AbilityType.HEALING_AURA,
  AbilityType.SHIELD_BURST,
  AbilityType.DASH,
  AbilityType.DIMENSIONAL_DASH,
  AbilityType.NANITE_AEGIS,
  AbilityType.TIME_WARP,
  AbilityType.TEMPORAL_COLLAPSE,
  AbilityType.BLOOD_LUST,
  AbilityType.SANGUINE_FRENZY,
];
const OFFENSIVE_ABILITIES: AbilityType[] = [
  AbilityType.CHAIN_LIGHTNING,
  AbilityType.METEOR_STRIKE,
  AbilityType.INFERNO,
  AbilityType.HELLFIRE_STORM,
  AbilityType.THUNDERBOLT_STORM,
  AbilityType.SEISMIC_CRUSHER,
  AbilityType.PLASMA_NOVA,
  AbilityType.SHOCKWAVE,
  AbilityType.FROST_NOVA,
  AbilityType.BLIZZARD,
  AbilityType.CORROSIVE_DECAY,
  AbilityType.FROSTBITE_TEMPEST,
  AbilityType.KINETIC_BOUNCE_STORM,
];

const ARCHETYPES: Record<PolicyName, ArchetypeConfig> = {
  aggressive: {
    bandMin: 90,
    bandMax: 190,
    aggression: 1,
    maxSpeedFactor: 1.0,
    abilityPrefs: [...OFFENSIVE_ABILITIES, ...DEFENSIVE_ABILITIES],
    weaponAffinity: [...CONTACT, ...ORBITAL_AOE, ...RANGED],
    statAffinity: { meleeSpeed: 3, weaponSize: 3, speed: 2, bounceDmg: 2, maxHp: 1, lifesteal: 2, defense: 1 },
    misclickRate: 0.03,
  },
  defensive: {
    bandMin: 250,
    bandMax: 360,
    aggression: -0.2,
    maxSpeedFactor: 1.05,
    abilityPrefs: DEFENSIVE_ABILITIES,
    weaponAffinity: [...ORBITAL_AOE, ...RANGED, ...CONTACT],
    statAffinity: { maxHp: 3, defense: 3, regen: 3, lifesteal: 2, speed: 1, cooldownMult: 1 },
    misclickRate: 0.025,
  },
  glasscannon: {
    bandMin: 280,
    bandMax: 420,
    aggression: 0.35,
    maxSpeedFactor: 1.12,
    abilityPrefs: [...OFFENSIVE_ABILITIES.slice(1), ...DEFENSIVE_ABILITIES],
    weaponAffinity: [...RANGED, ...ORBITAL_AOE],
    statAffinity: { critChance: 3, weaponSynergy: 3, accuracy: 1, speed: 2, cooldownMult: 2, maxHp: 0 },
    misclickRate: 0.03,
  },
};

// -------------------------------------------------------------- policies

class BasePolicy implements Policy {
  name: PolicyName;
  cfg: ArchetypeConfig;
  private cmd: { x: number; y: number } | null = null;
  private nextIntentAt = 0;

  constructor(name: PolicyName, private rng: () => number = Math.random) {
    this.name = name;
    this.cfg = ARCHETYPES[name];
  }

  reactionMs(): number {
    return 170 + this.rng() * 160; // 170-330ms human reaction
  }

  onFrame(ctx: PolicyCtx, dt: number): void {
    const engine = ctx.engine;
    const p = engine.player;
    const maxSpeed = 900 * (p.stats.speed || 1.0) * this.cfg.maxSpeedFactor;

    if (ctx.now >= this.nextIntentAt) {
      this.nextIntentAt = ctx.now + this.reactionMs();
      this.decideIntent(ctx, maxSpeed);
    }

    if (this.cmd) {
      steerToward(engine, this.cmd, maxSpeed, 5200, dt);
    }
  }

  /** Pick a new movement intent (called at reaction cadence). */
  private decideIntent(ctx: PolicyCtx, maxSpeed: number): void {
    const engine = ctx.engine;
    const p = engine.player;

    // --- occasional misinput: wander off briefly in a random direction ---
    if (this.rng() < this.cfg.misclickRate) {
      const ang = this.rng() * Math.PI * 2;
      this.cmd = clampToArena(p.pos.x + Math.cos(ang) * 320, p.pos.y + Math.sin(ang) * 320, 60);
      return;
    }

    // --- projectile dodge has priority ---
    const threat = projectileThreat(engine, 950);
    if (threat) {
      const t = threat;
      const dodgeDist = 260 + this.rng() * 80;
      this.cmd = clampToArena(
        p.pos.x + t.tx * dodgeDist + (this.rng() - 0.5) * 50,
        p.pos.y + t.ty * dodgeDist + (this.rng() - 0.5) * 50,
        55,
      );
      this.useAbilities(ctx, 'dodge');
      return;
    }

    // --- panic escape when an enemy is about to make contact ---
    const nearest = nearestEnemyInfo(engine);
    if (nearest && nearest.dist < (nearest.isBoss ? 200 : 110)) {
      const ex = p.pos.x - nearest.x;
      const ey = p.pos.y - nearest.y;
      const ed = Math.hypot(ex, ey) || 1;
      const escapeDist = nearest.isBoss ? 380 : 260;
      this.cmd = clampToArena(p.pos.x + (ex / ed) * escapeDist, p.pos.y + (ey / ed) * escapeDist, 60);
      this.useAbilities(ctx, 'panic');
      return;
    }

    // --- swarm positioning ---
    const crowd = threatCentroid(engine, this.cfg.bandMax + 200);
    if (crowd.count === 0) {
      // wander while waiting for the next wave
      const ang = this.rng() * Math.PI * 2;
      const r = 100 + this.rng() * 160;
      this.cmd = clampToArena(engine.width / 2 + Math.cos(ang) * r, engine.height / 2 + Math.sin(ang) * r, 60);
    } else {
      const dist = Math.hypot(crowd.x - p.pos.x, crowd.y - p.pos.y);
      const edge = this.cfg.bandMax + (this.cfg.bandMax - this.cfg.bandMin) * this.rng();
      if (dist > edge) {
        const straightIn = this.rng() < 0.35 + this.cfg.aggression * 0.5;
        if (straightIn) {
          this.cmd = { x: crowd.x, y: crowd.y };
        } else {
          const cdx = crowd.x - p.pos.x;
          const cdy = crowd.y - p.pos.y;
          const cd = Math.hypot(cdx, cdy) || 1;
          // orbit to a flank
          const flank = (this.rng() - 0.5) * 2;
          const px = (-cdy / cd) * flank;
          const py = (cdx / cd) * flank;
          const adv = Math.min(0.5, dist / (edge * 2));
          this.cmd = clampToArena(p.pos.x + cdx * adv + px * 160, p.pos.y + cdy * adv + py * 160, 55);
        }
      } else {
        // too close — back out, or weave through for brawlers
        const awayX = p.pos.x - crowd.x;
        const awayY = p.pos.y - crowd.y;
        const awayD = Math.hypot(awayX, awayY) || 1;
        if (this.cfg.aggression > 0.5 && dist < this.cfg.bandMin && this.rng() < 0.5) {
          this.cmd = clampToArena(crowd.x + (this.rng() - 0.5) * 260, crowd.y + (this.rng() - 0.5) * 260, 55);
        } else {
          const retreat = (this.cfg.bandMax * 0.8) * (1 - Math.min(0.7, this.cfg.aggression * 0.5));
          this.cmd = clampToArena(p.pos.x + (awayX / awayD) * retreat, p.pos.y + (awayY / awayD) * retreat, 55);
        }
      }
    }
    this.useAbilities(ctx, 'normal');
  }

  private useAbilities(ctx: PolicyCtx, phase: 'dodge' | 'panic' | 'normal'): void {
    const engine = ctx.engine;
    const p = engine.player;
    const hpPct = p.hp / p.maxHp;
    const panic = phase === 'panic' || hpPct < 0.3;

    for (const pref of this.cfg.abilityPrefs) {
      const idx = p.abilities.findIndex(a => a.type === pref);
      if (idx === -1) continue;
      const ab = p.abilities[idx];
      if (ctx.now - (ab as any).lastUsed < (ab as any).cooldown) continue;

      const isDash = pref === AbilityType.DASH || pref === AbilityType.DIMENSIONAL_DASH;
      const isHeal = pref === AbilityType.HEALING_AURA || pref === AbilityType.SANGUINE_FRENZY;
      const use =
        (isDash && (panic || phase === 'dodge')) ||
        (isHeal && (panic || hpPct < 0.5)) ||
        (!isDash && !isHeal && (panic || (phase !== 'dodge' && this.rng() < 0.4)));
      if (use && this.rng() < 0.8) {
        engine.triggerAbility(idx);
        break;
      }
    }
  }

  pick(ctx: PolicyCtx, pool: Upgrade[]): Upgrade {
    if (pool.length === 0) {
      throw new Error('empty upgrade pool');
    }
    if (pool.length > 1 && this.rng() < 0.04) {
      return pool[Math.floor(this.rng() * pool.length)];
    }
    let best = pool[0];
    let bestScore = -Infinity;
    const ownedWeaponTypes = new Set(ctx.engine.player.weapons.map(w => w.type));
    const ownedAbilityTypes = new Set(ctx.engine.player.abilities.map(a => a.type));

    for (const u of pool) {
      let score = 0;
      if (u.type === 'WEAPON') {
        if (u.evolutionOf && ownedWeaponTypes.has(u.evolutionOf)) score += 26;
        const ownedIdx = ctx.engine.player.weapons.findIndex(w => w.type === u.weaponType);
        if (ownedIdx !== -1) {
          score += 16 - ctx.engine.player.weapons[ownedIdx].level * 0.7;
        } else if (!ownedWeaponTypes.has(u.weaponType)) {
          const aff = this.cfg.weaponAffinity.indexOf(u.weaponType!);
          score += aff === -1 ? 6 : 12 - aff * 0.1;
        }
      } else if (u.type === 'STAT') {
        score += this.cfg.statAffinity[u.statKey!] ?? 1;
      } else if (u.type === 'ABILITY') {
        if (u.evolutionOf && ownedAbilityTypes.has(u.evolutionOf as any)) score += 20;
        const aff = this.cfg.abilityPrefs.indexOf(u.abilityType!);
        if (aff !== -1) score += 14 - aff * 0.15;
        else score += 2;
        if (ownedAbilityTypes.has(u.abilityType!)) score += 6;
      }
      score += this.rng() * 3;
      if (score > bestScore) {
        bestScore = score;
        best = u;
      }
    }
    return best;
  }
}

export function makePolicy(name: PolicyName, rng?: () => number): Policy {
  return new BasePolicy(name, rng);
}
