import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowRight, X, Sparkles } from 'lucide-react';
import { gameAudio } from '../../game/audio.ts';
import { useLanguage } from '../../game/localization';

interface SandboxCompendiumModalProps {
  isOpen: boolean;
  onOpenCompendium: () => void;
  onClose: () => void;
}

export const SandboxCompendiumModal: React.FC<SandboxCompendiumModalProps> = ({
  isOpen,
  onOpenCompendium,
  onClose
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleOpenCompendium = () => {
    gameAudio.playUpgradePickSound();
    onOpenCompendium();
  };

  const handleDismiss = () => {
    gameAudio.playButtonClickSound();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        key="sandbox-compendium-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
      >
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={handleDismiss} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-md bg-zinc-950 border border-cyan-500/40 rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden"
          id="sandbox_compendium_modal"
        >
          {/* Subtle ambient corner glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <BookOpen size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black font-mono uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  SANDBOX
                </span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide text-white mt-0.5">
                {t('compendium')}
              </h3>
            </div>
          </div>

          {/* Body description */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-300 leading-relaxed m-0">
              {t('sandbox_compendium_prompt', {}, 'Open the Compendium at any time to equip, level up, or mutate any weapon, tactical ability, and combat stat.')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleOpenCompendium}
              className="flex-1 py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-black font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <span>{t('open_compendium_btn', {}, 'OPEN COMPENDIUM')}</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={handleDismiss}
              className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              {t('start_playing_btn', {}, 'DISMISS')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
