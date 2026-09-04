import React, { useState } from 'react';
import { GameEngine } from '../../game/engine';
import { motion } from 'motion/react';
import { useLanguage } from '../../game/localization';
import { 
  X, 
  Activity, 
  Flame, 
  ChevronRight, 
  Coins, 
  HelpCircle, 
  Plus,
  Radio,
  Disc,
  Snowflake,
  Sparkles
} from 'lucide-react';
import { gameAudio } from '../../game/audio';

interface ControlShopProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine;
  onUpdate?: () => void;
  isSandbox?: boolean;
}

interface ControlData {
  id: string;
  name: string;
  target: 'Player' | 'Enemies';
  description: string;
  cost: number;
  icon: React.ElementType;
  baseCooldown: number;
  color: string;
}

const MOVEMENT_CONTROLS: ControlData[] = [
  {
    id: 'redirection_pull',
    name: 'Pull',
    target: 'Player',
    description: 'Directs your ball to cursor with a quick velocity impulse & deflects surrounding enemy projectiles back.',
    cost: 2500,
    icon: Activity,
    baseCooldown: 5.0,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'gravity_tether',
    name: 'Tether',
    target: 'Player',
    description: 'Toggle-hold micro-magnet lasso to steer or slingshot your ship around obstacles & gravity pulls.',
    cost: 4000,
    icon: Flame,
    baseCooldown: 0.1,
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'gravity_warp',
    name: 'Teleport',
    target: 'Player',
    description: 'Instantly teleports your vessel to the cursor position with a spatial implosion displacement force.',
    cost: 8500,
    icon: ChevronRight,
    baseCooldown: 10.0,
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'shockwave_blast',
    name: 'Kinetic Shockwave',
    target: 'Enemies',
    description: 'Fires a localized kinetic shockwave burst centered at cursor position. Knocks enemies back with force, stuns them, and deflects bullets in radius.',
    cost: 5000,
    icon: Radio,
    baseCooldown: 6.0,
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'gravity_well',
    name: 'Gravity Well',
    target: 'Enemies',
    description: 'Deploys a localized gravitational singularity at cursor location for 3.5s. Pulls nearby enemies inward to a center point.',
    cost: 7500,
    icon: Disc,
    baseCooldown: 8.0,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'temporal_freeze',
    name: 'Stasis Freeze',
    target: 'Enemies',
    description: 'Deploys a localized temporal freeze field at cursor position. Freezes all enemies and enemy bullets caught inside for 3 seconds.',
    cost: 10000,
    icon: Snowflake,
    baseCooldown: 12.0,
    color: 'from-cyan-400 to-blue-600'
  }
];

const ALL_CONTROLS: ControlData[] = [...MOVEMENT_CONTROLS];

export const getUpgradeCost = (level: number) => {
  return Math.floor(1500 * Math.pow(1.5, level - 1));
};

export default function ControlShop({ isOpen, onClose, engine, onUpdate, isSandbox }: ControlShopProps) {
  const { t } = useLanguage();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (!isOpen) return null;
  if (isSandbox && !engine.player.stats.isControlUnlocked) {
    engine.player.stats.isControlUnlocked = true;
  }

  const playerStats = engine.player.stats;
  const currency = playerStats.currency || 0;
  const ownedList = playerStats.ownedControls || [];
  const leftSlot = playerStats.leftClickSlot || null;
  const rightSlot = playerStats.rightClickSlot || null;

  const isUnlocked = Boolean(playerStats.isControlUnlocked || (ownedList && ownedList.length > 0) || isSandbox);

  // Unlock skills protocol (2500 Cr)
  const handleUnlockSkills = () => {
    const cost = 2500;
    if (currency < cost && !isSandbox) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox) {
      playerStats.currency = Math.max(0, currency - cost);
    }

    playerStats.isControlUnlocked = true;

    if (!playerStats.ownedControls) {
      playerStats.ownedControls = [];
    }

    if (!playerStats.ownedControls.some(c => c.id === 'redirection_pull')) {
      playerStats.ownedControls.push({ id: 'redirection_pull', level: 1 });
    }

    if (!playerStats.leftClickSlot) {
      playerStats.leftClickSlot = 'redirection_pull';
    }

    gameAudio.playUpgradePickSound();
    onUpdate?.();
  };

  // Buy control
  const buyControl = (id: string, cost: number) => {
    if (currency < cost && !isSandbox) {
      gameAudio.playHitSound(false, 'laser'); // failure buzz replacement
      return;
    }

    if (!isSandbox) {
      playerStats.currency = Math.max(0, currency - cost);
    }

    playerStats.isControlUnlocked = true;

    // Add to owned
    if (!playerStats.ownedControls) {
      playerStats.ownedControls = [];
    }
    
    // Check if duplicate
    if (!playerStats.ownedControls.some(c => c.id === id)) {
      playerStats.ownedControls.push({ id, level: 1 });
    }

    // Default auto-equip if there is an empty slot
    if (!playerStats.leftClickSlot) {
      playerStats.leftClickSlot = id;
    } else if (!playerStats.rightClickSlot) {
      playerStats.rightClickSlot = id;
    }

    gameAudio.playUpgradePickSound();
    onUpdate?.();
  };

  // Upgrade control
  const upgradeControl = (id: string) => {
    const owned = ownedList.find(c => c.id === id);
    if (!owned) return;

    const cost = getUpgradeCost(owned.level);
    if (currency < cost && !isSandbox) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox) {
      playerStats.currency = Math.max(0, currency - cost);
    }

    owned.level += 1;
    gameAudio.playUpgradePickSound();
    onUpdate?.();
  };

  // Equip control to slot
  const equipControl = (id: string, slot: 'left' | 'right') => {
    playerStats.isControlUnlocked = true;
    if (slot === 'left') {
      if (playerStats.rightClickSlot === id) {
        playerStats.rightClickSlot = null;
      }
      playerStats.leftClickSlot = id;
    } else {
      if (playerStats.leftClickSlot === id) {
        playerStats.leftClickSlot = null;
      }
      playerStats.rightClickSlot = id;
    }
    gameAudio.playUpgradePickSound();
    onUpdate?.();
  };

  // Unequip slot
  const unequipControl = (slot: 'left' | 'right') => {
    if (slot === 'left') {
      playerStats.leftClickSlot = null;
    } else {
      playerStats.rightClickSlot = null;
    }
    gameAudio.playUpgradePickSound();
    onUpdate?.();
  };

  // Get Control specs
  const getSpecs = (ctrl: ControlData, level: number) => {
    if (ctrl.id === 'redirection_pull') {
      const cooldownVal = Math.max(1.0, 2.5 - (level - 1) * 0.10).toFixed(2);
      const velVal = 1200 + (level - 1) * 75;
      return {
        cooldown: t('seconds_cooldown', { duration: cooldownVal }, `${cooldownVal}s Cooldown`),
        effect: `Vel: ${velVal} px/s`
      };
    } else if (ctrl.id === 'gravity_tether') {
      return {
        cooldown: t('active_toggle', {}, 'Active Toggle'),
        effect: `Magnet Tether Lasso`
      };
    } else if (ctrl.id === 'gravity_warp') {
      const cooldownVal = Math.max(3.0, 10.0 - (level - 1) * 0.8).toFixed(2);
      const radVal = 135 + (level - 1) * 15;
      return {
        cooldown: t('seconds_cooldown', { duration: cooldownVal }, `${cooldownVal}s Cooldown`),
        effect: `Displace AOE: ${radVal}px`
      };
    } else if (ctrl.id === 'shockwave_blast') {
      const cooldownVal = Math.max(2.0, 6.0 - (level - 1) * 0.5).toFixed(2);
      const pushVal = 850 + level * 70;
      return {
        cooldown: t('seconds_cooldown', { duration: cooldownVal }, `${cooldownVal}s Cooldown`),
        effect: `Knockback: ${pushVal}`
      };
    } else if (ctrl.id === 'gravity_well') {
      const cooldownVal = Math.max(3.0, 8.0 - (level - 1) * 0.6).toFixed(2);
      const radVal = 190 + (level - 1) * 15;
      return {
        cooldown: t('seconds_cooldown', { duration: cooldownVal }, `${cooldownVal}s Cooldown`),
        effect: `Singularity Radius: ${radVal}px`
      };
    } else if (ctrl.id === 'temporal_freeze') {
      const cooldownVal = Math.max(4.0, 12.0 - (level - 1) * 0.8).toFixed(2);
      const freezeDur = (3.0 + (level - 1) * 0.5).toFixed(1);
      return {
        cooldown: t('seconds_cooldown', { duration: cooldownVal }, `${cooldownVal}s Cooldown`),
        effect: `Freeze Field: ${freezeDur}s`
      };
    }
    return {
      cooldown: `Ready`,
      effect: `Tactical Skill`
    };
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Side-sliding Panel */}
      <motion.div 
        id="control-shop-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-[520px] h-full space-ui-bg border-l border-cyan-500/30 flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.2)] font-mono"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" />
            <div>
              <h2 className="text-base font-black uppercase text-amber-400 tracking-wider">{t('combat_controls_title', {}, 'Skills Shop')}</h2>
              <p className="text-xs font-bold text-zinc-400">{t('chassis_core_module_stations', {}, 'TACTICAL MOUSE ABILITIES')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-700/80">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-amber-300">
                {currency.toLocaleString()}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 select-none custom-scrollbar flex flex-col">
          {!isUnlocked ? (
            /* LOCKED OVERVIEW CARD */
            <div className="flex flex-col items-center justify-center h-full text-center p-6 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)] mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full inline-block mb-2">
                RECOMMENDED ROUND 20+
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">TACTICAL SKILLS PROTOCOL</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-sans max-w-sm">
                Unlock active mouse-bound tactical skills to manipulate vessel velocity, lasso tether anchors, warp positions, fire kinetic shockwaves, and deploy singularity gravity wells.
              </p>

              <div className="w-full max-w-xs space-y-2.5 mt-6">
                <div className="bg-black/40 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold">COST:</span>
                  <span className="text-cyan-400 font-black text-sm">{isSandbox ? 'FREE' : '2,500 Cr'}</span>
                </div>
                <button
                  onClick={handleUnlockSkills}
                  disabled={currency < 2500 && !isSandbox}
                  className={`w-full py-3 rounded-xl text-xs font-black font-mono transition-all uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    currency >= 2500 || isSandbox
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-pulse'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{currency >= 2500 || isSandbox ? (isSandbox ? 'UNLOCK SKILLS' : 'UNLOCK SKILLS (2,500 Cr)') : 'NEED 2,500 CREDITS'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* EQUIPPED SLOTS (TOP SECTION) - ENHANCED DUAL SLOT DESIGN */}
              <section className="space-y-3">
            <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider border-b border-zinc-800 pb-2">
              {t('equipped_hot_click_activation_slots', {}, 'Equipped Mouse Abilities')}
            </h3>
            
            <div className="w-full grid grid-cols-2 gap-4">
              {/* LEFT CLICK SLOT CONTAINER */}
              <div className="flex flex-col">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 text-center block">
                  {t('left_click_action', {}, 'Left Click Action')}
                </span>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData('text/plain') || draggedId;
                    if (id) equipControl(id, 'left');
                  }}
                  className={`group border rounded-xl p-3.5 flex flex-col justify-between h-[165px] transition-all relative ${
                    leftSlot 
                      ? 'bg-zinc-900 border-cyan-500/60 shadow-[rgba(6,182,212,0.15)_0_0_25px]' 
                      : 'bg-zinc-950/60 border-dashed border-zinc-800'
                  }`}
                >
                  <div className="flex justify-end items-start h-4 mb-1">
                    {leftSlot && (
                      <button 
                        onClick={() => unequipControl('left')}
                        className="text-xs text-rose-400 transition-colors opacity-0 group-hover:opacity-100 uppercase font-bold cursor-pointer"
                      >
                        {t('unequip_label', {}, '[Unequip]')}
                      </button>
                    )}
                  </div>

                  {leftSlot ? (
                    (() => {
                      const ctrl = ALL_CONTROLS.find(c => c.id === leftSlot);
                      const level = ownedList.find(c => c.id === leftSlot)?.level || 1;
                      if (!ctrl) return null;
                      const Icon = ctrl.icon;
                      const specs = getSpecs(ctrl, level);
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2.5 items-center">
                            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-black text-white flex items-center gap-1.5">
                                <span className="truncate">{t(ctrl.id + '_name', {}, ctrl.name)}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 font-mono shrink-0 font-black">
                                  L.{level}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono font-black uppercase mt-0.5 text-zinc-400 flex items-center gap-1">
                                <span className={`px-1 rounded text-[9px] ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  Controls: {ctrl.target === 'Player' ? 'Player' : 'Enemies'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-300 font-mono font-bold mt-0.5">
                                {specs.cooldown}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-200 font-mono bg-zinc-950/90 px-2.5 py-1.5 rounded-lg border border-zinc-800 truncate leading-tight mt-1">
                            {specs.effect}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                      <Plus className="w-5 h-5 mb-1.5 opacity-60 text-cyan-400 animate-pulse" />
                      <span className="text-xs uppercase tracking-wider font-bold">{t('unassigned_label', {}, 'Unassigned')}</span>
                    </div>
                  )}
                  
                  {/* Drag zone footer indicator */}
                  <div className="text-[9px] text-zinc-500 font-mono font-bold absolute bottom-2 right-2.5 uppercase">
                    {t('drag_action_here', {}, 'Drag action here')}
                  </div>
                </div>
              </div>

              {/* RIGHT CLICK SLOT CONTAINER */}
              <div className="flex flex-col">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 text-center block">
                  {t('right_click_action', {}, 'Right Click Action')}
                </span>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData('text/plain') || draggedId;
                    if (id) equipControl(id, 'right');
                  }}
                  className={`group border rounded-xl p-3.5 flex flex-col justify-between h-[165px] transition-all relative ${
                    rightSlot 
                      ? 'bg-zinc-900 border-cyan-500/60 shadow-[rgba(6,182,212,0.15)_0_0_25px]' 
                      : 'bg-zinc-950/60 border-dashed border-zinc-800'
                  }`}
                >
                  <div className="flex justify-end items-start h-4 mb-1">
                    {rightSlot && (
                      <button 
                        onClick={() => unequipControl('right')}
                        className="text-xs text-rose-400 transition-colors opacity-0 group-hover:opacity-100 uppercase font-bold cursor-pointer"
                      >
                        {t('unequip_label', {}, '[Unequip]')}
                      </button>
                    )}
                  </div>

                  {rightSlot ? (
                    (() => {
                      const ctrl = ALL_CONTROLS.find(c => c.id === rightSlot);
                      const level = ownedList.find(c => c.id === rightSlot)?.level || 1;
                      if (!ctrl) return null;
                      const Icon = ctrl.icon;
                      const specs = getSpecs(ctrl, level);
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2.5 items-center">
                            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-black text-white flex items-center gap-1.5">
                                <span className="truncate">{t(ctrl.id + '_name', {}, ctrl.name)}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 font-mono shrink-0 font-black">
                                  L.{level}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono font-black uppercase mt-0.5 text-zinc-400 flex items-center gap-1">
                                <span className={`px-1 rounded text-[9px] ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  Controls: {ctrl.target === 'Player' ? 'Player' : 'Enemies'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-300 font-mono font-bold mt-0.5">
                                {specs.cooldown}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-200 font-mono bg-zinc-950/90 px-2.5 py-1.5 rounded-lg border border-zinc-800 truncate leading-tight mt-1">
                            {specs.effect}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                      <Plus className="w-5 h-5 mb-1.5 opacity-60 text-cyan-400 animate-pulse" />
                      <span className="text-xs uppercase tracking-wider font-bold">{t('unassigned_label', {}, 'Unassigned')}</span>
                    </div>
                  )}
                  
                  {/* Drag zone footer indicator */}
                  <div className="text-[9px] text-zinc-500 font-mono font-bold absolute bottom-2 right-2.5 uppercase">
                    {t('drag_action_here', {}, 'Drag action here')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* OWNED STORAGE / HAND */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                {t('your_control_hand_modules', {}, 'Your Skills')}
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                {t('owned_click_or_drag_to_slot', { count: ownedList.length }, `${ownedList.length} OWNED // CLICK OR DRAG TO SLOT`)}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {ownedList.map(item => {
                const ctrl = ALL_CONTROLS.find(c => c.id === item.id);
                if (!ctrl) return null;
                const Icon = ctrl.icon;
                const specs = getSpecs(ctrl, item.level);
                const upgradeCost = getUpgradeCost(item.level);
                const isLeftEquipped = leftSlot === item.id;
                const isRightEquipped = rightSlot === item.id;

                return (
                  <div 
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className="group flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-500/50 cursor-grab active:cursor-grabbing transition-all relative"
                  >
                    <div className="flex items-center gap-3 max-w-[210px] min-w-0">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{t(ctrl.id + '_name', {}, ctrl.name)}</span>
                          <span className="px-1.5 py-0.5 text-[9px] bg-zinc-800 text-amber-300 font-mono font-bold rounded shrink-0">
                            Lv {item.level}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {ctrl.target === 'Player' ? 'Player' : 'Enemies'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-300 font-mono truncate mt-0.5">
                          {specs.effect}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => isLeftEquipped ? unequipControl('left') : equipControl(item.id, 'left')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black border transition-all uppercase cursor-pointer ${
                          isLeftEquipped 
                            ? 'bg-cyan-500 text-black border-cyan-400 font-black' 
                            : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {t('left_click', {}, 'Left')}
                      </button>

                      <button
                        onClick={() => isRightEquipped ? unequipControl('right') : equipControl(item.id, 'right')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black border transition-all uppercase cursor-pointer ${
                          isRightEquipped 
                            ? 'bg-cyan-500 text-black border-cyan-400 font-black' 
                            : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {t('right_click', {}, 'Right')}
                      </button>

                      <button
                        onClick={() => upgradeControl(item.id)}
                        disabled={currency < upgradeCost && !isSandbox}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors flex flex-col items-center min-w-[65px] shrink-0 uppercase cursor-pointer ${
                          currency >= upgradeCost || isSandbox
                            ? 'bg-amber-500 text-black font-black hover:bg-amber-400'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-bold leading-none mb-0.5">{t('upgrade_btn_label', {}, 'UPGRADE')}</span>
                        <span className="text-xs font-black leading-none">{isSandbox ? t('free_label', {}, 'Free') : upgradeCost}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BUY MOVEMENT CONTROLS SHOP */}
          <section className="space-y-3 pt-3 border-t border-zinc-800">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              {t('movement_skill_module_shop', {}, 'Available Skills')}
            </h3>

            <div className="space-y-3">
              {MOVEMENT_CONTROLS.map(ctrl => {
                const owned = ownedList.some(o => o.id === ctrl.id);
                if (owned) return null;

                return (
                  <div 
                    key={ctrl.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 transition-colors flex flex-col justify-between gap-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                       <div className="flex gap-2.5 items-start">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow flex-shrink-0 mt-0.5`}>
                          <ctrl.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white uppercase tracking-wide">
                              {t(ctrl.id + '_name', {}, ctrl.name)}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                              Controls: {ctrl.target === 'Player' ? 'Player (Your Vessel)' : 'Enemies (Hostiles)'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">
                            {t(ctrl.id + '_description', {}, ctrl.description)}
                          </p>
                        </div>
                      </div>

                      {/* Buy trigger */}
                      <button
                        onClick={() => buyControl(ctrl.id, ctrl.cost)}
                        disabled={currency < ctrl.cost && !isSandbox}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs font-mono flex flex-col items-center justify-center min-w-[75px] transition-all shrink-0 cursor-pointer ${
                          currency >= ctrl.cost || isSandbox
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-bold leading-none">{t('buy_label', {}, 'BUY')}</span>
                        <span className="text-xs font-black leading-none mt-1">
                          {isSandbox ? t('free_all_caps', {}, 'FREE') : `${ctrl.cost}`}
                        </span>
                      </button>
                    </div>

                    <div className="mt-1 bg-zinc-950/80 rounded-lg px-2.5 py-1.5 flex justify-between items-center text-xs font-mono border border-zinc-800/60 text-zinc-400">
                      <span>{t('base_cooldown_label', { cooldown: ctrl.baseCooldown }, `BASE COOLDOWN: ${ctrl.baseCooldown}s`)}</span>
                      <span>{t('system_code_label', { code: ctrl.id.toUpperCase() }, `SYSTEM CODE: ${ctrl.id.toUpperCase()}`)}</span>
                    </div>
                  </div>
                );
              })}

              {MOVEMENT_CONTROLS.every(c => ownedList.some(o => o.id === c.id)) && (
                <div className="border border-dashed border-zinc-800 rounded-xl py-4 text-center text-zinc-400 font-mono">
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                    {t('all_movement_core_tech_unlocked', {}, '✓ All Skills Unlocked')}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* QUICK TUTORIAL CORNER */}
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 font-sans">
            <h4 className="text-xs font-black text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> {t('tactical_control_guide', {}, 'Skills Guide')}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t('tactical_control_guide_desc', {}, 'Equip tactical skills to your Left & Right click mouse buttons. Skills like Pull, Tether, and Teleport control your player vessel, while Shockwave, Gravity Well, and Stasis Freeze control enemy positioning.')}
            </p>
          </section>
        </>
      )}

        </div>
      </motion.div>
    </div>
  );
}
