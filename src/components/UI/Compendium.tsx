import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_UPGRADES, EVOLVED_UPGRADES, ULTIMATE_UPGRADES, EVOLVED_STATS, EVOLVED_ABILITIES, type Upgrade } from '../../game/upgrades.ts';
import { WeaponType, AbilityType, type Weapon, type ActiveAbility } from '../../game/types.ts';
import { 
  X, Book, Target, ChevronRight, Sparkles, Wand2, Bomb, Users, Droplet, Wind, Maximize, 
  Flame, CloudLightning, Disc, Radio, Boxes, Loader, Sun, ShieldPlus, Shield, Activity, 
  Cpu, RadioTower, Infinity as InfinityIcon, Zap as ZapIcon, CircuitBoard, Heart, 
  Crosshair, Swords, Layers, Plus, Minus, Trash2, ArrowUpCircle, Check
} from 'lucide-react';
import { gameAudio } from '../../game/audio.ts';
import { useLanguage } from '../../game/localization';

interface CompendiumProps {
  onClose: () => void;
  isSandbox?: boolean;
  onSelect?: (upgrade: Upgrade) => void;
  ownedWeapons?: WeaponType[];
  ownedAbilities?: AbilityType[];
  statPickCounts?: Record<string, number>;
  sandboxStatCounts?: Record<string, number>;
  weaponLevels?: Record<string, number>;
  playerWeapons?: Weapon[];
  playerAbilities?: ActiveAbility[];
  playerStats?: any;
  playerMaxHp?: number;
  onClearWeapons?: () => void;
  onMaxAllWeapons?: () => void;
}

export function Compendium({ 
  onClose, 
  isSandbox, 
  onSelect, 
  ownedWeapons = [], 
  ownedAbilities = [], 
  statPickCounts = {}, 
  sandboxStatCounts = {}, 
  weaponLevels = {},
  playerWeapons = [],
  playerAbilities = [],
  playerStats = {},
  playerMaxHp = 100,
  onClearWeapons,
  onMaxAllWeapons
}: CompendiumProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LOADOUT' | 'WEAPONS' | 'ABILITIES' | 'STATS'>('ALL');

  const getIcon = (upgrade: Upgrade) => {
    if (upgrade.type === 'WEAPON') {
      switch (upgrade.weaponType) {
        case WeaponType.SPINNING_BLADE: 
        case WeaponType.VORTEX_SCYTHE: 
        case WeaponType.CHRONO_REAPER: return <Disc className="text-amber-400" size={16} />;
        
        case WeaponType.AUTO_TURRET: 
        case WeaponType.RAIL_GUN: 
        case WeaponType.OMEGA_BEAM: return <Target className="text-blue-400" size={16} />;
        
        case WeaponType.FIRE_TRAIL: 
        case WeaponType.VOLCANIC_PLUME: 
        case WeaponType.COSMIC_FLAME: return <Flame className="text-red-400" size={16} />;
        
        case WeaponType.ORBITAL_SHIELD: 
        case WeaponType.SENTINEL_DRONES: 
        case WeaponType.CELESTIAL_GUARD: return <ShieldPlus className="text-emerald-400" size={16} />;
        
        case WeaponType.MAGIC_BURST: 
        case WeaponType.SINGULARITY: 
        case WeaponType.VOID_EATER: return <Maximize className="text-purple-400" size={16} />;
        
        case WeaponType.CHAIN_ARC_SWORD: 
        case WeaponType.ARC_WHIP: 
        case WeaponType.THUNDER_GOD: return <CloudLightning className="text-cyan-400" size={16} />;

        case WeaponType.REPULSOR_FIELD: return <Shield className="text-zinc-300" size={16} />;

        case WeaponType.SHOTGUN:
        case WeaponType.FLAK_CANNON:
        case WeaponType.OBLITERATOR_CANNON: return <Boxes className="text-red-500" size={16} />;

        case WeaponType.MAGIC_BLASTER:
        case WeaponType.SPELL_WEAVER: return <Sparkles className="text-pink-400" size={16} />;

        case WeaponType.BOMB_LAUNCHER:
        case WeaponType.RECURSIVE_BOMB: 
        case WeaponType.SUPERNOVA_BOMB: return <Bomb className="text-orange-500" size={16} />;

        case WeaponType.CLONE_PROJECTION:
        case WeaponType.HOLOGRAPHIC_ARMY: 
        case WeaponType.MIRAGE_LEGION: return <Users className="text-sky-400" size={16} />;

        case WeaponType.PLASMA_RAZOR:
        case WeaponType.NEUTRINO_SHREDDER:
        case WeaponType.GOD_SLAYER_WHEEL: return <Cpu className="text-red-500" size={16} />;

        case WeaponType.TESLA_COIL:
        case WeaponType.STATIC_STORM:
        case WeaponType.EMP_HARVESTER: return <Radio className="text-yellow-400" size={16} />;

        case WeaponType.GRAVITY_BEAM:
        case WeaponType.EVENT_HORIZON:
        case WeaponType.SINGULARITY_CORE: return <Loader className="text-indigo-400" size={16} />;

        case WeaponType.ION_CANNON:
        case WeaponType.ORBITAL_STRIKE:
        case WeaponType.DEATH_STAR_BEAM: return <Sun className="text-cyan-300" size={16} />;

        case WeaponType.MINE_LAYER:
        case WeaponType.SENSOR_CLUSTER:
        case WeaponType.VOID_MINES: return <RadioTower className="text-zinc-400" size={16} />;

        case WeaponType.PHOTON_REPEATER:
        case WeaponType.LANCE_ARRAY:
        case WeaponType.HYPER_LIGHT_ARRAY: return <Radio className="text-white" size={16} />;

        case WeaponType.RICOCHET_CANNON:
        case WeaponType.REFRACTION_LANCE:
        case WeaponType.ECHO_STRIKE: return <InfinityIcon className="text-orange-400" size={16} />;

        case WeaponType.ICE_SWORD:
        case WeaponType.GLACIAL_GREATSWORD:
        case WeaponType.ABSOLUTE_ZERO_SIPHON: return <Sparkles className="text-blue-300" size={16} />;
        
        case WeaponType.FIRE_SWORD:
        case WeaponType.SOLAR_ECLIPSE_BLADE:
        case WeaponType.SUPERNOVA_SLAYER: return <Flame className="text-orange-500" size={16} />;
        
        default: return <Wand2 className="text-zinc-400" size={16} />;
      }
    } else if (upgrade.type === 'ABILITY') {
        switch (upgrade.abilityType) {
            case AbilityType.DASH:
            case AbilityType.DIMENSIONAL_DASH: return <Wind className="text-white" size={16} />;
            case AbilityType.SHIELD_BURST:
            case AbilityType.PLASMA_NOVA: return <Shield className="text-blue-400" size={16} />;
            case AbilityType.SHOCKWAVE:
            case AbilityType.SEISMIC_CRUSHER: return <Maximize className="text-yellow-400" size={16} />;
            case AbilityType.TOXIC_CLOUD:
            case AbilityType.CORROSIVE_DECAY: return <Droplet className="text-green-500" size={16} />;
            case AbilityType.CHAIN_LIGHTNING:
            case AbilityType.THUNDERBOLT_STORM: return <ZapIcon className="text-amber-400" size={16} />;
            case AbilityType.FROST_NOVA:
            case AbilityType.ABSOLUTE_ZERO_RIPPLE: return <Loader className="text-blue-300" size={16} />;
            case AbilityType.HEALING_AURA:
            case AbilityType.NANITE_AEGIS: return <Heart className="text-emerald-400" size={16} />;
            case AbilityType.METEOR_STRIKE:
            case AbilityType.SUPERNOVA_RAIN: return <Flame className="text-orange-500" size={16} />;
            case AbilityType.BLOOD_LUST:
            case AbilityType.SANGUINE_FRENZY: return <Droplet className="text-red-600" size={16} />;
            case AbilityType.TIME_WARP: 
            case AbilityType.TEMPORAL_COLLAPSE: return <Activity className="text-indigo-400" size={16} />;
            case AbilityType.OVERDRIVE:
            case AbilityType.APEX_OVERDRIVE: return <InfinityIcon className="text-yellow-400" size={16} />;
            case AbilityType.BOUNCE_SHOTS:
            case AbilityType.KINETIC_BOUNCE_STORM: return <Sparkles className="text-cyan-400" size={16} />;
            case AbilityType.BLIZZARD:
            case AbilityType.FROSTBITE_TEMPEST: return <Wind className="text-cyan-300" size={16} />;
            case AbilityType.INFERNO:
            case AbilityType.HELLFIRE_STORM: return <Flame className="text-red-500" size={16} />;
            default: return <ZapIcon className="text-zinc-400" size={16} />;
        }
    } else {
      switch (upgrade.statKey) {
        case 'maxHp': return <Heart className="text-rose-500" size={16} />;
        case 'regen': return <Activity className="text-lime-400" size={16} />;
        case 'defense': return <Shield className="text-sky-400" size={16} />;
        case 'critChance': return <Target className="text-yellow-400" size={16} />;
        case 'bounceDmg': return <Sparkles className="text-amber-400" size={16} />;
        case 'speed': return <Wind className="text-cyan-400" size={16} />;
        case 'cooldownMult': return <Cpu className="text-purple-400" size={16} />;
        case 'damageMult': return <Flame className="text-orange-500" size={16} />;
        case 'meleeSpeed': return <ZapIcon className="text-fuchsia-400" size={16} />;
        case 'pierce': return <Crosshair className="text-emerald-400" size={16} />;
        case 'lifesteal': return <Droplet className="text-rose-400" size={16} />;
        case 'luck': return <Sparkles className="text-yellow-400" size={16} />;
        case 'expBoost': return <Crosshair className="text-cyan-400" size={16} />;
        default: return <ZapIcon className="text-zinc-400" size={16} />;
      }
    }
  };

  const getAccent = (upgrade: Upgrade) => {
    const sandboxCount = sandboxStatCounts[upgrade.id] || 0;
    const isOwned = isSandbox 
        ? (upgrade.type === 'WEAPON' ? ownedWeapons.includes(upgrade.weaponType!) : 
           upgrade.type === 'ABILITY' ? ownedAbilities.includes(upgrade.abilityType!) :
           sandboxCount > 0)
        : (upgrade.type === 'WEAPON' ? ownedWeapons.includes(upgrade.weaponType!) :
           upgrade.type === 'ABILITY' ? ownedAbilities.includes(upgrade.abilityType!) :
           (upgrade.statKey ? statPickCounts[upgrade.statKey] || 0 : 0) > 0);

    const activeOutline = "ring-2 ring-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10";
    const hoverOutline = "hover:border-cyan-500 hover:bg-zinc-850 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)]";

    if (upgrade.tier === 3) return `${isOwned ? activeOutline : hoverOutline} border-amber-400/50 bg-amber-400/5`;
    if (upgrade.tier === 2) return `${isOwned ? activeOutline : hoverOutline} border-purple-500/50 bg-purple-500/5`;
    if (upgrade.type === 'WEAPON') return `${isOwned ? activeOutline : hoverOutline} border-zinc-800 bg-zinc-900/40`;
    if (upgrade.statKey === 'maxHp' || upgrade.statKey === 'regen') return `${isOwned ? activeOutline : hoverOutline} border-emerald-950 bg-emerald-500/5`;
    return `${isOwned ? activeOutline : hoverOutline} border-blue-950 bg-blue-500/5`;
  };

  const findWeaponUpgrade = (type: WeaponType): Upgrade | undefined => {
    return [...ALL_UPGRADES, ...EVOLVED_UPGRADES, ...ULTIMATE_UPGRADES].find(u => u.weaponType === type);
  };

  const getWeaponChainForType = (type: WeaponType): {
    base?: Upgrade;
    evolution?: Upgrade;
    ultimate?: Upgrade;
    currentTier: number;
  } => {
    let base = ALL_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === type);
    let evolution: Upgrade | undefined;
    let ultimate: Upgrade | undefined;
    let currentTier = 1;

    if (base) {
      evolution = EVOLVED_UPGRADES.find(u => u.evolutionOf === base?.weaponType);
      ultimate = evolution ? ULTIMATE_UPGRADES.find(u => u.evolutionOf === evolution.weaponType) : undefined;
      currentTier = 1;
    } else {
      evolution = EVOLVED_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === type);
      if (evolution) {
        base = ALL_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === evolution.evolutionOf);
        ultimate = ULTIMATE_UPGRADES.find(u => u.evolutionOf === evolution.weaponType);
        currentTier = 2;
      } else {
        ultimate = ULTIMATE_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === type);
        if (ultimate) {
          evolution = EVOLVED_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === ultimate.evolutionOf);
          base = evolution ? ALL_UPGRADES.find(u => u.type === 'WEAPON' && u.weaponType === evolution.evolutionOf) : undefined;
          currentTier = 3;
        }
      }
    }

    return { base, evolution, ultimate, currentTier };
  };

  const findAbilityUpgrade = (type: AbilityType): Upgrade | undefined => {
    return [...ALL_UPGRADES, ...EVOLVED_ABILITIES].find(u => u.abilityType === type);
  };

  const getAbilityChainForType = (type: AbilityType): {
    base?: Upgrade;
    mutation?: Upgrade;
    currentTier: number;
  } => {
    let base = ALL_UPGRADES.find(u => u.type === 'ABILITY' && u.abilityType === type);
    let mutation: Upgrade | undefined;
    let currentTier = 1;

    if (base) {
      mutation = EVOLVED_ABILITIES.find(e => String(e.evolutionOf) === String(base?.abilityType));
      currentTier = 1;
    } else {
      mutation = EVOLVED_ABILITIES.find(e => e.type === 'ABILITY' && e.abilityType === type);
      if (mutation) {
        base = ALL_UPGRADES.find(u => u.type === 'ABILITY' && String(u.abilityType) === String(mutation.evolutionOf));
        currentTier = 2;
      }
    }

    return { base, mutation, currentTier };
  };

  const baseWeapons = ALL_UPGRADES.filter(u => u.type === 'WEAPON');
  const statUpgrades = [...ALL_UPGRADES.filter(u => u.type === 'STAT'), ...EVOLVED_STATS];

  // Stat Chains (grouped by evolutionary path, each exactly 3 stages)
  const STAT_CHAINS = [
    {
      title: "Hull Plating Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_hull'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_hull_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_omega_hull')
    },
    {
      title: "Engine Booster Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_speed'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_speed_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_speed')
    },
    {
      title: "Autogenous Repair Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_repair'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_nano_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_regen')
    },
    {
      title: "Lifesteal Matrix Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_lifesteal'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_lifesteal_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_ls')
    },
    {
      title: "Kinetic Safeguard Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_def'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_def_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_def')
    },
    {
      title: "Critical Strike Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_crit'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_crit_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_crit')
    },
    {
      title: "Calibration Accuracy Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_accuracy'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_accuracy_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_accuracy')
    },
    {
      title: "Rapid Reloader Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_fire_rate'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_fire_rate_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_fire_rate')
    },
    {
      title: "Impact Engine Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_bounce'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_bounce_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_bounce')
    },
    {
      title: "Gyroscopic Overdrive Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_melee_speed'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_melee_speed_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_melee_speed')
    },
    {
      title: "Sub-Atomic Expander Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_weapon_size'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_weapon_size_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_weapon_size')
    },
    {
      title: "Core Sync Protocols Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_synergy'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_synergy_2'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_synergy')
    },
    {
      title: "Cryogenic Infusion Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_proj_slow'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_slow_dmg_boost'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_freeze')
    },
    {
      title: "Combustion Catalyst Series",
      base: ALL_UPGRADES.find(u => u.id === 'stat_fire_dmg_boost'),
      evolution: EVOLVED_STATS.find(u => u.id === 'stat_fire_melee_dmg_boost'),
      ultimate: EVOLVED_STATS.find(u => u.id === 'stat_god_fire')
    }
  ];

  const chainedStatIds = new Set(
    STAT_CHAINS.flatMap(c => [c.base?.id, c.evolution?.id, c.ultimate?.id].filter(Boolean) as string[])
  );
  const auxiliaryStats = statUpgrades.filter(u => !chainedStatIds.has(u.id));

  // Abilities Chain Creation
  const baseAbilityUpgrades = ALL_UPGRADES.filter(u => u.type === 'ABILITY');
  const ABILITY_CHAINS = baseAbilityUpgrades.map(base => {
    const mutation = EVOLVED_ABILITIES.find(e => String(e.evolutionOf) === String(base.abilityType));
    return {
      title: `${base.name} Evolution`,
      base,
      mutation
    };
  });

  const getFormattedStatValue = (statKey: string, value: number) => {
    if (statKey === 'speed') return `+${Math.round((value - 1) * 100)}% ${t('stat_velocity')}`;
    if (statKey === 'bounceDmg') return `+${value} ${t('stat_impact')}`;
    if (statKey === 'maxHp') return `+${value} ${t('hull_integrity')}`;
    if (statKey === 'critChance') return `+${Math.round(value * 100)}% ${t('stat_critical')}`;
    if (statKey === 'regen') return `+${value} ${t('stat_regen')}`;
    if (statKey === 'lifesteal') return `+${Math.round(value * 100)}% ${t('stat_lifesteal')}`;
    if (statKey === 'defense') return `+${Math.round(value * 100)}% ${t('stat_defense')}`;
    if (statKey === 'cooldownMult') return `-${Math.round((1 - value) * 100)}% ${t('stat_haste')}`;
    if (statKey === 'weaponSynergy') return `+${Math.round(value * 100)}% ${t('drop_synergy', {}, 'drop synergy')}`;
    if (statKey === 'meleeSpeed') return `+${Math.round((value - 1) * 100)}% ${t('swing_speed', {}, 'swing speed')}`;
    if (statKey === 'weaponSize') return `+${Math.round((value - 1) * 100)}% ${t('weapon_coverage', {}, 'weapon coverage')}`;
    if (statKey === 'projectileSlow') return `+${Math.round(value * 100)}% ${t('freeze_slow', {}, 'freeze slow')}`;
    if (statKey === 'slowDmgBoost') return `+${Math.round(value * 100)}% ${t('target_freeze_damage', {}, 'target freeze damage')}`;
    if (statKey === 'fireDmgBoost' || statKey === 'fireMeleeDmgBoost') return `+${Math.round(value * 100)}% ${t('burn_blast_damage', {}, 'burn blast damage')}`;
    return `+${value}`;
  };

  // Node card for gallery items
  const nodeCard = (upgrade: Upgrade, extraLabels?: React.ReactNode, evolutionOverloads?: { evolution?: Upgrade | null, ultimate?: Upgrade | null }) => {
    const sandboxCount = sandboxStatCounts[upgrade.id] || 0;
    const isOwned = isSandbox 
        ? (upgrade.type === 'WEAPON' ? ownedWeapons.includes(upgrade.weaponType!) : 
           upgrade.type === 'ABILITY' ? ownedAbilities.includes(upgrade.abilityType!) :
           sandboxCount > 0)
        : (upgrade.type === 'WEAPON' ? ownedWeapons.includes(upgrade.weaponType!) :
           upgrade.type === 'ABILITY' ? ownedAbilities.includes(upgrade.abilityType!) :
           (upgrade.statKey ? (
             (upgrade.tier === 3) ? (statPickCounts[upgrade.statKey] || 0) >= 3 :
             (upgrade.tier === 2) ? (statPickCounts[upgrade.statKey] || 0) >= 2 :
             (statPickCounts[upgrade.statKey] || 0) >= 1
           ) : false));

    return (
      <div 
        onClick={() => {
          if (isSandbox) {
            gameAudio.playButtonClickSound();
            onSelect?.(upgrade);
          }
        }}
        className={`p-3.5 border-l-4 rounded-xl ${getAccent(upgrade)} flex flex-col gap-1 items-start w-full relative overflow-hidden group transition-all duration-300 ease-out ${isSandbox ? 'cursor-pointer' : ''}`}
        id={`compendium_node_${upgrade.id}`}
      >
        {/* Tier badge */}
        {upgrade.tier && upgrade.tier > 1 && (
          <div className={`absolute top-0 right-0 px-2 py-0.5 text-xs font-black uppercase text-white rounded-bl-lg ${
            upgrade.tier === 3 ? 'bg-amber-500 text-black' : 'bg-purple-600'
          }`}>
            T{upgrade.tier}
          </div>
        )}

        {/* Card Header (Icon and Name ONLY by default) */}
        <div className="flex gap-3 items-center w-full">
          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800 shrink-0">
            {getIcon(upgrade)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white leading-snug text-xs sm:text-sm uppercase truncate group-hover:text-cyan-300 transition-colors">
                {t('up_name_' + upgrade.id, {}, upgrade.name)}
              </h3>
              {isOwned && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-black uppercase shrink-0">
                  {t('equipped', {}, 'EQUIPPED')}
                </span>
              )}
            </div>
            {isSandbox && (
              <span className="text-[9px] text-cyan-400/80 font-mono">
                {isOwned ? t('click_to_toggle', {}, 'Click to toggle/level') : t('click_to_equip', {}, 'Click to equip')}
              </span>
            )}
          </div>
        </div>

        {/* Expandable Body (Expands ONLY when hovered) */}
        <div className="max-h-0 opacity-0 group-hover:max-h-[300px] group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden w-full select-text">
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed border-t border-zinc-800/60 pt-2 font-sans">
            {t('up_desc_' + upgrade.id, {}, upgrade.description)}
          </p>
          
          {extraLabels}

          {evolutionOverloads?.evolution && (
            <div className="mt-2 text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-1 rounded-md border border-purple-800/40 inline-block font-bold">
              {t('mutates_at_level_label', {}, 'MUTATES AT LEVEL')} {evolutionOverloads.evolution.evolutionLevel || (upgrade.type === 'ABILITY' ? 15 : 4)}
            </div>
          )}

          {evolutionOverloads?.ultimate && (
            <div className="mt-2 text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-1 rounded-md border border-amber-800/40 inline-block font-bold">
              {t('god_engine_at_level_label', {}, 'GOD-ENGINE AT LEVEL')} {evolutionOverloads.ultimate.evolutionLevel || 15}
            </div>
          )}

          {upgrade.value !== undefined && upgrade.type === 'STAT' && upgrade.statKey && (
            <div className="mt-2 text-xs font-mono font-black text-emerald-400 border-t border-zinc-900/60 pt-2 uppercase tracking-wide">
              {t('effect', {}, 'Effect:')} <span className="text-white font-bold">{getFormattedStatValue(upgrade.statKey, upgrade.value)}</span>
            </div>
          )}

          {/* Sandbox controls mapped in expand view */}
          {isSandbox && (
            <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex gap-2 w-full justify-end">
              {upgrade.type === 'WEAPON' && ownedWeapons.includes(upgrade.weaponType!) && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.({...upgrade, id: `${upgrade.id}_LEVEL_DOWN`}); }}
                    className="px-2 py-1 bg-red-950/70 border border-red-500/50 text-xs text-red-300 rounded hover:bg-red-500 hover:text-white transition-colors uppercase font-bold cursor-pointer"
                  >
                    {t('lvl_minus_label', {}, 'Lvl -')}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.({...upgrade, id: `${upgrade.id}_LEVEL_UP`}); }}
                    className="px-2 py-1 bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 rounded hover:bg-emerald-500 hover:text-white transition-colors uppercase font-bold cursor-pointer"
                  >
                    {t('lvl_plus_label', {}, 'Lvl +')}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.({...upgrade, id: `${upgrade.id}_LEVEL_MAX`}); }}
                    className="px-2 py-1 bg-amber-950/70 border border-amber-500/50 text-xs text-amber-300 rounded hover:bg-amber-500 hover:text-black transition-colors uppercase font-bold cursor-pointer"
                  >
                    {t('max_label', {}, 'Max')}
                  </button>
                </>
              )}

              {upgrade.type === 'ABILITY' && upgrade.abilityType && (
                <button 
                  onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.(upgrade); }}
                  className={`px-2 py-1 border text-xs rounded uppercase font-bold transition-colors cursor-pointer ${
                    ownedAbilities.includes(upgrade.abilityType) 
                      ? 'bg-red-950/70 border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white' 
                      : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  {ownedAbilities.includes(upgrade.abilityType) ? t('unequip_label', {}, 'Unequip') : t('equip_label', {}, 'Equip')}
                </button>
              )}

              {upgrade.type === 'STAT' && (
                <>
                  {sandboxCount > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.({...upgrade, id: `${upgrade.id}_REMOVE`}); }}
                      className="px-2 py-1 bg-red-950/70 border border-red-500/50 text-xs text-red-300 rounded hover:bg-red-500 hover:text-white transition-colors uppercase font-bold cursor-pointer"
                    >
                      {t('remove_label', {}, 'Remove')}
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); gameAudio.playButtonClickSound(); onSelect?.(upgrade); }}
                    className="px-2 py-1 bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 rounded hover:bg-emerald-500 hover:text-white transition-colors uppercase font-bold cursor-pointer"
                  >
                    {t('add_lvl_label', {}, 'Add Lvl')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Compile active loadout weapons list
  const activeWeaponsList = (playerWeapons && playerWeapons.length > 0)
    ? playerWeapons
    : ownedWeapons.map(type => ({
        type,
        level: weaponLevels[type] || 1,
        damage: 25,
        cooldown: 0,
        lastUsed: 0
      }));

  // Compile active abilities list
  const activeAbilitiesList = (playerAbilities && playerAbilities.length > 0)
    ? playerAbilities
    : ownedAbilities.map(type => ({
        type,
        name: type,
        cooldown: 5000,
        duration: 2000,
        lastUsed: 0,
        isActive: false,
        level: 1
      }));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none"
      id="compendium_root"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-6xl h-[92vh] sm:h-[88vh] space-ui-bg border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden"
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-20 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Book size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-black text-white uppercase tracking-wider text-xl">
                  {t('compendium', {}, 'Compendium')}
                </h2>
                {isSandbox && (
                  <span className="px-2 py-0.5 text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-400/40 rounded font-mono font-black uppercase tracking-wider">
                    SANDBOX ARSENAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Header Category Pills */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'ALL' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('all_systems', {}, 'ALL')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('LOADOUT'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'LOADOUT' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('loadout_title', {}, 'LOADOUT')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('WEAPONS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'WEAPONS' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('weapons_roadmap', {}, 'WEAPONS')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('ABILITIES'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'ABILITIES' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('tactical_abilities', {}, 'ABILITIES')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('STATS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'STATS' ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('stat_augmentations', {}, 'STATS')}
              </button>
            </div>

            <button 
              onClick={() => { gameAudio.playButtonClickSound(); onClose(); }}
              className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              id="close_compendium_btn"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 custom-scrollbar space-y-8 bg-zinc-950/20">
        
        {/* ========================================================================= */}
        {/* TOP LOADOUT AREA (Showing current loadout weapons, abilities & attributes) */}
        {/* ========================================================================= */}
        {(activeCategory === 'ALL' || activeCategory === 'LOADOUT') && (
        <section 
          className="bg-zinc-950/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-visible backdrop-blur-md"
          id="compendium_active_loadout"
        >
          {/* Ambient header glow */}
          <div className="absolute top-0 right-0 w-80 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <Swords className="text-cyan-400" size={22} />
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                {t('loadout_title', {}, 'LOADOUT')}
              </h3>
            </div>

            {isSandbox && (
              <div className="flex items-center gap-2">
                {onMaxAllWeapons && (
                  <button
                    onClick={() => {
                      gameAudio.playButtonClickSound();
                      onMaxAllWeapons();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-black uppercase transition-all cursor-pointer"
                  >
                    <ArrowUpCircle size={14} />
                    <span>{t('max_all_equipped', {}, 'Max All (Lv.10)')}</span>
                  </button>
                )}
                {onClearWeapons && (
                  <button
                    onClick={() => {
                      gameAudio.playButtonClickSound();
                      onClearWeapons();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-600 hover:text-white text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{t('clear_loadout', {}, 'Clear Weapons')}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Top Row: Equipped Weapons and Tactical Abilities */}
            <div className="flex flex-col gap-5">
              {/* Equipped Weapons Panel */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Disc size={15} className="text-amber-400" />
                    <span>{t('equipped_weapons', {}, 'Equipped Weapons')} ({activeWeaponsList.length})</span>
                  </span>
                </div>

                {activeWeaponsList.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center bg-zinc-900/20">
                    <Wand2 size={24} className="text-zinc-600 mb-2" />
                    <p className="text-xs font-mono text-zinc-400 uppercase font-bold">
                      {t('no_weapons_equipped', {}, 'No weapons equipped')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {activeWeaponsList.map((wpn, idx) => {
                      const chain = getWeaponChainForType(wpn.type);
                      const currentUpgrade = (chain.currentTier === 3 ? chain.ultimate : chain.currentTier === 2 ? chain.evolution : chain.base) || findWeaponUpgrade(wpn.type);
                      const evoLevel = chain.evolution?.evolutionLevel || 7;
                      const ultLevel = chain.ultimate?.evolutionLevel || 15;

                      return (
                        <div 
                          key={idx}
                          className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden group"
                        >
                          {/* Ambient glow accent behind card depending on active tier */}
                          <div className={`absolute top-0 right-0 w-64 h-24 rounded-full blur-3xl pointer-events-none opacity-20 ${
                            chain.currentTier === 3 ? 'bg-amber-500' :
                            chain.currentTier === 2 ? 'bg-purple-500' :
                            'bg-emerald-500'
                          }`} />

                          {/* Weapon Series Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 ${
                                chain.currentTier === 3 ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]' :
                                chain.currentTier === 2 ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]' :
                                'bg-zinc-950 border-zinc-800 text-emerald-400'
                              }`}>
                                {currentUpgrade ? getIcon(currentUpgrade) : <Disc size={20} className="text-zinc-400" />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-black uppercase text-white tracking-wide truncate">
                                    {currentUpgrade ? t('up_name_' + currentUpgrade.id, {}, currentUpgrade.name) : wpn.type}
                                  </h4>
                                  <span className={`text-[9px] sm:text-[10px] font-mono font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                    chain.currentTier === 3 ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                                    chain.currentTier === 2 ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}>
                                    {chain.currentTier === 3 ? 'T3 GOD-ENGINE' : chain.currentTier === 2 ? 'T2 MUTATED' : 'T1 BASE'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-400 flex-wrap">
                                  <span className="text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.2 rounded">
                                    Lv. {wpn.level || 1}
                                  </span>
                                  {wpn.damage > 0 && (
                                    <span className="text-zinc-300 font-semibold">
                                      • {Math.round(wpn.damage)} dmg
                                    </span>
                                  )}
                                  {chain.currentTier === 1 && chain.evolution && (
                                    <span className="text-purple-300 text-[11px] font-semibold hidden sm:inline">
                                      • Mutates at Lv.{evoLevel} ({Math.max(0, evoLevel - (wpn.level || 1))} lvls to unlock)
                                    </span>
                                  )}
                                  {chain.currentTier === 2 && chain.ultimate && (
                                    <span className="text-amber-300 text-[11px] font-semibold hidden sm:inline">
                                      • God-Engine at Lv.{ultLevel} ({Math.max(0, ultLevel - (wpn.level || 1))} lvls to unlock)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sandbox interactive controls */}
                            {isSandbox && currentUpgrade && (
                              <div className="flex items-center gap-1.5 shrink-0 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
                                <button
                                  onClick={() => {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.({ ...currentUpgrade, id: `${currentUpgrade.id}_LEVEL_DOWN` });
                                  }}
                                  className="px-2 py-1 flex items-center gap-1 bg-zinc-800 hover:bg-red-500 hover:text-white rounded text-zinc-300 transition-colors text-xs font-mono font-bold cursor-pointer"
                                  title={t('lvl_minus_label', {}, 'Level Down')}
                                >
                                  <Minus size={12} />
                                  <span>Lvl -</span>
                                </button>

                                <button
                                  onClick={() => {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.({ ...currentUpgrade, id: `${currentUpgrade.id}_LEVEL_UP` });
                                  }}
                                  className="px-2 py-1 flex items-center gap-1 bg-zinc-800 hover:bg-emerald-500 hover:text-white rounded text-zinc-300 transition-colors text-xs font-mono font-bold cursor-pointer"
                                  title={t('lvl_plus_label', {}, 'Level Up')}
                                >
                                  <Plus size={12} />
                                  <span>Lvl +</span>
                                </button>

                                <button
                                  onClick={() => {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.({ ...currentUpgrade, id: `${currentUpgrade.id}_LEVEL_MAX` });
                                  }}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded text-zinc-300 transition-colors text-xs font-mono font-bold cursor-pointer"
                                  title={t('max_label', {}, 'Max')}
                                >
                                  Max
                                </button>

                                <button
                                  onClick={() => {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.({ ...currentUpgrade, id: `${currentUpgrade.id}_UNEQUIP` });
                                  }}
                                  className="p-1.5 bg-zinc-800 hover:bg-red-600 hover:text-white rounded text-zinc-400 transition-colors cursor-pointer"
                                  title={t('unequip_label', {}, 'Unequip')}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Evolution Forecast 3-Stage Pipeline */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch relative z-10">
                            {/* STAGE 1: BASE */}
                            {chain.base && (
                              <div 
                                onClick={() => {
                                  if (isSandbox && chain.base) {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.(chain.base);
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                                  chain.currentTier === 1
                                    ? 'bg-emerald-950/35 border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10'
                                    : chain.currentTier > 1
                                    ? 'bg-zinc-900/50 border-zinc-800/80 opacity-75'
                                    : 'bg-zinc-900/30 border-zinc-800/60'
                                } ${isSandbox ? 'cursor-pointer hover:border-cyan-400 hover:opacity-100' : ''}`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                                        {getIcon(chain.base)}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-black uppercase text-white tracking-wide truncate">
                                          {t('up_name_' + chain.base.id, {}, chain.base.name)}
                                        </h5>
                                        <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold">
                                          Stage 1 • Base Form
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      chain.currentTier === 1
                                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.6)] font-bold'
                                        : chain.currentTier > 1
                                        ? 'bg-zinc-800 text-zinc-400'
                                        : 'bg-zinc-850 text-zinc-500'
                                    }`}>
                                      {chain.currentTier === 1 ? `EQUIPPED (Lv.${wpn.level || 1})` : chain.currentTier > 1 ? 'MASTERED' : 'BASE'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/60 pt-2.5">
                                    {t('up_desc_' + chain.base.id, {}, chain.base.description)}
                                  </p>
                                </div>

                                {/* Requirement & Stage Footnote */}
                                <div className="mt-2 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-zinc-500 uppercase font-bold">Evolution:</span>
                                  <span className="text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded font-bold">
                                    {t('mutates_at_level_label', {}, 'MUTATES AT LEVEL')} {evoLevel}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* STAGE 2: MUTATED */}
                            {chain.evolution ? (
                              <div 
                                onClick={() => {
                                  if (isSandbox && chain.evolution) {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.(chain.evolution);
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                                  chain.currentTier === 2
                                    ? 'bg-purple-950/45 border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_22px_rgba(168,85,247,0.35)] z-10'
                                    : chain.currentTier > 2
                                    ? 'bg-zinc-900/50 border-zinc-800/80 opacity-75'
                                    : 'bg-zinc-900/30 border-zinc-800/60 hover:border-purple-500/40'
                                } ${isSandbox ? 'cursor-pointer hover:border-cyan-400 hover:opacity-100' : ''}`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                                        {getIcon(chain.evolution)}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-black uppercase text-white tracking-wide truncate">
                                          {t('up_name_' + chain.evolution.id, {}, chain.evolution.name)}
                                        </h5>
                                        <span className="text-[9px] font-mono text-purple-400 block uppercase font-bold">
                                          Stage 2 • Mutated Form
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      chain.currentTier === 2
                                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] font-bold'
                                        : chain.currentTier > 2
                                        ? 'bg-zinc-800 text-zinc-400'
                                        : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                                    }`}>
                                      {chain.currentTier === 2 ? `EQUIPPED (Lv.${wpn.level || 1})` : chain.currentTier > 2 ? 'MASTERED' : 'UPCOMING'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/60 pt-2.5">
                                    {t('up_desc_' + chain.evolution.id, {}, chain.evolution.description)}
                                  </p>
                                </div>

                                {/* Mutation threshold footnote */}
                                <div className="mt-2 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-zinc-500 uppercase font-bold">Unlock Threshold:</span>
                                  <span className="text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded font-bold">
                                    {t('mutates_at_level_label', {}, 'MUTATES AT LEVEL')} {evoLevel}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center text-zinc-600 font-mono text-xs uppercase">
                                No Mutated Stage
                              </div>
                            )}

                            {/* STAGE 3: GOD-ENGINE */}
                            {chain.ultimate ? (
                              <div 
                                onClick={() => {
                                  if (isSandbox && chain.ultimate) {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.(chain.ultimate);
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                                  chain.currentTier === 3
                                    ? 'bg-amber-950/45 border-amber-400 ring-2 ring-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.4)] z-10'
                                    : 'bg-zinc-900/30 border-zinc-800/60 hover:border-amber-500/40'
                                } ${isSandbox ? 'cursor-pointer hover:border-cyan-400 hover:opacity-100' : ''}`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                                        {getIcon(chain.ultimate)}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-black uppercase text-white tracking-wide truncate">
                                          {t('up_name_' + chain.ultimate.id, {}, chain.ultimate.name)}
                                        </h5>
                                        <span className="text-[9px] font-mono text-amber-400 block uppercase font-bold">
                                          Stage 3 • God-Engine
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      chain.currentTier === 3
                                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.7)] font-bold'
                                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                    }`}>
                                      {chain.currentTier === 3 ? `EQUIPPED (Lv.${wpn.level || 1})` : 'GOD-ENGINE'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/60 pt-2.5">
                                    {t('up_desc_' + chain.ultimate.id, {}, chain.ultimate.description)}
                                  </p>
                                </div>

                                {/* God-Engine requirement footnote */}
                                <div className="mt-2 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-zinc-500 uppercase font-bold">God-Engine Threshold:</span>
                                  <span className="text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded font-bold">
                                    {t('god_engine_at_level_label', {}, 'GOD-ENGINE AT LEVEL')} {ultLevel}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center text-zinc-600 font-mono text-xs uppercase">
                                No God-Engine Stage
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Equipped Tactical Abilities Panel */}
              <div className="pt-4 border-t border-zinc-800/70 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-400">
                  <span className="flex items-center gap-2">
                    <ZapIcon size={15} className="text-cyan-400" />
                    <span>{t('tactical_abilities', {}, 'Tactical Abilities')} ({activeAbilitiesList.length})</span>
                  </span>
                </div>

                {activeAbilitiesList.length === 0 ? (
                  <div className="p-4 border border-dashed border-zinc-800/80 rounded-xl text-center bg-zinc-900/10">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase">
                      {t('no_abilities_equipped', {}, 'No abilities active')}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {activeAbilitiesList.map((abl, idx) => {
                      const chain = getAbilityChainForType(abl.type);
                      const currentUpgrade = (chain.currentTier === 2 ? chain.mutation : chain.base) || findAbilityUpgrade(abl.type);
                      const evoLevel = chain.mutation?.evolutionLevel || 15;

                      return (
                        <div 
                          key={idx}
                          className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden"
                        >
                          {/* Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 ${
                                chain.currentTier === 2 ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]' :
                                'bg-zinc-950 border-zinc-800 text-cyan-400'
                              }`}>
                                {currentUpgrade ? getIcon(currentUpgrade) : <ZapIcon size={20} className="text-cyan-400" />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-black uppercase text-white tracking-wide truncate">
                                    {currentUpgrade ? t('up_name_' + currentUpgrade.id, {}, currentUpgrade.name) : abl.name || abl.type}
                                  </h4>
                                  <span className={`text-[9px] sm:text-[10px] font-mono font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                    chain.currentTier === 2 ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                                    'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                  }`}>
                                    {chain.currentTier === 2 ? 'MUTATED ABILITY' : 'BASE TACTICAL'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-400">
                                  <span>
                                    Cooldown: {((abl.cooldown || 3000) / 1000).toFixed(1)}s
                                  </span>
                                  {chain.currentTier === 1 && chain.mutation && (
                                    <span className="text-purple-300 text-[11px] font-semibold hidden sm:inline">
                                      • Mutates at Level {evoLevel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isSandbox && currentUpgrade && (
                              <button
                                onClick={() => {
                                  gameAudio.playButtonClickSound();
                                  onSelect?.(currentUpgrade);
                                }}
                                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-500 hover:text-white border border-red-500/40 text-xs font-mono text-red-300 rounded-lg uppercase font-bold transition-colors cursor-pointer shrink-0"
                              >
                                {t('unequip_label', {}, 'Unequip')}
                              </button>
                            )}
                          </div>

                          {/* 2-Stage Ability Pipeline */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
                            {/* BASE ABILITY */}
                            {chain.base && (
                              <div 
                                onClick={() => {
                                  if (isSandbox && chain.base) {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.(chain.base);
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                                  chain.currentTier === 1
                                    ? 'bg-cyan-950/35 border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-10'
                                    : 'bg-zinc-900/50 border-zinc-800/80 opacity-75'
                                } ${isSandbox ? 'cursor-pointer hover:border-cyan-400 hover:opacity-100' : ''}`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                                        {getIcon(chain.base)}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-black uppercase text-white tracking-wide truncate">
                                          {t('up_name_' + chain.base.id, {}, chain.base.name)}
                                        </h5>
                                        <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold">
                                          Stage 1 • Base Ability
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      chain.currentTier === 1
                                        ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.6)] font-bold'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {chain.currentTier === 1 ? 'CURRENT ACTIVE' : 'EVOLVED'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/60 pt-2.5">
                                    {t('up_desc_' + chain.base.id, {}, chain.base.description)}
                                  </p>
                                </div>

                                {chain.mutation && (
                                  <div className="mt-2 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-zinc-500 uppercase font-bold">Evolution:</span>
                                    <span className="text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded font-bold">
                                      {t('mutates_at_level_label', {}, 'MUTATES AT LEVEL')} {evoLevel}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* MUTATED ABILITY */}
                            {chain.mutation ? (
                              <div 
                                onClick={() => {
                                  if (isSandbox && chain.mutation) {
                                    gameAudio.playButtonClickSound();
                                    onSelect?.(chain.mutation);
                                  }
                                }}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                                  chain.currentTier === 2
                                    ? 'bg-purple-950/45 border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_22px_rgba(168,85,247,0.35)] z-10'
                                    : 'bg-zinc-900/30 border-zinc-800/60 hover:border-purple-500/40'
                                } ${isSandbox ? 'cursor-pointer hover:border-cyan-400 hover:opacity-100' : ''}`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                                        {getIcon(chain.mutation)}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-black uppercase text-white tracking-wide truncate">
                                          {t('up_name_' + chain.mutation.id, {}, chain.mutation.name)}
                                        </h5>
                                        <span className="text-[9px] font-mono text-purple-400 block uppercase font-bold">
                                          Stage 2 • Final Form (Max Lv. 10)
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      chain.currentTier === 2
                                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] font-bold'
                                        : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                                    }`}>
                                      {chain.currentTier === 2 ? 'CURRENT ACTIVE' : 'UPCOMING'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/60 pt-2.5">
                                    {t('up_desc_' + chain.mutation.id, {}, chain.mutation.description)}
                                  </p>
                                </div>

                                <div className="mt-2 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-zinc-500 uppercase font-bold">Unlock & Cap:</span>
                                  <span className="text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded font-bold">
                                    {t('mutates_at_level_label', {}, 'MUTATES AT LEVEL')} {evoLevel} • MAX LV. 10
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center text-zinc-600 font-mono text-xs uppercase">
                                No Mutated Form
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Combat Profile & Multipliers (Full Width Matrix) */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold uppercase text-zinc-300 pb-2.5 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span>{t('combat_matrix', {}, 'Combat Stat Matrix')}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-4">
                  <span>{t('melee_haste', {}, 'Melee Spd')}: +{Math.round(((playerStats.meleeSpeed || 1.0) - 1) * 100)}%</span>
                  <span>{t('area_scale', {}, 'Size')}: +{Math.round(((playerStats.weaponSize || 1.0) - 1) * 100)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs font-mono">
                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_hull', {}, 'Max Hull')}</span>
                  <span className="text-white font-bold">{Math.round(playerMaxHp)} HP</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_damage', {}, 'Damage Mult')}</span>
                  <span className="text-orange-400 font-bold">x{(playerStats.damageMult || 1.0).toFixed(2)}</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_velocity', {}, 'Velocity')}</span>
                  <span className="text-cyan-400 font-bold">+{Math.round(((playerStats.speed || 1.0) - 1) * 100)}%</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_critical', {}, 'Crit Chance')}</span>
                  <span className="text-yellow-400 font-bold">{Math.round((playerStats.critChance || 0.05) * 100)}%</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_defense', {}, 'Defense')}</span>
                  <span className="text-sky-400 font-bold">+{Math.round(((playerStats.defense || 1.0) - 1) * 100)}%</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_haste', {}, 'Haste / CD')}</span>
                  <span className="text-purple-400 font-bold">-{Math.round((1 - (playerStats.cooldownMult ?? 1.0)) * 100)}%</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_regen', {}, 'Hull Regen')}</span>
                  <span className="text-lime-400 font-bold">+{playerStats.regen || 0}/s</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('stat_lifesteal', {}, 'Lifesteal')}</span>
                  <span className="text-rose-400 font-bold">{Math.round((playerStats.lifesteal || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ========================================================================= */}
        {/* GALLERY AREA: Navigation & Evolution Roadmaps */}
        {/* ========================================================================= */}
        {(activeCategory === 'ALL' || activeCategory !== 'LOADOUT') && (
        <div>
          {/* Gallery Section Header & Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Layers className="text-amber-500" size={26} /> 
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                {t('gallery', {}, 'GALLERY')}
              </h2>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'ALL' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('all_systems', {}, 'ALL')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('WEAPONS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'WEAPONS' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('weapons_roadmap', {}, 'WEAPONS')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('ABILITIES'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'ABILITIES' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('tactical_abilities', {}, 'ABILITIES')}
              </button>
              <button
                onClick={() => { gameAudio.playButtonClickSound(); setActiveCategory('STATS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeCategory === 'STATS' ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('stat_augmentations', {}, 'STATS')}
              </button>
            </div>
          </div>

          {/* 1. WEAPON ROADMAP */}
          {(activeCategory === 'ALL' || activeCategory === 'WEAPONS') && (
            <section className="mb-16" id="compendium_weapons_section">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <CircuitBoard className="text-amber-500" size={24} /> {t('weapon_evolution_roadmap', {}, 'Weapon Evolution Roadmap')}
                </h3>
                <div className="flex gap-4 text-xs font-mono font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-zinc-700"></div> {t('status_base', {}, 'Base')}</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-600"></div> {t('evolve', {}, 'Mutated (T2)')}</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-400"></div> {t('god_engine', {}, 'God-Engine (T3)')}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {baseWeapons.map(base => {
                  const evolution = EVOLVED_UPGRADES.find(e => e.evolutionOf === base.weaponType);
                  const ultimate = evolution ? ULTIMATE_UPGRADES.find(u => u.evolutionOf === evolution.weaponType) : null;

                  return (
                    <div 
                      key={base.id} 
                      className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-zinc-905/30 p-4 sm:p-5 rounded-2xl border border-zinc-800/40 hover:bg-zinc-900/10 transition-all duration-300 w-full md:justify-between"
                    >
                      {/* TIER 1 */}
                      <div className="flex-1 min-w-0">
                        {nodeCard(base, null, { evolution, ultimate })}
                      </div>

                      {/* T1 -> T2 Arrow */}
                      <div className="flex items-center justify-center py-1 text-zinc-750">
                        <ChevronRight className="rotate-90 md:rotate-0 text-zinc-700" size={16} />
                      </div>

                      {/* TIER 2 */}
                      <div className="flex-1 min-w-0">
                        {evolution ? (
                          nodeCard(evolution, null, { ultimate })
                        ) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('no_mutant', {}, 'No Mutant')}</span>
                          </div>
                        )}
                      </div>

                      {/* T2 -> T3 Arrow */}
                      <div className="flex items-center justify-center py-1 text-zinc-750">
                        <ChevronRight className="rotate-90 md:rotate-0 text-zinc-700" size={16} />
                      </div>

                      {/* TIER 3 */}
                      <div className="flex-1 min-w-0">
                        {ultimate ? (
                          nodeCard(ultimate)
                        ) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('incomplete', {}, 'Incomplete')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. ABILITY EVOLVED SECTION */}
          {(activeCategory === 'ALL' || activeCategory === 'ABILITIES') && (
            <section className="mb-16" id="compendium_abilities_section">
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <ZapIcon className="text-cyan-400" size={24} /> {t('tactical_abilities_evolution', {}, 'Tactical Abilities Evolution')}
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {ABILITY_CHAINS.map((chain, index) => {
                  return (
                    <div 
                      key={index} 
                      className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-zinc-905/30 p-4 sm:p-5 rounded-2xl border border-zinc-800/40 hover:bg-zinc-900/10 transition-all duration-300 w-full md:justify-between"
                    >
                      {/* BASE ABILITY */}
                      <div className="flex-1 min-w-0">
                        {nodeCard(chain.base)}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center py-1 text-zinc-750">
                        <ChevronRight className="rotate-90 md:rotate-0 text-zinc-700" size={16} />
                      </div>

                      {/* MUTATED ABILITY */}
                      <div className="flex-1 min-w-0">
                        {chain.mutation ? (
                          nodeCard(chain.mutation)
                        ) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('no_mutation', {}, 'No Mutation')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. STAT EVOLVED ROADMAPS SECTION */}
          {(activeCategory === 'ALL' || activeCategory === 'STATS') && (
            <section className="mb-16" id="compendium_stats_section">
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Target className="text-emerald-400" size={24} /> {t('stat_augmentation_roadmap', {}, 'Stat Augmentation Roadmap')}
              </h3>
              <div className="grid grid-cols-1 gap-5">
                {STAT_CHAINS.map((chain, index) => {
                  return (
                    <div 
                      key={index} 
                      className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-zinc-905/30 p-4 sm:p-5 rounded-2xl border border-zinc-800/40 hover:bg-zinc-900/10 transition-all duration-300 w-full md:justify-between"
                    >
                      {/* BASE STAT */}
                      <div className="flex-1 min-w-0">
                        {chain.base ? nodeCard(chain.base) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('empty_slot', {}, 'None')}</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center py-1 text-zinc-750">
                        <ChevronRight className="rotate-90 md:rotate-0 text-zinc-700" size={16} />
                      </div>

                      {/* MUTATED STAT */}
                      <div className="flex-1 min-w-0">
                        {chain.evolution ? (
                          nodeCard(chain.evolution)
                        ) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('incomplete', {}, 'Incomplete')}</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center py-1 text-zinc-750">
                        <ChevronRight className="rotate-90 md:rotate-0 text-zinc-700" size={16} />
                      </div>

                      {/* GOD-ENGINE STAT */}
                      <div className="flex-1 min-w-0">
                        {chain.ultimate ? (
                          nodeCard(chain.ultimate)
                        ) : (
                          <div className="p-4 border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center opacity-20 h-full min-h-[52px]">
                            <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500">{t('incomplete', {}, 'Incomplete')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Auxiliary Stats */}
          {(activeCategory === 'ALL' || activeCategory === 'STATS') && auxiliaryStats.length > 0 && (
            <section className="mb-16" id="compendium_aux_stats_section">
              <h3 className="text-lg font-black text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={18} /> {t('auxiliary_augmentations', {}, 'Auxiliary Augmentations')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {auxiliaryStats.map(stat => (
                  <div key={stat.id}>
                    {nodeCard(stat)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        )}
      </div>

    </motion.div>
  </div>
  );
}
