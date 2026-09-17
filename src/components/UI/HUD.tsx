import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Settings, HelpCircle, LogOut, ShoppingCart, Shield, Coins, Wrench, Pickaxe, Zap } from 'lucide-react';
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

  // Unlock popup: level-based, matching the shop's boss-milestone gates
  // (SKILLS 20 / DEFENSE 30 / MINING 40). Fires for a few rooms AFTER the feature
  // actually unlocks at its milestone room, so "READY!" is always true when shown.
  const skillsUnlocked = Boolean(engine.player.stats.isControlUnlocked || (engine.player.stats.ownedControls && engine.player.stats.ownedControls.length > 0)) || Boolean(isSandbox);
  const turretsUnlocked = Boolean(engine.player.stats.isTurretsUnlocked) || Boolean(isSandbox);
  const minesUnlocked = Boolean(engine.player.stats.isMinesUnlocked) || Boolean(isSandbox);
  const nextMilestone = !isSandbox && skillsUnlocked && room >= 20 && room < 25 ? 'SKILLS'
    : !isSandbox && turretsUnlocked && room >= 30 && room < 35 ? 'DEFENSE'
    : !isSandbox && minesUnlocked && room >= 40 && room < 45 ? 'MINING'
    : null;
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
            onClick={() => {
              gameAudio.playButtonClickSound();
              setConfirmQuit(true);
              // Pause the simulation while the quit confirmation is open
              window.dispatchEvent(new CustomEvent('game_pause_request', { detail: { paused: true } }));
            }}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    !
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-base tracking-wider font-mono">{t('quit_confirm_title')}</h3>
                    <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">
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
                      onClick={() => {
                        gameAudio.playButtonClickSound();
                        setConfirmQuit(false);
                        // Resume the simulation when the modal closes without quitting
                        window.dispatchEvent(new CustomEvent('game_pause_request', { detail: { paused: false } }));
                      }}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-zinc-700 cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
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
              <span className="text-[10px] font-extrabold uppercase text-amber-900/80 leading-tight mt-0.5 tracking-tight">
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

          {nextMilestone ? (
            <div className="absolute bottom-[calc(100%+6px)] right-1 z-20 flex flex-col items-end gap-1 pointer-events-none">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className={`px-2 py-0.5 rounded-full border-2 border-zinc-950 font-mono text-[9px] font-black uppercase shadow-lg flex items-center gap-1 ${nextMilestone === 'MINING' ? 'bg-emerald-400 text-black shadow-emerald-400/80' : 'bg-amber-400 text-black shadow-amber-400/80'}`}
              >
                {nextMilestone === 'SKILLS' && <Zap size={10} />}
                {nextMilestone === 'DEFENSE' && <Wrench size={10} />}
                {nextMilestone === 'MINING' && <Pickaxe size={10} />}
                <span>{nextMilestone} READY!</span>
              </motion.div>
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

        {/* Rebuilds Readout: plain label + indicator, matching the hull/hostiles style (no button chrome) */}
        {gameMode === 'OVERDRIVE' && typeof rebuildsLeft === 'number' && rebuildsLeft > 0 && (
          <div className="flex flex-col items-end">
            <p className="text-xs uppercase text-zinc-400 font-bold font-mono tracking-wider mb-1">{t('rebuilds_short', {}, 'Rebuilds')}</p>
            <div className="flex items-center gap-1.5 h-8">
              {[0, 1, 2].map(i => {
                const lit = i < rebuildsLeft;
                return (
                  <Wrench
                    key={i}
                    size={22}
                    strokeWidth={2.5}
                    className={lit ? 'text-emerald-400 transition-all duration-300' : 'text-zinc-700 transition-all duration-300'}
                  />
                );
              })}
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

export function SidebarStats({ engine, room = 1 }: { engine: GameEngine; room?: number }) {
    const { t, lang } = useLanguage();
    const abilityCount = engine.player.abilities.length;

    const displayKey = (key?: string) => {
        if (!key) return '?';
        if (key === 'Space') return 'SPC';
        return key.replace('Key', '');
    };

    return (
        <div id="sidebar-stats" className="w-[205px] flex flex-col gap-3.5 h-full select-none">
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
                        const isMaxed = a.level >= getAbilityMaxLevel(a.type);

                        return (
                            <div key={i} className={`flex flex-col relative group bg-black/40 p-2 rounded-xl border transition-all ${isMaxed ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]' : 'border-zinc-800'}`}>
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
                                        <span className={`text-[10px] font-mono font-bold ${isMaxed ? 'text-amber-400' : 'text-zinc-500'}`}>
                                            {isMaxed ? `LVL ${a.level} MAX` : `LVL ${a.level || 1}`}
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

            {/* Current Loadout */}
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
                            <span className="font-mono text-[10px] uppercase text-zinc-200 font-bold truncate max-w-[150px]">
                                {t('wp_' + w.type, {}, w.type.replace(/_/g, ' '))}
                            </span>
                            <span className="text-cyan-400 text-[10px] font-black font-mono">Lv.{w.level}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
