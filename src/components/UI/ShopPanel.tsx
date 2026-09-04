import React, { useState, useEffect } from 'react';
import { GameEngine } from '../../game/engine';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Shield, 
  Heart, 
  Target, 
  Timer, 
  Coins, 
  ChevronRight, 
  Flame, 
  Layers, 
  Activity, 
  Cpu, 
  Wrench,
  Pickaxe,
  Lock,
  X,
  Sparkles,
  Snowflake
} from 'lucide-react';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';
import ConstructionGround from './ConstructionGround';
import MiningZone from './MiningZone';

interface ShopPanelProps {
  engine: GameEngine;
  isOpen: boolean;
  onClose: () => void;
  isSandbox?: boolean;
  onUpdate?: () => void;
  defaultTab?: 'STATS' | 'DEFENSE' | 'MINING';
}

const MOVEMENT_CATALOG = [
  {
    id: 'tether',
    name: 'Gravity Steering Tether',
    cost: 30000,
    description: 'Heavy magnetic warp tether to steer and slingshot around obstacles manually.',
    icon: Flame,
    color: 'text-cyan-400 bg-cyan-950/20 border-cyan-800',
    secondaryBonusName: 'Hyper-Pull Velocity',
    secondaryBonusDesc: '+15% momentum pull speed per level.',
    maxLevel: 10
  },
  {
    id: 'stabilizer',
    name: 'Chronos Stabilizer Thruster',
    cost: 15000,
    description: 'Minimizes friction drag. Buffers core shock dampeners to shorten disruption times.',
    icon: Activity,
    color: 'text-amber-400 bg-amber-950/20 border-amber-800',
    secondaryBonusName: 'Warp Shock Insulation',
    secondaryBonusDesc: '-1.5s tether-disrupted lockout penalty per level.',
    maxLevel: 10
  },
  {
    id: 'reflector',
    name: 'Overcharged Reflective Core',
    cost: 20000,
    description: 'Expands your Directional Redirection field radius and accelerates deflected projectiles.',
    icon: Zap,
    color: 'text-purple-400 bg-purple-950/20 border-purple-800',
    secondaryBonusName: 'Hyper-Frequency Reflect',
    secondaryBonusDesc: '+25% redirect force & projectile speed per level.',
    maxLevel: 10
  }
];

const STAT_THEMES: Record<string, {
  text: string;
  border: string;
  borderHover: string;
  bg: string;
  iconText: string;
  progress: string;
  btn: string;
  btnText: string;
  shadow: string;
}> = {
  speed: {
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    borderHover: 'hover:border-cyan-400',
    bg: 'bg-cyan-950/30',
    iconText: 'text-cyan-400',
    progress: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    btn: 'bg-cyan-400 hover:bg-cyan-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-cyan-500/25',
  },
  bounceDmg: {
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    borderHover: 'hover:border-amber-400',
    bg: 'bg-amber-950/30',
    iconText: 'text-amber-400',
    progress: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]',
    btn: 'bg-amber-400 hover:bg-amber-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-amber-500/25',
  },
  maxHp: {
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    borderHover: 'hover:border-rose-400',
    bg: 'bg-rose-950/30',
    iconText: 'text-rose-400',
    progress: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]',
    btn: 'bg-rose-500 hover:bg-rose-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-rose-500/25',
  },
  defense: {
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    borderHover: 'hover:border-sky-400',
    bg: 'bg-sky-950/30',
    iconText: 'text-sky-400',
    progress: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]',
    btn: 'bg-sky-500 hover:bg-sky-400',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-sky-500/25',
  },
  critChance: {
    text: 'text-yellow-300',
    border: 'border-yellow-500/40',
    borderHover: 'hover:border-yellow-400',
    bg: 'bg-yellow-950/30',
    iconText: 'text-yellow-400',
    progress: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]',
    btn: 'bg-yellow-400 hover:bg-yellow-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-yellow-500/25',
  },
  damageMult: {
    text: 'text-orange-300',
    border: 'border-orange-500/40',
    borderHover: 'hover:border-orange-400',
    bg: 'bg-orange-950/30',
    iconText: 'text-orange-400',
    progress: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]',
    btn: 'bg-orange-500 hover:bg-orange-400',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-orange-500/25',
  },
  regen: {
    text: 'text-lime-300',
    border: 'border-lime-500/40',
    borderHover: 'hover:border-lime-400',
    bg: 'bg-lime-950/30',
    iconText: 'text-lime-400',
    progress: 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]',
    btn: 'bg-lime-400 hover:bg-lime-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-lime-500/25',
  },
  cooldownMult: {
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    borderHover: 'hover:border-purple-400',
    bg: 'bg-purple-950/30',
    iconText: 'text-purple-400',
    progress: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]',
    btn: 'bg-purple-500 hover:bg-purple-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-purple-500/25',
  },
  meleeSpeed: {
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-500/40',
    borderHover: 'hover:border-fuchsia-400',
    bg: 'bg-fuchsia-950/30',
    iconText: 'text-fuchsia-400',
    progress: 'bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]',
    btn: 'bg-fuchsia-500 hover:bg-fuchsia-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-fuchsia-500/25',
  },
  pierce: {
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    borderHover: 'hover:border-emerald-400',
    bg: 'bg-emerald-950/30',
    iconText: 'text-emerald-400',
    progress: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    btn: 'bg-emerald-400 hover:bg-emerald-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-emerald-500/25',
  },
  lifesteal: {
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    borderHover: 'hover:border-rose-400',
    bg: 'bg-rose-950/30',
    iconText: 'text-rose-400',
    progress: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]',
    btn: 'bg-rose-500 hover:bg-rose-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-rose-500/25',
  },
  accuracy: {
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    borderHover: 'hover:border-purple-400',
    bg: 'bg-purple-950/30',
    iconText: 'text-purple-400',
    progress: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]',
    btn: 'bg-purple-500 hover:bg-purple-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-purple-500/25',
  },
  weaponSize: {
    text: 'text-teal-300',
    border: 'border-teal-500/40',
    borderHover: 'hover:border-teal-400',
    bg: 'bg-teal-950/30',
    iconText: 'text-teal-400',
    progress: 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]',
    btn: 'bg-teal-400 hover:bg-teal-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-teal-500/25',
  },
  weaponSynergy: {
    text: 'text-blue-300',
    border: 'border-blue-500/40',
    borderHover: 'hover:border-blue-400',
    bg: 'bg-blue-950/30',
    iconText: 'text-blue-400',
    progress: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]',
    btn: 'bg-blue-500 hover:bg-blue-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-blue-500/25',
  },
  projectileSlow: {
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    borderHover: 'hover:border-cyan-400',
    bg: 'bg-cyan-950/30',
    iconText: 'text-cyan-400',
    progress: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    btn: 'bg-cyan-400 hover:bg-cyan-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-cyan-500/25',
  },
  fireDmgBoost: {
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    borderHover: 'hover:border-rose-400',
    bg: 'bg-rose-950/30',
    iconText: 'text-rose-400',
    progress: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]',
    btn: 'bg-rose-500 hover:bg-rose-400',
    btnText: 'text-white',
    shadow: 'shadow-md shadow-rose-500/25',
  },
  upgradeChoicesCount: {
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    borderHover: 'hover:border-amber-400',
    bg: 'bg-amber-950/30',
    iconText: 'text-amber-400',
    progress: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]',
    btn: 'bg-amber-400 hover:bg-amber-300',
    btnText: 'text-black',
    shadow: 'shadow-md shadow-amber-500/25',
  },
};

export const ShopPanel: React.FC<ShopPanelProps> = ({ engine, isOpen, onClose, isSandbox, onUpdate, defaultTab }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'STATS' | 'DEFENSE' | 'MINING'>(defaultTab || 'STATS');
  const [highlightedStatKey, setHighlightedStatKey] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || 'STATS');
    }
  }, [isOpen, defaultTab]);
  
  // Local reactive ticket for dynamic values inside the engine
  const [tick, setTick] = React.useState(0);
  const forceUpdate = () => {
    setTick(t => t + 1);
    onUpdate?.();
  };

  const currentCurrency = engine.player.stats.currency;
  const canAffordTurrets = !engine.player.stats.isTurretsUnlocked && (currentCurrency >= 10000 || isSandbox || engine.gameMode.includes('SANDBOX'));
  const canAffordMines = !engine.player.stats.isMinesUnlocked && (currentCurrency >= 50000 || isSandbox || engine.gameMode.includes('SANDBOX'));
  const equippedModules = engine.player.stats.equippedMovementModules || [];

  const stats = [
    // Top Priority: Primary Survivability & Defense
    { key: 'maxHp', label: t('hull_integrity', {}, 'Hull Integrity'), icon: Heart, cost: 60, increment: 25, max: 5000 },
    { key: 'defense', label: t('stat_defense', {}, 'Ship Shield'), icon: Shield, cost: 75, increment: 0.1, max: 5 },
    { key: 'regen', label: t('stat_regen', {}, 'Hull Regen'), icon: Timer, cost: 500, increment: 0.5, max: 50 },
    { key: 'lifesteal', label: t('stat_lifesteal', {}, 'Lifesteal'), icon: Heart, cost: 450, increment: 0.01, max: 0.25 },

    // Core Offensive Power & Mobility
    { key: 'speed', label: t('stat_velocity', {}, 'Velocity'), icon: Zap, cost: 50, increment: 0.1, max: 10 },
    { key: 'cooldownMult', label: t('stat_cooldown', {}, 'Fire Rate'), icon: Timer, cost: 200, increment: 0.03, max: 0.3 },
    { key: 'critChance', label: t('stat_critical', {}, 'Critical Chance'), icon: Target, cost: 300, increment: 0.01, max: 0.50 },
    { key: 'damageMult', label: t('crit_bonus', {}, 'Critical Bonus'), icon: Flame, cost: 80, increment: 0.03, max: 2.5 },
    { key: 'pierce', label: t('pierce_cnt', {}, 'Pierce Count'), icon: Layers, cost: 3500, increment: 1, max: 5 },
    { key: 'bounceDmg', label: t('stat_impact', {}, 'Impact Damage'), icon: ChevronRight, cost: 40, increment: 5, max: 500 },

    // Precision, Range & Synergies
    { key: 'accuracy', label: t('stat_accuracy', {}, 'Accuracy'), icon: Target, cost: 120, increment: 0.05, max: 1.0 },
    { key: 'weaponSize', label: t('stat_weapon_size', {}, 'Weapon Size'), icon: Sparkles, cost: 150, increment: 0.05, max: 2.5 },
    { key: 'meleeSpeed', label: t('melee_speed', {}, 'Melee Speed'), icon: Activity, cost: 120, increment: 0.01, max: 2.5 },
    { key: 'weaponSynergy', label: t('stat_weapon_synergy', {}, 'System Synergy'), icon: Cpu, cost: 250, increment: 0.05, max: 2.0 },
    { key: 'projectileSlow', label: t('stat_projectile_slow', {}, 'Enemy Slow'), icon: Snowflake, cost: 400, increment: 0.05, max: 0.50 },
    { key: 'fireDmgBoost', label: t('stat_fire_dmg_boost', {}, 'Fire Damage +'), icon: Flame, cost: 300, increment: 0.05, max: 2.0 },
    { key: 'upgradeChoicesCount', label: t('stat_upgrade_choices', {}, 'Upgrade Choices'), icon: Sparkles, cost: 100000, increment: 1, max: 6 }
  ];

  const getUpgradeChoicesCost = (currentVal: number) => {
    if (currentVal <= 3) return 100000;
    if (currentVal === 4) return 1000000;
    if (currentVal === 5) return 100000000;
    return 100000000;
  };

  const getStatCurrentVal = (key: string): number => {
    if (key === 'maxHp') return engine.player.maxHp || 300;
    if (key === 'speed') return engine.player.stats.speed ?? 1.2;
    if (key === 'bounceDmg') return engine.player.stats.bounceDmg ?? 10;
    if (key === 'critChance') return engine.player.stats.critChance ?? 0.05;
    if (key === 'regen') return engine.player.stats.regen ?? 0.6;
    if (key === 'lifesteal') return engine.player.stats.lifesteal ?? 0;
    if (key === 'accuracy') return engine.player.stats.accuracy ?? 0.15;
    if (key === 'defense') return engine.player.stats.defense ?? 1.0;
    if (key === 'damageMult') return engine.player.stats.damageMult ?? 1.0;
    if (key === 'meleeSpeed') return engine.player.stats.meleeSpeed ?? 1.0;
    if (key === 'pierce') return (engine.player.stats as any).pierce ?? 0;
    if (key === 'cooldownMult') return engine.player.stats.cooldownMult ?? 1.0;
    if (key === 'weaponSize') return engine.player.stats.weaponSize ?? 1.0;
    if (key === 'weaponSynergy') return engine.player.stats.weaponSynergy ?? 0;
    if (key === 'projectileSlow') return engine.player.stats.projectileSlow ?? 0;
    if (key === 'fireDmgBoost') return engine.player.stats.fireDmgBoost ?? 0;
    if (key === 'upgradeChoicesCount') return engine.player.stats.upgradeChoicesCount ?? 3;
    return (engine.player.stats as any)[key] ?? 0;
  };

  const getStatBaseVal = (key: string, basePlayer: any): number => {
    if (key === 'maxHp') return basePlayer.maxHp || 300;
    if (key === 'speed') return basePlayer.stats.speed ?? 1.2;
    if (key === 'bounceDmg') return basePlayer.stats.bounceDmg ?? 10;
    if (key === 'critChance') return basePlayer.stats.critChance ?? 0.05;
    if (key === 'regen') return basePlayer.stats.regen ?? 0.6;
    if (key === 'lifesteal') return basePlayer.stats.lifesteal ?? 0;
    if (key === 'accuracy') return basePlayer.stats.accuracy ?? 0.15;
    if (key === 'defense') return basePlayer.stats.defense ?? 1.0;
    if (key === 'damageMult') return basePlayer.stats.damageMult ?? 1.0;
    if (key === 'meleeSpeed') return basePlayer.stats.meleeSpeed ?? 1.0;
    if (key === 'pierce') return (basePlayer.stats as any).pierce ?? 0;
    if (key === 'cooldownMult') return basePlayer.stats.cooldownMult ?? 1.0;
    if (key === 'weaponSize') return basePlayer.stats.weaponSize ?? 1.0;
    if (key === 'weaponSynergy') return basePlayer.stats.weaponSynergy ?? 0;
    if (key === 'projectileSlow') return basePlayer.stats.projectileSlow ?? 0;
    if (key === 'fireDmgBoost') return basePlayer.stats.fireDmgBoost ?? 0;
    if (key === 'upgradeChoicesCount') return basePlayer.stats.upgradeChoicesCount ?? 3;
    return (basePlayer.stats as any)[key] ?? 0;
  };

  const getDisplayVal = (key: string, val: number) => {
    if (key === 'speed' || key === 'defense' || key === 'critChance' || key === 'damageMult' || key === 'meleeSpeed' || key === 'lifesteal' || key === 'accuracy' || key === 'weaponSize') {
      return `${Math.round(val * 100)}%`;
    }
    if (key === 'cooldownMult') {
      return `${Math.round((1 / val) * 100)}%`;
    }
    if (key === 'pierce') {
      return `+${Math.round(val)}`;
    }
    if (key === 'weaponSynergy' || key === 'projectileSlow' || key === 'fireDmgBoost') {
      return `+${Math.round(val * 100)}%`;
    }
    if (key === 'regen') {
      return val.toFixed(1);
    }
    if (key === 'upgradeChoicesCount') {
      return `${Math.round(val)} Options`;
    }
    return Math.round(val).toString();
  };

  // Centralized stat cost calculator enforcing balance rules:
  // 1. projectileSlow gets WAY more expensive as percentage increases
  // 2. accuracy gets WAY more expensive as percentage increases
  // 3. all stats (except maxHp and defense) become much more expensive past halfway towards max
  const calculateStatCost = (stat: any, currentVal: number): number => {
    if (stat.key === 'upgradeChoicesCount') {
      return getUpgradeChoicesCost(currentVal);
    }
    const isDec = stat.key === 'cooldownMult';
    const basePlayer = engine.createPlayer();
    const baseVal = getStatBaseVal(stat.key, basePlayer);
    const timesBought = isDec
      ? Math.max(0, Math.round((baseVal - currentVal) / stat.increment))
      : Math.max(0, Math.round((currentVal - baseVal) / stat.increment));

    let cost: number;

    if (stat.key === 'projectileSlow') {
      // Base cost 250, heavy exponential per tier + dramatic surge as slow % increases towards 50%
      const slowRatio = Math.max(0, currentVal / 0.50);
      const slowSurge = 1 + Math.pow(slowRatio, 2) * 5.5;
      cost = Math.floor(stat.cost * Math.pow(2.1, timesBought) * slowSurge);
    } else if (stat.key === 'accuracy') {
      // Base cost 120, steep scaling as accuracy approaches 1.0 (100%)
      const accRatio = Math.max(0, (currentVal - 0.35) / 0.65);
      const accSurge = 1 + Math.pow(accRatio, 2) * 4.8;
      cost = Math.floor(stat.cost * Math.pow(1.75, timesBought) * accSurge);
    } else {
      const multiplier = (stat.key === 'cooldownMult' || stat.key === 'meleeSpeed') ? 1.06 : stat.key === 'critChance' ? 1.15 : stat.key === 'pierce' ? 3.0 : stat.key === 'regen' ? 1.20 : 1.40;
      cost = Math.floor(stat.cost * Math.pow(multiplier, timesBought));
    }

    // Past halfway through towards the max: make upgrades significantly more expensive (exempting hull integrity/maxHp and defense)
    if (stat.key !== 'maxHp' && stat.key !== 'defense') {
      const maxVal = stat.max;
      const progress = isDec 
        ? (baseVal - currentVal) / (baseVal - maxVal)
        : (maxVal === baseVal ? 0 : (currentVal - baseVal) / (maxVal - baseVal));
      
      if (progress > 0.5) {
        const pastHalfRatio = Math.min(1.0, (progress - 0.5) / 0.5); // 0.0 to 1.0
        const pastHalfMultiplier = 1.0 + (pastHalfRatio * 1.8) + (Math.pow(pastHalfRatio, 2) * 3.2);
        cost = Math.floor(cost * pastHalfMultiplier);
      }
    }

    return isSandbox ? 0 : cost;
  };

  const buyStat = (stat: any) => {
    if (stat.key === 'upgradeChoicesCount') {
      const currentVal = engine.player.stats.upgradeChoicesCount ?? 3;
      if (currentVal >= 6) return;
      const cost = isSandbox ? 0 : getUpgradeChoicesCost(currentVal);
      if (isSandbox || engine.player.stats.currency >= cost) {
        if (!isSandbox) engine.player.stats.currency -= cost;
        gameAudio.playPurchaseSound();
        engine.player.stats.upgradeChoicesCount = Math.min(6, currentVal + 1);
        setHighlightedStatKey(stat.key);
        setTimeout(() => {
          setHighlightedStatKey(prev => prev === stat.key ? null : prev);
        }, 1200);
        forceUpdate();
      }
      return;
    }

    const isDec = stat.key === 'cooldownMult';
    const currentVal = getStatCurrentVal(stat.key);
    const isMax = isDec ? (currentVal <= stat.max) : (currentVal >= stat.max - 0.001);
    if (isMax) return;
    
    const cost = calculateStatCost(stat, currentVal);
    
    if (isSandbox || engine.player.stats.currency >= cost) {
      if (!isSandbox) engine.player.stats.currency -= cost;
      gameAudio.playPurchaseSound();
      if (stat.key === 'maxHp') {
          engine.player.maxHp += stat.increment;
          engine.player.hp = Math.min(engine.player.hp + stat.increment, engine.player.maxHp);
      } else if (isDec) {
          (engine.player.stats as any)[stat.key] = Math.max(stat.max, ((engine.player.stats as any)[stat.key] ?? 1.0) - stat.increment);
      } else {
        let newVal = getStatCurrentVal(stat.key) + stat.increment;
        if (stat.key === 'critChance') {
          newVal = Math.min(0.50, newVal);
        } else if (stat.key === 'accuracy') {
          newVal = Math.min(1.0, newVal);
        } else if (stat.key === 'lifesteal') {
          newVal = Math.min(0.25, newVal);
        } else if (stat.key === 'projectileSlow') {
          newVal = Math.min(0.50, newVal);
        }
        (engine.player.stats as any)[stat.key] = newVal;
        if (stat.key === 'regen') {
          engine.player.lastDamageTime = 0; // Trigger regen immediately
          engine.player.hp = Math.min(engine.player.maxHp, engine.player.hp + 20);
        }
      }

      setHighlightedStatKey(stat.key);
      setTimeout(() => {
        setHighlightedStatKey(prev => prev === stat.key ? null : prev);
      }, 1200);

      forceUpdate();
    }
  };

  const handleUnlockTurrets = () => {
    const cost = 10000;
    if (currentCurrency >= cost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        engine.player.stats.currency = Math.max(0, currentCurrency - cost);
      }
      engine.player.stats.isTurretsUnlocked = true;
      gameAudio.playUpgradePickSound();
      forceUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  const handleUnlockMining = () => {
    const cost = 50000;
    if (currentCurrency >= cost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        engine.player.stats.currency = Math.max(0, currentCurrency - cost);
      }
      engine.player.stats.isMinesUnlocked = true;
      gameAudio.playUpgradePickSound();
      forceUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  const [arenaRect, setArenaRect] = useState<DOMRect | null>(null);

  const isPlacing = Boolean(engine.placingTurretType || engine.placingMineType);

  useEffect(() => {
    if (!isPlacing) {
      setArenaRect(null);
      return;
    }

    let animId: number;
    const updateRect = () => {
      const el = document.getElementById('game-canvas');
      if (el) {
        const rect = el.getBoundingClientRect();
        setArenaRect(rect);
      }
      animId = requestAnimationFrame(updateRect);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isPlacing, engine.placingTurretType, engine.placingMineType]);

  const activeRect = arenaRect || (isPlacing && typeof document !== 'undefined' ? document.getElementById('game-canvas')?.getBoundingClientRect() || null : null);

  const clipPathStyle = (isPlacing && activeRect) ? {
    clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${activeRect.left}px ${activeRect.top}px, ${activeRect.left}px ${activeRect.bottom}px, ${activeRect.right}px ${activeRect.bottom}px, ${activeRect.right}px ${activeRect.top}px, ${activeRect.left}px ${activeRect.top}px)`
  } : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-colors ${
            isPlacing ? 'bg-black/60 backdrop-blur-md pointer-events-none' : 'bg-black/75 backdrop-blur-md'
          }`}
          style={clipPathStyle}
        >
          {/* Click outside target */}
          {!isPlacing && <div className="absolute inset-0" onClick={onClose} />}

          {/* Deployment Mode Banner */}
          {isPlacing && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto bg-zinc-950/95 border-2 border-amber-400 p-4 px-7 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.6)] text-center flex flex-col items-center gap-2 animate-pulse select-none">
              <div className="flex items-center gap-2.5 text-amber-300 font-mono font-black text-sm uppercase tracking-wider">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>DEPLOY YOUR {engine.placingTurretType ? 'DEFENSE TURRET' : 'MINING DRILL'}</span>
              </div>
              <p className="text-zinc-300 text-xs font-sans">
                Click anywhere on the battlefield canvas to place your deployable unit
              </p>
              <button
                onClick={() => {
                  engine.placingTurretType = null;
                  engine.placingMineType = null;
                  gameAudio.playHitSound(false, 'laser');
                  forceUpdate();
                }}
                className="mt-1 px-4 py-1.5 bg-red-950 hover:bg-red-600 border border-red-500/60 text-red-200 hover:text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-lg"
              >
                CANCEL DEPLOYMENT
              </button>
            </div>
          )}

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`relative w-full max-w-2xl sm:w-[680px] h-full space-ui-bg border-l border-amber-500/30 p-6 flex flex-col justify-between overflow-x-hidden overflow-y-hidden shadow-[0_0_80px_rgba(245,158,11,0.25)] select-none transition-opacity duration-200 ${
              isPlacing ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Top Header */}
            <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      {t('shop', {}, 'ARMORY & SYSTEMS SHOP')}
                    </h2>
                    <p className="text-zinc-400 text-xs font-sans">
                      Upgrade core stats, deploy defense turrets, and manage mining drills.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isSandbox && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-300 font-mono font-black text-base shadow-sm">
                      <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{Math.round(currentCurrency).toLocaleString()} Cr</span>
                    </div>
                  )}
                  {isSandbox && (
                    <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-xl text-purple-300 font-mono text-xs font-black uppercase">
                      SANDBOX MODE
                    </div>
                  )}
                  <button 
                    onClick={() => { gameAudio.playButtonClickSound(); onClose(); }} 
                    className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-400 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Shop Navigation Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('STATS')}
                  className={`py-2 rounded-xl text-xs font-black font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'STATS'
                      ? 'bg-amber-400 text-black shadow-[0_0_18px_rgba(251,191,36,0.5)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>STAT UPGRADES</span>
                </button>

                <button
                  onClick={() => setActiveTab('DEFENSE')}
                  className={`py-2 rounded-xl text-xs font-black font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'DEFENSE'
                      ? 'bg-cyan-400 text-black shadow-[0_0_18px_rgba(34,211,238,0.5)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>DEFENSE GRID</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                    engine.player.stats.isTurretsUnlocked 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : canAffordTurrets 
                      ? 'bg-amber-400 text-black animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {engine.player.stats.isTurretsUnlocked ? 'ACTIVE' : canAffordTurrets ? 'READY!' : 'LOCKED'}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('MINING')}
                  className={`py-2 rounded-xl text-xs font-black font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'MINING'
                      ? 'bg-emerald-400 text-black shadow-[0_0_18px_rgba(52,211,153,0.5)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Pickaxe className="w-4 h-4" />
                  <span>MINING DRILLS</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                    engine.player.stats.isMinesUnlocked 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : canAffordMines 
                      ? 'bg-emerald-400 text-black animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {engine.player.stats.isMinesUnlocked ? 'ACTIVE' : canAffordMines ? 'READY!' : 'LOCKED'}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden shop-scrollbar py-4 my-1">
              {activeTab === 'STATS' && (
                <div className="space-y-4">
                  {isSandbox && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex justify-between items-center gap-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
                          ⚡ GOD MODE: INVINCIBILITY
                        </span>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          Bypass all incoming collision damage and kinetic shockwaves.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          engine.player.isInvincible = !engine.player.isInvincible;
                          gameAudio.playHitSound(false, 'impact');
                          forceUpdate();
                        }}
                        className={`font-mono text-xs py-2 px-4 rounded-xl font-black transition-all cursor-pointer ${
                          engine.player.isInvincible 
                            ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {engine.player.isInvincible ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {stats.map((stat) => {
                      const isDec = stat.key === 'cooldownMult';
                      const currentVal = getStatCurrentVal(stat.key);
                      const basePlayer = engine.createPlayer();
                      const baseVal = getStatBaseVal(stat.key, basePlayer);
                      const cost = calculateStatCost(stat, currentVal);
                      const isMax = isDec ? (currentVal <= stat.max) : (currentVal >= stat.max - 0.001);

                      const theme = STAT_THEMES[stat.key] || {
                        text: 'text-amber-300',
                        border: 'border-amber-500/40',
                        borderHover: 'hover:border-amber-400',
                        bg: 'bg-amber-950/20',
                        iconText: 'text-amber-400',
                        progress: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
                        btn: 'bg-amber-400 hover:bg-amber-300',
                        btnText: 'text-black',
                        shadow: 'shadow-md shadow-amber-500/20',
                      };

                      const progressPct = stat.key === 'upgradeChoicesCount'
                        ? ((currentVal - 3) / (6 - 3)) * 100
                        : (isDec
                            ? ((baseVal - currentVal) / (baseVal - stat.max)) * 100
                            : (stat.key === 'maxHp'
                                ? (currentVal / stat.max) * 100
                                : (stat.max === baseVal ? 100 : ((currentVal - baseVal) / (stat.max - baseVal)) * 100)));

                      const incrementLabel = stat.key === 'upgradeChoicesCount'
                        ? '+1 Option'
                        : (stat.key === 'speed' || stat.key === 'defense' || stat.key === 'critChance' || stat.key === 'damageMult' || stat.key === 'meleeSpeed' || stat.key === 'lifesteal' || stat.key === 'accuracy' || stat.key === 'weaponSize' || stat.key === 'weaponSynergy' || stat.key === 'projectileSlow' || stat.key === 'fireDmgBoost'
                            ? `+${Math.round(stat.increment * 100)}%`
                            : `+${stat.increment}`);

                      const isHighlighted = highlightedStatKey === stat.key;

                      return (
                        <div 
                          key={stat.key} 
                          className={`p-2.5 sm:px-3.5 border ${
                            isHighlighted 
                              ? 'border-amber-400 ring-1 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] bg-amber-950/40 brightness-110' 
                              : `${theme.border} ${theme.bg} ${theme.borderHover} hover:bg-zinc-900/60`
                          } rounded-xl transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3.5 shadow-sm`}
                        >
                          {/* Left: Icon, Stat Label & Increment info */}
                          <div className="flex items-center gap-2.5 min-w-[180px] shrink-0">
                            <div className={`w-7 h-7 rounded-lg bg-black/60 border ${isHighlighted ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'border-zinc-800'} flex items-center justify-center shrink-0 transition-all`}>
                              <stat.icon className={`w-3.5 h-3.5 ${isHighlighted ? 'text-amber-300 animate-pulse' : theme.iconText}`} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs uppercase font-black text-zinc-200 font-mono tracking-wide leading-tight">
                                  {stat.label}
                                </span>
                                {isHighlighted && (
                                  <span className="text-[9px] font-mono font-black text-amber-300 bg-amber-500/30 px-1.5 py-0.2 rounded border border-amber-400/80 animate-pulse">
                                    +▲ UPGRADED
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 font-bold">
                                {incrementLabel} / tier
                              </span>
                            </div>
                          </div>

                          {/* Middle: Progress Bar & Current Value */}
                          <div className="flex-1 flex items-center gap-2.5 min-w-0">
                            <div className={`flex-1 bg-zinc-950/90 h-2 rounded-full overflow-hidden p-0.5 border ${isHighlighted ? 'border-amber-400' : 'border-zinc-800/80'}`}>
                              <motion.div 
                                initial={false}
                                animate={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                                transition={{ duration: 1.0, ease: "easeOut" }}
                                className={`${theme.progress} h-full rounded-full ${isHighlighted ? 'brightness-125 shadow-[0_0_12px_#fff]' : ''}`}
                              />
                            </div>
                            <div className={`bg-black/60 border ${isHighlighted ? 'border-amber-400 bg-amber-950/40' : 'border-zinc-800/90'} px-2.5 py-0.5 rounded-lg min-w-[64px] text-right shrink-0 transition-all`}>
                              <span className={`text-xs sm:text-sm font-black font-mono tracking-tight transition-all duration-300 ${
                                isHighlighted ? 'scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] inline-block' : theme.text
                              }`}>
                                {getDisplayVal(stat.key, currentVal)}
                              </span>
                            </div>
                          </div>

                          {/* Right: Upgrade Button */}
                          <div className="shrink-0">
                            {!isMax ? (
                              <button 
                                onClick={() => buyStat(stat)}
                                disabled={!isSandbox && currentCurrency < cost}
                                className={`w-full sm:w-auto min-w-[145px] py-1.5 px-3 font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center ${
                                  isSandbox || currentCurrency >= cost 
                                    ? `${theme.btn} ${theme.btnText} ${theme.shadow} font-black` 
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                }`}
                              >
                                {isSandbox ? 'UPGRADE (FREE)' : `UPGRADE (${cost.toLocaleString()} Cr)`}
                              </button>
                            ) : (
                              <span className="block w-full sm:w-auto min-w-[145px] text-center text-[11px] font-mono font-black text-emerald-400 bg-emerald-500/10 py-1.5 px-2 border border-emerald-500/30 rounded-xl uppercase tracking-wider">
                                MAX LEVEL
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'DEFENSE' && (
                <div className="h-full">
                  {!engine.player.stats.isTurretsUnlocked ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl h-full gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                        <Wrench className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <span className="text-xs font-black font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full inline-block mb-1">
                          RECOMMENDED ROUND 10+
                        </span>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">DEFENSE SENTRY TURRETS</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                          Build automated stationary sentries directly on the battlefield to blast enemies with laser swords, electric arc beams, and heavy kinetic mortar shells!
                        </p>
                      </div>

                      <div className="w-full max-w-xs space-y-3 pt-2">
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-sm font-mono">
                          <span className="text-zinc-400 font-bold">UNLOCK COST:</span>
                          <span className="text-amber-400 font-black">{isSandbox || engine.gameMode.includes('SANDBOX') ? 'FREE' : '10,000 Cr'}</span>
                        </div>
                        <button
                          onClick={handleUnlockTurrets}
                          className={`w-full py-3 rounded-xl text-xs font-black font-mono transition-all uppercase cursor-pointer flex items-center justify-center gap-2 ${
                            currentCurrency >= 10000 || isSandbox || engine.gameMode.includes('SANDBOX')
                              ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                          <span>UNLOCK DEFENSE GRID</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 h-full">
                      <ConstructionGround engine={engine} onUpdate={forceUpdate} isSandbox={isSandbox} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'MINING' && (
                <div className="h-full">
                  {!engine.player.stats.isMinesUnlocked ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl h-full gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                        <Pickaxe className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <span className="text-xs font-black font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-1">
                          RECOMMENDED ROUND 20+
                        </span>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">AUTOMATED MINING DRILLS</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                          Deploy subterranean mineral drills that extract valuable ore and continuously generate passive Credits every second!
                        </p>
                      </div>

                      <div className="w-full max-w-xs space-y-3 pt-2">
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-sm font-mono">
                          <span className="text-zinc-400 font-bold">UNLOCK COST:</span>
                          <span className="text-emerald-400 font-black">{isSandbox || engine.gameMode.includes('SANDBOX') ? 'FREE' : '50,000 Cr'}</span>
                        </div>
                        <button
                          onClick={handleUnlockMining}
                          className={`w-full py-3 rounded-xl text-xs font-black font-mono transition-all uppercase cursor-pointer flex items-center justify-center gap-2 ${
                            currentCurrency >= 50000 || isSandbox || engine.gameMode.includes('SANDBOX')
                              ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                          <span>UNLOCK MINING OPERATIONS</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 h-full">
                      <MiningZone engine={engine} onUpdate={forceUpdate} isSandbox={isSandbox} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Footer Status */}
            <div className="pt-3 border-t border-zinc-800/80 flex justify-end items-center text-[10px] text-zinc-500 font-mono">
              <span className="text-amber-400/80 font-bold uppercase">PRESS SHOP AT ANY TIME</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
