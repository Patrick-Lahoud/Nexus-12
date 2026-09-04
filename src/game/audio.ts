/**
 * Boundless Blade High-Fidelity Synthesized Sound & Music Engine
 * High-performance Web Audio API Synthesizer & Procedural Sequencer.
 * Composed & Synthesized dynamically in real-time. No external assets required.
 */

class GameAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;

  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.4;

  // Reusable audio noise buffer for snare drums, crackling explosions, and hi-hats
  private noiseBuffer: AudioBuffer | null = null;

  // Music sequencers state
  private activeMusicType: 'menu' | 'gameplay' | null = null;
  private musicIntervalId: any = null;
  private sequenceStep = 0;

  constructor() {
    // SFX and Music granular volumes
    const sfxVal = localStorage.getItem('game_sfx_volume');
    this.sfxVolume = sfxVal !== null ? parseFloat(sfxVal) : 0.5;

    const musicVal = localStorage.getItem('game_music_volume');
    this.musicVolume = musicVal !== null ? parseFloat(musicVal) : 0.4;

    const savedMuted = localStorage.getItem('audio_muted');
    this.isMuted = savedMuted === 'true';
  }

  // Set up AudioContext and components
  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      // Balanced gain levels
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      // Create separate SFX volume controller node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Create separate Music volume controller node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Initialize noise buffer
      this.createNoiseBuffer();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API", e);
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of random noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    localStorage.setItem('audio_muted', String(mute));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('game_sfx_volume', String(this.sfxVolume));
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('game_music_volume', String(this.musicVolume));
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  // Primary trigger to resume context on gesture
  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- High-Fidelity Retro Sound Effects Synthesizer ---

  /**
   * Helper to trigger a customized bursts of filtered white noise for SFX
   */
  private playNoise(volume: number, duration: number, filterType: BiquadFilterType, filterFreq: number, q: number = 1) {
    if (!this.ctx || !this.noiseBuffer || this.isMuted) return;
    const time = this.ctx.currentTime;
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.setValueAtTime(q, time);
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    
    const dest = this.sfxGain || this.masterGain;
    if (dest) gainNode.connect(dest);
    
    noiseNode.start(time);
    noiseNode.stop(time + duration);
  }

  /**
   * Blade / Projectile Wall Bounce
   * double-oscillator metallic rung chime
   */
  public playBounceSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(840, time);
    osc1.frequency.exponentialRampToValueAtTime(1300, time + 0.1);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1260, time); // Ringing third-harmonic overtone
    osc2.frequency.exponentialRampToValueAtTime(1800, time + 0.08);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    
    const dest = this.sfxGain || this.masterGain;
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.18);
    osc2.stop(time + 0.18);
  }

  /**
   * Orbital shield bullet reflection sound
   * futuristic dual-frequency reverse-pitch chime sweep
   */
  public playShieldReflectSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, time);
    osc1.frequency.exponentialRampToValueAtTime(2400, time + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(750, time);
    osc2.frequency.exponentialRampToValueAtTime(1800, time + 0.09);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    
    const dest = this.sfxGain || this.masterGain;
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  /**
   * Weapon Projectile Fired click and laser sweep (slightly better punch)
   */
  public playShootSound(type?: string) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    if (type === 'laser') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + 0.13);
      gain.gain.setValueAtTime(0.10, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
      
      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.15);
      
      // Laser discharge hiss
      this.playNoise(0.05, 0.09, 'bandpass', 2600);

    } else if (type === 'heavy') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.20);
      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.20);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.22);
      
      this.playNoise(0.14, 0.16, 'lowpass', 240);

    } else {
      // Regular kinetic projectile
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(200, time + 0.08);
      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.09);
      
      this.playNoise(0.05, 0.02, 'highpass', 4500);
    }
  }

  private lastHitSoundTimes: Record<string, number> = {};

  /**
   * Hit enemy impact (crackle impact snap with better feedback, procedurally unique per source)
   */
  public playHitSound(isCrit: boolean = false, source?: string) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    // Throttle duplicate hit sounds within 30ms to prevent audio thread starvation
    const now = performance.now();
    const key = (source || 'default') + (isCrit ? '_crit' : '');
    if (now - (this.lastHitSoundTimes[key] || 0) < 30) {
      return;
    }
    this.lastHitSoundTimes[key] = now;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    const pitchSkew = 0.85 + Math.random() * 0.3; // randomized pitch shift
    const decaySkew = 0.85 + Math.random() * 0.3;  // randomized duration length

    if (source === 'fire_sword' || source === 'fire' || source === 'VOLCANIC_PLUME' || source === 'COSMIC_FLAME' || source === 'FIRE_TRAIL') {
      osc.type = 'sawtooth';
      const baseFreq = 220 * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08 * decaySkew);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.09 * decaySkew);

      this.playNoise(0.08, 0.06, 'lowpass', 650 + Math.random() * 300);
    } else if (source === 'ice_sword' || source === 'ice' || source === 'FROST_NOVA') {
      osc.type = 'sine';
      const baseFreq = (isCrit ? 2200 : 1500) * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, time + 0.05 * decaySkew);

      gain.gain.setValueAtTime(0.09, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.06 * decaySkew);

      this.playNoise(0.03, 0.03, 'highpass', 9000);
    } else if (source === 'electrical' || source === 'TESLA_COIL' || source === 'ARC_WHIP' || source === 'THUNDER_GOD' || source === 'CHAIN_ARC_SWORD' || source === 'CHAIN_LIGHTNING') {
      osc.type = 'triangle';
      const baseFreq = (isCrit ? 950 : 650) * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, time + 0.02);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.07 * decaySkew);

      gain.gain.setValueAtTime(0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.08 * decaySkew);

      this.playNoise(0.07, 0.04, 'bandpass', 4000);
    } else if (source === 'laser' || source === 'beam' || source === 'GRAVITY_BEAM' || source === 'RAIL_GUN' || source === 'OMEGA_BEAM' || source === 'DEATH_STAR_BEAM') {
      osc.type = 'sine';
      const baseFreq = 1200 * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.04 * decaySkew);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.05 * decaySkew);
    } else if (source === 'melee' || source === 'blade' || source === 'SPINNING_BLADE' || source === 'VORTEX_SCYTHE' || source === 'CHRONO_REAPER' || source === 'PLASMA_RAZOR' || source === 'NEUTRINO_SHREDDER' || source === 'GOD_SLAYER_WHEEL') {
      osc.type = 'sawtooth';
      const baseFreq = 380 * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(220, time + 0.05 * decaySkew);

      gain.gain.setValueAtTime(isCrit ? 0.12 : 0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05 * decaySkew);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.Q.setValueAtTime(2, time);

      osc.connect(filter);
      filter.connect(gain);
      if (dest) gain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.06 * decaySkew);

      this.playNoise(isCrit ? 0.06 : 0.03, 0.04, 'highpass', 5500);
    } else if (source === 'shield' || source === 'ORBITAL_SHIELD' || source === 'CELESTIAL_GUARD' || source === 'REPULSOR_FIELD' || source === 'SHIELD_BURST') {
      osc.type = 'triangle';
      const baseFreq = 140 * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.12 * decaySkew);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.13 * decaySkew);

      this.playNoise(0.08, 0.09, 'lowpass', 200, 2);
    } else if (source === 'bomb' || source === 'explosion' || source === 'BOMB_LAUNCHER' || source === 'RECURSIVE_BOMB' || source === 'SUPERNOVA_BOMB' || source === 'VOID_MINES' || source === 'MINE_LAYER' || source === 'SENSOR_CLUSTER') {
      osc.type = 'triangle';
      const baseFreq = 180 * pitchSkew;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.15 * decaySkew);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.16 * decaySkew);

      this.playNoise(0.18, 0.12, 'lowpass', 400);
    } else {
      osc.type = isCrit ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime((isCrit ? 480 : 320) * pitchSkew, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.05 * decaySkew);

      gain.gain.setValueAtTime((isCrit ? 0.14 : 0.08), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05 * decaySkew);

      osc.connect(gain);
      if (dest) gain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.06 * decaySkew);

      this.playNoise(isCrit ? 0.09 : 0.04, 0.05 * decaySkew, 'bandpass', isCrit ? 2200 : 3000, 2);
    }
  }

  /**
   * Enemy Explosion
   * Rich bass impact & dispersion noise
   */
  public playExplosionSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.35);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, time);
    subOsc.frequency.linearRampToValueAtTime(20, time + 0.35);

    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.40);

    osc.connect(gain);
    subOsc.connect(gain);
    if (dest) gain.connect(dest);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.42);
    subOsc.stop(time + 0.42);

    this.playNoise(0.24, 0.42, 'lowpass', 520);
  }

  /**
   * Player Hull Damaged / Hurt
   */
  public playPlayerHurtSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(240, time);
    osc1.frequency.linearRampToValueAtTime(40, time + 0.38);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(255, time); // Pure tension detuning ratio
    osc2.frequency.linearRampToValueAtTime(45, time + 0.38);

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.40);
    osc2.stop(time + 0.40);

    this.playNoise(0.18, 0.30, 'bandpass', 1700, 3.5);
  }

  /**
   * Button Click
   */
  public playButtonClickSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, time); // E5
    osc.frequency.setValueAtTime(987.77, time + 0.04); // B5

    gain.gain.setValueAtTime(0.10, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    if (dest) gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  /**
   * Purchase in Shop
   */
  public playPurchaseSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.50, time); // C6
    osc1.frequency.setValueAtTime(1318.51, time + 0.07); // E6
    osc1.frequency.setValueAtTime(1567.98, time + 0.14); // G6
    osc1.frequency.setValueAtTime(2093.00, time + 0.21); // C7

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(523.25, time); // C5
    osc2.frequency.setValueAtTime(1046.50, time + 0.14); // C6

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.38);
    osc2.stop(time + 0.38);
  }

  /**
   * Upgrade / Selection Bling
   */
  public playUpgradePickSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, time); // D5
    osc.frequency.setValueAtTime(783.99, time + 0.06); // G5
    osc.frequency.setValueAtTime(1174.66, time + 0.12); // D6
    osc.frequency.setValueAtTime(1567.98, time + 0.18); // G6
    osc.frequency.setValueAtTime(2349.32, time + 0.24); // D7

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(gain);
    if (dest) gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  /**
   * Level Clear / Victory Fanfare
   */
  public playLevelClearSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc1.type = 'triangle';
    osc2.type = 'sine';

    const mainMelody = [587.33, 733.41, 659.25, 783.99, 1174.66, 1567.98, 1760.00]; 
    mainMelody.forEach((freq, i) => {
      osc1.frequency.setValueAtTime(freq, time + i * 0.08);
      osc2.frequency.setValueAtTime(freq * 1.5, time + i * 0.08);
    });

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.85);

    osc1.connect(gain);
    osc2.connect(gain);
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.90);
    osc2.stop(time + 0.90);
  }

  /**
   * Game Over minor breakdown
   */
  public playGameOverSound() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.sfxGain || this.masterGain;

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    const notes1 = [293.66, 277.18, 261.63, 220.00]; // D4 -> C#4 -> C4 -> A3
    const notes2 = [146.83, 138.59, 130.81, 110.00];

    notes1.forEach((freq, i) => {
      osc1.frequency.setValueAtTime(freq, time + i * 0.22);
    });
    notes2.forEach((freq, i) => {
      osc2.frequency.setValueAtTime(freq, time + i * 0.22);
    });

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    if (dest) gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 1.30);
    osc2.stop(time + 1.30);
  }


  // --- High-Fidelity Synthesized Drum Instruments ---

  private playSynthKick(time: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    // Punchy kick sweep
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(28, time + 0.11);
    
    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSynthSnare(time: number) {
    if (!this.ctx || !this.noiseBuffer || !this.musicGain || this.isMuted) return;
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(190, time);
    toneOsc.frequency.exponentialRampToValueAtTime(90, time + 0.08);
    
    toneGain.gain.setValueAtTime(0.12, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    
    toneOsc.connect(toneGain);
    toneGain.connect(this.musicGain);
    toneOsc.start(time);
    toneOsc.stop(time + 0.1);

    // Filtered noise snap for authentic retro snare warmth
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(2.2, time);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.24, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    
    noiseNode.start(time);
    noiseNode.stop(time + 0.18);
  }

  private playSynthHat(time: number) {
    if (!this.ctx || !this.noiseBuffer || !this.musicGain || this.isMuted) return;
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    
    noiseNode.start(time);
    noiseNode.stop(time + 0.05);
  }


  // --- Procedural Synth Music Engine with much sweeter melodies ---

  /**
   * Get active playing music type
   */
  public getActiveMusicType(): 'menu' | 'gameplay' | null {
    return this.activeMusicType;
  }

  /**
   * Play dynamic looping background music
   */
  public playMusic(type: 'menu' | 'gameplay') {
    this.resume();
    
    if (type === 'gameplay') {
      this.stopMusic();
      return;
    }

    // If requested music is already playing, do not interrupt
    if (this.activeMusicType === type) return;

    this.stopMusic();
    this.activeMusicType = type;
    this.sequenceStep = 0;

    // Classic 70/80s space synth tempo (eighth-note beat steps)
    const bpm = 48;
    const stepDuration = 60 / bpm / 2; // Eighth-notes grid speed (e.g., ~0.44s per step)

    this.musicIntervalId = setInterval(() => {
      this.tickSequencer(type);
    }, stepDuration * 1000);
  }

  public stopMusic() {
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.activeMusicType = null;
  }

  /**
   * Loops retro sequences procedurally using the Web Audio API
   */
  private tickSequencer(type: 'menu' | 'gameplay') {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    const bpm = type === 'menu' ? 48 : 80;
    const stepDuration = 60 / bpm / 2; // Eighth-notes grid speed
    
    // 64-step sequence loop (4 measures of 16 steps)
    const gridLen = 64;
    this.sequenceStep = (this.sequenceStep + 1) % gridLen;

    const measure = Math.floor(this.sequenceStep / 16); // 0, 1, 2, 3
    const stepInMeasure = this.sequenceStep % 16;       // 0 to 15

    // --- HARMONIC STRUCTURE: G Minor -> Eb Major 7#11 -> C Minor -> Bb Major/augmented eerie gravity ---
    // Deep, brooding, space sci-fi minor chord progression
    const chordFrequencies = [
      [196.00, 233.08, 293.66, 349.23], // Gmin9 (G3, Bb3, D4, F4)
      [196.00, 220.00, 293.66, 311.13], // Ebmaj7#11 (G3, A3, D4, Eb4) - beautiful space tension
      [233.08, 261.63, 293.66, 311.13], // Cmin9 (Bb3, C4, D4, Eb4)
      [233.08, 277.18, 311.13, 349.23]  // Bbmaj9/Db / augmented (Bb3, Db4, Eb4, F4) - eerie outer horizon
    ];

    const bassNotes = [
      98.00,  // G2 (Measure 1)
      77.78,  // Eb2 (Measure 2)
      130.81, // C3 (Measure 3)
      116.54  // Bb2 (Measure 4)
    ];

    const activeChord = chordFrequencies[measure];
    const activeBass = bassNotes[measure];

    // --- 1. THE DRUM MACHINE (Eerie space pulse) ---
    if (type === 'menu') {
      // Faint deep-space heartbeat kick on step 0 & step 10
      if (stepInMeasure === 0 || stepInMeasure === 10) {
        this.playSynthKick(now);
      }
      // No standard hi-hats or snares to maintain a ghostly, isolated atmosphere
    } else {
      // Gameplay beats
      if (stepInMeasure === 0 || stepInMeasure === 8) {
        this.playSynthKick(now);
      } else if (stepInMeasure === 4 || stepInMeasure === 11 || stepInMeasure === 14) {
        this.playSynthKick(now);
      }
      if (stepInMeasure === 4 || stepInMeasure === 12) {
        this.playSynthSnare(now);
      }
      if (stepInMeasure % 2 === 1) {
        this.playSynthHat(now);
      }
    }

    // --- 2. DEEP RETRO BASSLINE (Continuous eerie sub hum for menu) ---
    const isMenu = type === 'menu';
    const shouldPlayBass = isMenu 
      ? (stepInMeasure === 0) 
      : (stepInMeasure === 0 || stepInMeasure === 3 || stepInMeasure === 6 || stepInMeasure === 8 || stepInMeasure === 11 || stepInMeasure === 14);

    if (shouldPlayBass) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = isMenu ? 'sine' : 'sawtooth'; // Pure haunting sine for menu, sawtooth drive for gameplay
      bassOsc.frequency.setValueAtTime(activeBass / 2, now); // Low sub-bass rumble

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(120, now);

      const bassVolume = isMenu ? 0.45 : 0.35;
      const duration = isMenu ? 9.5 : 0.32;

      bassGain.gain.setValueAtTime(0.001, now);
      if (isMenu) {
        // Slow swelling base drone that lasts the entire measure
        bassGain.gain.linearRampToValueAtTime(bassVolume, now + 2.5);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      } else {
        bassGain.gain.setValueAtTime(bassVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      }

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + duration + 0.3);
    }

    // --- 3. SPACE CHORD PADS (Warm atmospheric background cords, swelling in space) ---
    if (stepInMeasure === 0) {
      activeChord.forEach((freq, idx) => {
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        const padFilter = this.ctx.createBiquadFilter();

        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(freq, now);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(350 + idx * 80, now);
        padFilter.Q.setValueAtTime(1.5, now);

        // Slow cinematic swelling envelope - sustained over the whole 10s measure to eliminate silent gaps!
        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.12 + (3 - idx) * 0.02, now + 2.5);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + 9.5);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);

        padOsc.start(now);
        padOsc.stop(now + 9.8);
      });
    }

    // --- 4. THE MELODY (High-substance Retro Outerspace Theme) ---
    // We compose a beautiful, slow, eerie, and haunting space minor melody lineup!
    // Short/quick notes are removed; notes trigger spaced apart and are heavily sustained.
    const menuMelody = [
      // Measure 1 (G Minor - deep loneliness)
      392.00, 0, 0, 0, 466.16, 0, 0, 0,
      587.33, 0, 0, 0, 349.23, 0, 0, 0,
      // Measure 2 (Eb Major 7#11 - eerie expansion)
      392.00, 0, 0, 0, 440.00, 0, 0, 0,
      587.33, 0, 0, 0, 622.25, 0, 0, 0,
      // Measure 3 (C Minor 9 - deep plunge)
      392.00, 0, 0, 0, 523.25, 0, 0, 0,
      622.25, 0, 0, 0, 587.33, 0, 0, 0,
      // Measure 4 (Dark Tension resolving back)
      349.23, 0, 0, 0, 554.37, 0, 0, 0,
      698.46, 0, 0, 0, 587.33, 0, 0, 0
    ];

    const gameplayMelody = [
      // Measure 1 (amin9 quick arpeggio riff + strong high notes)
      220.00, 261.63, 329.63, 392.00, 440.00, 0, 523.25, 0,
      440.00, 392.00, 329.63, 261.63, 440.00, 0, 0, 0,
      // Measure 2 (fmaj9 quick arpeggiation)
      174.61, 261.63, 349.23, 440.00, 523.25, 0, 659.25, 0,
      523.25, 440.00, 349.23, 261.63, 523.25, 0, 0, 0,
      // Measure 3 (gmaj9 high melody sweep)
      196.00, 293.66, 392.00, 493.88, 587.33, 0, 783.99, 0,
      587.33, 493.88, 392.00, 293.66, 587.33, 0, 0, 0,
      // Measure 4 (emaj7 tension building roll-out)
      164.81, 246.94, 329.63, 415.30, 493.88, 0, 830.61, 0,
      659.25, 493.88, 415.30, 329.63, 659.25, 0, 415.30, 493.88
    ];

    const melodyList = type === 'menu' ? menuMelody : gameplayMelody;
    const noteToPlay = melodyList[this.sequenceStep];

    if (noteToPlay && noteToPlay > 0) {
      const leadOsc1 = this.ctx.createOscillator();
      const leadOsc2 = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator(); // Sub-octave for rich substance
      const leadGain = this.ctx.createGain();
      const leadFilter = this.ctx.createBiquadFilter();

      // Dual detuned analog oscillators for rich space texture chorus
      leadOsc1.type = 'sawtooth';
      leadOsc2.type = 'triangle';
      subOsc.type = 'sine'; // Pure warm sub foundation

      leadOsc1.frequency.setValueAtTime(noteToPlay - 1.5, now);
      leadOsc2.frequency.setValueAtTime(noteToPlay + 1.5, now);
      subOsc.frequency.setValueAtTime(noteToPlay * 0.5, now); // An octave lower!

      leadFilter.type = 'lowpass';
      const filterFreq = type === 'menu' ? 600 : 850;
      leadFilter.frequency.setValueAtTime(filterFreq, now);

      if (type === 'menu') {
        // Slow soft filter sweep for the eerie menu melody
        leadFilter.frequency.exponentialRampToValueAtTime(800, now + 1.0);
        leadFilter.frequency.exponentialRampToValueAtTime(350, now + 3.5);
      } else {
        // Sweeping filter cut-off for cyber analog synthesis style
        leadFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
        leadFilter.frequency.exponentialRampToValueAtTime(500, now + 0.45);
      }

      // Volume is boosted in lobby (0.18) for high prominence and depth
      const leadVolume = type === 'gameplay' ? 0.11 : 0.16;
      leadGain.gain.setValueAtTime(0.001, now);
      
      if (type === 'menu') {
        // Very slow attack, long tail release to avoid "clicky" or "quick" transients
        leadGain.gain.linearRampToValueAtTime(leadVolume, now + 0.9);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
      } else {
        leadGain.gain.linearRampToValueAtTime(leadVolume, now + 0.05);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
      }

      leadOsc1.connect(leadFilter);
      leadOsc2.connect(leadFilter);
      subOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc1.start(now);
      leadOsc2.start(now);
      subOsc.start(now);
      
      const stopDuration = type === 'menu' ? 4.0 : 0.55;
      leadOsc1.stop(now + stopDuration);
      leadOsc2.stop(now + stopDuration);
      subOsc.stop(now + stopDuration);

      // --- ECHO DEFER / SYNTHESIZED TAPE DELAY EFFECT ---
      // Trigger a delayed echo note 1.5 steps later to create massive space width
      setTimeout(() => {
        if (!this.ctx || !this.musicGain || this.isMuted || this.activeMusicType !== type) return;
        const echoTime = this.ctx.currentTime;
        const echoOsc = this.ctx.createOscillator();
        const echoGain = this.ctx.createGain();

        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(noteToPlay, echoTime);

        echoGain.gain.setValueAtTime(0.001, echoTime);
        if (type === 'menu') {
          // Lush slow-release eerie delay
          echoGain.gain.linearRampToValueAtTime(leadVolume * 0.45, echoTime + 0.8);
          echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 3.2);
          echoOsc.connect(echoGain);
          echoGain.connect(this.musicGain);
          echoOsc.start(echoTime);
          echoOsc.stop(echoTime + 3.5);
        } else {
          // Echo is also slightly louder and clearer for gameplay
          echoGain.gain.setValueAtTime(leadVolume * 0.5, echoTime);
          echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.45);
          echoOsc.connect(echoGain);
          echoGain.connect(this.musicGain);
          echoOsc.start(echoTime);
          echoOsc.stop(echoTime + 0.48);
        }
      }, (stepDuration * 1.5) * 1000);
    }
  }
}

export const gameAudio = new GameAudio();
