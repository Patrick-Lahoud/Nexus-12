// Touch-device detection for mobile controls.

let cachedNatural: boolean | null = null;

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Test escape hatch: set localStorage 'force_touch' = '1' to preview the
  // mobile control overlay on a desktop browser. Re-read on every call so a
  // flag set before/after mount is always honored (no cache staleness).
  try {
    if (localStorage.getItem('force_touch') === '1') return true;
  } catch {}

  const coarse = typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
  const touchPoints = (navigator.maxTouchPoints ?? 0) > 0;
  const finePointer = typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: fine)').matches;

  // Phones/tablets: coarse pointer. Touch-screen laptops have maxTouchPoints>0
  // but a fine pointer — they keep the desktop UI.
  if (cachedNatural === null) {
    cachedNatural = coarse || (touchPoints && !finePointer);
  }
  return cachedNatural;
}
