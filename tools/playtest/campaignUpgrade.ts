/**
 * Headless mirror of App.tsx's (non-sandbox) upgrade application.
 * The browser version interleaves React state (setShowUpgrade, advanceRoom,
 * setTick); this module applies only the engine mutations so the playtest
 * bot can exercise the real progression rules without a DOM.
 */
import { GameEngine } from '../../src/game/engine.ts';
import { WeaponType, AbilityType } from '../../src/game/types.ts';
import { getAbilityMaxLevel, type Upgrade } from '../../src/game/upgrades.ts';

/** Base configs for weapons added fresh (mirrors App.tsx baseConfigs). */
const WEAPON_BASE: Record<string, { dmg: number; cd: number; len?: number }> = {
  [WeaponType.SPINNING_BLADE]: { dmg: 40, cd: 0, len: 80 },
  [WeaponType.AUTO_TURRET]: { dmg: 30, cd: 600 },
  [WeaponType.FIRE_TRAIL]: { dmg: 25, cd: 0 },
  [WeaponType.ORBITAL_SHIELD]: { dmg: 20, cd: 0 },
  [WeaponType.MAGIC_BURST]: { dmg: 140, cd: 3000 },
  [WeaponType.CHAIN_ARC_SWORD]: { dmg: 35, cd: 0, len: 85 },
  [WeaponType.SHOTGUN]: { dmg: 22, cd: 2100 },
  [WeaponType.MAGIC_BLASTER]: { dmg: 25, cd: 1200 },
  [WeaponType.BOMB_LAUNCHER]: { dmg: 15, cd: 1800 },
  [WeaponType.CLONE_PROJECTION]: { dmg: 10, cd: 5000 },
  [WeaponType.PLASMA_RAZOR]: { dmg: 12, cd: 0 },
  [WeaponType.TESLA_COIL]: { dmg: 8, cd: 2000 },
  [WeaponType.GRAVITY_BEAM]: { dmg: 4, cd: 0 },
  [WeaponType.ION_CANNON]: { dmg: 60, cd: 3000 },
  [WeaponType.MINE_LAYER]: { dmg: 150, cd: 2500 },
  [WeaponType.PHOTON_REPEATER]: { dmg: 15, cd: 400 },
  [WeaponType.RICOCHET_CANNON]: { dmg: 40, cd: 1200 },
  [WeaponType.RAIL_GUN]: { dmg: 75, cd: 1000 },
  [WeaponType.OMEGA_BEAM]: { dmg: 95, cd: 2800 },
  [WeaponType.FLAK_CANNON]: { dmg: 65, cd: 2800 },
  [WeaponType.OBLITERATOR_CANNON]: { dmg: 75, cd: 4800 },
  [WeaponType.SPELL_WEAVER]: { dmg: 60, cd: 1800 },
  [WeaponType.RECURSIVE_BOMB]: { dmg: 100, cd: 2500 },
  [WeaponType.SUPERNOVA_BOMB]: { dmg: 130, cd: 4800 },
  [WeaponType.LANCE_ARRAY]: { dmg: 40, cd: 650 },
  [WeaponType.HYPER_LIGHT_ARRAY]: { dmg: 50, cd: 1400 },
  [WeaponType.REFRACTION_LANCE]: { dmg: 90, cd: 1600 },
  [WeaponType.ECHO_STRIKE]: { dmg: 120, cd: 3200 },
  [WeaponType.ICE_SWORD]: { dmg: 35, cd: 0 },
  [WeaponType.GLACIAL_GREATSWORD]: { dmg: 75, cd: 0 },
  [WeaponType.ABSOLUTE_ZERO_SIPHON]: { dmg: 85, cd: 0 },
  [WeaponType.FIRE_SWORD]: { dmg: 15, cd: 0 },
  [WeaponType.SOLAR_ECLIPSE_BLADE]: { dmg: 55, cd: 0 },
  [WeaponType.SUPERNOVA_SLAYER]: { dmg: 70, cd: 0 },
};

/** Ability cooldown/duration defaults (mirrors App.tsx abilityConfigs). */
const ABILITY_BASE: Record<string, { name: string; cd: number; dur: number }> = {
  [AbilityType.SHIELD_BURST]: { name: 'Shield Nova', cd: 8000, dur: 500 },
  [AbilityType.DASH]: { name: 'Overdrive Dash', cd: 3000, dur: 200 },
  [AbilityType.SHOCKWAVE]: { name: 'Shockwave Blast', cd: 10000, dur: 300 },
  [AbilityType.TOXIC_CLOUD]: { name: 'Toxic Cloud', cd: 15000, dur: 5000 },
  [AbilityType.CHAIN_LIGHTNING]: { name: 'Volt Cascade', cd: 10000, dur: 500 },
  [AbilityType.FROST_NOVA]: { name: 'Glacier Pulse', cd: 12000, dur: 1000 },
  [AbilityType.HEALING_AURA]: { name: 'Repair Nanites', cd: 20000, dur: 3000 },
  [AbilityType.METEOR_STRIKE]: { name: 'Orbital Strike', cd: 18000, dur: 2000 },
  [AbilityType.BLOOD_LUST]: { name: 'Berserker Engine', cd: 25000, dur: 5000 },
  [AbilityType.TIME_WARP]: { name: 'Temporal Shift', cd: 15000, dur: 3000 },
  [AbilityType.OVERDRIVE]: { name: 'Combat Overdrive', cd: 20000, dur: 5000 },
  [AbilityType.BOUNCE_SHOTS]: { name: 'Bouncing Rounds', cd: 18000, dur: 5000 },
  [AbilityType.BLIZZARD]: { name: 'Glacial Blizzard', cd: 16000, dur: 4000 },
  [AbilityType.INFERNO]: { name: 'Inferno Flames', cd: 16000, dur: 4500 },
  [AbilityType.DIMENSIONAL_DASH]: { name: 'Dimensional Dash', cd: 5000, dur: 250 },
  [AbilityType.TEMPORAL_COLLAPSE]: { name: 'Temporal Collapse', cd: 15000, dur: 3000 },
  [AbilityType.PLASMA_NOVA]: { name: 'Plasma Nova', cd: 8050, dur: 500 },
  [AbilityType.APEX_OVERDRIVE]: { name: 'Apex Overdrive', cd: 15000, dur: 5000 },
  [AbilityType.SEISMIC_CRUSHER]: { name: 'Seismic Crusher', cd: 8000, dur: 500 },
  [AbilityType.CORROSIVE_DECAY]: { name: 'Corrosive Decay', cd: 11000, dur: 5000 },
  [AbilityType.THUNDERBOLT_STORM]: { name: 'Thunderbolt Storm', cd: 8000, dur: 500 },
  [AbilityType.ABSOLUTE_ZERO_RIPPLE]: { name: 'Absolute Zero Ripple', cd: 9000, dur: 1000 },
  [AbilityType.NANITE_AEGIS]: { name: 'Nanite Aegis', cd: 15000, dur: 3000 },
  [AbilityType.SUPERNOVA_RAIN]: { name: 'Supernova Rain', cd: 14000, dur: 2000 },
  [AbilityType.SANGUINE_FRENZY]: { name: 'Sanguine Frenzy', cd: 18000, dur: 5000 },
  [AbilityType.KINETIC_BOUNCE_STORM]: { name: 'Kinetic Bounce Storm', cd: 13000, dur: 5000 },
  [AbilityType.FROSTBITE_TEMPEST]: { name: 'Frostbite Tempest', cd: 12000, dur: 4000 },
  [AbilityType.HELLFIRE_STORM]: { name: 'Hellfire Storm', cd: 12000, dur: 4500 },
};

const ABILITY_KEYS = ['Space', 'KeyQ', 'KeyE', 'KeyT', 'KeyY'];

/** Duration growth factor when evolving an ability (Plasma Nova is the odd one out). */
function abilityEvolutionDurationMult(abilityType?: AbilityType): number {
  return abilityType === AbilityType.PLASMA_NOVA ? 1.05 : 1.10;
}

/**
 * Applies one campaign upgrade to the engine. Returns true when something
 * changed. Mirrors App.tsx `applyUpgrade` campaign branch 1:1.
 */
export function applyCampaignUpgrade(engine: GameEngine, upgrade: Upgrade): boolean {
  if (upgrade.type === 'WEAPON') {
    const evolutionTarget = upgrade.evolutionOf;
    if (evolutionTarget) {
      const index = engine.player.weapons.findIndex(w => w.type === evolutionTarget);
      if (index !== -1) {
        const old = engine.player.weapons[index];
        const isTier3 = upgrade.tier === 3 || (upgrade as any).isUltimate;
        engine.player.weapons[index] = {
          type: upgrade.weaponType!,
          level: 1,
          damage: old.damage * (isTier3 ? 1.15 : 2.0),
          cooldown: old.cooldown * (isTier3 ? 1.35 : 0.85),
          lastUsed: old.lastUsed,
          angle: old.angle || 0,
          length:
            upgrade.weaponType === WeaponType.CHRONO_REAPER || upgrade.weaponType === WeaponType.THUNDER_GOD
              ? 150
              : upgrade.weaponType === WeaponType.VORTEX_SCYTHE || upgrade.weaponType === WeaponType.ARC_WHIP
                ? 115
                : 80,
          isEvolved: true,
        } as any;
        return true;
      }
    }

    const existing = engine.player.weapons.find(w => w.type === upgrade.weaponType);
    if (existing) {
      existing.level++;
      existing.damage *= 1.6;
      if (existing.cooldown > 0) existing.cooldown *= 0.95;
      if (existing.type === WeaponType.PLASMA_RAZOR || existing.type === WeaponType.TESLA_COIL) {
        existing.damage *= 1.4; // High frequency weapons scale slightly differently
      }
      return true;
    }

    const config = WEAPON_BASE[upgrade.weaponType!] || { dmg: 20, cd: 1500 };
    engine.player.weapons.push({
      type: upgrade.weaponType!,
      level: 1,
      damage: config.dmg,
      cooldown: config.cd,
      lastUsed: 0,
      angle: 0,
      length: config.len || 0,
    } as any);
    return true;
  }

  if (upgrade.type === 'STAT') {
    return applyStatUpgrade(engine, upgrade);
  }

  if (upgrade.type === 'ABILITY') {
    const evolutionTarget = upgrade.evolutionOf as unknown as AbilityType;
    if (evolutionTarget) {
      const index = engine.player.abilities.findIndex(a => a.type === evolutionTarget);
      if (index !== -1) {
        const old = engine.player.abilities[index];
        engine.player.abilities[index] = {
          ...old,
          type: upgrade.abilityType!,
          name: upgrade.name || (ABILITY_BASE[upgrade.abilityType!]?.name ?? old.name),
          cooldown: Math.max(old.cooldown * 0.9, 2000),
          duration: Math.min(old.duration * abilityEvolutionDurationMult(upgrade.abilityType), 8000),
          level: 1,
        } as any;
        return true;
      }
    }

    const existing = engine.player.abilities.find(a => a.type === upgrade.abilityType);
    if (existing) {
      const maxLevel = getAbilityMaxLevel(existing.type);
      if (existing.level < maxLevel) {
        existing.level = Math.min(maxLevel, existing.level + 1);
        existing.cooldown = Math.max(existing.cooldown * 0.985, 2000);
        if (existing.duration > 0) {
          existing.duration = Math.min(existing.duration * 1.01, 8000);
        }
        return true;
      }
      return false; // already maxed
    }

    const conf = ABILITY_BASE[upgrade.abilityType!];
    if (conf) {
      const usedKeys = engine.player.abilities.map(a => (a as any).key);
      const nextKey = ABILITY_KEYS.find(k => !usedKeys.includes(k)) || 'KeyG';
      engine.player.abilities.push({
        type: upgrade.abilityType!,
        name: upgrade.name || conf.name,
        cooldown: conf.cd,
        duration: conf.dur,
        lastUsed: 0,
        isActive: false,
        level: 1,
        key: nextKey,
      } as any);
      return true;
    }
    return false;
  }

  return false;
}

/** Mirrors App.tsx applyStatUpgrade (non-removing path only). */
function applyStatUpgrade(engine: GameEngine, upgrade: Upgrade): boolean {
  if (!upgrade.statKey || upgrade.value === undefined) return false;
  const statKey = upgrade.statKey;
  const mult = upgrade.value;
  const add = upgrade.value;

  if (statKey === 'speed') {
    engine.player.stats.speed *= mult;
  } else if (statKey === 'bounceDmg') {
    engine.player.stats.bounceDmg += add;
  } else if (statKey === 'maxHp') {
    engine.player.maxHp += add;
    engine.player.hp = engine.player.maxHp;
  } else if (statKey === 'critChance') {
    engine.player.stats.critChance = Math.min(0.95, engine.player.stats.critChance + add);
  } else if (statKey === 'regen') {
    engine.player.stats.regen += add;
    engine.player.lastDamageTime = 0; // triggers regen immediately
    engine.player.hp = Math.min(engine.player.maxHp, engine.player.hp + 25);
  } else if (statKey === 'lifesteal') {
    engine.player.stats.lifesteal += add;
  } else if (statKey === 'defense') {
    engine.player.stats.defense = Math.min(30.0, engine.player.stats.defense + add);
    if (!engine.player.stats.damageReductionMultiplier) {
      engine.player.stats.damageReductionMultiplier = 1.0;
    }
    engine.player.stats.damageReductionMultiplier *= 1 - upgrade.value;
  } else if (statKey === 'cooldownMult') {
    engine.player.stats.cooldownMult *= mult;
  } else if (statKey === 'accuracy') {
    engine.player.stats.accuracy = Math.min(1.0, Math.max(0.15, (engine.player.stats.accuracy || 0.15) + add));
  } else if (statKey === 'weaponSynergy') {
    engine.player.stats.weaponSynergy = Math.min(0.95, engine.player.stats.weaponSynergy + add);
  } else if (statKey === 'meleeSpeed') {
    engine.player.stats.meleeSpeed = Math.max(0.1, (engine.player.stats.meleeSpeed || 1.0) * mult);
  } else if (statKey === 'weaponSize') {
    engine.player.stats.weaponSize = Math.max(0.1, (engine.player.stats.weaponSize || 1.0) * mult);
  } else if (statKey === 'projectileSlow') {
    engine.player.stats.projectileSlow = Math.max(0, (engine.player.stats.projectileSlow || 0) + add);
  } else if (statKey === 'slowDmgBoost') {
    engine.player.stats.slowDmgBoost = Math.max(0, (engine.player.stats.slowDmgBoost || 0) + add);
  } else if (statKey === 'fireDmgBoost') {
    engine.player.stats.fireDmgBoost = Math.max(0, (engine.player.stats.fireDmgBoost || 0) + add);
  } else if (statKey === 'fireMeleeDmgBoost') {
    engine.player.stats.fireMeleeDmgBoost = Math.max(0, (engine.player.stats.fireMeleeDmgBoost || 0) + add);
  } else {
    return false;
  }
  return true;
}
