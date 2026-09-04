import { WeaponType, Weapon, AbilityType, ActiveAbility } from './types.ts';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  type: 'WEAPON' | 'STAT' | 'ABILITY';
  weaponType?: WeaponType;
  abilityType?: AbilityType;
  statKey?: string;
  value?: number;
  evolutionOf?: WeaponType;
  evolutionLevel?: number;
  tier?: number;
}

export const ALL_UPGRADES: Upgrade[] = [
  {
    id: 'blade_1',
    name: 'Spinning Blade',
    description: 'Rapid rotating cutter that sweeps around player.',
    type: 'WEAPON',
    weaponType: WeaponType.SPINNING_BLADE,
  },
  {
    id: 'turret_1',
    name: 'Auto Turret',
    description: 'Deploy a high-speed orbiting point-defense companion drone that targets and fires upon nearby hostiles.',
    type: 'WEAPON',
    weaponType: WeaponType.AUTO_TURRET,
  },
  {
    id: 'fire_trail',
    name: 'Fire Trail',
    description: 'Leaves a trail of burning propellant in your movement wake.',
    type: 'WEAPON',
    weaponType: WeaponType.FIRE_TRAIL,
  },
  {
    id: 'shield_1',
    name: 'Orbital Shield',
    description: 'Creates orbiting fields to deflect and absorb damage.',
    type: 'WEAPON',
    weaponType: WeaponType.ORBITAL_SHIELD,
  },
  {
    id: 'magic_burst',
    name: 'Energy Burst',
    description: 'Releases a periodic, omni-directional kinetic pulse.',
    type: 'WEAPON',
    weaponType: WeaponType.MAGIC_BURST,
  },
  {
    id: 'chain_sword',
    name: 'Chain Lightning Sword',
    description: 'Melee blade that arcs electric energy to surrounding targets.',
    type: 'WEAPON',
    weaponType: WeaponType.CHAIN_ARC_SWORD,
    tier: 1,
  },
  {
    id: 'shotgun_1',
    name: 'Shotgun',
    description: 'Fires high-spread bursts of kinetic shrapnel.',
    type: 'WEAPON',
    weaponType: WeaponType.SHOTGUN,
    tier: 1,
  },
  {
    id: 'magic_blaster_1',
    name: 'Homing Blaster',
    description: 'Fires target-locked bolts of ionized energy.',
    type: 'WEAPON',
    weaponType: WeaponType.MAGIC_BLASTER,
    tier: 1,
  },
  {
    id: 'bomb_launcher_1',
    name: 'Bomb Launcher',
    description: 'Launches high-yield explosive canisters over target areas.',
    type: 'WEAPON',
    weaponType: WeaponType.BOMB_LAUNCHER,
    tier: 1,
  },
  {
    id: 'clone_projection_1',
    name: 'Holographic Clone',
    description: 'Projects a hard-light phantom that attacks nearby hostiles.',
    type: 'WEAPON',
    weaponType: WeaponType.CLONE_PROJECTION,
    tier: 1,
  },
  {
    id: 'razor_1',
    name: 'Plasma Razor',
    description: 'High-frequency buzzsaw that shreds targets in its path.',
    type: 'WEAPON',
    weaponType: WeaponType.PLASMA_RAZOR,
    tier: 1,
  },
  {
    id: 'tesla_1',
    name: 'Tesla Coil',
    description: 'Chains electrical shocks directly across nearby hostiles.',
    type: 'WEAPON',
    weaponType: WeaponType.TESLA_COIL,
    tier: 1,
  },
  {
    id: 'gravity_1',
    name: 'Gravity Beam',
    description: 'Fires gravity streams that slow and pull hostiles.',
    type: 'WEAPON',
    weaponType: WeaponType.GRAVITY_BEAM,
    tier: 1,
  },
  {
    id: 'ion_1',
    name: 'Ion Cannon',
    description: 'Fires long-range piercing beams that cleave enemies.',
    type: 'WEAPON',
    weaponType: WeaponType.ION_CANNON,
    tier: 1,
  },
  {
    id: 'mines_1',
    name: 'Mine Layer',
    description: 'Drops proximity-detonated explosive canisters.',
    type: 'WEAPON',
    weaponType: WeaponType.MINE_LAYER,
    tier: 1,
  },
  {
    id: 'photon_1',
    name: 'Photon Repeater',
    description: 'Rapid-fire energy pulses that accelerate over time.',
    type: 'WEAPON',
    weaponType: WeaponType.PHOTON_REPEATER,
    tier: 1,
  },
  {
    id: 'ricochet_1',
    name: 'Ricochet Cannon',
    description: 'Fires kinetic shells that bounce off borders and walls.',
    type: 'WEAPON',
    weaponType: WeaponType.RICOCHET_CANNON,
    tier: 1,
  },
  {
    id: 'stat_speed',
    name: 'Afterburners',
    description: 'Increases baseline movement velocity by +3%.',
    type: 'STAT',
    statKey: 'speed',
    value: 1.03,
  },
  {
    id: 'stat_bounce',
    name: 'Impact Engine',
    description: 'Increases bounce collision damage by +2.',
    type: 'STAT',
    statKey: 'bounceDmg',
    value: 2,
  },
  {
    id: 'stat_hull',
    name: 'Hull Plating',
    description: 'Reinforces integrity. Gain +10 max HP.',
    type: 'STAT',
    statKey: 'maxHp',
    value: 10,
  },
  {
    id: 'stat_crit',
    name: 'Critical Strike Chance',
    description: 'Adds +2% chance to deal double damage.',
    type: 'STAT',
    statKey: 'critChance',
    value: 0.02,
  },
  {
    id: 'stat_def',
    name: 'Reflective Coating',
    description: 'Adds protective layers to absorb 3% of damage.',
    type: 'STAT',
    statKey: 'defense',
    value: 0.03,
    tier: 1,
  },
  {
    id: 'stat_luck',
    name: 'Core Optimizer',
    description: 'Augments target locks: adds +5% Critical Chance.',
    type: 'STAT',
    statKey: 'critChance',
    value: 0.05,
    tier: 2,
  },
  {
    id: 'stat_repair',
    name: 'Auto-Welder',
    description: 'Restores hull integrity: gain +0.15 HP/sec regen.',
    type: 'STAT',
    statKey: 'regen',
    value: 0.15,
    tier: 1,
  },
  {
    id: 'stat_fire_rate',
    name: 'Rapid Reloader',
    description: 'Reduces all weapon reload cooldowns by -1.5%.',
    type: 'STAT',
    statKey: 'cooldownMult',
    value: 0.985,
    tier: 1,
  },
  {
    id: 'stat_lifesteal',
    name: 'Vampiric Drive',
    description: 'Converts 1.5% of all dealt damage directly to health.',
    type: 'STAT',
    statKey: 'lifesteal',
    value: 0.015,
    tier: 1,
  },
  {
    id: 'stat_accuracy',
    name: 'Calibration Accuracy',
    description: 'Increases predictive shooter lead tracking and narrows bullet spread cone range (+8% accuracy).',
    type: 'STAT',
    statKey: 'accuracy',
    value: 0.08,
    tier: 1,
  },
  {
    id: 'ability_shockwave',
    name: 'Shockwave Blast',
    description: 'Active: Fires a heavy force wave to repel foes.',
    type: 'ABILITY',
    abilityType: AbilityType.SHOCKWAVE,
  },
  {
    id: 'ability_toxic',
    name: 'Toxic Cloud',
    description: 'Active: Spawns a corrosive gas cloud that poisons foes.',
    type: 'ABILITY',
    abilityType: AbilityType.TOXIC_CLOUD,
  },
  {
    id: 'ability_shield',
    name: 'Shield Nova',
    description: 'Active: Emits a kinetic barrier pushing all nearby foes.',
    type: 'ABILITY',
    abilityType: AbilityType.SHIELD_BURST,
  },
  {
    id: 'ability_dash',
    name: 'Overdrive Dash',
    description: 'Active: Empowers dash power and reduces its cooldown.',
    type: 'ABILITY',
    abilityType: AbilityType.DASH,
  },
  {
    id: 'ability_time_warp',
    name: 'Temporal Shift',
    description: 'Active: Greatly slows down time for all hostiles.',
    type: 'ABILITY',
    abilityType: AbilityType.TIME_WARP,
    tier: 3,
  },
  {
    id: 'ability_overdrive',
    name: 'Combat Overdrive',
    description: 'Active: Grants massive fire rate and speed boost for 5s.',
    type: 'ABILITY',
    abilityType: AbilityType.OVERDRIVE,
    tier: 2,
  },
  {
    id: 'ability_chain',
    name: 'Volt Cascade',
    description: 'Active: Fires high-voltage bolt that jumps 10 targets.',
    type: 'ABILITY',
    abilityType: AbilityType.CHAIN_LIGHTNING,
  },
  {
    id: 'ability_frost',
    name: 'Glacier Pulse',
    description: 'Active: Freezes all nearby enemies in a massive radius.',
    type: 'ABILITY',
    abilityType: AbilityType.FROST_NOVA,
  },
  {
    id: 'ability_heal',
    name: 'Repair Nanites',
    description: 'Active: Dispatches repair nanites (+1.5 HP/s per level) continuously regardless of combat status for 3s.',
    type: 'ABILITY',
    abilityType: AbilityType.HEALING_AURA,
    tier: 2,
  },
  {
    id: 'ability_meteor',
    name: 'Orbital Strike',
    description: 'Active: Fires high-yield fire impacts from low orbit.',
    type: 'ABILITY',
    abilityType: AbilityType.METEOR_STRIKE,
    tier: 3,
  },
  {
    id: 'ability_blood',
    name: 'Berserker Engine',
    description: 'Active: Grants extreme lifesteal and speed for 5 seconds.',
    type: 'ABILITY',
    abilityType: AbilityType.BLOOD_LUST,
    tier: 2,
  },
  {
    id: 'stat_synergy',
    name: 'Core Sync Protocols',
    description: 'Increases likelihood of matching upgrade drops by +3%.',
    type: 'STAT',
    statKey: 'weaponSynergy',
    value: 0.03,
  },
  {
    id: 'ability_bounce',
    name: 'Bouncing Rounds',
    description: 'Active: Causes all projectiles to bounce off boundaries.',
    type: 'ABILITY',
    abilityType: AbilityType.BOUNCE_SHOTS,
  },
  {
    id: 'ice_sword_1',
    name: 'Ice Sword',
    description: 'Spins a cryo-blade that slows foes and fires shards.',
    type: 'WEAPON',
    weaponType: WeaponType.ICE_SWORD,
    tier: 1,
  },
  {
    id: 'fire_sword_1',
    name: 'Fire Sword',
    description: 'Spins an ignited blade that deals close damage and burns.',
    type: 'WEAPON',
    weaponType: WeaponType.FIRE_SWORD,
    tier: 1,
  },
  {
    id: 'stat_melee_speed',
    name: 'Gyroscopic Overdrive',
    description: 'Accelerates rotational speed of melee weapons by +3%.',
    type: 'STAT',
    statKey: 'meleeSpeed',
    value: 1.03,
  },
  {
    id: 'stat_weapon_size',
    name: 'Sub-Atomic Expander',
    description: 'Increases size and hitboxes of contact weapons by +3%.',
    type: 'STAT',
    statKey: 'weaponSize',
    value: 1.03,
  },
  {
    id: 'stat_proj_slow',
    name: 'Cryogenic Infusion',
    description: 'Adds frost to bullets, slowing enemies by 5% on hit.',
    type: 'STAT',
    statKey: 'projectileSlow',
    value: 0.05,
  },
  {
    id: 'stat_fire_dmg_boost',
    name: 'Combustion Catalyst',
    description: 'Deals +3% more damage against burning hostiles.',
    type: 'STAT',
    statKey: 'fireDmgBoost',
    value: 0.03,
  },
  {
    id: 'ability_blizzard',
    name: 'Glacial Blizzard',
    description: 'Active: Spawns a massive freeze storm around the player, slowing and damaging enemies.',
    type: 'ABILITY',
    abilityType: AbilityType.BLIZZARD,
  },
  {
    id: 'ability_inferno',
    name: 'Inferno Flames',
    description: 'Active: Ignites orbiting walls of fire that burn nearby enemies and detonate them on death.',
    type: 'ABILITY',
    abilityType: AbilityType.INFERNO,
  },
];

export const EVOLVED_ABILITIES: Upgrade[] = [
  {
    id: 'evo_dash',
    name: 'Dimensional Dash',
    description: 'Evolved: Leaving high-damage spatial rifts in your movement wake.',
    type: 'ABILITY',
    abilityType: AbilityType.DIMENSIONAL_DASH,
    evolutionOf: AbilityType.DASH as unknown as WeaponType, // Reuse property for simplicity
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_warp',
    name: 'Temporal Collapse',
    description: 'Evolved: Time dilation deals heavy ticks of damage to frozen/slowed foes.',
    type: 'ABILITY',
    abilityType: AbilityType.TEMPORAL_COLLAPSE,
    evolutionOf: AbilityType.TIME_WARP as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_shield_burst',
    name: 'Plasma Nova',
    description: 'Evolved: Emits a high-heat plasma expansion that shreds armor.',
    type: 'ABILITY',
    abilityType: AbilityType.PLASMA_NOVA,
    evolutionOf: AbilityType.SHIELD_BURST as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_overdrive',
    name: 'Apex Overdrive',
    description: 'Evolved: Spits rapid, high-voltage electric discharges at targets.',
    type: 'ABILITY',
    abilityType: AbilityType.APEX_OVERDRIVE,
    evolutionOf: AbilityType.OVERDRIVE as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_shockwave',
    name: 'Seismic Crusher',
    description: 'Evolved: Triggers custom tectonic pulses that crush and stun foes.',
    type: 'ABILITY',
    abilityType: AbilityType.SEISMIC_CRUSHER,
    evolutionOf: AbilityType.SHOCKWAVE as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_toxic',
    name: 'Corrosive Decay',
    description: 'Evolved: Emits acidic fires that melt armor and spread between foes.',
    type: 'ABILITY',
    abilityType: AbilityType.CORROSIVE_DECAY,
    evolutionOf: AbilityType.TOXIC_CLOUD as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_chain',
    name: 'Thunderbolt Storm',
    description: 'Evolved: Contact shocks trigger cascading static explosions.',
    type: 'ABILITY',
    abilityType: AbilityType.THUNDERBOLT_STORM,
    evolutionOf: AbilityType.CHAIN_LIGHTNING as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_frost',
    name: 'Absolute Zero Ripple',
    description: 'Evolved: Frozen enemies shatter into high-speed piercing shards.',
    type: 'ABILITY',
    abilityType: AbilityType.ABSOLUTE_ZERO_RIPPLE,
    evolutionOf: AbilityType.FROST_NOVA as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_heal',
    name: 'Nanite Aegis',
    description: 'Evolved: Fortified dome granting +75% defense & continuous nanite repair (+5 HP/s per level).',
    type: 'ABILITY',
    abilityType: AbilityType.NANITE_AEGIS,
    evolutionOf: AbilityType.HEALING_AURA as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_meteor',
    name: 'Supernova Rain',
    description: 'Evolved: Saturation bombardment with persistent thermite fire pockets.',
    type: 'ABILITY',
    abilityType: AbilityType.SUPERNOVA_RAIN,
    evolutionOf: AbilityType.METEOR_STRIKE as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_blood',
    name: 'Sanguine Frenzy',
    description: 'Evolved: Maximum lifeforce draining, boosting speed and lifesteal.',
    type: 'ABILITY',
    abilityType: AbilityType.SANGUINE_FRENZY,
    evolutionOf: AbilityType.BLOOD_LUST as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_bounce',
    name: 'Kinetic Bounce Storm',
    description: 'Evolved: Projected units accelerate and gain extra base damage per bounce.',
    type: 'ABILITY',
    abilityType: AbilityType.KINETIC_BOUNCE_STORM,
    evolutionOf: AbilityType.BOUNCE_SHOTS as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_blizzard',
    name: 'Frostbite Tempest',
    description: 'Evolved: Envelops the field in a freezing tempest with chilling damage and shattering bursts.',
    type: 'ABILITY',
    abilityType: AbilityType.FROSTBITE_TEMPEST,
    evolutionOf: AbilityType.BLIZZARD as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  },
  {
    id: 'evo_inferno',
    name: 'Hellfire Storm',
    description: 'Evolved: Fires continuous lock-on solar flare columns at hostiles.',
    type: 'ABILITY',
    abilityType: AbilityType.HELLFIRE_STORM,
    evolutionOf: AbilityType.INFERNO as unknown as WeaponType,
    evolutionLevel: 15,
    tier: 2,
  }
];

export const EVOLVED_STATS: Upgrade[] = [
  // --- HULL PLATING SERIES (Max HP) ---
  {
    id: 'stat_hull_2',
    name: 'Heavy Alloy Plating',
    description: 'Layered ceramic-titanium wraps the hull. Gain +20 max HP.',
    type: 'STAT',
    statKey: 'maxHp',
    value: 20,
    tier: 2,
  },
  {
    id: 'stat_omega_hull',
    name: 'Adamantine Core',
    description: 'Quantum structural generator: grants +30 max HP.',
    type: 'STAT',
    statKey: 'maxHp',
    value: 30,
    tier: 3,
  },

  // --- ENGINE BOOSTER SERIES (Speed) ---
  {
    id: 'stat_speed_2',
    name: 'Vector Thrusters',
    description: 'Deploys localized auxiliary thrusters to increase speed by +6%.',
    type: 'STAT',
    statKey: 'speed',
    value: 1.06,
    tier: 2,
  },
  {
    id: 'stat_god_speed',
    name: 'Relativistic Drive',
    description: 'Ultimate engine configuration: boosts overall velocity by +10%.',
    type: 'STAT',
    statKey: 'speed',
    value: 1.10,
    tier: 3,
  },

  // --- REPAIR NANITES SERIES (Regenerative Repair) ---
  {
    id: 'stat_nano_2',
    name: 'Rapid Repair Swarm',
    description: 'Smart self-welding nanobots restore +0.35 HP/second hull health.',
    type: 'STAT',
    statKey: 'regen',
    value: 0.35,
    tier: 2,
  },
  {
    id: 'stat_god_regen',
    name: 'Eternal Forge',
    description: 'Sub-dermal reconstructors restore +0.60 HP/second health.',
    type: 'STAT',
    statKey: 'regen',
    value: 0.60,
    tier: 3,
  },

  // --- LIFESTEAL PROTOCOLS SERIES (Vampiric Drive) ---
  {
    id: 'stat_lifesteal_2',
    name: 'Leech Protocols',
    description: 'Converts 3% of all dealt kinetic damage directly into health.',
    type: 'STAT',
    statKey: 'lifesteal',
    value: 0.03,
    tier: 2,
  },
  {
    id: 'stat_god_ls',
    name: 'Siphon Singularity',
    description: 'Ultimate life drain: converts 5% of all dealt damage into health.',
    type: 'STAT',
    statKey: 'lifesteal',
    value: 0.05,
    tier: 3,
  },

  // --- REFLECTIVE SHIELDS SERIES (Armor / Defense) ---
  {
    id: 'stat_def_2',
    name: 'Kinetic Dampeners',
    description: 'Deflects incoming kinetic force waves to reduce damage by 6%.',
    type: 'STAT',
    statKey: 'defense',
    value: 0.06,
    tier: 2,
  },
  {
    id: 'stat_god_def',
    name: 'Absolute Aegis Matrix',
    description: 'Ultimate light-field barrier: reduces all incoming damage by 10%.',
    type: 'STAT',
    statKey: 'defense',
    value: 0.10,
    tier: 3,
  },

  // --- CRITICAL HIT STRIKES SERIES (Critical Chance) ---
  {
    id: 'stat_crit_2',
    name: 'Core Optimizer',
    description: 'Advanced target computations grant +5% Critical Strike chance.',
    type: 'STAT',
    statKey: 'critChance',
    value: 0.05,
    tier: 2,
  },
  {
    id: 'stat_god_crit',
    name: 'Neural Targeting Array',
    description: 'Quantum threat detectors align impacts, granting +8% Critical chance.',
    type: 'STAT',
    statKey: 'critChance',
    value: 0.08,
    tier: 3,
  },

  // --- CALIBRATION ACCURACY SERIES (Accuracy) ---
  {
    id: 'stat_accuracy_2',
    name: 'Targeting Computer',
    description: 'Advanced predictive lead tracking calculates enemy vectors (+15% accuracy, tighter spread).',
    type: 'STAT',
    statKey: 'accuracy',
    value: 0.15,
    tier: 2,
  },
  {
    id: 'stat_god_accuracy',
    name: 'Omni-Lock Predictor',
    description: 'Quantum trajectory foresight locks onto projected hostile paths (+25% accuracy).',
    type: 'STAT',
    statKey: 'accuracy',
    value: 0.25,
    tier: 3,
  },

  // --- RELOADER WEAPON COOLDOWNS SERIES (Fire Rate / Cooldown) ---
  {
    id: 'stat_fire_rate_2',
    name: 'Hypercharge Reloader',
    description: 'Uses magnetic reload chambers to reduce cooldowns by -3%.',
    type: 'STAT',
    statKey: 'cooldownMult',
    value: 0.97,
    tier: 2,
  },
  {
    id: 'stat_god_fire_rate',
    name: 'Chrono-Relational Matrix',
    description: 'Dilation eliminates reload limits, reducing weapon cooldowns by -5%.',
    type: 'STAT',
    statKey: 'cooldownMult',
    value: 0.95,
    tier: 3,
  },

  // --- BOUNCING KINETICS SERIES (Bounce Damage) ---
  {
    id: 'stat_bounce_2',
    name: 'Elastic Resonator',
    description: 'Carbon-lattice slugs deal +4 extra damage to units on bounce.',
    type: 'STAT',
    statKey: 'bounceDmg',
    value: 4,
    tier: 2,
  },
  {
    id: 'stat_god_bounce',
    name: 'Perpetual Rebound Core',
    description: 'Stabilizers accelerate bouncing bullets to deal +6 extra damage.',
    type: 'STAT',
    statKey: 'bounceDmg',
    value: 6,
    tier: 3,
  },

  // --- GYROSCOPIC MELEE SPEED SERIES (Melee Speed) ---
  {
    id: 'stat_melee_speed_2',
    name: 'Tachyon Rotator Hub',
    description: 'Tachyon servos accelerate orbital and melee swipe speeds by +6%.',
    type: 'STAT',
    statKey: 'meleeSpeed',
    value: 1.06,
    tier: 2,
  },
  {
    id: 'stat_god_melee_speed',
    name: 'Event Horizon Centrifuge',
    description: 'Exceed friction limits to accelerate melee weapon rotation by +10%.',
    type: 'STAT',
    statKey: 'meleeSpeed',
    value: 1.10,
    tier: 3,
  },

  // --- SUB-ATOMIC WEAPON SIZE SERIES (Melee Size) ---
  {
    id: 'stat_weapon_size_2',
    name: 'Macro-Phasic Resonator',
    description: 'Expands weapon frames to increase contact area and size by +5%.',
    type: 'STAT',
    statKey: 'weaponSize',
    value: 1.05,
    tier: 2,
  },
  {
    id: 'stat_god_weapon_size',
    name: 'Titan-Class Projection Matrix',
    description: 'Projects hard-light surrounds, expanding weapon reach and size by +10%.',
    type: 'STAT',
    statKey: 'weaponSize',
    value: 1.10,
    tier: 3,
  },

  // --- CORE SYSTEM SYNCHRONIZATION SERIES (Weapon Synergy) ---
  {
    id: 'stat_synergy_2',
    name: 'Resonant Core Alignment',
    description: 'Secures matching upgrades for your existing setup +5% more often.',
    type: 'STAT',
    statKey: 'weaponSynergy',
    value: 0.05,
    tier: 2,
  },
  {
    id: 'stat_god_synergy',
    name: 'Perfect Synergy Harmonizer',
    description: 'Increases the likelihood of finding matching weapon options by +10%.',
    type: 'STAT',
    statKey: 'weaponSynergy',
    value: 0.10,
    tier: 3,
  },

  // --- CRYOGENIC CHILL SYSTEM (Ice Elements) ---
  {
    id: 'stat_slow_dmg_boost',
    name: 'Frost Shatter',
    description: 'Forces crystallizing shocks, dealing +5% more damage to frozen foes.',
    type: 'STAT',
    statKey: 'slowDmgBoost',
    value: 0.05,
    tier: 2,
  },
  {
    id: 'stat_god_freeze',
    name: 'Absolute Zero Siphon Core',
    description: 'Ultimate cold protocol: deals +10% extra damage to frozen hostiles.',
    type: 'STAT',
    statKey: 'slowDmgBoost',
    value: 0.10,
    tier: 3,
  },

  // --- THERMAL PYRO SYSTEM (Fire Elements) ---
  {
    id: 'stat_fire_melee_dmg_boost',
    name: 'Thermite Ignition',
    description: 'Melee/orbital attacks deal +6% more damage to burning hostiles.',
    type: 'STAT',
    statKey: 'fireMeleeDmgBoost',
    value: 0.06,
    tier: 2,
  },
  {
    id: 'stat_god_fire',
    name: 'Solar Flare Singularity',
    description: 'Fires continuous ignition sparks, boosting burn target damage by +10%.',
    type: 'STAT',
    statKey: 'fireDmgBoost',
    value: 0.10,
    tier: 3,
  }
];

export const EVOLVED_UPGRADES: Upgrade[] = [
  {
    id: 'evo_blade',
    name: 'Vortex Scythe',
    description: 'Evolved: Slicing hits pull hostiles inward while emitting outward crescent energy arcs.',
    type: 'WEAPON',
    weaponType: WeaponType.VORTEX_SCYTHE,
    evolutionOf: WeaponType.SPINNING_BLADE,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_turret',
    name: 'Railgun',
    description: 'Evolved: Fires dual armor-breaking kinetic beams that weaken targets to +30% incoming damage.',
    type: 'WEAPON',
    weaponType: WeaponType.RAIL_GUN,
    evolutionOf: WeaponType.AUTO_TURRET,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_fire',
    name: 'Volcanic Plume',
    description: 'Evolved: Spark trail creates magma vents that erupt into geysers, knocking back swarms.',
    type: 'WEAPON',
    weaponType: WeaponType.VOLCANIC_PLUME,
    evolutionOf: WeaponType.FIRE_TRAIL,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_shield',
    name: 'Sentinel Drones',
    description: 'Evolved: Drones tether laser forcefields between each other, electrocuting enemies passing through.',
    type: 'WEAPON',
    weaponType: WeaponType.SENTINEL_DRONES,
    evolutionOf: WeaponType.ORBITAL_SHIELD,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_nova',
    name: 'Gravity Singularity',
    description: 'Evolved: Collapses swarms into a singularity orb before detonating in an EMP shockwave.',
    type: 'WEAPON',
    weaponType: WeaponType.SINGULARITY,
    evolutionOf: WeaponType.MAGIC_BURST,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_whip',
    name: 'Thunderbolt Whip',
    description: 'Evolved: Sweeping whip leaves electrified floor lines that stun hostiles who step on them.',
    type: 'WEAPON',
    weaponType: WeaponType.ARC_WHIP,
    evolutionOf: WeaponType.CHAIN_ARC_SWORD,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_shotgun',
    name: 'Flak Cannon',
    description: 'Evolved: Heavy shells detonate on impact into bouncing anti-air shrapnel fragments.',
    type: 'WEAPON',
    weaponType: WeaponType.FLAK_CANNON,
    evolutionOf: WeaponType.SHOTGUN,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_blaster',
    name: 'Spell Weaver',
    description: 'Evolved: Weaves alternating Arcane, Frost, and Fire bolts triggering elemental combo bursts.',
    type: 'WEAPON',
    weaponType: WeaponType.SPELL_WEAVER,
    evolutionOf: WeaponType.MAGIC_BLASTER,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_bomb',
    name: 'Cluster Bomb',
    description: 'Evolved: Exploded bombs release a cluster of 3 secondary explosives.',
    type: 'WEAPON',
    weaponType: WeaponType.RECURSIVE_BOMB,
    evolutionOf: WeaponType.BOMB_LAUNCHER,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_clone',
    name: 'Holographic Army',
    description: 'Evolved: 3 Holograms taunt hostiles into attacking them and detonate EMP pulses when damaged.',
    type: 'WEAPON',
    weaponType: WeaponType.HOLOGRAPHIC_ARMY,
    evolutionOf: WeaponType.CLONE_PROJECTION,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_razor',
    name: 'Neutrino Shredder',
    description: 'Evolved: Contact blades leave cutting plasma trails and split into twin sub-razors on elites.',
    type: 'WEAPON',
    weaponType: WeaponType.NEUTRINO_SHREDDER,
    evolutionOf: WeaponType.PLASMA_RAZOR,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_tesla',
    name: 'Static Storm',
    description: 'Evolved: Establishes a lightning web that arcs continuously between all shocked targets.',
    type: 'WEAPON',
    weaponType: WeaponType.STATIC_STORM,
    evolutionOf: WeaponType.TESLA_COIL,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_gravity',
    name: 'Event Horizon',
    description: 'Evolved: Crushes enemy speed down to 10% while dragging them along the central gravity beam.',
    type: 'WEAPON',
    weaponType: WeaponType.EVENT_HORIZON,
    evolutionOf: WeaponType.GRAVITY_BEAM,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_ion',
    name: 'Orbital Strike',
    description: 'Evolved: Paints targets with orbital laser markers before delivering high-yield kinetic strikes.',
    type: 'WEAPON',
    weaponType: WeaponType.ORBITAL_STRIKE,
    evolutionOf: WeaponType.ION_CANNON,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_mines',
    name: 'Sensor Cluster',
    description: 'Evolved: Placed mines deploy laser tripwires between each other, slicing hostiles passing through.',
    type: 'WEAPON',
    weaponType: WeaponType.SENSOR_CLUSTER,
    evolutionOf: WeaponType.MINE_LAYER,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_photon',
    name: 'Lance Array',
    description: 'Evolved: Piercing laser lances refract secondary light needles outward upon striking targets.',
    type: 'WEAPON',
    weaponType: WeaponType.LANCE_ARRAY,
    evolutionOf: WeaponType.PHOTON_REPEATER,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_ricochet',
    name: 'Refraction Lance',
    description: 'Evolved: Rebounding slugs split into twin ricocheting shards upon bouncing or hitting heavy foes.',
    type: 'WEAPON',
    weaponType: WeaponType.REFRACTION_LANCE,
    evolutionOf: WeaponType.RICOCHET_CANNON,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_ice_sword',
    name: 'Glacial Greatsword',
    description: 'Evolved: Slashes emit frost waves that encase enemies solid in ice blocks for 2 seconds.',
    type: 'WEAPON',
    weaponType: WeaponType.GLACIAL_GREATSWORD,
    evolutionOf: WeaponType.ICE_SWORD,
    evolutionLevel: 7,
    tier: 2,
  },
  {
    id: 'evo_fire_sword',
    name: 'Solar Eclipse Blade',
    description: 'Evolved: Solar sweeps leave fire walls that incinerate incoming projectiles and burn foes.',
    type: 'WEAPON',
    weaponType: WeaponType.SOLAR_ECLIPSE_BLADE,
    evolutionOf: WeaponType.FIRE_SWORD,
    evolutionLevel: 7,
    tier: 2,
  }
];

export const ULTIMATE_UPGRADES: Upgrade[] = [
  {
    id: 'ult_blade',
    name: 'Chrono Reaper',
    description: 'Ultimate: Strikes apply 70% Time-Stasis lock and periodically spawn a temporal rift scythe.',
    type: 'WEAPON',
    weaponType: WeaponType.CHRONO_REAPER,
    evolutionOf: WeaponType.VORTEX_SCYTHE,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_razor',
    name: 'Infinity Razor',
    description: 'Ultimate: Shredder wheel carves molten floor fissures and gains damage from momentum.',
    type: 'WEAPON',
    weaponType: WeaponType.GOD_SLAYER_WHEEL,
    evolutionOf: WeaponType.NEUTRINO_SHREDDER,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_turret',
    name: 'Omega Beam',
    description: 'Ultimate: Heavy orbital beam sweeps sectors while automated crosshairs call down kinetic strikes.',
    type: 'WEAPON',
    weaponType: WeaponType.OMEGA_BEAM,
    evolutionOf: WeaponType.RAIL_GUN,
    evolutionLevel: 20,
    tier: 3,
  },
  {
    id: 'ult_fire',
    name: 'Cosmic Flame',
    description: 'Ultimate: Connected trail sigils trigger screen-wide Solar Flares detonating all enemy burn marks.',
    type: 'WEAPON',
    weaponType: WeaponType.COSMIC_FLAME,
    evolutionOf: WeaponType.VOLCANIC_PLUME,
    evolutionLevel: 20,
    tier: 3,
  },
  {
    id: 'ult_nova',
    name: 'Void Singularity',
    description: 'Ultimate: Consumes slain foes, spawning homing Void Wisps that restore player shield energy.',
    type: 'WEAPON',
    weaponType: WeaponType.VOID_EATER,
    evolutionOf: WeaponType.SINGULARITY,
    evolutionLevel: 25,
    tier: 3,
  },
  {
    id: 'ult_guard',
    name: 'Celestial Guard',
    description: 'Ultimate: Reflects 100% of blocked projectiles and projects a periodic invulnerability Aegis.',
    type: 'WEAPON',
    weaponType: WeaponType.CELESTIAL_GUARD,
    evolutionOf: WeaponType.SENTINEL_DRONES,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_bomb',
    name: 'Supernova Bomb',
    description: 'Ultimate: Impact pulls surrounding hostiles into a gravity well before thermonuclear implosion.',
    type: 'WEAPON',
    weaponType: WeaponType.SUPERNOVA_BOMB,
    evolutionOf: WeaponType.RECURSIVE_BOMB,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_shotgun',
    name: 'Obliterator Cannon',
    description: 'Ultimate: Quad siege cannons lock targeting lasers directly onto hostiles; unleashes 14 hyper-velocity piercing flak shells.',
    type: 'WEAPON',
    weaponType: WeaponType.OBLITERATOR_CANNON,
    evolutionOf: WeaponType.FLAK_CANNON,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_tesla',
    name: 'EMP Harvester',
    description: 'Ultimate: Stuns hostiles, disables enemy gunners for 2.5s, and converts blocked bullets into credits.',
    type: 'WEAPON',
    weaponType: WeaponType.EMP_HARVESTER,
    evolutionOf: WeaponType.STATIC_STORM,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_gravity',
    name: 'Singularity Core',
    description: 'Ultimate: Slain targets collapse into micro gravity wells that trap and redirect enemy fire.',
    type: 'WEAPON',
    weaponType: WeaponType.SINGULARITY_CORE,
    evolutionOf: WeaponType.EVENT_HORIZON,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_ion',
    name: 'Death Star Beam',
    description: 'Ultimate: Heavy satellite beam sweeps across the arena destroying projectiles and leaving fire pools.',
    type: 'WEAPON',
    weaponType: WeaponType.DEATH_STAR_BEAM,
    evolutionOf: WeaponType.ORBITAL_STRIKE,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_mines',
    name: 'Void Mines',
    description: 'Ultimate: Gravitational stealth traps pull hostiles into the blast center and apply time dilation.',
    type: 'WEAPON',
    weaponType: WeaponType.VOID_MINES,
    evolutionOf: WeaponType.SENSOR_CLUSTER,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_photon',
    name: 'Hyper-Light Array',
    description: 'Ultimate: Light needles create shared-damage tether lines between all struck enemies.',
    type: 'WEAPON',
    weaponType: WeaponType.HYPER_LIGHT_ARRAY,
    evolutionOf: WeaponType.LANCE_ARRAY,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_ricochet',
    name: 'Echo Strike',
    description: 'Ultimate: Every wall bounce emits a sonic shockwave that pushes back and damages surrounding foes.',
    type: 'WEAPON',
    weaponType: WeaponType.ECHO_STRIKE,
    evolutionOf: WeaponType.REFRACTION_LANCE,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_ice_sword',
    name: 'Absolute Zero Siphon',
    description: 'Ultimate: Shattering frozen targets releases glacial siphon shards that restore shield and boost speed.',
    type: 'WEAPON',
    weaponType: WeaponType.ABSOLUTE_ZERO_SIPHON,
    evolutionOf: WeaponType.GLACIAL_GREATSWORD,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_fire_sword',
    name: 'Supernova Slayer',
    description: 'Ultimate: Every 3rd swing fires a screen-wide crescent flame wave that pierces through all enemies.',
    type: 'WEAPON',
    weaponType: WeaponType.SUPERNOVA_SLAYER,
    evolutionOf: WeaponType.SOLAR_ECLIPSE_BLADE,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_thunder_god',
    name: 'Thunder God',
    description: 'Ultimate: Strikes summon localized thunderbolts and roaming Ball Lightning orbs.',
    type: 'WEAPON',
    weaponType: WeaponType.THUNDER_GOD,
    evolutionOf: WeaponType.ARC_WHIP,
    evolutionLevel: 15,
    tier: 3,
  },
  {
    id: 'ult_mirage_legion',
    name: 'Mirage Legion',
    description: 'Ultimate: 5 Clones form a tactical phalanx granting +25% Evasion and synced weapon strikes.',
    type: 'WEAPON',
    weaponType: WeaponType.MIRAGE_LEGION,
    evolutionOf: WeaponType.HOLOGRAPHIC_ARMY,
    evolutionLevel: 15,
    tier: 3,
  }
];

export function weaponHasMoreMutations(weaponType?: WeaponType): boolean {
  if (!weaponType) return false;
  const hasEvo = EVOLVED_UPGRADES.some(e => e.evolutionOf === weaponType);
  if (hasEvo) return true;
  const hasUlt = ULTIMATE_UPGRADES.some(u => u.evolutionOf === weaponType);
  if (hasUlt) return true;
  return false;
}

export function isFinalFormAbility(abilityType?: AbilityType): boolean {
  if (!abilityType) return false;
  // An ability is at its final form if it is an evolved ability or has no further mutations/evolutions
  const isEvolved = EVOLVED_ABILITIES.some(e => e.abilityType === abilityType);
  const hasNoEvolution = !EVOLVED_ABILITIES.some(e => (e.evolutionOf as unknown as AbilityType) === abilityType);
  return isEvolved || hasNoEvolution;
}

export function getAbilityMaxLevel(abilityType?: AbilityType): number {
  return isFinalFormAbility(abilityType) ? 10 : 15;
}

export function getRandomUpgrades(
    count: number, 
    playerWeapons: Weapon[] = [], 
    playerAbilities: ActiveAbility[] = [], 
    stats: any = {}, 
    isFirstLevel: boolean = false,
    statPickCounts: Record<string, number> = {},
    isSandbox: boolean = false,
    isSecondLevel: boolean = false,
    isBossReward: boolean = false,
    currentRoom: number = 1
): Upgrade[] {
  // Check if a stat key has reached its maximum cap to block duplicate offerings
  const isStatMaxed = (statKey?: string): boolean => {
    if (!statKey) return false;
    const currentVal = stats[statKey] ?? 0;
    
    if (statKey === 'critChance' && currentVal >= 0.95) {
      return true;
    }
    if (statKey === 'weaponSynergy' && currentVal >= 0.95) {
      return true;
    }
    if (statKey === 'cooldownMult' && currentVal <= 0.10) {
      return true;
    }
    if (statKey === 'defense' && currentVal >= 30.0) {
      return true;
    }
    if (statKey === 'speed' && currentVal >= 25.0) {
      return true;
    }
    if (statKey === 'maxHp' && currentVal >= 25000) {
      return true;
    }
    if (statKey === 'regen' && currentVal >= 250.0) {
      return true;
    }
    if (statKey === 'bounceDmg' && currentVal >= 2500) {
      return true;
    }
    if (statKey === 'meleeSpeed' && currentVal >= 10.0) {
      return true;
    }
    if (statKey === 'pierce' && currentVal >= 50) {
      return true;
    }
    return false;
  };

  // Check for transformations (Evolutions/Ultimates) first, so we don't offer standard upgrades for mutating or evolution-ready modules
  const possibleTransitions = [
    ...EVOLVED_UPGRADES.filter(evo => {
        const baseWeapon = playerWeapons.find(w => w.type === evo.evolutionOf);
        if (!baseWeapon || (baseWeapon.isEvolved && !isSandbox)) return false;
        const hasThisEvo = playerWeapons.some(w => w.type === evo.weaponType);
        return (baseWeapon.level >= (evo.evolutionLevel || 4) || isSandbox) && !hasThisEvo;
    }),
    ...ULTIMATE_UPGRADES.filter(ult => {
        const baseWeapon = playerWeapons.find(w => w.type === ult.evolutionOf);
        if (!baseWeapon) return false;
        const hasThisUlt = playerWeapons.some(w => w.type === ult.weaponType);
        return (baseWeapon.level >= (ult.evolutionLevel || 15) || isSandbox) && !hasThisUlt;
    }),
    ...EVOLVED_ABILITIES.filter(evo => {
        const baseAbility = playerAbilities.find(a => a.type === (evo.evolutionOf as unknown as AbilityType));
        if (!baseAbility) return false;
        return (baseAbility.level >= (evo.evolutionLevel || 15) || isSandbox) && !playerAbilities.some(a => a.type === evo.abilityType);
    })
  ];

  // 1. Get definitions for all currently owned weapons to allow leveling them up
  // If a weapon has no more mutations, you cannot obtain any upgrades for it from the choose an upgrade menu
  // DONT OFFER upgrades for weapons that are currently mutating (have mutations available)
  const ownedWeaponDefs = playerWeapons.map(pw => {
    // If a weapon has no more mutations (i.e. final / ultimate tier), do not offer upgrades for it
    if (!weaponHasMoreMutations(pw.type)) return null;

    const isMutating = possibleTransitions.some(t => t.type === 'WEAPON' && t.evolutionOf === pw.type);
    if (isMutating) return null;
    return [...ALL_UPGRADES, ...EVOLVED_UPGRADES, ...ULTIMATE_UPGRADES].find(u => u.weaponType === pw.type);
  }).filter(Boolean) as Upgrade[];

  // 2. Base weapons that haven't been evolved or replaced by an ultimate version yet
  const availableBaseWeapons = ALL_UPGRADES.filter(u => {
    if (u.type !== 'WEAPON') return false;
    
    // Don't show if player already owns this exact weapon
    if (playerWeapons.some(pw => pw.type === u.weaponType)) return false;

    // Don't show if player already has an evolved version or the ultimate version of THIS weapon
    const hasSuccessor = playerWeapons.some(pw => {
        // Is owned weapon 'pw' an evolution of 'u'?
        const evolvedFromU = EVOLVED_UPGRADES.find(evo => evo.weaponType === pw.type && evo.evolutionOf === u.weaponType);
        if (evolvedFromU) return true;

        // Is owned weapon 'pw' an ultimate evolution that traces back to 'u'?
        const ultimateOfU = ULTIMATE_UPGRADES.find(ult => {
            if (ult.weaponType !== pw.type) return false;
            // Check if what this ultimate evolution is of (T2) traces back to u (T1)
            const evolvedMid = EVOLVED_UPGRADES.find(evo => evo.weaponType === ult.evolutionOf);
            return evolvedMid && evolvedMid.evolutionOf === u.weaponType;
        });
        
         return !!ultimateOfU;
    });

    return !hasSuccessor;
  });

  const allStats = ALL_UPGRADES.filter(u => {
    if (u.type !== 'STAT') return false;
    // Condition: Max 3 picks per stat key for BASIC stats, 
    // unless they are needed for evolved ones, or in sandbox mode
    if (!isSandbox && u.statKey && statPickCounts[u.statKey] >= 3) return false;
    if (!isSandbox && isStatMaxed(u.statKey)) return false;

    // Crit chance is much harder to get/spawns very infrequently (25% chance of appearing in basic stat selections)
    if (!isSandbox && u.statKey === 'critChance' && Math.random() > 0.25) return false;

    // Gate advanced basic crit (stat_luck) behind having at least 1 basic-tier crit strike pick
    if (!isSandbox && u.id === 'stat_luck') {
      const picks = statPickCounts['critChance'] || 0;
      if (picks < 1) return false;
    }

    return true;
  });
  
  // Ability filtering
  // DONT OFFER upgrades for abilities that are currently mutating (have mutations available)
  const ownedAbilityDefs = playerAbilities
    .filter(pa => pa.level < getAbilityMaxLevel(pa.type)) // Final form abilities cap at level 10
    .filter(pa => {
      const isMutating = possibleTransitions.some(t => t.type === 'ABILITY' && (t.evolutionOf as unknown as AbilityType) === pa.type);
      return !isMutating;
    })
    .map(pa => {
      return [...ALL_UPGRADES, ...EVOLVED_ABILITIES, ...ULTIMATE_UPGRADES].find(u => u.abilityType === pa.type);
    }).filter(Boolean) as Upgrade[];

  let abilities = ALL_UPGRADES.filter(u => {
    if (u.type !== 'ABILITY') return false;
    
    // Don't show if player already owns this exact ability
    if (playerAbilities.some(pa => pa.type === u.abilityType)) return false;

    // Don't show if player already has an evolved version of THIS ability
    const hasSuccessor = playerAbilities.some(pw => {
        return EVOLVED_ABILITIES.some(evo => evo.abilityType === pw.type && (evo.evolutionOf as unknown as AbilityType) === u.abilityType);
    });

    return !hasSuccessor;
  });

  if (!isSandbox && playerAbilities.length >= 5) {
    abilities = ownedAbilityDefs;
  } else {
    // Merge unowned with owned level-ups
    abilities = [...abilities, ...ownedAbilityDefs];
  }
  
  if (isBossReward) {
    // Guaranteed 3 new weapon options that the player does not currently have on round multiples of 10
    const unownedWeapons = ALL_UPGRADES.filter(u => 
      u.type === 'WEAPON' && 
      u.weaponType && 
      !playerWeapons.some(pw => pw.type === u.weaponType)
    );

    const shuffled = unownedWeapons.sort(() => 0.5 - Math.random());
    if (shuffled.length >= 3) {
      return shuffled.slice(0, 3);
    }

    // Supplement with unowned evolved or ultimate weapons if base weapon pool is depleted
    const unownedEvoWeapons = [...EVOLVED_UPGRADES, ...ULTIMATE_UPGRADES].filter(u => 
      u.type === 'WEAPON' && 
      u.weaponType && 
      !playerWeapons.some(pw => pw.type === u.weaponType) && 
      !shuffled.some(s => s.id === u.id)
    ).sort(() => 0.5 - Math.random());

    const combined = [...shuffled, ...unownedEvoWeapons];
    if (combined.length >= 3) {
      return combined.slice(0, 3);
    }

    // Fallback if player already owns almost every single weapon
    const fallbackWeapons = ALL_UPGRADES.filter(u => u.type === 'WEAPON');
    return [...combined, ...fallbackWeapons.filter(w => !combined.some(c => c.id === w.id))].slice(0, 3);
  }

  if (isFirstLevel) {
    const startWeapons = availableBaseWeapons.length > 0 ? availableBaseWeapons : ALL_UPGRADES.filter(u => u.type === 'WEAPON');
    return startWeapons.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  if (isSecondLevel) {
    const startAbilities = abilities.filter(u => u.type === 'ABILITY' && u.id !== 'ability_dash');
    const pool = (startAbilities.length > 0 ? startAbilities : ALL_UPGRADES.filter(u => u.type === 'ABILITY')).filter(u => u.id !== 'ability_dash');
    return pool.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  const possibleEvolvedStats = EVOLVED_STATS.filter(evo => {
    if (isSandbox) return true;

    // Stat mutations are MUCH rarer and appear more in later levels past round 30:
    // Before round 25: 0% chance (do not appear at all)
    // Rounds 25-29: extremely rare (only 5% roll to even be considered)
    // Rounds 30+: appear more frequently, unlocking progressively
    if (currentRoom < 25) return false;
    if (currentRoom < 30 && Math.random() > 0.05) return false;
    if (currentRoom >= 30) {
      const unlockChance = Math.min(0.85, 0.35 + (currentRoom - 30) * 0.025);
      if (Math.random() > unlockChance) return false;
    }

    // Condition: Max 8 picks per evolved/ultimate stat key (higher limit)
    if (evo.statKey && statPickCounts[evo.statKey] >= 8) return false;

    // Exclude if already maxed out
    if (isStatMaxed(evo.statKey)) return false;

    // Crit chance is much harder to get - 15% chance of appearing in the available evolved results
    if (evo.statKey === 'critChance' && Math.random() > 0.15) return false;

    // Check requirements for evolved stats to appear
    if (evo.statKey === 'speed' && stats.speed > 1.02) return true;
    if (evo.statKey === 'maxHp' && stats.maxHp > 305) return true;
    if (evo.statKey === 'regen' && stats.regen > 0.25) return true;
    if (evo.statKey === 'lifesteal' && stats.lifesteal > 0.01) return true;

    // Defense: Gate tier 2 (+6%) and tier 3 (+10%) behind basic picks
    if (evo.statKey === 'defense') {
      const picks = statPickCounts['defense'] || 0;
      if (evo.id === 'stat_def_2' && picks < 1) return false;
      if (evo.id === 'stat_god_def' && picks < 2) return false;
      return stats.defense > 0.02;
    }

    // Crit Chance: Gate tier 2 and tier 3 behind basic picks
    if (evo.statKey === 'critChance') {
      const picks = statPickCounts['critChance'] || 0;
      if (evo.id === 'stat_crit_2' && picks < 1) return false;
      if (evo.id === 'stat_god_crit' && picks < 2) return false;
      return stats.critChance > 0.06;
    }

    if (evo.statKey === 'cooldownMult' && stats.cooldownMult < 0.98) return true;
    if (evo.statKey === 'bounceDmg' && stats.bounceDmg > 10) return true;
    if (evo.statKey === 'meleeSpeed' && stats.meleeSpeed > 1.02) return true;
    if (evo.statKey === 'weaponSize' && stats.weaponSize > 1.02) return true;
    if (evo.statKey === 'weaponSynergy' && stats.weaponSynergy > 0.02) return true;
    if (evo.statKey === 'slowDmgBoost' && stats.slowDmgBoost > 0.02) return true;
    if (evo.statKey === 'fireDmgBoost' && stats.fireDmgBoost > 0.02) return true;
    return false;
  });

  const weaponPool = [...availableBaseWeapons, ...ownedWeaponDefs, ...possibleTransitions.filter(u => u.type === 'WEAPON')];
  const abilityPool = [...abilities, ...possibleTransitions.filter(u => u.type === 'ABILITY')];
  const statPool = [...allStats, ...possibleEvolvedStats];
  
  // Safety: If pool is getting too small, add more stats that are not maxed out
  if (statPool.length < 3) {
      statPool.push(...ALL_UPGRADES.filter(u => u.type === 'STAT' && !isStatMaxed(u.statKey) && !statPool.find(p => p.id === u.id)));
  }

  const results: Upgrade[] = [];
  const pickedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // ... rest of loop logic but using pickedIds for better tracking
    // For simplicity, just ensure uniqueness via while or filter
    const remainingPool = [...weaponPool, ...abilityPool, ...statPool].filter(u => !pickedIds.has(u.id));
    if (remainingPool.length === 0) break;

    const ownedWeaponCount = playerWeapons.length;
    // Scale category weights: weapon weight shifts towards abilities & stats as player gets more weapons
    const weaponWeight = Math.max(0.18, 0.40 - ownedWeaponCount * 0.05);
    const weights = {
        'WEAPON': weaponWeight,
        'ABILITY': playerAbilities.length < 5 ? 0.30 : 0.15,
        'STAT': 0.45 + (0.40 - weaponWeight)
    };
    
    // Diversity Rule: roughly balanced
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    let selectedType: 'WEAPON' | 'ABILITY' | 'STAT' = 'STAT';
    
    if (r < (weights['WEAPON'] || 0)) selectedType = 'WEAPON';
    else if (r < (weights['WEAPON'] || 0) + (weights['ABILITY'] || 0)) selectedType = 'ABILITY';
    else selectedType = 'STAT';

    let picked: Upgrade | null = null;
    const synergyChance = 0.4 + (stats.weaponSynergy || 0.1); 

    if (selectedType === 'WEAPON') {
        const wp = weaponPool.filter(u => !pickedIds.has(u.id));
        const ownedTypes = playerWeapons.map(w => w.type);
        const ownedPool = wp.filter(u => 
            (u.weaponType && ownedTypes.includes(u.weaponType)) || 
            (u.evolutionOf && ownedTypes.includes(u.evolutionOf))
        );
        const newWeaponPool = wp.filter(u => !ownedPool.some(op => op.id === u.id));

        // Significant exponential reduction in chance of finding new weapons for each weapon already owned:
        // 1 weapon: 7% chance; 2 weapons: 2.4%; 3 weapons: 0.8%; 4+ weapons: ~0.5%
        const newWeaponChance = Math.max(0.005, 0.20 * Math.pow(0.35, Math.max(1, ownedWeaponCount)));

        if (ownedPool.length > 0 && (newWeaponPool.length === 0 || Math.random() >= newWeaponChance)) {
            picked = ownedPool[Math.floor(Math.random() * ownedPool.length)];
        } else if (newWeaponPool.length > 0) {
            picked = newWeaponPool[Math.floor(Math.random() * newWeaponPool.length)];
        } else if (wp.length > 0) {
            picked = wp[Math.floor(Math.random() * wp.length)];
        }
    } else if (selectedType === 'ABILITY') {
        const ap = abilityPool.filter(u => !pickedIds.has(u.id));
        const ownedAbilityTypes = playerAbilities.map(a => a.type);
        const ownedPool = ap.filter(u => 
            (u.abilityType && ownedAbilityTypes.includes(u.abilityType)) ||
            (u.evolutionOf && ownedAbilityTypes.includes(u.evolutionOf as unknown as AbilityType))
        );
        const newAbilityPool = ap.filter(u => !ownedPool.some(op => op.id === u.id));

        if (ownedPool.length > 0 && (newAbilityPool.length === 0 || Math.random() < 0.80)) {
            picked = ownedPool[Math.floor(Math.random() * ownedPool.length)];
        } else if (newAbilityPool.length > 0) {
            picked = newAbilityPool[Math.floor(Math.random() * newAbilityPool.length)];
        } else if (ap.length > 0) {
            picked = ap[Math.floor(Math.random() * ap.length)];
        }
    } else {
        const sp = statPool.filter(u => !pickedIds.has(u.id));
        if (sp.length > 0) {
            const basicStatsInPool = sp.filter(u => !EVOLVED_STATS.some(es => es.id === u.id));
            const evoStatsInPool = sp.filter(u => EVOLVED_STATS.some(es => es.id === u.id));

            if (!isSandbox && evoStatsInPool.length > 0 && basicStatsInPool.length > 0) {
                // Before round 30, heavily favor basic stats (95%)
                // Past round 30, evolved stat chance rises progressively from 35% up to 75%
                const evoChance = currentRoom < 30 ? 0.05 : Math.min(0.75, 0.35 + (currentRoom - 30) * 0.02);
                if (Math.random() < evoChance) {
                    picked = evoStatsInPool[Math.floor(Math.random() * evoStatsInPool.length)];
                } else {
                    picked = basicStatsInPool[Math.floor(Math.random() * basicStatsInPool.length)];
                }
            } else {
                picked = sp[Math.floor(Math.random() * sp.length)];
            }
        }
    }

    if (!picked && remainingPool.length > 0) {
        picked = remainingPool[Math.floor(Math.random() * remainingPool.length)];
    }

    if (picked) {
        results.push(picked);
        pickedIds.add(picked.id);
    }
  }

  // Final fallback to ensure 'count' results if possible
  if (results.length < count) {
      const globalPool = [...ALL_UPGRADES, ...EVOLVED_UPGRADES, ...EVOLVED_STATS].filter(u => {
        if (pickedIds.has(u.id)) return false;
        if (u.type === 'WEAPON') {
          if (u.weaponType && playerWeapons.some(pw => pw.type === u.weaponType) && !weaponHasMoreMutations(u.weaponType)) {
            return false;
          }
        }
        return true;
      });
      while (results.length < count && globalPool.length > 0) {
          const p = globalPool.pop()!;
          results.push(p);
          pickedIds.add(p.id);
      }
  }

  return results;
}
