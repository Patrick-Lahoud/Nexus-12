import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Check, Lock, X } from 'lucide-react';
import { 
  ACHIEVEMENTS, 
  getUnlockedAchievements, 
  getEquippedSkin, 
  setEquippedSkin, 
  getEquippedAura, 
  setEquippedAura 
} from '../../game/achievements';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';

interface AchievementsAndStyleProps {
  onClose: () => void;
  onEquipChange?: () => void;
}

export default function AchievementsAndStyle({ onClose, onEquipChange }: AchievementsAndStyleProps) {
  const { t } = useLanguage();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [equippedSkin, setSkin] = useState<string>('classic');
  const [equippedAura, setAura] = useState<string>('none');

  useEffect(() => {
    setUnlockedIds(getUnlockedAchievements());
    setSkin(getEquippedSkin());
    setAura(getEquippedAura());
  }, []);

  const handleEquipSkin = (skinId: string) => {
    gameAudio.playUpgradePickSound();
    setEquippedSkin(skinId);
    setSkin(skinId);
    if (onEquipChange) onEquipChange();
  };

  const handleEquipAura = (auraId: string) => {
    gameAudio.playUpgradePickSound();
    setEquippedAura(auraId);
    setAura(auraId);
    if (onEquipChange) onEquipChange();
  };

  const isSkinUnlocked = (skinId: string) => {
    if (skinId === 'classic') return true;
    const ach = ACHIEVEMENTS.find(a => a.reward.type === 'skin' && a.reward.id === skinId);
    return ach ? unlockedIds.includes(ach.id) : false;
  };

  const isAuraUnlocked = (auraId: string) => {
    if (auraId === 'none') return true;
    const ach = ACHIEVEMENTS.find(a => a.reward.type === 'aura' && a.reward.id === auraId);
    return ach ? unlockedIds.includes(ach.id) : false;
  };

  const getUnlockAchievement = (rewardType: 'skin' | 'aura', id: string) =>
    ACHIEVEMENTS.find(a => a.reward.type === rewardType && a.reward.id === id);

  // List of skins including descriptions and custom style details for preview
  const SKINS_DECOR = [
    { id: 'classic', name: 'Classic Cyan', desc: 'The trusty standard neon cyan core.', color: '#06b6d4', glow: '#06b6d4' },
    { id: 'vibrant_cyan', name: 'Vibrant Cyan', desc: 'Slightly brighter with hyper-saturated core.', color: '#22d3ee', glow: '#0891b2' },
    { id: 'gilded_gold', name: 'Gilded Gold', desc: 'A striking polished golden shell that commands respect.', color: '#facc15', glow: '#ca8a04' },
    { id: 'neon_magenta', name: 'Neon Magenta', desc: 'Vibrant ultraviolet pink charging with thermal energy.', color: '#f43f5e', glow: '#db2777' },
    { id: 'void_eclipse', name: 'Void Eclipse', desc: 'A stellar onyx core framed with neon violet halos.', color: '#1e1b4b', glow: '#a855f7' },
    { id: 'omega_god', name: 'Omega God', desc: 'Brilliant metallic crimson with unstable thermal reactions.', color: '#dc2626', glow: '#ef4444' },
    { id: 'emerald_green', name: 'Emerald Green', desc: 'Matrix green terminal plating pulsing with bio-energy.', color: '#10b981', glow: '#059669' },
    { id: 'crimson_death', name: 'Crimson Death', desc: 'Active red cybernetic core tuned for demolition.', color: '#b91c1c', glow: '#7f1d1d' },
    { id: 'matrix_hologram', name: 'Matrix Hologram', desc: 'Pulsing green virtual grid simulating digital realms.', color: '#4ade80', glow: '#15803d' },
    { id: 'snow_white', name: 'Snow White', desc: 'Ultra-pure white minimalist shell of supreme discipline.', color: '#ffffff', glow: '#f8fafc' },
    { id: 'rich_platinum', name: 'Rich Platinum', desc: 'Heavy solid physical silver core with shimmering accents.', color: '#cbd5e1', glow: '#94a3b8' },
    { id: 'deep_obsidian', name: 'Deep Obsidian', desc: 'Hard volcanic black stone with glowing neon indigo energy lines.', color: '#0f172a', glow: '#6366f1' },
    { id: 'inferno_orange', name: 'Inferno Orange', desc: 'Intense reactor core orange that glows like molten lava.', color: '#f97316', glow: '#ea580c' },
    { id: 'chrono_glow', name: 'Chrono Glow', desc: 'Specialized chronometer blue skin shifting temporal waves.', color: '#3b82f6', glow: '#1d4ed8' },
  ];

  const AURAS_DECOR = [
    { id: 'none', name: 'No Energy Trail', desc: 'Clean engine profile without active particle trails.', color: '#94a3b8' },
    { id: 'void_particle', name: 'Void Particle Trail', desc: 'Unstable dark matter sparks emanate from your movement.', color: '#a855f7' },
    { id: 'amethyst_aura', name: 'Amethyst Energy Aura', desc: 'Rotating crystalline amethyst shields swirl around you.', color: '#c084fc' },
    { id: 'overcharged_sparks', name: 'Overcharged Sparks', desc: 'Dynamic orange lightning bolts spark from the generator.', color: '#fb923c' },
    { id: 'solar_flare', name: 'Solar Flare Aura', desc: 'Warm corona fields pulse outwards from your core.', color: '#f59e0b' },
    { id: 'vortex_trail', name: 'Vortex Wind Trail', desc: 'Atmospheric swirling dust cyclones path in your wake.', color: '#818cf8' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl space-ui-bg border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col h-[85vh]"
      >
        {/* Header Area */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 text-black rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">{t('locker', {}, 'Locker')}</h2>
          </div>
          <button 
            onClick={() => {
              gameAudio.playButtonClickSound();
              onClose();
            }}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Locker Contents */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 space-y-8">
          {/* Visualizer Area */}
          <div className="bg-gradient-to-b from-zinc-900/40 to-zinc-950/80 border border-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[160px]">
            {/* Grid Lines in background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
            
            {/* The Ball Preview */}
            <div className="relative z-10 w-24 h-24 flex items-center justify-center">
              {/* Aura Preview Ring */}
              {equippedAura !== 'none' && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  className="absolute inset--4 rounded-full border-2 border-dashed flex items-center justify-center"
                  style={{
                    borderColor: AURAS_DECOR.find(a => a.id === equippedAura)?.color || '#22d3ee',
                    filter: 'drop-shadow(0 0 10px currentColor)'
                  }}
                />
              )}
              
              {/* Core Render */}
              <div 
                className="w-16 h-16 rounded-full border-4 flex items-center justify-center relative shadow-lg"
                style={{
                  backgroundColor: SKINS_DECOR.find(s => s.id === equippedSkin)?.color || '#06b6d4',
                  borderColor: '#ffffff',
                  boxShadow: `0 0 30px ${SKINS_DECOR.find(s => s.id === equippedSkin)?.glow || '#06b6d4'}`
                }}
              >
                {/* Sub-elements inside skin preview */}
                {equippedSkin === 'omega_god' && (
                  <div className="absolute inset-2 border-2 border-white/40 rounded-full animate-ping" />
                )}
                {equippedSkin === 'matrix_hologram' && (
                  <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_2px,transparent_2px,transparent_4px)] rounded-full" />
                )}
                {equippedSkin === 'deep_obsidian' && (
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                )}
                <div className="w-4 h-4 bg-white/20 rounded-full" />
              </div>
            </div>

            <div className="relative z-10 text-center mt-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-550 block">{t('current_core_signature', {}, 'Current Core Signature')}</span>
              <h3 className="text-base font-black text-white uppercase tracking-wider py-0.5">
                {t(equippedSkin + '_skin_name', {}, SKINS_DECOR.find(s => s.id === equippedSkin)?.name)}
              </h3>
            </div>
          </div>

          {/* Core Skins Grid */}
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-cyan-500 rounded-sm" />
              {t('select_blade_core_skin', {}, 'Select Blade Core Skin')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SKINS_DECOR.map((skin) => {
                const unlocked = isSkinUnlocked(skin.id);
                const isEquipped = equippedSkin === skin.id;
                const unlockAch = getUnlockAchievement('skin', skin.id);
                
                return (
                  <button
                    key={skin.id}
                    disabled={!unlocked}
                    onClick={() => handleEquipSkin(skin.id)}
                    className={`group rounded-xl p-3 border text-left flex flex-col justify-between transition-all relative overflow-hidden h-[105px] ${
                      isEquipped 
                        ? 'bg-zinc-900 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.1)]' 
                        : unlocked 
                          ? 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700 cursor-pointer' 
                          : 'bg-zinc-950/20 border-zinc-900/60 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {/* Inner preview circle */}
                    <div className="flex justify-between items-start">
                      <div 
                        className="w-5 h-5 rounded-full border border-white/20 shadow-md"
                        style={{ 
                          backgroundColor: skin.color,
                          boxShadow: unlocked ? `0 0 10px ${skin.glow}` : 'none'
                        }}
                      />
                      {isEquipped ? (
                        <Check className="text-cyan-400" size={13} />
                      ) : !unlocked ? (
                        <Lock className="text-zinc-750" size={11} />
                      ) : null}
                    </div>

                    <div className="mt-2 min-w-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider truncate block ${
                        isEquipped ? 'text-cyan-400' : 'text-zinc-300 group-hover:text-white'
                      }`}>
                        {t(skin.id + '_skin_name', {}, skin.name)}
                      </span>
                      <span className="text-[8.5px] text-zinc-500 line-clamp-2 leading-relaxed block mt-0.5">
                        {unlocked 
                          ? t(skin.id + '_skin_desc', {}, skin.desc) 
                          : unlockAch ? t(unlockAch.id + '_ach_title', {}, unlockAch.title) : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Aura/Trail Grid */}
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-sm" />
              {t('select_energy_trail_aura', {}, 'Select Energy Trail Aura')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AURAS_DECOR.map((aura) => {
                const unlocked = isAuraUnlocked(aura.id);
                const isEquipped = equippedAura === aura.id;
                const unlockAch = getUnlockAchievement('aura', aura.id);
                
                return (
                  <button
                    key={aura.id}
                    disabled={!unlocked}
                    onClick={() => handleEquipAura(aura.id)}
                    className={`group rounded-xl p-3 border text-left flex flex-col justify-between transition-all relative overflow-hidden h-[105px] ${
                      isEquipped 
                        ? 'bg-zinc-900 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]' 
                        : unlocked 
                          ? 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700 cursor-pointer' 
                          : 'bg-zinc-950/20 border-zinc-900/60 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full block animate-pulse"
                          style={{ backgroundColor: aura.color }}
                        />
                        <span 
                          className="w-2.5 h-2.5 rounded-full block"
                          style={{ backgroundColor: aura.color, opacity: 0.4 }}
                        />
                      </div>
                      {isEquipped ? (
                        <Check className="text-amber-500" size={13} />
                      ) : !unlocked ? (
                        <Lock className="text-zinc-750" size={11} />
                      ) : null}
                    </div>

                    <div className="mt-2 min-w-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider truncate block ${
                        isEquipped ? 'text-amber-400' : 'text-zinc-300 group-hover:text-white'
                      }`}>
                        {t(aura.id + '_aura_name', {}, aura.name)}
                      </span>
                      <span className="text-[8.5px] text-zinc-500 line-clamp-2 leading-relaxed block mt-0.5">
                        {unlocked 
                          ? t(aura.id + '_aura_desc', {}, aura.desc) 
                          : unlockAch ? t(unlockAch.id + '_ach_title', {}, unlockAch.title) : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}