import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, PlayCircle, FlaskConical, Trophy, Flame, ChevronLeft, Settings, Palette, Globe, TriangleAlert } from 'lucide-react';
import { gameAudio } from '../../game/audio';
import AchievementsAndStyle from './AchievementsAndStyle';
import TitleBackgroundBattle from './TitleBackgroundBattle';
import BadgeStrip from './BadgeStrip';
import { useLanguage, LANGUAGES } from '../../game/localization';

interface TitleScreenProps {
  onStart: (mode: 'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX', startLevel?: number) => void;
  highestRoom: number;
  onShowSettings: () => void;
  resumeRoom?: number | null;
  onResume?: () => void;
}

export default function TitleScreen({ onStart, highestRoom, onShowSettings, resumeRoom, onResume }: TitleScreenProps) {
  const { lang, setLang, t } = useLanguage();
  const [showLanguageList, setShowLanguageList] = useState<boolean>(false);
  const [showModes, setShowModes] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SURVIVAL' | 'HARDCORE' | 'SANDBOX'>('SURVIVAL');
  const [showDeployConfirm, setShowDeployConfirm] = useState<boolean>(false);

  // TENTATIVE cursor aura: moves the spotlight gradient on the frame dim
  // and the colour-reveal mask (both declared below). The CSS vars are set
  // on the root container so both overlays inherit them; rAF-throttled
  // writes, no React re-renders.
  const frameDimRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let cx = 0;
    let cy = 0;
    let pending = false;
    const apply = () => {
      pending = false;
      const el = frameDimRef.current;
      if (!el) return;
      // Convert viewport coords to container-local coords here (once per
      // frame max) so container scrolling never desyncs the aura.
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--cursor-x', `${cx - rect.left}px`);
      el.style.setProperty('--cursor-y', `${cy - rect.top}px`);
    };
    const onMove = (e: MouseEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(apply);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (pending) cancelAnimationFrame(raf);
    };
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
    <div ref={frameDimRef} className="absolute inset-0 bg-[#020205] flex flex-col items-center justify-between p-6 sm:p-8 z-[100] overflow-y-auto pointer-events-auto select-none">
      {/* Dynamic Simulation Background */}
      <TitleBackgroundBattle />

      {/* TENTATIVE uniform frame dim + cursor aura: the whole game frame is
          evenly darkened (background sim included), except inside a circular
          radius that follows the cursor — there the dim lifts (undim/unblack)
          and a soft white glow whitens the background. Revert by restoring
          the plain `bg-black/45` div (or the old radial halo behind the title). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(circle 210px at var(--cursor-x, 50%) var(--cursor-y, 42%), rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 26%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 78%)',
        }}
      />

      {/* TENTATIVE colour-reveal: a zero-saturation layer desaturates the
          whole frame EXCEPT a circular hole that follows the cursor, so the
          background sim renders in colour only inside the radius of light.
          The sim canvas beneath now paints native colours. Revert by deleting
          this div and restoring grayscale strokes in TitleBackgroundBattle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          backgroundColor: 'hsl(0, 0%, 50%)',
          mixBlendMode: 'saturation',
          WebkitMaskImage:
            'radial-gradient(circle 120px at var(--cursor-x, 50%) var(--cursor-y, 42%), transparent 0%, transparent 88%, black 100%)',
          maskImage:
            'radial-gradient(circle 120px at var(--cursor-x, 50%) var(--cursor-y, 42%), transparent 0%, transparent 88%, black 100%)',
        }}
      />

      {/* Floating Language Corner Selector */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col items-start font-mono text-[10px]">
        <button
          onClick={() => {
            gameAudio.playButtonClickSound();
            setShowLanguageList(!showLanguageList);
          }}
          className="flex items-center transition-all hover:opacity-70 cursor-pointer"
          id="lang-selector-toggle"
          aria-label="Select language"
        >
          <Globe size={20} strokeWidth={2.5} className="text-white animate-spin-slow" />
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
            className="relative flex-1 w-full flex flex-col justify-center items-center text-center max-w-lg z-10"
          >            {/* TENTATIVE uniform frame dim: the readability halo behind the
                title was replaced by an even darkening layer across the whole
                game frame. Revert by restoring the radial-gradient div and
                removing this one. */}

            {/* Logo Unit */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8 relative"
            >

              {/* EXPERIMENT (tentative rename to Nexus 12): demo title text in a
                  sci-fi display font (Space Mono). Revert by restoring the
                  "BOUNDLESS + t('logo_sub')" heading and removing the
                  --font-nexus theme entry in index.css. */}
              <h1 style={{ textShadow: 'none', transition: 'text-shadow 0.4s' }} onMouseEnter={e => e.currentTarget.style.textShadow = '0 0 10px rgba(251,191,36,0.65), 0 0 22px rgba(245,158,11,0.5), 0 0 42px rgba(245,158,11,0.32)'} onMouseLeave={e => e.currentTarget.style.textShadow = 'none'} className="font-nexus not-italic text-7xl font-bold text-amber-400 tracking-widest leading-none mb-3 uppercase cursor-default">
                NEXUS-12
              </h1>
            </motion.div>

            {/* Simple Central Play Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251,191,36,0.35)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                gameAudio.resume();
                gameAudio.playButtonClickSound();
                setShowModes(true);
              }}
              className="w-full max-w-[13rem] py-3 font-nexus font-bold uppercase tracking-[0.08em] text-xs rounded border border-white/60 bg-white/10 text-white shadow-none hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Play size={18} fill="currentColor" />
              {t('enter_simulation')}
            </motion.button>

            {/* Coolmath school-safe build: plain, NON-CLICKABLE text credit
                (their editorial guidelines allow text-only credits only).
                TODO: replace the placeholder studio name before upload. */}
            {typeof __CM_BUILD__ !== 'undefined' && __CM_BUILD__ && (
              <p className="mt-6 text-[10px] font-nexus tracking-[0.2em] uppercase text-zinc-500 select-none pointer-events-none">
                A NEXUS INTERACTIVE STUDIO PRODUCTION
              </p>
            )}
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
                className="flex items-center gap-2 text-zinc-400 hover:text-white font-nexus text-xs font-bold tracking-[0.08em] transition-colors cursor-pointer"
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
                  className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/60 hover:border-amber-400 text-amber-300 font-black font-nexus text-xs sm:text-sm tracking-[0.05em] rounded-md transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 duration-150"
                  id="style-locker-btn"
                >
                  <Palette size={16} className="text-amber-300 stroke-[2.5]" />
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
                className={`flex-1 py-3 text-xs sm:text-sm font-black font-nexus tracking-[0.05em] transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
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
                className={`flex-1 py-3 text-xs sm:text-sm font-black font-nexus tracking-[0.05em] transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
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
                className={`flex-1 py-3 text-xs sm:text-sm font-black font-nexus tracking-[0.05em] transition-all rounded-md flex items-center justify-center gap-2 cursor-pointer ${
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
                      <h3 className="text-white font-black font-nexus not-italic normal-case tracking-[0.05em] text-lg sm:text-xl">
                        {t('survival_header')}
                      </h3>
                      <p className="text-zinc-200 text-sm sm:text-base mt-2.5 leading-relaxed font-medium">
                        {t('survival_desc')}
                      </p>

                      {highestRoom > 0 && (
                        <p className="text-xs sm:text-sm text-zinc-400 tracking-[0.1em] font-bold font-nexus mt-4">
                          {t('highest_room_label', {}, 'Highest Room')}: {highestRoom}
                        </p>
                      )}
                      <BadgeStrip mode="SURVIVAL" />
                    </div>

                    <div className="mt-2 flex flex-col gap-2.5">
                      {resumeRoom && resumeRoom > 0 && onResume && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            gameAudio.playButtonClickSound();
                            onResume();
                          }}
                          className="w-full py-3 bg-emerald-600/25 border border-emerald-500/60 text-emerald-300 font-black font-nexus tracking-[0.05em] text-xs flex items-center justify-center gap-2.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                          id="resume-run-btn"
                        >
                          <PlayCircle size={16} />
                          {t('resume_run', { room: resumeRoom }, 'Resume Run: Room')} {resumeRoom}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          gameAudio.playButtonClickSound();
                          if (resumeRoom && resumeRoom > 0) {
                            setShowDeployConfirm(true);
                          } else {
                            onStart('OVERDRIVE');
                          }
                        }}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black font-nexus tracking-[0.05em] text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
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
                      <h3 className="text-white font-black font-nexus not-italic normal-case tracking-[0.05em] text-lg sm:text-xl">
                        {t('hardcore_header', {}, 'Hardcore Mode')}
                      </h3>
                      <p className="text-zinc-200 text-sm sm:text-base mt-2.5 leading-relaxed font-medium">
                        {t('hardcore_desc', {}, 'Endless waves with zero mercy: no checkpoints, no rebuilds, no autosaves.')}
                      </p>                      {highestRoom > 0 && (
                        <p className="text-xs sm:text-sm text-zinc-400 tracking-[0.1em] font-bold font-nexus mt-4">
                          {t('highest_room_label', {}, 'Highest Room')}: {highestRoom}
                        </p>
                      )}
                      <BadgeStrip mode="HARDCORE" />
                    </div>


                    <div className="mt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          gameAudio.playButtonClickSound();
                          onStart('HARDCORE');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-red-700 to-red-500 text-white font-black font-nexus tracking-[0.05em] text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.35)] border border-red-400/40 transition-all"
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
                      <h3 className="text-white font-black font-nexus not-italic normal-case tracking-[0.05em] text-lg sm:text-xl">
                        {t('sandbox_header')}
                      </h3>
                      <p className="text-zinc-200 text-sm sm:text-base mt-2.5 leading-relaxed font-medium">
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
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-black font-nexus tracking-[0.05em] text-sm flex items-center justify-center gap-3 rounded-lg hover:brightness-110 cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
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

      <AnimatePresence>
        {showDeployConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-sm space-ui-bg border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden pointer-events-auto"
            >
              <div className="relative z-10 p-6 flex flex-col gap-4 text-center">
                <div className="mx-auto p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <TriangleAlert size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase text-lg tracking-tight">{t('deploy_confirm_title', {}, 'New Run?')}</h3>
                  <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                    {t('deploy_confirm_desc', {}, 'Deploying a new run will delete your saved run. You will not be able to resume it.')}
                  </p>
                </div>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => { gameAudio.playButtonClickSound(); setShowDeployConfirm(false); }}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all border-2 border-zinc-700 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => { gameAudio.playButtonClickSound(); setShowDeployConfirm(false); onStart('OVERDRIVE'); }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                  >
                    {t('deploy_confirm_btn', {}, 'DEPLOY')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right: Settings */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 font-mono text-[10px]">
        <button
          onClick={onShowSettings}
          className="flex items-center transition-all hover:opacity-70 cursor-pointer group"
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={2.5} className="text-white group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </div>
  );
}
