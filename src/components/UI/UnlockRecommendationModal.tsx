import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Pickaxe, 
  Coins, 
  X, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Award,
  Zap
} from 'lucide-react';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';

export type UnlockType = 'DEFENSE' | 'MINING' | 'SKILLS';

interface UnlockRecommendationModalProps {
  isOpen: boolean;
  type: UnlockType | null;
  isSandbox?: boolean;
  onOpenShopTab: (tab: UnlockType) => void;
  onClose: () => void;
}

export const UnlockRecommendationModal: React.FC<UnlockRecommendationModalProps> = ({
  isOpen,
  type,
  isSandbox,
  onOpenShopTab,
  onClose
}) => {
  const { t } = useLanguage();

  if (!isOpen || !type) return null;

  const isDefense = type === 'DEFENSE';
  const isSkills = type === 'SKILLS';
  const isMining = type === 'MINING';

  const unlockLevel = isDefense ? 30 : isSkills ? 20 : 40;

  const handleAction = () => {
    gameAudio.playUpgradePickSound();
    onOpenShopTab(type);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        key={`unlock-modal-backdrop-${type}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
      >
        {/* Click background to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className={`relative w-full max-w-lg space-ui-bg border-2 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden ${
            isDefense 
              ? 'border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.35)]' 
              : isSkills
              ? 'border-cyan-400/80 shadow-[0_0_60px_rgba(34,211,238,0.35)]'
              : 'border-emerald-400/80 shadow-[0_0_60px_rgba(52,211,153,0.35)]'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          {/* Top Milestone Badge */}
          <div className="flex items-center gap-2 self-start">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono uppercase tracking-wider border shadow-md ${
              isDefense
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                : isSkills
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
            }`}>
              <Award size={14} />
              <span>LEVEL {unlockLevel} REACHED</span>
            </span>
          </div>

          {/* Main Visual Header */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-lg ${
              isDefense 
                ? 'bg-amber-500/15 border-amber-400 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                : isSkills
                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]'
                : 'bg-emerald-500/15 border-emerald-400 text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
            }`}>
              {isDefense ? <Wrench size={32} /> : isSkills ? <Zap size={32} /> : <Pickaxe size={32} />}
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-wide text-white leading-tight">
                {isDefense ? 'DEFENSE UNLOCKED' : isSkills ? 'SKILLS UNLOCKED' : 'MINING UNLOCKED'}
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                {isDefense 
                  ? 'Automated battlefield sentries are now available in the shop.' 
                  : isSkills
                  ? 'Active mouse-bound tactical skills are now available in the shop.'
                  : 'Passive mining drills are now available in the shop.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAction}
              className={`flex-1 py-3.5 px-5 rounded-2xl font-black font-mono text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isDefense
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                  : isSkills
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_25px_rgba(34,211,238,0.5)]'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_25px_rgba(52,211,153,0.5)]'
              }`}
            >
              <span>{isSkills ? 'OPEN TACTICAL SKILLS' : 'OPEN SHOP'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={onClose}
              className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              LATER
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
