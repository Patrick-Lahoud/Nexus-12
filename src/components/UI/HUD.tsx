import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Settings, HelpCircle, LogOut, ShoppingCart, Shield, Heart, Activity, Lock, Unlock, Zap, Flame, Target, ChevronLeft, ChevronRight, Coins, Wrench, Pickaxe, BarChart2, RotateCcw } from 'lucide-react';
import { GameEngine } from '../../game/engine.ts';
import { gameAudio } from '../../game/audio.ts';
import { useLanguage, translateDynamicName } from '../../game/localization.ts';
import { getAbilityMaxLevel, ALL_UPGRADES, EVOLVED_ABILITIES } from '../../game/upgrades.ts';

interface HUDProps {
  engine: GameEngine;
  room: number;
  score: number;
  highestRoom?: number;
  onShowShop: () => void;
  onShowCompendium: () => void;
  onShowSettings: () => void;
  onShowGuidebook: () => void;
  isSandbox?: boolean;
  gameMode?: 'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX';
  rebuildsLeft?: number;
  onRoomChange?: (room: number) => void;
  onQuitToMenu: () => void;
}

export default function HUD({ engine, room, score, highestRoom = 1, onShowShop, onShowCompendium, onShowSettings, onShowGuidebook, isSandbox, gameMode = 'SURVIVAL', rebuildsLeft, onRoomChange, onQuitToMenu }: HUDProps) {
  const { t, lang } = useLanguage();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const prevHpPctRef = useRef<number | null>(null);
  const regenFlashStartRef = useRef<number>(0);

  const canAffordTurrets = !engine.player.stats.isTurretsUnlocked && (engine.player.stats.currency >= 10000 || isSandbox);
  const canAffordMines = !engine.player.stats.isMinesUnlocked && (engine.player.stats.currency >= 50000 || isSandbox);
  const hpPercent = engine.player.maxHp > 0 ? (engine.player.hp / engine.player.maxHp) * 100 : 0;
  const displayHpPct = Math.max(0, Math.ceil(hpPercent));
  if (prevHpPctRef.current !== null && displayHpPct > prevHpPctRef.current) {
    regenFlashStartRef.current = Date.now();
  }
  prevHpPctRef.current = displayHpPct;
  const regenActive = Date.now() - regenFlashStartRef.current < 900;

  return (
    <div className="flex justify-between items-end mb-4 border-b-2 border-zinc-800 pb-3 pointer-events-auto select-none">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2.5 items-center flex-wrap">
          {/* Compendium Button */}
          <motion.button 
            onClick={() => { gameAudio.playButtonClickSound(); onShowCompendium(); }}
            animate={{ 
              boxShadow: [
                "0 0 4px rgba(34,211,238,0.3)", 
                "0 0 15px rgba(34,211,238,0.8)", 
                "0 0 4px rgba(34,211,238,0.3)"
              ],
              borderColor: [
                "rgba(103,232,249,0.4)",
                "rgba(34,211,238,1)",
                "rgba(103,232,249,0.4)"
              ]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.0,
              repeatDelay: 3.5,
              ease: "easeInOut"
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-black border-2 border-cyan-300 px-3.5 py-2 hover:from-cyan-400 hover:to-cyan-300 transition-all rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.35)] cursor-pointer"
          >
            <BookOpen size={16} className="text-black stroke-[2.5]" />
            <span className="text-xs uppercase tracking-wider">{t('compendium_btn')}</span>
          </motion.button>

          {/* Settings Button */}
          <button 
            onClick={() => { gameAudio.playButtonClickSound(); onShowSettings(); }}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-cyan-400 px-3.5 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 font-bold transition-all rounded-lg cursor-pointer group"
          >
            <Settings size={16} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
            <span className="text-xs uppercase tracking-wider">{t('settings_btn')}</span>
          </button>

          {/* Handbook Button */}
          <button 
            onClick={() => { gameAudio.playButtonClickSound(); onShowGuidebook(); }}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-cyan-400 px-3.5 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 font-bold transition-all rounded-lg cursor-pointer group"
          >
            <HelpCircle size={16} className="text-cyan-400" />
            <span className="text-xs uppercase tracking-wider">{t('handbook_btn')}</span>
          </button>

          {/* Quit Button */}
          <button 
            onClick={() => { gameAudio.playButtonClickSound(); setConfirmQuit(true); }}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-red-500 px-3.5 py-2 hover:bg-red-950/30 text-zinc-300 hover:text-red-400 font-bold transition-all rounded-lg cursor-pointer group"
          >
            <LogOut size={16} className="text-red-400" />
            <span className="text-xs uppercase tracking-wider">{t('quit_btn')}</span>
          </button>

          <AnimatePresence>
            {confirmQuit && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="bg-zinc-950 border border-red-900/50 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col gap-4 text-center pointer-events-auto"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    !
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-base tracking-wider font-mono">{t('quit_confirm_title')}</h3>
                    <p className="text-zinc-300 text-xs mt-2 leading-relaxed font-mono">
                      {t('quit_confirm_desc')}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={() => {
                        gameAudio.playButtonClickSound();
                        setConfirmQuit(false);
                        onQuitToMenu();
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                    >
                      {t('yes_quit')}
                    </button>
                    <button 
                      onClick={() => { gameAudio.playButtonClickSound(); setConfirmQuit(false); }}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-zinc-700 cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
          <span className={`text-xs uppercase tracking-widest font-black font-mono ml-1 ${gameMode === 'HARDCORE' ? 'text-red-400' : 'text-zinc-400'}`}>
            {gameMode === 'HARDCORE' ? t('hardcore', {}, 'HARDCORE') : (gameMode === 'SANDBOX' || gameMode === 'OVERDRIVE_SANDBOX') ? t('sandbox_simulation', {}, 'Sandbox') : gameMode === 'SURVIVAL' ? t('retro_sector', {}, 'Retro Sector') : t('survival_sector', {}, 'Survival')}
          </span>

          {isSandbox && (
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded-lg ml-2 group hover:border-cyan-500/50 transition-colors">
              <span className="text-xs font-black text-zinc-400 uppercase font-mono">{t('input_sector')}</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { gameAudio.playButtonClickSound(); onRoomChange?.(Math.max(1, room - 1)); }}
                  className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-cyan-500 hover:text-black text-xs font-black rounded transition-colors"
                >
                  -
                </button>
                <input 
                  type="number"
                  value={room}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) onRoomChange?.(Math.max(1, val));
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-cyan-400 w-10 text-center border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={() => { gameAudio.playButtonClickSound(); onRoomChange?.(room + 1); }}
                  className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-cyan-500 hover:text-black text-xs font-black rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black italic uppercase leading-none tracking-tight text-white mt-1">
          {isSandbox ? t('sandbox_tab') : `${t('room_label')} ${room}`} 
          <span className="text-zinc-400 ml-3 text-2xl font-mono not-italic font-bold">
            {isSandbox ? t('unlimited') : `${t('highest_room_label', {}, 'Highest Room')}: ${Math.max(highestRoom || 1, room)}`}
          </span>
        </h1>
      </div>

      <div className="flex gap-4 items-center">
        {/* Prominent Wide Shop Button */}
        <motion.button 
           onClick={() => { gameAudio.playButtonClickSound(); onShowShop(); }}
           animate={{ 
             boxShadow: [
               "0 0 8px rgba(245,158,11,0.4)", 
               "0 0 25px rgba(245,158,11,0.9)", 
               "0 0 8px rgba(245,158,11,0.4)"
             ],
             borderColor: [
               "rgba(253,230,138,0.6)",
               "rgba(245,158,11,1)",
               "rgba(253,230,138,0.6)"
             ],
             scale: [1, 1.02, 1],
           }}
           transition={{
             repeat: Infinity,
             duration: 2.0,
             repeatDelay: 2.5,
             ease: "easeInOut"
           }}
           className="relative bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black border-2 border-amber-300 px-6 py-2.5 hover:brightness-110 transition-all flex items-center justify-between gap-4 group rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer min-w-[220px] sm:min-w-[260px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-black/15 text-amber-950 font-black rounded-xl shadow-inner group-hover:scale-110 transition-transform">
               <ShoppingCart size={22} strokeWidth={2.8} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm sm:text-base font-black uppercase text-amber-950 leading-none tracking-wider font-mono">
                {t('shop', {}, 'SHOP')}
              </span>
              <span className="text-[10px] font-extrabold uppercase text-amber-900/80 leading-tight mt-0.5 tracking-tight font-sans">
                {t('core_upgrades', {}, 'UPGRADES & DEPLOYMENTS')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-amber-900/30 text-black font-mono font-black text-sm sm:text-base shadow-sm shrink-0">
             {isSandbox ? (
               <span className="text-xs text-black uppercase">{t('unlocked', {}, 'FREE')}</span>
             ) : (
               <>
                 <Coins size={16} className="text-amber-950 shrink-0" />
                 <span>{Math.round(engine.player.stats.currency || 0).toLocaleString()}</span>
               </>
             )}
          </div>

          {(canAffordTurrets || canAffordMines) ? (
            <div className="absolute bottom-[calc(100%+6px)] right-1 z-20 flex flex-col items-end gap-1 pointer-events-none">
              {canAffordMines && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="px-2 py-0.5 rounded-full border-2 border-zinc-950 font-mono text-[9px] font-black uppercase shadow-lg flex items-center gap-1 bg-emerald-400 text-black shadow-emerald-400/80"
                >
                  <Pickaxe size={10} />
                  <span>MINING READY!</span>
                </motion.div>
              )}
              {canAffordTurrets && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="px-2 py-0.5 rounded-full border-2 border-zinc-950 font-mono text-[9px] font-black uppercase shadow-lg flex items-center gap-1 bg-amber-400 text-black shadow-amber-400/80"
                >
                  <Wrench size={10} />
                  <span>DEFENSE READY!</span>
                </motion.div>
              )}
            </div>
          ) : (!isSandbox && engine.player.stats.currency >= 40) ? (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 z-20 shadow-[0_0_12px_rgba(239,68,68,0.9)]"
            />
          ) : null}
        </motion.button>

        {/* Rebuilds Indicator — green, shop-sized, sits between the Shop button and the health readout */}
        {gameMode === 'OVERDRIVE' && typeof rebuildsLeft === 'number' && rebuildsLeft > 0 && (
          <div className="flex items-center gap-3 bg-emerald-950/60 border-2 border-emerald-500/50 rounded-2xl px-5 py-2.5 min-w-[170px] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-400/15 text-emerald-300 font-black rounded-xl border border-emerald-400/40">
              <RotateCcw size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 leading-none">
                {t('rebuilds_short', {}, 'Rebuilds')}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[0, 1, 2].map(i => {
                  const lit = i < rebuildsLeft;
                  return (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 ${
                        lit
                          ? 'bg-emerald-400 text-emerald-950 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : 'bg-zinc-900/80 border-zinc-700 text-zinc-600'
                      }`}
                    >
                      <Wrench size={14} strokeWidth={2.5} />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Hull & Hostiles Readout */}
        <div className="flex gap-6 text-right ml-2 items-center">
          <div className="flex flex-col items-end">
            <p className="text-xs uppercase text-zinc-400 font-bold mb-1 font-mono tracking-wider">{t('hull_integrity')}</p>
            <div className="flex items-center gap-3">
                <div className="w-32 sm:w-36 h-3 bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-700">
                    {/* Ghost Health (Damage Indicator) */}
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${Math.max(0, hpPercent)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="absolute inset-0 bg-red-900/60"
                    />
                    {/* Actual Health */}
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${Math.max(0, hpPercent)}%` }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`absolute inset-0 h-full ${hpPercent < 30 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`}
                    />
                    {/* Green Regen Flash - only while HP% is rising (bar and % text share one fade) */}
                    {regenActive && (
                        <motion.div
                            key={regenFlashStartRef.current}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="absolute inset-0 h-full bg-green-400/70 shadow-[0_0_14px_rgba(34,197,94,0.9)]"
                        />
                    )}
                </div>
                <motion.p 
                    key={regenActive ? `hp-flash-${regenFlashStartRef.current}` : 'hp-idle'}
                    initial={{ 
                        scale: engine.player.hurtTimer > 0 ? 1.15 : 1,
                        color: regenActive ? '#22c55e' : (hpPercent < 30 ? '#ef4444' : '#f43f5e') 
                    }}
                    animate={{ 
                        scale: engine.player.hurtTimer > 0 ? 1.15 : 1,
                        color: hpPercent < 30 ? '#ef4444' : '#f43f5e' 
                    }}
                    transition={{ color: { duration: 0.9, ease: 'easeOut' } }}
                    className="text-2xl font-mono font-black"
                >
                    {Math.max(0, Math.ceil(hpPercent))}<span className="text-sm">%</span>
                </motion.p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-400 font-bold font-mono tracking-wider mb-1">{t('hostiles')}</p>
            <p className="text-2xl font-mono text-white font-black">{engine.enemies.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarStats({ engine, room = 1, onOpenControlShop }: { engine: GameEngine; room?: number; onOpenControlShop?: () => void }) {
    const { t, lang } = useLanguage();
    const abilityCount = engine.player.abilities.length;
    const isSkillsUnlocked = Boolean(engine.player.stats.isControlUnlocked || (engine.player.stats.ownedControls && engine.player.stats.ownedControls.length > 0) || engine.gameMode?.includes('SANDBOX'));
    const isSandbox = engine.gameMode?.includes('SANDBOX');
    const currency = engine.player.stats.currency || 0;

    const handleBuySkillsFromHUD = () => {
        const cost = 2500;
        if (currency >= cost || isSandbox) {
            if (!isSandbox) {
                engine.player.stats.currency = Math.max(0, currency - cost);
            }
            engine.player.stats.isControlUnlocked = true;
            if (!engine.player.stats.ownedControls) {
                engine.player.stats.ownedControls = [];
            }
            if (!engine.player.stats.ownedControls.some(c => c.id === 'redirection_pull')) {
                engine.player.stats.ownedControls.push({ id: 'redirection_pull', level: 1 });
            }
            if (!engine.player.stats.leftClickSlot) {
                engine.player.stats.leftClickSlot = 'redirection_pull';
            }
            gameAudio.playUpgradePickSound();
        } else {
            gameAudio.playHitSound(false, 'laser');
            onOpenControlShop?.();
        }
    };
    
    const [highlights, setHighlights] = useState<Record<string, boolean>>({});
    const prevStatsRef = useRef<Record<string, number>>({});

    const currentStatsSnapshot: Record<string, number> = {
        speed: engine.player.stats.speed || 0,
        bounceDmg: engine.player.stats.bounceDmg || 0,
        critChance: engine.player.stats.critChance || 0,
        regen: engine.player.stats.regen || 0,
        lifesteal: engine.player.stats.lifesteal || 0,
        accuracy: engine.player.stats.accuracy || 0,
        defense: engine.player.stats.defense || 0,
        maxHp: engine.player.maxHp || 0,
        damageMult: engine.player.stats.damageMult || 0,
        meleeSpeed: engine.player.stats.meleeSpeed || 0,
        cooldownMult: engine.player.stats.cooldownMult ?? 1.0,
        pierce: (engine.player.stats as any).pierce || 0,
        weaponSize: engine.player.stats.weaponSize || 0,
        weaponSynergy: engine.player.stats.weaponSynergy || 0,
        projectileSlow: engine.player.stats.projectileSlow || 0,
        slowDmgBoost: engine.player.stats.slowDmgBoost || 0,
        fireDmgBoost: engine.player.stats.fireDmgBoost || 0,
        fireMeleeDmgBoost: engine.player.stats.fireMeleeDmgBoost || 0,
    };

    useEffect(() => {
        const prev = prevStatsRef.current;
        const newlyHighlighted: string[] = [];

        if (Object.keys(prev).length > 0) {
            for (const [k, v] of Object.entries(currentStatsSnapshot)) {
                const prevVal = prev[k];
                if (prevVal !== undefined) {
                    if (k === 'cooldownMult' ? v < prevVal - 0.005 : v > prevVal + 0.005) {
                        newlyHighlighted.push(k);
                    }
                }
            }
        }

        prevStatsRef.current = { ...currentStatsSnapshot };

        if (newlyHighlighted.length > 0) {
            setHighlights(h => {
                const next = { ...h };
                newlyHighlighted.forEach(k => { next[k] = true; });
                return next;
            });

            const timer = setTimeout(() => {
                setHighlights(h => {
                    const next = { ...h };
                    newlyHighlighted.forEach(k => { delete next[k]; });
                    return next;
                });
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [
        engine.player.stats.speed,
        engine.player.stats.bounceDmg,
        engine.player.stats.critChance,
        engine.player.stats.regen,
        engine.player.stats.lifesteal,
        engine.player.stats.accuracy,
        engine.player.stats.defense,
        engine.player.maxHp,
        engine.player.stats.damageMult,
        engine.player.stats.meleeSpeed,
        engine.player.stats.cooldownMult,
        (engine.player.stats as any).pierce,
        engine.player.stats.weaponSize,
        engine.player.stats.weaponSynergy,
        engine.player.stats.projectileSlow,
        engine.player.stats.slowDmgBoost,
        engine.player.stats.fireDmgBoost,
        engine.player.stats.fireMeleeDmgBoost
    ]);

    const displayKey = (key?: string) => {
        if (!key) return '?';
        if (key === 'Space') return 'SPC';
        return key.replace('Key', '');
    };

    const reductionCount = engine.player.stats.deflectCooldownReduction || 0;
    const maxCooldown = Math.max(0.5, 5.0 - reductionCount * 0.1);

    const statsList = [
        // Primary Survivability & Defense
        {
            key: 'maxHp',
            val: engine.player.maxHp || 0,
            label: t('hull_integrity', {}, 'Hull Integrity'),
            value: Math.round(engine.player.maxHp || 0).toString(),
            progress: Math.min(1, Math.max(0, (engine.player.maxHp || 0) / 2000)),
            textClass: "text-red-300",
            progressClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        },
        {
            key: 'defense',
            val: engine.player.stats.defense || 0,
            label: t('stat_defense', {}, 'Ship Shield'),
            value: `${Math.round((engine.player.stats.defense || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.defense || 0) / 2)),
            textClass: "text-sky-300",
            progressClass: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
        },
        {
            key: 'regen',
            val: engine.player.stats.regen || 0,
            label: t('stat_regen'),
            value: (engine.player.stats.regen || 0).toFixed(1),
            progress: Math.min(1, Math.max(0, (engine.player.stats.regen || 0) / 10)),
            textClass: "text-lime-300",
            progressClass: "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]"
        },
        {
            key: 'lifesteal',
            val: engine.player.stats.lifesteal || 0,
            label: t('stat_lifesteal'),
            value: `${Math.round((engine.player.stats.lifesteal || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.lifesteal || 0) / 0.25)),
            textClass: "text-rose-300",
            progressClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
        },

        // Core Mobility & Offensive Power
        {
            key: 'speed',
            val: engine.player.stats.speed || 0,
            label: t('stat_velocity'),
            value: `${Math.round((engine.player.stats.speed || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.speed || 0) / 3)),
            textClass: "text-cyan-300",
            progressClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        },
        {
            key: 'cooldownMult',
            val: engine.player.stats.cooldownMult ? (1 / engine.player.stats.cooldownMult) : 1.0,
            label: t('stat_cooldown', {}, 'Fire Rate'),
            value: `${Math.round((1 / (engine.player.stats.cooldownMult || 1.0)) * 100)}%`,
            progress: Math.min(1, Math.max(0, ((1 / (engine.player.stats.cooldownMult || 1.0)) - 1.0) / 2.0)),
            textClass: "text-purple-300",
            progressClass: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"
        },
        {
            key: 'critChance',
            val: engine.player.stats.critChance || 0,
            label: t('stat_critical'),
            value: `${Math.round((engine.player.stats.critChance || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.critChance || 0) / 0.50)),
            textClass: "text-yellow-300",
            progressClass: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
        },
        {
            key: 'damageMult',
            val: engine.player.stats.damageMult || 0,
            label: t('crit_bonus', {}, 'Critical Bonus'),
            value: `${Math.round((engine.player.stats.damageMult || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.damageMult || 0) / 2.5)),
            textClass: "text-orange-300",
            progressClass: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"
        },
        {
            key: 'pierce',
            val: (engine.player.stats as any).pierce || 0,
            label: t('pierce_cnt', {}, 'Pierce Count'),
            value: `+${Math.round((engine.player.stats as any).pierce || 0)}`,
            progress: Math.min(1, Math.max(0, ((engine.player.stats as any).pierce || 0) / 5)),
            textClass: "text-emerald-300",
            progressClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
        },
        {
            key: 'bounceDmg',
            val: engine.player.stats.bounceDmg || 0,
            label: t('stat_impact'),
            value: Math.round(engine.player.stats.bounceDmg || 0).toString(),
            progress: Math.min(1, Math.max(0, (engine.player.stats.bounceDmg || 0) / 100)),
            textClass: "text-amber-300",
            progressClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        },

        // Precision, Reach & Synergies
        {
            key: 'accuracy',
            val: engine.player.stats.accuracy || 0,
            label: t('stat_accuracy', {}, 'Accuracy'),
            value: `${Math.round((engine.player.stats.accuracy || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.accuracy || 0) / 1.0)),
            textClass: "text-purple-300",
            progressClass: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"
        },
        {
            key: 'weaponSize',
            val: engine.player.stats.weaponSize || 0,
            label: t('stat_weapon_size', {}, 'Weapon Size'),
            value: `${Math.round((engine.player.stats.weaponSize || 1.0) * 100)}%`,
            progress: Math.min(1, Math.max(0, ((engine.player.stats.weaponSize || 1.0) - 1.0) / 1.5)),
            textClass: "text-teal-300",
            progressClass: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
        },
        {
            key: 'meleeSpeed',
            val: engine.player.stats.meleeSpeed || 0,
            label: t('melee_speed', {}, 'Melee Speed'),
            value: `${Math.round((engine.player.stats.meleeSpeed || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.meleeSpeed || 0) / 2.5)),
            textClass: "text-violet-300",
            progressClass: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
        },
        {
            key: 'weaponSynergy',
            val: engine.player.stats.weaponSynergy || 0,
            label: t('stat_weapon_synergy', {}, 'System Synergy'),
            value: `+${Math.round((engine.player.stats.weaponSynergy || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.weaponSynergy || 0) / 1.0)),
            textClass: "text-blue-300",
            progressClass: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
        },
        {
            key: 'projectileSlow',
            val: engine.player.stats.projectileSlow || 0,
            label: t('stat_projectile_slow', {}, 'Enemy Slow'),
            value: `${Math.round((engine.player.stats.projectileSlow || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.projectileSlow || 0) / 0.50)),
            textClass: "text-cyan-300",
            progressClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        },
        {
            key: 'fireDmgBoost',
            val: engine.player.stats.fireDmgBoost || 0,
            label: t('stat_fire_dmg_boost', {}, 'Fire Damage +'),
            value: `+${Math.round((engine.player.stats.fireDmgBoost || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.fireDmgBoost || 0) / 1.0)),
            textClass: "text-rose-300",
            progressClass: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
        },
        {
            key: 'slowDmgBoost',
            val: engine.player.stats.slowDmgBoost || 0,
            label: t('stat_slow_dmg_boost', {}, 'Slow Damage +'),
            value: `+${Math.round((engine.player.stats.slowDmgBoost || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.slowDmgBoost || 0) / 1.0)),
            textClass: "text-sky-300",
            progressClass: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
        },
        {
            key: 'fireMeleeDmgBoost',
            val: engine.player.stats.fireMeleeDmgBoost || 0,
            label: t('stat_fire_melee_dmg_boost', {}, 'Fire Melee +'),
            value: `+${Math.round((engine.player.stats.fireMeleeDmgBoost || 0) * 100)}%`,
            progress: Math.min(1, Math.max(0, (engine.player.stats.fireMeleeDmgBoost || 0) / 1.0)),
            textClass: "text-amber-300",
            progressClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        },
        {
            key: 'upgradeChoicesCount',
            val: (engine.player.stats.upgradeChoicesCount || 3) > 3 ? (engine.player.stats.upgradeChoicesCount || 3) : 0,
            label: t('stat_upgrade_choices', {}, 'Upgrade Choices'),
            value: `${engine.player.stats.upgradeChoicesCount || 3} Slots`,
            progress: Math.min(1, Math.max(0, ((engine.player.stats.upgradeChoicesCount || 3) - 3) / 3)),
            textClass: "text-amber-300",
            progressClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        }
    ];

    return (
        <div id="sidebar-stats" className="w-[410px] grid grid-cols-2 gap-3.5 h-full select-none">
            {/* Column 1: Active Abilities & Control Tab */}
            <div className="flex flex-col gap-3.5">
                
                {/* Active Abilities Section */}
                <div className="bg-zinc-950/70 p-4 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col flex-1 overflow-hidden min-h-[210px] shadow-lg">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
                        <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider font-mono flex items-center gap-1.5">
                            <Zap size={14} />
                            {t('active_abilities', {}, 'ABILITIES')}
                        </h3>
                        <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${abilityCount >= 5 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {abilityCount}/5 {t('slots', {}, 'SLOTS')}
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-3">
                        {engine.player.abilities.length === 0 && <p className="text-zinc-500 text-xs italic font-mono pt-2">{t('no_active_abilities')}</p>}
                        {engine.player.abilities.map((a, i) => {
                            const now = Date.now();
                            const timeSinceUsed = now - a.lastUsed;
                            const cooldownPercent = Math.min(1, timeSinceUsed / a.cooldown);
                            const isReady = cooldownPercent >= 1;

                            return (
                                <div key={i} className="flex flex-col relative group bg-black/40 p-2 rounded-xl border border-zinc-800">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex flex-col">
                                            {(() => {
                                                const up = [...ALL_UPGRADES, ...EVOLVED_ABILITIES].find(u => u.abilityType === a.type);
                                                const displayName = up ? t('up_name_' + up.id, {}, up.name) : translateDynamicName(a.name, lang);
                                                return (
                                                    <span className={`text-xs font-black uppercase tracking-tight ${isReady ? 'text-amber-300' : 'text-zinc-400'}`}>
                                                        {displayName}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-[10px] text-zinc-500 font-mono font-bold">
                                                {a.level >= getAbilityMaxLevel(a.type) ? `LVL ${a.level} (MAX)` : `LVL ${a.level || 1}`}
                                            </span>
                                        </div>
                                        <div className={`w-7 h-7 flex items-center justify-center border ${isReady ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 bg-zinc-800 text-zinc-500'} transition-all duration-300 rounded-lg shadow-sm font-mono text-xs font-black`}>
                                            {displayKey(a.key)}
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 w-full overflow-hidden rounded-full">
                                        <motion.div 
                                            initial={false}
                                            animate={{ width: `${cooldownPercent * 100}%` }}
                                            className={`h-full transition-all ${isReady ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-zinc-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Control Tab Section */}
                <div className="bg-zinc-950/70 p-4 border border-zinc-800/80 rounded-2xl backdrop-blur-md flex flex-col justify-between overflow-hidden h-[230px] shadow-lg">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
                        <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
                            <Activity size={14} />
                            {t('control_tab', {}, 'SKILLS')}
                        </h3>
                        {isSkillsUnlocked && (
                            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {t('active', {}, 'ACTIVE')}
                            </span>
                        )}
                    </div>

                    {!isSkillsUnlocked ? (
                        <div className="flex-1 flex flex-col items-center justify-between p-3 text-center bg-black/40 border border-zinc-800 rounded-xl">
                            <div className="flex flex-col items-center my-auto">
                                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider block mb-1 font-mono">{t('no_skills_equipped', {}, 'Tactical Skills')}</span>
                                <p className="text-[10px] text-zinc-400 leading-tight max-w-[210px] font-sans">
                                    {t('skills_available_desc', {}, 'Unlock tactical mouse abilities anytime.')}
                                </p>
                            </div>
                            <button
                                onClick={handleBuySkillsFromHUD}
                                className={`w-full py-2 rounded-lg font-mono text-xs uppercase font-black tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                                    currency >= 2500 || isSandbox
                                        ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300'
                                }`}
                            >
                                <span>{isSandbox ? 'BUY (FREE)' : 'BUY (2,500 Cr)'}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase font-bold">
                                    {t('equipped_tacticals')}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Left Click Slot Details */}
                                    <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-xl flex flex-col justify-between h-[82px] relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-wider">{t('left_click')}</span>
                                            {engine.player.stats.leftClickSlot && (engine.player.stats.controlCooldowns?.[engine.player.stats.leftClickSlot] || 0) > 0 && (
                                                <span className="text-[9px] text-rose-400 font-mono font-black animate-pulse bg-rose-500/20 px-1 py-0.5 rounded border border-rose-500/30">{t('cd')}</span>
                                            )}
                                        </div>
                                        {engine.player.stats.leftClickSlot ? (
                                            (() => {
                                                const id = engine.player.stats.leftClickSlot;
                                                const matches: Record<string, string> = {
                                                    redirection_pull: t('control_redirection_pull', {}, 'Pull'),
                                                    gravity_tether: t('control_gravity_tether', {}, 'Tether'),
                                                    gravity_warp: t('control_gravity_warp', {}, 'Teleport'),
                                                    shockwave_blast: t('control_shockwave_blast', {}, 'Shockwave'),
                                                    gravity_well: t('control_gravity_well', {}, 'Gravity Well'),
                                                    temporal_freeze: t('control_temporal_freeze', {}, 'Stasis Freeze'),
                                                    emp_pulse: t('control_emp_pulse', {}, 'EMP Pulse')
                                                };
                                                const level = engine.player.stats.ownedControls?.find(c => c.id === id)?.level || 1;
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-white font-mono truncate uppercase">
                                                            {matches[id] || id}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase">LVL {level}</span>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-xs text-zinc-600 italic font-mono uppercase">{t('empty_slot')}</span>
                                        )}
                                    </div>

                                    {/* Right Click Slot Details */}
                                    <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-xl flex flex-col justify-between h-[82px] relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-cyan-400 font-mono uppercase tracking-wider">{t('right_click')}</span>
                                            {engine.player.stats.rightClickSlot && (engine.player.stats.controlCooldowns?.[engine.player.stats.rightClickSlot] || 0) > 0 && (
                                                <span className="text-[9px] text-rose-400 font-mono font-black animate-pulse bg-rose-500/20 px-1 py-0.5 rounded border border-rose-500/30">{t('cd')}</span>
                                            )}
                                        </div>
                                        {engine.player.stats.rightClickSlot ? (
                                            (() => {
                                                const id = engine.player.stats.rightClickSlot;
                                                const matches: Record<string, string> = {
                                                    redirection_pull: t('control_redirection_pull', {}, 'Pull'),
                                                    gravity_tether: t('control_gravity_tether', {}, 'Tether'),
                                                    gravity_warp: t('control_gravity_warp', {}, 'Teleport'),
                                                    shockwave_blast: t('control_shockwave_blast', {}, 'Shockwave'),
                                                    gravity_well: t('control_gravity_well', {}, 'Gravity Well'),
                                                    temporal_freeze: t('control_temporal_freeze', {}, 'Stasis Freeze'),
                                                    emp_pulse: t('control_emp_pulse', {}, 'EMP Pulse')
                                                };
                                                const level = engine.player.stats.ownedControls?.find(c => c.id === id)?.level || 1;
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-white font-mono truncate uppercase">
                                                            {matches[id] || id}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase">LVL {level}</span>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-xs text-zinc-600 italic font-mono uppercase">{t('empty_slot')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onOpenControlShop}
                                className="w-full py-1.5 mt-1 bg-zinc-800 border border-zinc-700 hover:border-cyan-400 hover:text-cyan-300 text-zinc-200 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer"
                            >
                                {t('open_control_shop_p', {}, 'Open Skills Shop (P)')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Column 2: Current Loadout & Stat breakdown */}
                <div className="flex flex-col gap-2.5 h-full">
                    <div className="bg-zinc-950/70 p-2.5 px-3 border border-zinc-800/80 rounded-2xl backdrop-blur-md shadow-lg shrink-0">
                        <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-zinc-800">
                            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider font-mono flex items-center gap-1.5">
                                <Shield size={13} />
                                {t('current_loadout', {}, 'LOADOUT')}
                            </h3>
                            <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {engine.player.weapons.length} {t('systems', {}, 'SYS')}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {engine.player.weapons.length === 0 && <p className="text-zinc-500 text-[10px] italic font-mono">{t('no_systems_active')}</p>}
                            {engine.player.weapons.map((w, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                                    <span className="font-mono text-[10px] uppercase text-zinc-200 font-bold truncate max-w-[120px]">
                                        {t('wp_' + w.type, {}, w.type.replace(/_/g, ' '))}
                                    </span>
                                    <span className="text-cyan-400 text-[10px] font-black font-mono">Lv.{w.level}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-950/70 p-2.5 px-3 border border-zinc-800/80 rounded-2xl backdrop-blur-md shadow-lg flex flex-col max-h-[360px] overflow-hidden">
                        <div className="flex justify-between items-center mb-1 pb-1 border-b border-zinc-800 shrink-0">
                            <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider font-mono flex items-center gap-1.5">
                                <BarChart2 size={13} />
                                {t('stat_breakdown', {}, 'STATS')}
                            </h3>
                            <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {t('active', {}, 'ACTIVE')}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pt-0.5 overflow-y-auto pr-1 custom-scrollbar max-h-[290px]">
                            {statsList
                                .filter(s => s.val > 0.0001)
                                .map(stat => (
                                    <StatBar
                                        key={stat.key}
                                        label={stat.label}
                                        value={stat.value}
                                        progress={stat.progress}
                                        textClass={stat.textClass}
                                        progressClass={stat.progressClass}
                                        isHighlighted={Boolean(highlights[stat.key])}
                                    />
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
    );
}

function StatBar({ 
    label, 
    value, 
    progress, 
    textClass = "text-cyan-300", 
    progressClass = "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    isHighlighted = false
}: { 
    key?: string; 
    label: string; 
    value: string; 
    progress: number; 
    textClass?: string; 
    progressClass?: string;
    isHighlighted?: boolean;
}) {
    return (
        <div className={`flex flex-col gap-0.5 p-0.5 rounded-lg transition-all duration-300 ${
            isHighlighted 
                ? 'bg-amber-400/20 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] ring-1 ring-amber-400/50' 
                : 'border border-transparent'
        }`}>
            <div className="flex justify-between items-center text-[10px] uppercase font-mono leading-none">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-zinc-300 font-bold whitespace-nowrap truncate">{label}</span>
                    {isHighlighted && (
                        <span className="text-[8px] font-black text-amber-300 bg-amber-400/30 px-1 py-0.2 rounded border border-amber-400/60 animate-pulse font-mono">
                            +▲
                        </span>
                    )}
                </div>
                <span className={`${textClass} font-black text-right ml-1 transition-all duration-300 ${
                    isHighlighted ? 'scale-110 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : ''
                }`}>
                    {value}
                </span>
            </div>
            <div className={`h-1.5 bg-zinc-900 w-full rounded-full overflow-hidden border ${isHighlighted ? 'border-amber-400/80' : 'border-zinc-800/80'} p-0.5 flex items-center`}>
                <motion.div 
                    initial={false}
                    animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className={`h-full rounded-full ${progressClass} ${isHighlighted ? 'brightness-125 shadow-[0_0_10px_#fff]' : ''}`}
                />
            </div>
        </div>
    );
}
