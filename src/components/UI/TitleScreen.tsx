import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, PlayCircle, FlaskConical, Trophy, Flame, ChevronLeft, Volume2, VolumeX, Settings, Palette, Globe } from 'lucide-react';
import { gameAudio } from '../../game/audio';
import AchievementsAndStyle from './AchievementsAndStyle';
import TitleBackgroundBattle from './TitleBackgroundBattle';
import { useLanguage, LANGUAGES } from '../../game/localization';

interface TitleScreenProps {
  onStart: (mode: 'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX', startLevel?: number) => void;
  highestRoom: number;
  onShowSettings: () => void;
}

export default function TitleScreen({ onStart, highestRoom, onShowSettings }: TitleScreenProps) {
  const { lang, setLang, t } = useLanguage();
  const [showLanguageList, setShowLanguageList] = useState<boolean>(false);
  const [showModes, setShowModes] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SURVIVAL' | 'HARDCORE' | 'SANDBOX'>('SURVIVAL');
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted());
  const [retroTheme, setRetroTheme] = useState(() => localStorage.getItem('game_retro_theme') !== 'false');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setRetroTheme(localStorage.getItem('game_retro_theme') !== 'false');
    };
    window.addEventListener('game_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('game_settings_updated', handleSettingsUpdate);
  }, []);

  // Loop menu music when title screen is active
  useEffect(() => {
    gameAudio.playMusic('menu');
    return () => {
      if (gameAudio.getActiveMusicType() === 'menu') {
        gameAudio.stopMusic();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[#020205] flex flex-col items-center justify-between p-6 sm:p-8 z-[100] overflow-y-auto pointer-events-auto select-none">
      {/* Dynamic Simulation Background */}
      <TitleBackgroundBattle />

      {/* Floating Language Corner Selector */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col items-start font-mono text-[10px]">
        <button
          onClick={() => {
            gameAudio.playButtonClickSound();
            setShowLanguageList(!showLanguageList);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/80 border rounded-md hover:border-cyan-500 hover:text-white transition-all text-zinc-400 cursor-pointer ${retroTheme ? 'border-cyan-900/40 text-cyan-400' : 'border-zinc-850'}`}
          id="lang-selector-toggle"
        >
          <Globe size={13} className="text-cyan-400 animate-spin-slow" />
          <span className="text-xs font-bold">{LANGUAGES.find(l => l.code === lang)?.name || 'English'}</span>
        </button>
        
        <AnimatePresence>
          {showLanguageList && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 w-48 max-h-56 overflow-y-auto bg-zinc-950/95 border border-zinc-850 rounded-md p-2 shadow-[0_0_25px_rgba(0,0,0,0.85)] z-[1001] divide-y divide-zinc-900/60"
            >
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pb-1 mb-1 px-1 flex justify-between items-center-none">
                <span>SELECT LANGUAGE</span>
              </div>
              <div className="pt-1 space-y-0.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      gameAudio.playButtonClickSound();
                      setLang(l.code);
                      setShowLanguageList(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition-all text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      l.code === lang
                        ? 'bg-cyan-500 text-black font-black'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-[8px] opacity-65 uppercase font-mono">{l.code}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Cyber Effect */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-950/20 rounded-full blur-[140px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Main Title Intro Screen */}
      <AnimatePresence mode="wait">
        {!showModes ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className="flex-1 w-full flex flex-col justify-center items-center text-center max-w-lg z-10"
          >
            {/* Logo Unit */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8 relative"
            >
              <div className={`absolute -inset-1 rounded-lg blur-2xl ${retroTheme ? 'bg-cyan-500/10' : 'bg-cyan-500/10'}`} />
              <h1 className="text-7xl font-black text-white italic tracking-tighter leading-none mb-3 uppercase">
                BOUNDLESS <span className={`${retroTheme ? 'text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]'} font-black relative`}>{t('logo_sub')}</span>
              </h1>
            </motion.div>

            {/* Simple Central Play Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: retroTheme ? "0 0 30px rgba(6,182,212,0.4)" : "0 0 30px rgba(6,182,212,0.4)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                gameAudio.resume();
                gameAudio.playButtonClickSound();
                setShowModes(true);
              }}
              className={`w-full max-w-xs py-4.5 font-black uppercase tracking-widest text-sm rounded flex items-center justify-center gap-3 transition-all cursor-pointer border-t border-white/20 ${
                retroTheme 
                  ? 'bg-cyan-50 hover:bg-cyan-400/90 text-black shadow-[0_0_20px_rgba(6,182,212,0.25)]' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              }`}
            >
              <Play size={18} fill="currentColor" />
              {t('enter_simulation')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="modes"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full flex flex-col items-center justify-center max-w-2xl sm:max-w-3xl z-10 gap-5"
          >
            {/* Header and Back Button */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-850">
              <button
                onClick={() => {
                  gameAudio.playButtonClickSound();
                  setShowModes(false);
                }}
                className="flex items-center gap-2 text-zinc-400 hover:text-white font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                {t('back_to_title')}
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    gameAudio.playButtonClickSound();
                    setShowAchievementsModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/60 hover:border-amber-400 text-amber-300 font-black font-mono text-xs sm:text-sm uppercase tracking-widest rounded-md transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 duration-150"
                  id="style-locker-btn"
                >
                  <Palette size={16} className="text-amber-300 animate-pulse stroke-[2.5]" />
                  <span>{t('locker')}</span>
                </button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="w-full bg-zinc-950/80 backdrop-blur-md border border-zinc-850 p-1.5 rounded-lg flex gap-1.5">
              <button
                onClick={() => {
                  gameAudio.playButtonClickSound();
                  setActiveTab('SURVIVAL');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'SURVIVAL'
                    ? 'bg-amber-500 text-black shadow-[0_0_18px_rgba(245,158,11,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Trophy size={16} />
                {t('survival')}
              </button>
              <button
                onClick={() => {
                  gameAudio.playButtonClickSound();
                  setActiveTab('HARDCORE');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'HARDCORE'
                    ? 'bg-red-600 text-white shadow-[0_0_18px_rgba(239,68,68,0.45)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Flame size={16} />
                {t('hardcore', {}, 'Hardcore')}
              </button>
              <button
                onClick={() => {
                  gameAudio.playButtonClickSound();
                  setActiveTab('SANDBOX');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'SANDBOX'
                    ? 'bg-zinc-800 text-purple-300 border border-purple-900/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <FlaskConical size={16} />
                {t('sandbox')}
              </button>
            </div>

            {/* Mode Content Box */}
            <div className="w-full bg-zinc-950/90 backdrop-blur-md border border-zinc-850 p-6 sm:p-7 rounded-xl min-h-[380px] flex flex-col justify-between shadow-2xl">
              <AnimatePresence mode="wait">

                {activeTab === 'SURVIVAL' && (
                  <motion.div
                    key="survival_interactive"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full justify-between flex-1 gap-5 text-left"
                  >
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wider text-base sm:text-lg">
                        {t('survival_header')}
                      </h3>
                      <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                        {t('survival_desc')}
                      </p>

                      {highestRoom > 0 && (
                        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mt-4">
                          {t('best_room_label', {}, 'Best')}: ROOM {highestRoom}
                        </p>
                      )}
                    </div>

                    <div className="mt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          gameAudio.playButtonClickSound();
                          onStart('OVERDRIVE');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
                      >
                        <PlayCircle size={18} fill="currentColor" className="text-black" />
                        {t('deploy_survival')}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'HARDCORE' && (
                  <motion.div
                    key="hardcore"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full justify-between flex-1 gap-5 text-left"
                  >
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wider text-base sm:text-lg">
                        {t('hardcore_header', {}, 'Hardcore Mode')}
                      </h3>
                      <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                        {t('hardcore_desc', {}, 'Endless waves with zero mercy — no checkpoints, no rebuilds, no autosaves.')}
                      </p>

                      {highestRoom > 0 && (
                        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mt-4">
                          {t('best_room_label', {}, 'Best')}: ROOM {highestRoom}
                        </p>
                      )}
                    </div>

                    <div className="mt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          gameAudio.playButtonClickSound();
                          onStart('HARDCORE');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-red-700 to-red-500 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.35)] border border-red-400/40 transition-all"
                      >
                        <Flame size={18} fill="currentColor" className="text-red-200" />
                        {t('deploy_hardcore', {}, 'Deploy Hardcore')}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'SANDBOX' && (
                  <motion.div
                    key="sandbox"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full justify-between flex-1 gap-6 text-left"
                  >
                    <div>
                      <h3 className="text-white font-black uppercase tracking-wider text-base sm:text-lg">
                        {t('sandbox_header')}
                      </h3>
                      <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                        {t('sandbox_desc')}
                      </p>
                    </div>

                    <div className="mt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          gameAudio.playButtonClickSound();
                          onStart('OVERDRIVE_SANDBOX');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
                      >
                        <FlaskConical size={18} />
                        {t('deploy_sandbox')}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievementsModal && (
          <AchievementsAndStyle onClose={() => setShowAchievementsModal(false)} />
        )}
      </AnimatePresence>

      {/* Audio Setup and Music Source Accreditation */}
      <div className="w-full max-w-2xl sm:max-w-3xl z-20 flex flex-col sm:flex-row items-center justify-between mt-auto pt-6 gap-3 text-zinc-500 text-xs font-mono border-t border-zinc-950/40 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              gameAudio.setMute(nextMuted);
              gameAudio.playButtonClickSound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/60 border rounded hover:border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer ${retroTheme ? 'border-cyan-900/40 text-cyan-400' : 'border-zinc-900'}`}
          >
            {isMuted ? <VolumeX size={14} className="text-red-400 animate-pulse" /> : <Volume2 size={14} className={retroTheme ? "text-cyan-400" : "text-cyan-400"} />}
            <span>{isMuted ? t('sound_muted') : t('sound_on')}</span>
          </button>

          <button
            onClick={onShowSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/60 border rounded hover:border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer group ${retroTheme ? 'border-cyan-900/40 text-cyan-400' : 'border-zinc-900'}`}
          >
            <Settings size={14} className={`${retroTheme ? 'text-cyan-400' : 'text-cyan-400'} group-hover:rotate-45 transition-transform`} />
            <span>{t('config_settings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
