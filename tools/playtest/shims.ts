/**
 * Headless browser shims
 * ----------------------
 * The game engine and audio module assume a browser environment at import
 * time. These shims make them importable and runnable under plain Node/tsx.
 *
 * Must run BEFORE importing ../../src/game/engine.ts (static imports are
 * hoisted, so the harness uses dynamic import after calling this).
 */

export interface SimClock {
  /** Advance the fake wall clock. Call once per simulated frame. */
  advance(seconds: number): void;
  /** Current simulated time in milliseconds. */
  now(): number;
}

const clockState = { nowMs: 0 };

/** Fake Date.now driven by simulated frames so cooldown logic (Date.now based) behaves at any sim speed. */
export function installShims(): void {
  // --- localStorage (audio GameAudio constructor + turret achievements read it) ---
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
  (globalThis as any).localStorage = ls;

  // --- window + no-op Web Audio graph (engine synthesizes SFX even headless) ---
  class Param {
    value = 0;
    setValueAtTime() { return this; }
    linearRampToValueAtTime() { return this; }
    exponentialRampToValueAtTime() { return this; }
    setTargetAtTime() { return this; }
    cancelScheduledValues() { return this; }
  }
  class Node {
    connect() { return this; }
    disconnect() {}
    start() {}
    stop() {}
    gain: Param;
    frequency: Param;
    detune: Param;
    playbackRate: Param;
    Q: Param;
    constructor() {
      this.gain = new Param();
      this.frequency = new Param();
      this.detune = new Param();
      this.playbackRate = new Param();
      this.Q = new Param();
    }
  }
  class AudioContextStub {
    currentTime = 0;
    destination = new Node();
    sampleRate = 44100;
    state = 'running';
    createGain() { return new Node(); }
    createOscillator() { return new Node(); }
    createBuffer() {
      return {
        numberOfChannels: 1,
        length: 4096,
        sampleRate: 44100,
        duration: 4096 / 44100,
        getChannelData: () => new Float32Array(4096),
        copyToChannel: () => undefined,
        copyFromChannel: () => undefined,
      };
    }
    createBufferSource() { return new Node(); }
    createBiquadFilter() { return new Node(); }
    createDynamicsCompressor() { return new Node(); }
    createWaveShaper() { return new Node(); }
    createDelay() { return new Node(); }
    createPanner() { return new Node(); }
    createStereoPanner() { return new Node(); }
    createAnalyser() { return new Node(); }
    createMediaStreamDestination() { return new Node(); }
    createScriptProcessor() { return new Node(); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  (globalThis as any).window = globalThis;
  (globalThis as any).AudioContext = AudioContextStub;
  (globalThis as any).webkitAudioContext = AudioContextStub;

  // --- fake clock ---
  (globalThis as any).__simNowMs = () => clockState.nowMs;
  Date.now = () => clockState.nowMs;
}

export function advanceSimClock(seconds: number): void {
  clockState.nowMs += seconds * 1000;
}

export function makeSimClock(): SimClock {
  return {
    advance: advanceSimClock,
    now: () => clockState.nowMs,
  };
}
