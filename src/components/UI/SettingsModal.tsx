import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Volume2, Music, Eye, Zap, Activity, Sliders, Contrast, Globe, Sparkles, Flame, Aperture, CircleDot } from 'lucide-react';
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

  // 4 Graphics Overdrive Switches
  const [gfxDynamicGrid, setGfxDynamicGrid] = useState(() => localStorage.getItem('gfx_dynamic_grid') !== 'false');
  const [gfxNeonLighting, setGfxNeonLighting] = useState(() => localStorage.getItem('gfx_neon_lighting') !== 'false');
  const [gfxDebrisFx, setGfxDebrisFx] = useState(() => localStorage.getItem('gfx_debris_fx') !== 'false');
  const [gfxCinematicFx, setGfxCinematicFx] = useState(() => localStorage.getItem('gfx_cinematic_fx') !== 'false');

  const retroTheme = false;

  useEffect(() => {
    gameAudio.resume();
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

  const handleGfxToggle = (key: string, currentVal: boolean, setter: (val: boolean) => void) => {
    const next = !currentVal;
    setter(next);
    localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event('game_settings_updated'));
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
          <h2 className="font-black uppercase tracking-wider text-xl m-0 text-white">
            {t('system_configurations', {}, 'System Configurations')}
          </h2>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 mb-6">
          
          {/* Graphics Overdrive Section */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-amber-400 flex items-center gap-2">
              <Sparkles size={16} />
              {t('graphics_overdrive_engine', {}, 'GRAPHICS & VISUAL ENGINE')}
            </h3>

            <div className="space-y-2.5">
              {/* Switch 1: 3D Space & Reactive Grid Engine */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-amber-500/30 transition-all">
                <div className="flex flex-col text-left pr-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe size={14} className="text-amber-400" />
                    {t('gfx_switch_1_title', {}, '1. Dynamic Space & 3D Grid')}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {t('gfx_switch_1_desc', {}, '3D-warping arena grid mesh, parallax cosmic nebulae & radar sweeps')}
                  </span>
                </div>
                <button
                  onClick={() => handleGfxToggle('gfx_dynamic_grid', gfxDynamicGrid, setGfxDynamicGrid)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${gfxDynamicGrid ? 'bg-amber-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${gfxDynamicGrid ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Switch 2: Hyper Neon Lighting & Energy Trails */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-cyan-500/30 transition-all">
                <div className="flex flex-col text-left pr-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Zap size={14} className="text-cyan-400" />
                    {t('gfx_switch_2_title', {}, '2. Neon Lighting & Energy Trails')}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {t('gfx_switch_2_desc', {}, 'Dynamic point-light casting, liquid plasma ghosting & lightning blooms')}
                  </span>
                </div>
                <button
                  onClick={() => handleGfxToggle('gfx_neon_lighting', gfxNeonLighting, setGfxNeonLighting)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${gfxNeonLighting ? 'bg-cyan-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${gfxNeonLighting ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Switch 3: Impact & Debris Physics */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-orange-500/30 transition-all">
                <div className="flex flex-col text-left pr-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Flame size={14} className="text-orange-400" />
                    {t('gfx_switch_3_title', {}, '3. Impact & Debris Physics')}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {t('gfx_switch_3_desc', {}, 'Hull fragment wreckage debris, floor shrapnel & explosion shockwaves')}
                  </span>
                </div>
                <button
                  onClick={() => handleGfxToggle('gfx_debris_fx', gfxDebrisFx, setGfxDebrisFx)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${gfxDebrisFx ? 'bg-orange-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${gfxDebrisFx ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Switch 4: Cinematic Post-Processing */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-purple-500/30 transition-all">
                <div className="flex flex-col text-left pr-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Aperture size={14} className="text-purple-400" />
                    {t('gfx_switch_4_title', {}, '4. Cinematic Post-Processing')}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {t('gfx_switch_4_desc', {}, 'Cockpit vignette shading, RGB chromatic split & micro lens flares')}
                  </span>
                </div>
                <button
                  onClick={() => handleGfxToggle('gfx_cinematic_fx', gfxCinematicFx, setGfxCinematicFx)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${gfxCinematicFx ? 'bg-purple-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${gfxCinematicFx ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Audio Console */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-cyan-400 flex items-center gap-2">
              <Volume2 size={16} />
              {t('audio_master_console', {}, 'AUDIO MASTER CONSOLE')}
            </h3>
            
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
                  <Activity size={14} className="text-zinc-400 animate-pulse" />
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

