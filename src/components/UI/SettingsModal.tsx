import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Volume2, Music, Eye, Activity, Sliders, Contrast, CircleDot } from 'lucide-react';
import { gameAudio } from '../../game/audio.ts';
import { useLanguage } from '../../game/localization';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useLanguage();
  const [sfxVol, setSfxVol] = useState(() => gameAudio.getSfxVolume());
  const [musicVol, setMusicVol] = useState(() => gameAudio.getMusicVolume());
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('game_high_contrast') === 'true');
  const [simpleProjectiles, setSimpleProjectiles] = useState(() => localStorage.getItem('game_simple_projectiles') === 'true');
  const [screenshakeMult, setScreenshakeMult] = useState(() => {
    const val = localStorage.getItem('game_screenshake_mult');
    return val !== null ? parseFloat(val) : 1.0;
  });

  const [soundMuted, setSoundMuted] = useState(() => gameAudio.getMuted());

  const retroTheme = false;

  useEffect(() => {
    gameAudio.resume();
    // Graphics & visual engines are always on: clear any stale opt-out flags.
    ['gfx_dynamic_grid', 'gfx_neon_lighting', 'gfx_debris_fx', 'gfx_cinematic_fx', 'gfx_enemy_detail'].forEach(k => {
      if (localStorage.getItem(k) === 'false') {
        localStorage.setItem(k, 'true');
      }
    });
    window.dispatchEvent(new Event('game_settings_updated'));
  }, []);

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    gameAudio.setSfxVolume(val);
    gameAudio.playHitSound(false);
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    gameAudio.setMusicVolume(val);
  };

  const handleHighContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('game_high_contrast', String(next));
    window.dispatchEvent(new Event('game_settings_updated'));
    gameAudio.playButtonClickSound();
  };

  const handleSimpleProjectilesToggle = () => {
    const next = !simpleProjectiles;
    setSimpleProjectiles(next);
    localStorage.setItem('game_simple_projectiles', String(next));
    window.dispatchEvent(new Event('game_settings_updated'));
    gameAudio.playButtonClickSound();
  };

  const handleScreenshakeChange = (val: number) => {
    setScreenshakeMult(val);
    localStorage.setItem('game_screenshake_mult', String(val));
    window.dispatchEvent(new Event('game_settings_updated'));
    gameAudio.playButtonClickSound();
  };

  const handleSoundMuteToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    gameAudio.setMute(next);
    gameAudio.playButtonClickSound();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto ${
          retroTheme 
            ? 'border-4 border-zinc-950 bg-[#060608] shadow-[0_0_50px_rgba(6,182,212,0.22)] ring-2 ring-cyan-500/80 text-cyan-400 font-retro' 
            : 'space-ui-bg border border-cyan-500/30 shadow-2xl text-white rounded-2xl'
        } p-6 relative custom-scrollbar`}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            gameAudio.playButtonClickSound();
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 transition-all cursor-pointer ${
            retroTheme 
              ? 'text-cyan-400 hover:text-cyan-300' 
              : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full'
          }`}
          aria-label="Close Settings"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-6 pt-1">
          <Sliders className="w-6 h-6 text-cyan-400" />
          <h2 className="not-italic font-mono font-black uppercase tracking-wider text-xl m-0 text-white">
            {t('system_configurations', {}, 'System Configurations')}
          </h2>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 mb-6">

          {/* Audio Console */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-400 flex items-center gap-2">
              <Volume2 size={16} />
              {t('audio_master_console', {}, 'Audio')}
            </h3>

            {/* Sound On/Off */}
            <div className="flex items-center justify-between p-3.5 mb-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex flex-col text-left pr-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 size={14} className="text-cyan-400" />
                  {t('sound', {}, 'Sound')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">{t('sound_toggle_desc', {}, 'Master audio on and off')}</span>
              </div>
              <button
                onClick={handleSoundMuteToggle}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${soundMuted ? 'bg-zinc-800' : 'bg-cyan-500'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${soundMuted ? 'left-1' : 'right-1'}`} />
              </button>
            </div>

            {/* SFX Volume Bar */}
            <div className="p-3.5 mb-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {t('sfx_volume', {}, 'SFX Volume')}
                </span>
                <span className="text-xs font-mono font-black text-cyan-400">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Music Volume Bar */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 inline text-zinc-400" />
                  {t('background_music', {}, 'Background Music')}
                </span>
                <span className="text-xs font-mono font-black text-cyan-400">{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={musicVol}
                onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Accessibility & Camera configurations */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-400 flex items-center gap-2">
              <Eye size={16} />
              {t('accessibility_and_contrast', {}, 'ACCESSIBILITY & CAMERA')}
            </h3>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-3.5 mb-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex flex-col text-left pr-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Contrast size={14} className="text-zinc-400" />
                  {t('high_contrast_outlines', {}, 'High Contrast Outlines')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">{t('high_contrast_desc', {}, 'Bolsters visibility with distinctive contours')}</span>
              </div>
              <button
                onClick={handleHighContrastToggle}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${highContrast ? 'bg-cyan-500' : 'bg-zinc-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${highContrast ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Simple Projectiles */}
            <div className="flex items-center justify-between p-3.5 mb-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex flex-col text-left pr-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CircleDot size={14} className="text-cyan-400" />
                  {t('simple_projectiles', {}, 'Simple Ball Projectiles')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">{t('simple_projectiles_desc', {}, 'Renders projectiles as classic energy spheres with fire and ice elemental status effects')}</span>
              </div>
              <button
                onClick={handleSimpleProjectilesToggle}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${simpleProjectiles ? 'bg-cyan-500' : 'bg-zinc-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${simpleProjectiles ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Screenshake Slider */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity size={14} className="text-zinc-400" />
                  {t('impact_screen_shake', {}, 'Impact Screen Shake')}
                </span>
                <span className="text-xs font-mono font-black text-cyan-400">{Math.round(screenshakeMult * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 font-mono font-bold">0%</span>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.25"
                  value={screenshakeMult}
                  onChange={(e) => handleScreenshakeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-zinc-500 font-mono font-bold">200%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              gameAudio.playButtonClickSound();
              onClose();
            }}
            className="w-full px-6 py-3 uppercase font-black tracking-wider text-sm transition-all cursor-pointer rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg"
          >
            {t('save_and_core_sync', {}, 'Save & Close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

