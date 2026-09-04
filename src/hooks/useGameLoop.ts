import { useEffect, useRef } from 'react';

export interface GameLoopTickInfo {
  dt: number;
  tickDuration: number;
  shouldSkipRender: boolean;
  isHeavyLoad: boolean;
  fps: number;
}

export function useGameLoop(callback: (dt: number, info: GameLoopTickInfo) => void) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const consecutiveHeavyTicksRef = useRef(0);
  const skipNextRenderRef = useRef(false);
  const fpsWindowRef = useRef<{ frames: number; lastFpsCalc: number; currentFps: number }>({
    frames: 0,
    lastFpsCalc: performance.now(),
    currentFps: 60,
  });

  // Keep the callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const rawDeltaTime = (time - previousTimeRef.current) / 1000;
        // Cap delta time to 0.05s (20fps step floor) to eliminate massive physics jumps and jitter
        const clampedDt = Math.min(Math.max(rawDeltaTime, 0.001), 0.05);

        // Track FPS window
        const fpsObj = fpsWindowRef.current;
        fpsObj.frames++;
        if (time - fpsObj.lastFpsCalc >= 1000) {
          fpsObj.currentFps = Math.round((fpsObj.frames * 1000) / (time - fpsObj.lastFpsCalc));
          fpsObj.frames = 0;
          fpsObj.lastFpsCalc = time;
        }

        const tickStart = performance.now();

        // Determine if this frame should skip rendering based on previous tick budget overflow
        const shouldSkipRender = skipNextRenderRef.current;
        const isHeavyLoad = consecutiveHeavyTicksRef.current > 0;

        const tickInfo: GameLoopTickInfo = {
          dt: clampedDt,
          tickDuration: tickStart - (previousTimeRef.current || tickStart),
          shouldSkipRender,
          isHeavyLoad,
          fps: fpsObj.currentFps,
        };

        // Execute physics & game update
        callbackRef.current(clampedDt, tickInfo);

        const executionDuration = performance.now() - tickStart;

        // Frame-skipping mechanism:
        // When tick duration exceeds 16ms (exceeding standard 60fps frame budget),
        // skip non-essential render passes on alternate frames to ensure butter-smooth gameplay.
        if (executionDuration > 16.0) {
          consecutiveHeavyTicksRef.current = Math.min(10, consecutiveHeavyTicksRef.current + 1);
          skipNextRenderRef.current = !shouldSkipRender; // Alternating skip prevents visual freezes while freeing CPU
        } else {
          consecutiveHeavyTicksRef.current = Math.max(0, consecutiveHeavyTicksRef.current - 1);
          skipNextRenderRef.current = false;
        }
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);
}

