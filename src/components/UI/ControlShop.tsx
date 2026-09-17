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
  Plus,
  Radio,
  Disc,
  Snowflake,
} from 'lucide-react';
import { gameAudio } from '../../game/audio';

interface ControlShopProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine;
  onUpdate?: () => void;
  isSandbox?: boolean;
  embedded?: boolean;
  room?: number;
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
    description: 'Pulls your vessel toward cursor with a velocity impulse; deflects nearby enemy bullets back.',
    cost: 2500,
    icon: Activity,
    baseCooldown: 5.0,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'gravity_tether',
    name: 'Tether',
    target: 'Player',
    description: 'Hold to lasso with a micro-magnet: steer and slingshot around obstacles and gravity pulls.',
    cost: 4000,
    icon: Flame,
    baseCooldown: 0.1,
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'gravity_warp',
    name: 'Teleport',
    target: 'Player',
    description: 'Warps your vessel to the cursor with a spatial implosion displacement.',
    cost: 8500,
    icon: ChevronRight,
    baseCooldown: 10.0,
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'shockwave_blast',
    name: 'Shockwave',
    target: 'Enemies',
    description: 'Bursts a kinetic shockwave at cursor: knocks enemies back, stuns them, and deflects bullets in radius.',
    cost: 5000,
    icon: Radio,
    baseCooldown: 6.0,
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'gravity_well',
    name: 'Gravity Well',
    target: 'Enemies',
    description: 'Drops a gravity singularity at cursor for 3.5s: pulls nearby enemies toward its center.',
    cost: 7500,
    icon: Disc,
    baseCooldown: 8.0,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'temporal_freeze',
    name: 'Stasis Freeze',
    target: 'Enemies',
    description: 'Freezes a field at cursor for 3s: enemies and their bullets inside stop dead.',
    cost: 10000,
    icon: Snowflake,
    baseCooldown: 12.0,
    color: 'from-cyan-400 to-blue-600'
  },
  {
    id: 'toxin_cloud',
    name: 'Toxin Cloud',
    target: 'Enemies',
    description: 'Spills a toxic cloud at cursor that poisons enemies inside over time, melting their health.',
    cost: 6000,
    icon: Flame,
    baseCooldown: 9.0,
    color: 'from-lime-600 to-green-700'
  },
  {
    id: 'incendiary_blast',
    name: 'Incendiary',
    target: 'Enemies',
    description: 'Blasts a cone of fire at cursor: burns enemies caught in it over a short duration.',
    cost: 5500,
    icon: Flame,
    baseCooldown: 7.0,
    color: 'from-red-500 to-orange-600'
  },
  {
    id: 'arc_chain',
    name: 'Arc Chain',
    target: 'Enemies',
    description: 'Fires chaining lightning arcs that jump between the nearest enemies in range, stunning each one hit.',
    cost: 9000,
    icon: Radio,
    baseCooldown: 11.0,
    color: 'from-sky-400 to-blue-600'
  }
];

const ALL_CONTROLS: ControlData[] = [...MOVEMENT_CONTROLS];

export const getControlCooldown = (id: string, level: number): number => {
  const base: Record<string, number> = {
    redirection_pull: 5.0,
    gravity_tether: 0.1,
    gravity_warp: 10.0,
    shockwave_blast: 6.0,
    gravity_well: 8.0,
    temporal_freeze: 12.0,
    toxin_cloud: 9.0,
    incendiary_blast: 7.0,
    arc_chain: 11.0,
  };
  return Math.max(0.1, (base[id] ?? 6.0) - (level - 1) * 0.4);
};

export const getControlEffect = (id: string, level: number): string => {
  switch (id) {
    case 'redirection_pull': return `Vel: ${1200 + (level - 1) * 75} px/s`;
    case 'gravity_tether': return 'Magnet lasso (hold)';
    case 'gravity_warp': return `Displace AOE: ${135 + (level - 1) * 15}px`;
    case 'shockwave_blast': return `Knockback: ${850 + level * 70}`;
    case 'gravity_well': return `Radius: ${190 + (level - 1) * 15}px · 3.5s`;
    case 'temporal_freeze': return `Freeze: ${(3.0 + (level - 1) * 0.5).toFixed(1)}s`;
    case 'toxin_cloud': return `Poison tick: ${8 + level * 3}/s · ${6 + level * 2}s`;
    case 'incendiary_blast': return `Burn: ${10 + level * 4}/s · ${2 + level * 0.4}s`;
    case 'arc_chain': return `Jumps: ${2 + Math.floor(level / 2)} · stun`;
    default: return `Lv ${level}`;
  }
};

export const getControlMaxCd = (id: string, level: number): number => {
  return Math.max(0.1, getControlCooldown(id, level) * 1.2);
};

export const getUpgradeCost = (level: number) => {
  return Math.floor(1500 * Math.pow(1.5, level - 1));
};

export default function ControlShop({ isOpen, onClose, engine, onUpdate, isSandbox, embedded, room = 1 }: ControlShopProps) {
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

  // Unlock skills protocol (level 20 boss clear, no cost)
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

  const cooldownStr = (id: string, level: number) => {
    const cd = getControlCooldown(id, level);
    return cd <= 0.1 ? t('active_toggle', {}, 'Active Toggle') : `${cd.toFixed(1)}s`;
  };
  const effectStr = (id: string, level: number) => getControlEffect(id, level);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const body = (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none custom-scrollbar flex flex-col">

          {isUnlocked && (<>
              {/* EQUIPPED SLOTS */}
              <section className="space-y-3">
                <div className="w-full grid grid-cols-2 gap-4">
                  {/* LEFT CLICK SLOT */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-1 text-center block">
                      {t('left_click_action', {}, 'Left Click Action')}
                    </span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData('text/plain') || draggedId;
                        if (id) equipControl(id, 'left');
                      }}
                      className={`group border rounded-xl p-3 flex flex-col justify-between h-[130px] transition-all relative ${
                        leftSlot
                          ? 'bg-zinc-900 border-cyan-500/60 shadow-[rgba(6,182,212,0.15)_0_0_25px]'
                          : 'bg-zinc-950/60 border-dashed border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-end items-start h-4 mb-1">
                        {leftSlot && (
                          <button
                            onClick={() => unequipControl('left')}
                            className="text-[10px] text-rose-400 transition-colors opacity-0 group-hover:opacity-100 uppercase font-bold cursor-pointer"
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
                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-2 items-center">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                                    <span className="truncate">{ctrl.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono shrink-0 font-black">
                                      L.{level}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono font-bold uppercase mt-0.5 text-zinc-400 flex items-center gap-1">
                                    <span className={`px-1 rounded text-[9px] ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                      {ctrl.target === 'Player' ? 'Player' : 'Enemies'}
                                    </span>
                                    <span className="text-zinc-500">·</span>
                                    <span className="text-zinc-300">{cooldownStr(ctrl.id, level)} cd</span>
                                  </div>
                                  <div className="text-xs text-zinc-200 font-mono bg-zinc-950/90 px-2 py-1 rounded border border-zinc-800 leading-tight mt-0.5">
                                    {effectStr(ctrl.id, level)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                          <Plus className="w-5 h-5 mb-1 opacity-60 text-cyan-400" />
                          <span className="text-xs uppercase tracking-wider font-bold">
                            {t('unassigned_label', {}, 'Unassigned')}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono font-bold mt-2 uppercase">
                            {t('drag_action_here', {}, 'Drag action here')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT CLICK SLOT */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-1 text-center block">
                      {t('right_click_action', {}, 'Right Click Action')}
                    </span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData('text/plain') || draggedId;
                        if (id) equipControl(id, 'right');
                      }}
                      className={`group border rounded-xl p-3 flex flex-col justify-between h-[130px] transition-all relative ${
                        rightSlot
                          ? 'bg-zinc-900 border-cyan-500/60 shadow-[rgba(6,182,212,0.15)_0_0_25px]'
                          : 'bg-zinc-950/60 border-dashed border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-end items-start h-4 mb-1">
                        {rightSlot && (
                          <button
                            onClick={() => unequipControl('right')}
                            className="text-[10px] text-rose-400 transition-colors opacity-0 group-hover:opacity-100 uppercase font-bold cursor-pointer"
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
                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-2 items-center">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                                    <span className="truncate">{ctrl.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono shrink-0 font-black">
                                      L.{level}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono font-bold uppercase mt-0.5 text-zinc-400 flex items-center gap-1">
                                    <span className={`px-1 rounded text-[9px] ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                      {ctrl.target === 'Player' ? 'Player' : 'Enemies'}
                                    </span>
                                    <span className="text-zinc-500">·</span>
                                    <span className="text-zinc-300">{cooldownStr(ctrl.id, level)} cd</span>
                                  </div>
                                  <div className="text-xs text-zinc-200 font-mono bg-zinc-950/90 px-2 py-1 rounded border border-zinc-800 leading-tight mt-0.5">
                                    {effectStr(ctrl.id, level)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                          <Plus className="w-5 h-5 mb-1 opacity-60 text-cyan-400" />
                          <span className="text-xs uppercase tracking-wider font-bold">
                            {t('unassigned_label', {}, 'Unassigned')}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono font-bold mt-2 uppercase">
                            {t('drag_action_here', {}, 'Drag action here')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* OWNED SKILLS */}
              <section className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    {t('your_control_hand_modules', {}, 'Your Skills')}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                    {ownedList.length} OWNED
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {ownedList.map(item => {
                    const ctrl = ALL_CONTROLS.find(c => c.id === item.id);
                    if (!ctrl) return null;
                    const Icon = ctrl.icon;
                    const level = item.level;
                    const upgradeCost = getUpgradeCost(level);
                    const isLeftEquipped = leftSlot === item.id;
                    const isRightEquipped = rightSlot === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className="group flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-500/50 cursor-grab active:cursor-grabbing transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{ctrl.name}</span>
                              <span className="px-1 py-0.5 text-[9px] bg-zinc-800 text-amber-300 font-mono font-bold rounded shrink-0">
                                Lv {level}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-300 font-mono truncate mt-0.5">
                              {effectStr(ctrl.id, level)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => isLeftEquipped ? unequipControl('left') : equipControl(item.id, 'left')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black border uppercase transition-all cursor-pointer ${
                              isLeftEquipped
                                ? 'bg-cyan-500 text-black border-cyan-400 font-black'
                                : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                            }`}
                          >
                            {t('left_click', {}, 'Left')}
                          </button>

                          <button
                            onClick={() => isRightEquipped ? unequipControl('right') : equipControl(item.id, 'right')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black border uppercase transition-all cursor-pointer ${
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
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border uppercase transition-all cursor-pointer ${
                              currency >= upgradeCost || isSandbox
                                ? 'bg-amber-500 text-black font-black hover:bg-amber-400 border-amber-400/40'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-800'
                            }`}
                          >
                            {isSandbox ? t('free_label', {}, 'Free') : `UPGRADE ${upgradeCost}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* AVAILABLE SKILLS SHOP */}
              <section className="space-y-2 pt-2 border-t border-zinc-800">
                <h3 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  {t('movement_skill_module_shop', {}, 'Available Skills')}
                </h3>

                <div className="space-y-2">
                  {MOVEMENT_CONTROLS.map(ctrl => {
                    const owned = ownedList.some(o => o.id === ctrl.id);
                    if (owned) return null;
                    const canAfford = currency >= ctrl.cost || isSandbox;

                    return (
                      <div
                        key={ctrl.id}
                        className="group flex items-center justify-between gap-3 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-500/50 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${ctrl.color} text-white shadow shrink-0`}>
                            <ctrl.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{ctrl.name}</span>
                              <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${ctrl.target === 'Player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {ctrl.target === 'Player' ? 'PLAYER' : 'ENEMIES'}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-300 font-mono truncate mt-0.5">
                              {ctrl.description}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => buyControl(ctrl.id, ctrl.cost)}
                          disabled={!canAfford}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-black border uppercase transition-all shrink-0 cursor-pointer ${
                            canAfford
                              ? 'bg-cyan-500 text-black hover:bg-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          {isSandbox ? t('free_all_caps', {}, 'FREE') : `BUY ${ctrl.cost}`}
                        </button>
                      </div>
                    );
                  })}

                  {MOVEMENT_CONTROLS.every(c => ownedList.some(o => o.id === c.id)) && (
                    <div className="border border-dashed border-zinc-800 rounded-xl py-3 text-center text-zinc-400 font-mono">
                      <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                        {t('all_movement_core_tech_unlocked', {}, '✓ All Skills Unlocked')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
          </>)}
            </div>
  );

  if (embedded) {
    return <div className="select-none">{body}</div>;
  }

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
            <div className="w-3 h-3 rounded bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
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
        {body}

      </motion.div>
    </div>
  );
}
