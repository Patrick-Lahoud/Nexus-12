export type Vector = { x: number; y: number };

export enum EntityType {
  PLAYER_BALL = 'PLAYER_BALL',
  ENEMY_BALL = 'ENEMY_BALL',
  WEAPON = 'WEAPON',
  PARTICLE = 'PARTICLE',
  PROJECTILE = 'PROJECTILE',
}

export enum WeaponType {
  SPINNING_BLADE = 'SPINNING_BLADE',
  AUTO_TURRET = 'AUTO_TURRET',
  FIRE_TRAIL = 'FIRE_TRAIL',
  ORBITAL_SHIELD = 'ORBITAL_SHIELD',
  MAGIC_BURST = 'MAGIC_BURST',
  CHAIN_ARC_SWORD = 'CHAIN_ARC_SWORD',
  REPULSOR_FIELD = 'REPULSOR_FIELD',
  
  // New Base Weapons
  SHOTGUN = 'SHOTGUN',
  MAGIC_BLASTER = 'MAGIC_BLASTER',
  BOMB_LAUNCHER = 'BOMB_LAUNCHER',
  CLONE_PROJECTION = 'CLONE_PROJECTION',

  // Evolutions T2
  VORTEX_SCYTHE = 'VORTEX_SCYTHE',
  RAIL_GUN = 'RAIL_GUN',
  VOLCANIC_PLUME = 'VOLCANIC_PLUME',
  SENTINEL_DRONES = 'SENTINEL_DRONES',
  SINGULARITY = 'SINGULARITY',
  ARC_WHIP = 'ARC_WHIP',
  FLAK_CANNON = 'FLAK_CANNON',
  SPELL_WEAVER = 'SPELL_WEAVER',
  RECURSIVE_BOMB = 'RECURSIVE_BOMB',
  HOLOGRAPHIC_ARMY = 'HOLOGRAPHIC_ARMY',
  
  // New Melee
  PLASMA_RAZOR = 'PLASMA_RAZOR',
  NEUTRINO_SHREDDER = 'NEUTRINO_SHREDDER',
  GOD_SLAYER_WHEEL = 'GOD_SLAYER_WHEEL',

  // Ultimates T3
  CHRONO_REAPER = 'CHRONO_REAPER',
  OMEGA_BEAM = 'OMEGA_BEAM',
  COSMIC_FLAME = 'COSMIC_FLAME',
  CELESTIAL_GUARD = 'CELESTIAL_GUARD',
  VOID_EATER = 'VOID_EATER',
  THUNDER_GOD = 'THUNDER_GOD',
  SUPERNOVA_BOMB = 'SUPERNOVA_BOMB',
  MIRAGE_LEGION = 'MIRAGE_LEGION',
  OBLITERATOR_CANNON = 'OBLITERATOR_CANNON',

  // New Weapons
  TESLA_COIL = 'TESLA_COIL',
  STATIC_STORM = 'STATIC_STORM',
  EMP_HARVESTER = 'EMP_HARVESTER',

  GRAVITY_BEAM = 'GRAVITY_BEAM',
  EVENT_HORIZON = 'EVENT_HORIZON',
  SINGULARITY_CORE = 'SINGULARITY_CORE',

  // Ranged Weapons
  ION_CANNON = 'ION_CANNON',
  ORBITAL_STRIKE = 'ORBITAL_STRIKE',
  DEATH_STAR_BEAM = 'DEATH_STAR_BEAM',

  MINE_LAYER = 'MINE_LAYER',
  SENSOR_CLUSTER = 'SENSOR_CLUSTER',
  VOID_MINES = 'VOID_MINES',

  PHOTON_REPEATER = 'PHOTON_REPEATER',
  LANCE_ARRAY = 'LANCE_ARRAY',
  HYPER_LIGHT_ARRAY = 'HYPER_LIGHT_ARRAY',

  // Bouncing Weapons
  RICOCHET_CANNON = 'RICOCHET_CANNON',
  REFRACTION_LANCE = 'REFRACTION_LANCE',
  ECHO_STRIKE = 'ECHO_STRIKE',

  // Elemental Melee Upgrades
  ICE_SWORD = 'ICE_SWORD',
  GLACIAL_GREATSWORD = 'GLACIAL_GREATSWORD',
  ABSOLUTE_ZERO_SIPHON = 'ABSOLUTE_ZERO_SIPHON',
  
  FIRE_SWORD = 'FIRE_SWORD',
  SOLAR_ECLIPSE_BLADE = 'SOLAR_ECLIPSE_BLADE',
  SUPERNOVA_SLAYER = 'SUPERNOVA_SLAYER',
}

export enum AbilityType {
  DASH = 'DASH',
  TIME_WARP = 'TIME_WARP',
  OVERDRIVE = 'OVERDRIVE',
  SHIELD_BURST = 'SHIELD_BURST',
  SHOCKWAVE = 'SHOCKWAVE',
  TOXIC_CLOUD = 'TOXIC_CLOUD',
  CHAIN_LIGHTNING = 'CHAIN_LIGHTNING',
  FROST_NOVA = 'FROST_NOVA',
  HEALING_AURA = 'HEALING_AURA',
  METEOR_STRIKE = 'METEOR_STRIKE',
  BLOOD_LUST = 'BLOOD_LUST',
  BOUNCE_SHOTS = 'BOUNCE_SHOTS',
  
  // Evolutions T2
  DIMENSIONAL_DASH = 'DIMENSIONAL_DASH',
  TEMPORAL_COLLAPSE = 'TEMPORAL_COLLAPSE',
  PLASMA_NOVA = 'PLASMA_NOVA',
  APEX_OVERDRIVE = 'APEX_OVERDRIVE',
  SEISMIC_CRUSHER = 'SEISMIC_CRUSHER',
  CORROSIVE_DECAY = 'CORROSIVE_DECAY',
  THUNDERBOLT_STORM = 'THUNDERBOLT_STORM',
  ABSOLUTE_ZERO_RIPPLE = 'ABSOLUTE_ZERO_RIPPLE',
  NANITE_AEGIS = 'NANITE_AEGIS',
  SUPERNOVA_RAIN = 'SUPERNOVA_RAIN',
  SANGUINE_FRENZY = 'SANGUINE_FRENZY',
  KINETIC_BOUNCE_STORM = 'KINETIC_BOUNCE_STORM',

  // Elemental Abilities
  BLIZZARD = 'BLIZZARD',
  INFERNO = 'INFERNO',
  FROSTBITE_TEMPEST = 'FROSTBITE_TEMPEST',
  HELLFIRE_STORM = 'HELLFIRE_STORM',
}

export interface ActiveAbility {
  type: AbilityType;
  name: string;
  cooldown: number; // ms
  duration: number; // ms
  lastUsed: number;
  isActive: boolean;
  level: number;
  key?: string; // Trigger key
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector;
  vel: Vector;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  isDead: boolean;
  isBoss?: boolean;
}

export interface PlayerBall extends Entity {
  type: EntityType.PLAYER_BALL;
  weapons: Weapon[];
  stats: {
    speed: number;
    bounceDmg: number;
    defense: number;
    critChance: number;
    regen: number;
    lifesteal: number;
    accuracy?: number;
    cooldownMult: number;
    currency: number;
    weaponSynergy: number;
    damageReductionMultiplier?: number;
    damageMult?: number;
    pierce?: number;
    meleeSpeed?: number;
    weaponSize?: number;
    projectileSlow?: number;
    slowDmgBoost?: number;
    fireDmgBoost?: number;
    fireMeleeDmgBoost?: number;
    deflectCooldownReduction?: number;
    isTetherUnlocked?: boolean;
    isStabilizerUnlocked?: boolean;
    isReflectorUnlocked?: boolean;
    equippedMovementModules?: { id: string; level: number }[];
    isControlUnlocked?: boolean;
    isTurretsUnlocked?: boolean;
    isMinesUnlocked?: boolean;
    maxMines?: number;
    mineHpLevels?: Record<string, number>;
    mineProdLevels?: Record<string, number>;
    totalMiningEarnings?: number;
    turretLevels?: {
      turret_tesla: number;
      turret_sword: number;
      turret_autoshooter: number;
      turret_ricochet: number;
      turret_shotgun: number;
      turret_fire: number;
      turret_shield: number;
      turret_bomb: number;
      turret_plasma: number;
    };
    maxTurrets?: number;
    turretHpLevels?: Record<string, number>;
    turretDmgLevels?: Record<string, number>;
    leftClickSlot?: string | null;
    rightClickSlot?: string | null;
    ownedControls?: { id: string; level: number }[];
    controlCooldowns?: Record<string, number>;
    upgradeChoicesCount?: number;
  };
  abilities: ActiveAbility[];
  hurtTimer: number;
  lastDamageTime: number; // For regen buffer
  healEffectTimer?: number;
  spawnShieldTimer?: number;
  isInvincible?: boolean;
}

export interface Clone extends Entity {
  type: EntityType.PLAYER_BALL;
  ownerId: string;
  life: number;
  damage: number;
  lastShot?: number;
  archetype?: 'DECOY' | 'TACTICAL' | 'SHOTGUN' | 'MELEE' | 'SNIPER';
  angle?: number;
  meleeAngle?: number;
  gunSpin?: number;
  aimAngle?: number;
  hasTarget?: boolean;
  isLockedOn?: boolean;
  targetDist?: number;
}

export interface Weapon {
  type: WeaponType;
  level: number;
  damage: number;
  cooldown: number;
  lastUsed: number;
  angle?: number; // For spinning blades
  length?: number; // For blades
  isEvolved?: boolean;
}

export interface EnemyBall extends Entity {
  type: EntityType.ENEMY_BALL;
  enemyType: 'BASIC' | 'SHOOTER' | 'SPLITTER' | 'TANK' | 'SHIELDED' | 'GUNNER' | 'BOMBER' | 'SWARMER' | 'PHANTOM' | 'TESLA_COIL' | 'GRAVITY_DRAIN' | 'MIRAGE' | 'CRYOMANCER' | 'STALKER' | 'HEALER' | 'WARP_WARLOCK' | 'PLASMA_STORMER' | 'BIO_LEECH' | 'BOSS' | 'ULTRA_BOSS';
  bossSubtype?: 'WARRIOR' | 'TITAN' | 'SWARM_QUEEN' | 'PHANTOM_ACE' | 'VOID_SENTINEL' | 'STORM_BRINGER' | 'ARCHITECT' | 'REAPER' | 'NEXUS_OVERLORD';
  lastShot?: number;
  shieldHp?: number;
  maxShieldHp?: number;
  isFrozen?: boolean;
  freezeTimer?: number;
  isSlowed?: boolean;
  slowTimer?: number;
  isOnFire?: boolean;
  fireTimer?: number;
  isBoss?: boolean;
  bossStage?: number;
  bossAttackTimer?: number;
  hasThruster?: boolean;
  thrusterAngle?: number;
  specialTimer?: number;
  tetherTarget?: Vector;
  warpCooldown?: number;
  warpZonePos?: Vector;
  ionCooldown?: number;
  
  // Force fields for late levels (past 30)
  forceFieldType?: 'SPAWN_IMMUNITY' | 'PERIODIC' | 'DIRECTIONAL' | 'VULNERABLE';
  forceFieldTimer?: number;
  forceFieldState?: boolean;
  forceFieldAngle?: number;
  hurtTimer?: number;
  stunTimer?: number;
  attackCooldown?: number;
  armorShred?: number;
}

export interface Projectile {
  pos: Vector;
  vel: Vector;
  radius: number;
  damage: number;
  ownerId: string;
  color: string;
  bounces?: number;
  piercing?: number;
  hitSet?: Set<string>;
  homing?: boolean;
  targetId?: string;
  isIce?: boolean;
  isFire?: boolean;
  isCrit?: boolean;
  isBossProjectile?: boolean;
  bossSubtype?: string;
  weaponType?: string;
}

export interface FloatingText {
  id: string;
  pos: Vector;
  vel: Vector;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface GameState {
  room: number;
  score: number;
  difficulty: number;
  isGameOver: boolean;
  isPaused: boolean;
  isSandbox?: boolean;
}
