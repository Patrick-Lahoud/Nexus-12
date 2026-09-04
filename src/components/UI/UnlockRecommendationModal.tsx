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
  room: number;
  currency: number;
  isSandbox?: boolean;
  onOpenShopTab: (tab: UnlockType) => void;
  onClose: () => void;
}

export const UnlockRecommendationModal: React.FC<UnlockRecommendationModalProps> = ({
  isOpen,
  type,
  room,
  currency,
  isSandbox,
  onOpenShopTab,
  onClose
}) => {
  const { t } = useLanguage();

  if (!isOpen || !type) return null;

  const isDefense = type === 'DEFENSE';
  const isSkills = type === 'SKILLS';
  const isMining = type === 'MINING';

  const cost = isDefense ? 10000 : isSkills ? 2500 : 50000;
  const recommendedRound = isDefense ? 20 : isSkills ? 20 : 30;

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
          {/* Ambient Glow background */}
          <div 
            className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20 ${
              isDefense ? 'bg-amber-400' : isSkills ? 'bg-cyan-400' : 'bg-emerald-400'
            }`} 
          />

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
              <Award size={14} className="animate-bounce" />
              <span>FUNDS AVAILABLE</span>
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
              {isDefense ? <Wrench size={32} className="animate-pulse" /> : isSkills ? <Zap size={32} className="animate-pulse" /> : <Pickaxe size={32} className="animate-pulse" />}
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-wide text-white leading-tight">
                {isDefense ? 'DEFENSE GRID READY!' : isSkills ? 'TACTICAL SKILLS READY!' : 'MINING OPERATIONS READY!'}
              </h3>
              <p className="text-xs text-zinc-400 font-sans font-medium">
                {isDefense 
                  ? 'Accumulated required credits to purchase and deploy automated battlefield sentries.' 
                  : isSkills
                  ? 'Accumulated required credits to unlock active mouse-bound tactical combat skills.'
                  : 'Accumulated required credits to purchase and deploy subterranean mining drills.'}
              </p>
            </div>
          </div>

          {/* Feature Highlights Box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800">
              <span className="text-zinc-400 font-bold uppercase">REQUIRED FUNDS:</span>
              <span className={`font-black flex items-center gap-1.5 ${
                isDefense ? 'text-amber-300' : isSkills ? 'text-cyan-300' : 'text-emerald-300'
              }`}>
                <Coins size={14} />
                <span>{isSandbox ? 'FREE' : `${cost.toLocaleString()} Cr`}</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-bold uppercase">YOUR BALANCE:</span>
              <span className="text-white font-black">
                {isSandbox ? 'UNLIMITED' : `${Math.round(currency).toLocaleString()} Cr`}
              </span>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed pt-1">
              {isDefense
                ? 'Construct laser blade spinners, electric shock coils, and heavy kinetic mortars directly on the arena floor to automate defensive firepower.'
                : isSkills
                ? 'Unlock & equip active mouse-bound tactical skills like Kinetic Shockwaves, Teleportation Portals, Gravity Singularity Wells, and Stasis Freeze fields.'
                : 'Deploy underground mining rigs that continuously extract valuable minerals, generating passive Credits every second as you battle.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAction}
              className={`flex-1 py-3.5 px-5 rounded-2xl font-black font-mono text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isDefense
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                  : isSkills
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_25px_rgba(34,211,238,0.5)] animate-pulse'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_25px_rgba(52,211,153,0.5)] animate-pulse'
              }`}
            >
              <span>{isSkills ? 'OPEN TACTICAL SKILLS' : 'OPEN SHOP & UNLOCK NOW'}</span>
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
