import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Check, Lock, X } from 'lucide-react';
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getEquippedSkin,
  setEquippedSkin
} from '../../game/achievements';
import { SKINS, SkinDef } from '../../game/skins';
import { drawSkinPattern } from '../GameCanvas';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';

interface AchievementsAndStyleProps {
  onClose: () => void;
  onEquipChange?: () => void;
}

// Canvas preview of one skin: 3D-shaded ball with its unique pattern overlay
function SkinPreview({ skin, size, dimmed }: { skin: SkinDef; size: number; dimmed?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.34;
      ctx.save();
      if (dimmed) ctx.globalAlpha = 0.35;
      // Shaded ball (same 3-light ramp as the game canvas)
      ctx.fillStyle = skin.color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = skin.stroke || '#22d3ee';
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      // Pattern overlay
      drawSkinPattern(ctx, skin, cx, cy, r);
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [skin, size, dimmed]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

export default function AchievementsAndStyle({ onClose, onEquipChange }: AchievementsAndStyleProps) {
  const { t } = useLanguage();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [equippedSkin, setSkin] = useState<string>('classic');

  useEffect(() => {
    setUnlockedIds(getUnlockedAchievements());
    setSkin(getEquippedSkin());
  }, []);

  const handleEquipSkin = (skinId: string) => {
    gameAudio.playUpgradePickSound();
    setEquippedSkin(skinId);
    setSkin(skinId);
    if (onEquipChange) onEquipChange();
  };

  const isSkinUnlocked = (skinId: string) => {
    if (skinId === 'classic') return true;
    const ach = ACHIEVEMENTS.find(a => a.reward.type === 'skin' && a.reward.id === skinId);
    return ach ? unlockedIds.includes(ach.id) : false;
  };

  const getUnlockAchievement = (id: string) =>
    ACHIEVEMENTS.find(a => a.reward.type === 'skin' && a.reward.id === id);

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
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

            {/* The Ball Preview (live pattern render, same as in-game) */}
            <div className="relative z-10 flex items-center justify-center" style={{ width: 112, height: 96 }}>
              <SkinPreview skin={SKINS.find(s => s.id === equippedSkin) || SKINS[0]} size={96} />
            </div>

            <div className="relative z-10 text-center mt-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-550 block">{t('current_core_signature', {}, 'Current Core Signature')}</span>
              <h3 className="text-base font-black text-white uppercase tracking-wider py-0.5">
                {t(equippedSkin + '_skin_name', {}, SKINS.find(s => s.id === equippedSkin)?.name)}
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
              {SKINS.map((skin) => {
                const unlocked = isSkinUnlocked(skin.id);
                const isEquipped = equippedSkin === skin.id;
                const unlockAch = getUnlockAchievement(skin.id);

                return (
                  <button
                    key={skin.id}
                    disabled={!unlocked}
                    onClick={() => handleEquipSkin(skin.id)}
                    className={`group rounded-xl p-3 border text-left flex flex-col justify-between transition-all relative overflow-hidden min-h-[150px] ${
                      isEquipped
                        ? 'bg-zinc-900 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                        : unlocked
                          ? 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700 cursor-pointer'
                          : 'bg-zinc-950/20 border-zinc-900/60 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {/* Live pattern preview */}
                    <div className="flex justify-between items-start">
                      <SkinPreview skin={skin} size={44} dimmed={!unlocked} />
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
                      <span className="text-[8.5px] text-zinc-500 leading-relaxed block mt-0.5">
                        {unlocked
                          ? t(skin.id + '_skin_desc', {}, skin.desc)
                          : unlockAch ? (
                            <>
                              <span className="text-zinc-300 font-bold block truncate">{t(unlockAch.id + '_ach_title', {}, unlockAch.title)}</span>
                              <span className="text-zinc-600 block mt-0.5 line-clamp-2">{t(unlockAch.id + '_ach_desc', {}, unlockAch.description)}</span>
                            </>
                          ) : ''}
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
