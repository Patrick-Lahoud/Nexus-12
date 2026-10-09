import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/engine.ts';
import { useGameLoop } from '../hooks/useGameLoop.ts';
import { EntityType, WeaponType, AbilityType } from '../game/types.ts';
import { getSkinById, SkinDef } from '../game/skins.ts';

// Draws a skin's unique pattern on a ball of the given radius, centered at (cx, cy).
// Used by the in-game player render and the locker preview so both stay identical.
export function drawSkinPattern(ctx: CanvasRenderingContext2D, skin: SkinDef | undefined, cx: number, cy: number, radius: number) {
  if (!skin || skin.pattern === 'none') return;
  const accent = skin.patternColor || '#ffffff';
  const t = Date.now() * 0.001;
  ctx.save();
  // Clip to the ball so patterns never spill over the edge
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();

  switch (skin.pattern) {
    case 'hologrid': {
      // Scanning green grid lines drifting downward
      ctx.strokeStyle = `rgba(134, 239, 172, 0.55)`;
      ctx.lineWidth = 1;
      const step = radius * 0.5;
      const off = (t * radius * 0.4) % step;
      for (let i = -1; i <= 2; i++) {
        const y = cy - radius + off + (i + 1) * step;
        ctx.beginPath(); ctx.moveTo(cx - radius, y); ctx.lineTo(cx + radius, y); ctx.stroke();
      }
      for (let i = -1; i <= 2; i++) {
        const x = cx - radius + (i + 1) * step;
        ctx.beginPath(); ctx.moveTo(x, cy - radius); ctx.lineTo(x, cy + radius); ctx.stroke();
      }
      break;
    }
    case 'energy_core': {
      // Glowing inner reactor core with a soft pulse
      const pulse = 0.5 + Math.sin(t * 4) * 0.25;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.7);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.5 + pulse * 0.4;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'pulse_rings': {
      // Expanding shockwave rings from the core
      for (let i = 0; i < 2; i++) {
        const phase = ((t * 0.6 + i * 0.5) % 1);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.7 * (1 - phase);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2 + phase * radius * 0.85, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'star_spangle': {
      // Rotating 4-point star sparkle offset from center
      const ang = t * 1.2;
      const sx = cx + Math.cos(ang) * radius * 0.35;
      const sy = cy + Math.sin(ang) * radius * 0.35;
      const sr = radius * 0.28;
      ctx.fillStyle = accent;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? sr : sr * 0.32;
        const a = ang + (Math.PI * 2 / 8) * i;
        const px = sx + Math.cos(a) * r;
        const py = sy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'molten_cracks': {
      // Jagged glowing cracks radiating from the center
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1.5, radius * 0.09);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i + 0.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * radius * 0.1, cy + Math.sin(a) * radius * 0.1);
        ctx.lineTo(cx + Math.cos(a + 0.25) * radius * 0.5, cy + Math.sin(a + 0.25) * radius * 0.5);
        ctx.lineTo(cx + Math.cos(a - 0.1) * radius * 0.92, cy + Math.sin(a - 0.1) * radius * 0.92);
        ctx.stroke();
      }
      break;
    }
    case 'orbit_dots': {
      // Two satellite motes orbiting the equator
      for (let i = 0; i < 2; i++) {
        const a = t * 2 + i * Math.PI;
        const dx = Math.cos(a) * radius * 0.55;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(cx + dx, cy + Math.sin(a) * radius * 0.18, radius * 0.12, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bolt_seam': {
      // Lightning seam zig-zagging down the ball
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1.5, radius * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.1, cy - radius);
      ctx.lineTo(cx + radius * 0.3, cy - radius * 0.4);
      ctx.lineTo(cx - radius * 0.25, cy - radius * 0.1);
      ctx.lineTo(cx + radius * 0.2, cy + radius * 0.5);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();
      break;
    }
    case 'void_swirl': {
      // Spiral vortex arms rotating slowly
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = Math.max(1.5, radius * 0.1);
      for (let arm = 0; arm < 2; arm++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const f = i / 20;
          const a = t * 1.5 + arm * Math.PI + f * Math.PI * 1.8;
          const r = f * radius * 0.9;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'hemostripes': {
      // Diagonal combat stripes
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(2, radius * 0.16);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - radius + i * radius * 0.5, cy + radius);
        ctx.lineTo(cx + radius + i * radius * 0.5, cy - radius);
        ctx.stroke();
      }
      break;
    }
    case 'platinum_shine': {
      // Moving specular band
      const phase = (t * 0.7) % 1.6 - 0.3;
      // The band slides through and off the gradient range; skip frames where
      // it is fully outside [0,1] so color stops never exceed the valid range.
      if (phase > -0.2 && phase < 1.2) {
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
        const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
        grad.addColorStop(clamp01(phase - 0.18), 'rgba(255,255,255,0)');
        grad.addColorStop(clamp01(phase), 'rgba(255,255,255,0.75)');
        grad.addColorStop(clamp01(phase + 0.18), 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'venom_drips': {
      // Drips sliding down from the top of the ball
      ctx.fillStyle = accent;
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * radius * 0.45;
        const dy = ((t * radius * 0.8 + i * radius * 0.6) % (radius * 1.4)) - radius * 0.2;
        const dr = radius * 0.14;
        ctx.beginPath();
        ctx.moveTo(cx + dx - dr, cy - radius * 0.4);
        ctx.quadraticCurveTo(cx + dx, cy + dy, cx + dx + dr, cy - radius * 0.4);
        ctx.fill();
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, dr, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'frost_rime': {
      // Ice crystal spikes around the rim
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, radius * 0.06);
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i + t * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * radius * 0.75, cy + Math.sin(a) * radius * 0.75);
        ctx.lineTo(cx + Math.cos(a) * radius * 1.0, cy + Math.sin(a) * radius * 1.0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a + 0.2) * radius * 0.88, cy + Math.sin(a + 0.2) * radius * 0.88);
        ctx.lineTo(cx + Math.cos(a) * radius * 1.0, cy + Math.sin(a) * radius * 1.0);
        ctx.stroke();
      }
      break;
    }
    case 'phantom_mask': {
      // Split face: dark left half, light right half with a divider
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI * 0.5, Math.PI * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1, radius * 0.07);
      ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
      break;
    }
    case 'particle_leak': {
      // Void Walker: violet motes drifting up and off the ball
      for (let i = 0; i < 7; i++) {
        const seed = i * 2.399;
        const px = cx + Math.sin(seed) * radius * 0.55;
        const life = ((t * 0.45 + i * 0.14) % 1);
        const py = cy + radius * 0.7 - life * radius * 1.4;
        const pr = radius * 0.07 * (1 - life * 0.6);
        ctx.globalAlpha = 0.85 * (1 - life);
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, pr), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'crystal_facets': {
      // Amethyst: slow-rotating triangular facet shards
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.15);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i;
        ctx.fillStyle = accent;
        ctx.globalAlpha = i % 2 === 0 ? 0.3 : 0.18;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.15, Math.sin(a) * radius * 0.15);
        ctx.lineTo(Math.cos(a - 0.5) * radius, Math.sin(a - 0.5) * radius);
        ctx.lineTo(Math.cos(a + 0.5) * radius, Math.sin(a + 0.5) * radius);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
    }
    case 'live_sparks': {
      // Overcharged Core: jittering electric arcs leaping across the core
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, radius * 0.055);
      for (let i = 0; i < 4; i++) {
        const a0 = Math.sin(t * 7 + i * 2.1) * Math.PI;
        const r0 = radius * 0.2;
        const r1 = radius * (0.65 + 0.25 * Math.abs(Math.sin(t * 11 + i * 1.7)));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
        const mx = cx + Math.cos(a0 + 0.5) * (r0 + r1) * 0.5 + (Math.sin(t * 23 + i) * radius * 0.15);
        const my = cy + Math.sin(a0 + 0.5) * (r0 + r1) * 0.5 + (Math.cos(t * 19 + i) * radius * 0.15);
        ctx.lineTo(mx, my);
        ctx.lineTo(cx + Math.cos(a0 + 0.9) * r1, cy + Math.sin(a0 + 0.9) * r1);
        ctx.stroke();
      }
      break;
    }
    case 'heat_waves': {
      // Solar Flare: rising translucent heat bands
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.5 + i * 0.33) % 1;
        const yy = cy + radius * 0.8 - ph * radius * 1.6;
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.4 * (1 - ph);
        ctx.lineWidth = Math.max(1.5, radius * 0.1);
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.85, yy);
        ctx.quadraticCurveTo(cx, yy - radius * 0.25, cx + radius * 0.85, yy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'cyclone_streaks': {
      // Vortex Wind: curved streak lines shearing around the core
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, radius * 0.06);
      for (let i = 0; i < 4; i++) {
        const a0 = t * 1.4 + (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * (0.35 + i * 0.17), a0, a0 + 1.9);
        ctx.stroke();
      }
      break;
    }
    case 'voltage_flicker': {
      // Vibrant Cyan: CRT scanlines flickering across the ball
      const flick = 0.16 + Math.abs(Math.sin(t * 13)) * 0.2;
      ctx.fillStyle = accent;
      ctx.globalAlpha = flick;
      const step = Math.max(3, radius * 0.22);
      const off = (t * radius * 0.9) % step;
      for (let i = -1; i <= 4; i++) {
        ctx.fillRect(cx - radius, cy - radius + off + i * step, radius * 2, Math.max(1, radius * 0.07));
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'thermal_charge': {
      // Neon Magenta: vertical charge bars rising from the bottom
      for (let i = 0; i < 3; i++) {
        const w = radius * 0.18;
        const dx = (i - 1) * radius * 0.55;
        const ph = (t * 0.6 + i * 0.37) % 1;
        const h = radius * 1.7 * ph;
        ctx.globalAlpha = 0.45 * (1 - ph) + 0.15;
        ctx.fillStyle = accent;
        ctx.fillRect(cx + dx - w / 2, cy + radius - h, w, h);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'bio_circuit': {
      // Emerald Green: circuit traces pulsing outward from the core
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, radius * 0.05);
      const pulse = 0.5 + Math.sin(t * 3) * 0.5;
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + Math.PI / 4;
        const ax = cx + Math.cos(a) * radius * 0.25;
        const ay = cy + Math.sin(a) * radius * 0.25;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(a) * radius * 0.35, ay + Math.sin(a) * radius * 0.35);
        ctx.lineTo(ax + Math.cos(a + 0.6) * radius * 0.75, ay + Math.sin(a + 0.6) * radius * 0.75);
        ctx.stroke();
        // Node dot at each trace end
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(ax + Math.cos(a + 0.6) * radius * 0.75, ay + Math.sin(a + 0.6) * radius * 0.75, Math.max(1, radius * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
  ctx.restore();
}

// --- Enhanced enemy detail (pixel-art-professional shading) ---
// Shadows hue-shift cool, highlights shift warm, never pure black/white.
function shadeColor(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  let r = 200, g = 80, b = 160;
  if (m) {
    const s = m[1];
    if (s.length === 3) {
      r = parseInt(s[0] + s[0], 16); g = parseInt(s[1] + s[1], 16); b = parseInt(s[2] + s[2], 16);
    } else {
      r = parseInt(s.slice(0, 2), 16); g = parseInt(s.slice(2, 4), 16); b = parseInt(s.slice(4, 6), 16);
    }
  }
  if (amount >= 0) {
    // Warm highlight: blend toward tinted warm white
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (241 - g) * amount);
    b = Math.round(b + (224 - b) * amount);
  } else {
    // Cool shadow: blend toward deep blue-purple, never pure black
    const k = -amount;
    r = Math.round(r * (1 - k) + 18 * k);
    g = Math.round(g * (1 - k) + 20 * k);
    b = Math.round(b * (1 - k) + 44 * k);
  }
  return `rgb(${r},${g},${b})`;
}

// Cache gradients per color+rounded-radius: the pulse makes visualRadius wobble
// every frame, and rebuilding a gradient per enemy per frame is pure churn.
// (Benchmarked against pre-rendered sprite blits: on this stack the cached
// gradient fill + rim stroke path is measurably faster, so gradients stay.)
const enemyBodyGradCache = new Map<string, CanvasGradient>();
// Per-frame gradient allocation caches: creating CanvasGradient objects is one
// of the hottest canvas costs under heavy projectile/particle load, so these
// are keyed by the small set of parameters the ramps actually depend on.
const fireGradCache = new Map<string, CanvasGradient>();
const bossProjGradCache = new Map<number, CanvasGradient>();
const bossEyeGradCache = new Map<string, CanvasGradient>();

// Shaded metal block used for boss cannons, plates and turrets: gradient fill with
// a global top-left key light, beveled highlight edge and dark opposite edge.
// Must be called inside the target's local (already rotated) context.
// Stylized metal plate matching the game's soft 3D-ball look: one gentle
// top-left light ramp, a soft outline and a single rim light. No rivets,
// no hard bevels, no hyper-real metallic detail.
function drawMetalPlate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, accent: string, radius: number = 3) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, shadeColor(base, 0.25));
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, shadeColor(base, -0.4));
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = shadeColor(base, -0.55);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Soft rim light on the top edge only, same as the ball shading
  ctx.strokeStyle = shadeColor(base, 0.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y + 1);
  ctx.lineTo(x + w - radius, y + 1);
  ctx.stroke();
}

// Enhanced body: hue-shifted cell shading with a top-left key light,
// directional rim light and a hot core. Flat arc fills only (no per-pixel blur).
// alpha < 1 keeps holographic translucency (used for player clones).
function drawEnemyBody(ctx: CanvasRenderingContext2D, baseColor: string, radius: number, isBoss: boolean, alpha: number = 1, cx: number = 0, cy: number = 0) {
  const lightAngle = -Math.PI * 0.75; // top-left
  if (alpha < 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
  }

  // Radial ramp: warm highlight top-left, base midtone, cool shadow bottom-right
  // Cached only for translated (origin-centered) callers; explicit positions build fresh.
  const canCache = cx === 0 && cy === 0;
  const gradKey = `${baseColor}|${Math.round(radius)}|${ctx.canvas.width}x${ctx.canvas.height}`;
  let grad = canCache ? enemyBodyGradCache.get(gradKey) : undefined;
  if (!grad) {
    grad = ctx.createRadialGradient(
      cx + Math.cos(lightAngle) * radius * 0.45, cy + Math.sin(lightAngle) * radius * 0.45, radius * 0.1,
      cx, cy, radius
    );
    grad.addColorStop(0, shadeColor(baseColor, 0.28));
    grad.addColorStop(0.55, baseColor);
    grad.addColorStop(1, shadeColor(baseColor, -0.45));
    if (canCache) enemyBodyGradCache.set(gradKey, grad);
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Thin light rim on the lit edge (top-left arc)
  const rimW = isBoss ? 3 : 2;
  ctx.strokeStyle = shadeColor(baseColor, 0.45);
  ctx.lineWidth = rimW;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - rimW * 0.5, lightAngle - Math.PI * 0.55, lightAngle + Math.PI * 0.55);
  ctx.stroke();

  if (alpha < 1) {
    ctx.restore();
  }
}

interface GameCanvasProps {
  engine: GameEngine;
  isPaused: boolean;
  room: number;
}

export default React.memo(function GameCanvas({ engine, isPaused, room }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgGradsRef = useRef<{ width: number; height: number; neb1: CanvasGradient; neb2: CanvasGradient; vig?: CanvasGradient } | null>(null);
  const gridPatternRef = useRef<CanvasPattern | null>(null);
  const [settings, setSettings] = useState({
    highContrast: localStorage.getItem('game_high_contrast') === 'true',
    simpleProjectiles: localStorage.getItem('game_simple_projectiles') === 'true',
    screenshakeMult: localStorage.getItem('game_screenshake_mult') !== null ? parseFloat(localStorage.getItem('game_screenshake_mult')!) : 1.0,
    retroTheme: false,
    gfxDynamicGrid: localStorage.getItem('gfx_dynamic_grid') !== 'false',
    gfxNeonLighting: localStorage.getItem('gfx_neon_lighting') !== 'false',
    gfxDebrisFx: localStorage.getItem('gfx_debris_fx') !== 'false',
    gfxCinematicFx: localStorage.getItem('gfx_cinematic_fx') !== 'false',
    gfxEnemyDetail: localStorage.getItem('gfx_enemy_detail') !== 'false',
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings({
        highContrast: localStorage.getItem('game_high_contrast') === 'true',
        simpleProjectiles: localStorage.getItem('game_simple_projectiles') === 'true',
        screenshakeMult: localStorage.getItem('game_screenshake_mult') !== null ? parseFloat(localStorage.getItem('game_screenshake_mult')!) : 1.0,
        retroTheme: false,
        gfxDynamicGrid: localStorage.getItem('gfx_dynamic_grid') !== 'false',
        gfxNeonLighting: localStorage.getItem('gfx_neon_lighting') !== 'false',
        gfxDebrisFx: localStorage.getItem('gfx_debris_fx') !== 'false',
        gfxCinematicFx: localStorage.getItem('gfx_cinematic_fx') !== 'false',
        gfxEnemyDetail: localStorage.getItem('gfx_enemy_detail') !== 'false',
      });
    };
    window.addEventListener('game_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('game_settings_updated', handleSettingsUpdate);
  }, []);

  useGameLoop((dt, info) => {
    // Single authoritative loop: advance physics then render frame
    if (!isPaused && !engine.player?.isDead) {
      engine.update(dt);
    }
    // Adaptive frame-skipping: if previous tick execution exceeded 16ms budget, skip draw frame to let physics catch up.
    // While paused (menus, shop, compendium open) skip drawing entirely: the canvas keeps its last frame, which stops
    // the constant 60fps redraw (and its re-composite under blurred modals) from burning GPU time.
    if (!info.shouldSkipRender && !isPaused) {
      draw(info.isHeavyLoad);
    }
  });

  const draw = (isHeavyLoad: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    
    // Apply Shake from engine
    if (engine.shake > 0) {
      const shakeAmt = engine.shake * settings.screenshakeMult;
      if (shakeAmt > 0) {
        const sx = (Math.random() - 0.5) * shakeAmt;
        const sy = (Math.random() - 0.5) * shakeAmt;
        ctx.translate(sx, sy);
      }
    }

    // Clear & Fill Arena Background: color matches the page background, and the whole
    // scene is clipped to the rounded arena boundary (radius 52, matching physics) so no
    // grid dots, stars, or particles show in the corner regions.
    ctx.fillStyle = settings.retroTheme ? '#030306' : '#020205';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 52);
    } else {
      ctx.rect(0, 0, canvas.width, canvas.height);
    }
    ctx.clip();

    const timeSec = Date.now() / 1000;
    const pPos = engine.player?.pos || { x: canvas.width / 2, y: canvas.height / 2 };

    if (settings.gfxDynamicGrid || settings.gfxCinematicFx) {
      if (!bgGradsRef.current || bgGradsRef.current.width !== canvas.width || bgGradsRef.current.height !== canvas.height) {
        const neb1 = ctx.createRadialGradient(canvas.width * 0.25, canvas.height * 0.3, 10, canvas.width * 0.25, canvas.height * 0.3, canvas.width * 0.45);
        neb1.addColorStop(0, 'rgba(88, 28, 135, 0.12)');
        neb1.addColorStop(0.6, 'rgba(14, 116, 144, 0.06)');
        neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');

        const neb2 = ctx.createRadialGradient(canvas.width * 0.75, canvas.height * 0.7, 10, canvas.width * 0.75, canvas.height * 0.7, canvas.width * 0.4);
        neb2.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
        neb2.addColorStop(0.6, 'rgba(168, 85, 247, 0.04)');
        neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        const vig = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.78
        );
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(1, 'rgba(2, 6, 23, 0.65)');

        bgGradsRef.current = { width: canvas.width, height: canvas.height, neb1, neb2, vig };
      }
    }

    if (settings.gfxDynamicGrid && bgGradsRef.current) {
      // 1. DYNAMIC DEEP-SPACE COSMIC NEBULAE BLOBS (Cached Gradients)
      ctx.save();
      ctx.fillStyle = bgGradsRef.current.neb1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = bgGradsRef.current.neb2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2. DYNAMIC 3D REACTIVE MESH GRID
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const moveX = (timeSec * 15) % gridSize;
      const moveY = (timeSec * 12) % gridSize;

      // Fast straight grid lines (smooth performance without sub-pixel vertex iteration per line)
      ctx.beginPath();
      for (let x = moveX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = moveY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      ctx.restore();

      // Drifting space dust stars
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const seedX = (i * 157.3) % 1;
        const seedY = (i * 821.7) % 1;
        const starSpeed = 0.12 + (i % 3) * 0.08;
        const startX = seedX * canvas.width;
        const startY = seedY * canvas.height;
        const curX = (startX - timeSec * starSpeed * 25 + canvas.width) % canvas.width;
        const curY = (startY - timeSec * starSpeed * 12 + canvas.height) % canvas.height;
        const alpha = 0.05 + Math.sin(timeSec * 1.5 + i) * 0.03;
        ctx.fillStyle = i % 2 === 0 ? `rgba(34, 211, 238, ${alpha})` : `rgba(168, 85, 247, ${alpha})`;
        ctx.beginPath();
        ctx.arc(curX, curY, i % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Standard static flat grid lines
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Faint Dotted Grid Overlay (Rendered with high-efficiency cached pattern)
    if (!gridPatternRef.current) {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 32;
      patternCanvas.height = 32;
      const pCtx = patternCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        pCtx.fillRect(15, 15, 2, 2);
        gridPatternRef.current = ctx.createPattern(patternCanvas, 'repeat');
      }
    }
    if (gridPatternRef.current) {
      ctx.save();
      ctx.fillStyle = gridPatternRef.current;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw Particles
    engine.particles.forEach(p => {
        if (p.type === 'RAIL') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 24 * p.life;
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.moveTo(p.p1.x, p.p1.y);
            ctx.lineTo(p.p2.x, p.p2.y);
            ctx.stroke();

            ctx.strokeStyle = p.color;
            ctx.lineWidth = 10 * p.life;
            ctx.globalAlpha = 0.8;
            ctx.stroke();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4 * p.life;
            ctx.globalAlpha = 1.0;
            ctx.stroke();
        }
        if (p.type === 'FIRE') {
            // Soft additive gradient blob: overlaps blend into one continuous flame
            const radius = Math.max(0, (p.isEvolved ? 25 : 15) * (p.life / 2));
            if (radius > 0.5) {
                const alpha = (p.life / (p.isEvolved ? 4 : 2)) * 0.55;
                // Cached per (evolved, radius bucket, alpha bucket): the fire trail
                // spawns dozens of particles per second and allocating a fresh
                // gradient for every one each frame showed up in profiles.
                const key = (p.isEvolved ? 'E' : 'N') + Math.round(radius) + '|' + Math.round(alpha * 40);
                let grad = fireGradCache.get(key);
                if (!grad) {
                    grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.round(radius));
                    const a = Math.round(alpha * 40) / 40;
                    if (p.isEvolved) {
                        grad.addColorStop(0, `rgba(255, 200, 120, ${a})`);
                        grad.addColorStop(0.35, `rgba(239, 68, 68, ${a * 0.9})`);
                        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                    } else {
                        grad.addColorStop(0, `rgba(255, 210, 130, ${a})`);
                        grad.addColorStop(0.35, `rgba(249, 115, 22, ${a * 0.9})`);
                        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
                    }
                    if (fireGradCache.size > 256) fireGradCache.clear();
                    fireGradCache.set(key, grad);
                }
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.translate(p.pos.x, p.pos.y);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        if (p.type === 'ARC') {
            const arcColor = p.color || '#fbbf24';
            const midX = (p.p1.x + p.p2.x) / 2 + (Math.random() - 0.5) * 26;
            const midY = (p.p1.y + p.p2.y) / 2 + (Math.random() - 0.5) * 26;
            const alpha = Math.min(1.0, p.life * 2.5);

            ctx.save();
            // Outer glowing discharge aura
            ctx.strokeStyle = arcColor;
            ctx.globalAlpha = alpha * 0.7;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(p.p1.x, p.p1.y);
            ctx.quadraticCurveTo(midX, midY, p.p2.x, p.p2.y);
            ctx.stroke();

            // Hot inner electric core
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.p1.x, p.p1.y);
            ctx.quadraticCurveTo(midX, midY, p.p2.x, p.p2.y);
            ctx.stroke();
            ctx.restore();
        }
        if (p.type === 'SPARK') {
            ctx.fillStyle = p.color || '#fff';
            const sz = Math.max(1, 2 * (p.life || 1));
            ctx.fillRect(p.pos.x - sz / 2, p.pos.y - sz / 2, sz, sz);
        }
        if (p.type === 'SNOW') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life > 0.4 ? 1 : p.life / 0.4;
            const sz = p.size || 2;
            ctx.fillRect(p.pos.x - sz / 2, p.pos.y - sz / 2, sz, sz);
            ctx.globalAlpha = 1.0;
        }
        if (p.type === 'DEATH_SHIVER') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life > 0.4 ? 1 : p.life / 0.4;
            const halfSize = p.size / 2;
            ctx.fillRect(p.pos.x - halfSize, p.pos.y - halfSize, p.size, p.size);
            ctx.globalAlpha = 1.0;
        }
        if (p.type === 'WARP') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3 * (p.life / 0.5);
            const progress = 1 - (p.life / 0.5);
            const size = progress * p.maxRadius;
            
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (p.type === 'NOVA') {
            const lifeTotal = p.maxRadius > 400 ? 1.0 : 0.5;
            const progress = Math.max(0, 1 - (p.life / lifeTotal));
            const radius = p.maxRadius * progress;
            
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4 * (1 - progress);
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, Math.max(0, radius), 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * (1 - progress)})`;
            ctx.lineWidth = 20 * (1 - progress);
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, Math.max(0, radius), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (p.type === 'TOXIC') {
            const size = (p.size || 20) * (0.8 + Math.sin(Date.now() * 0.003 + (p.pos.x * 0.1)) * 0.2) * (p.life / 5);
            const alpha = Math.min(1, p.life);
            ctx.fillStyle = `rgba(21, 128, 61, ${0.25 * alpha})`;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(34, 197, 94, ${0.4 * alpha})`;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Bombs
    engine.bombs.forEach(b => {
        ctx.save();
        ctx.translate(b.pos.x, b.pos.y);

        if (b.isMine) {
            ctx.rotate(Date.now() * 0.005);
            ctx.fillStyle = b.color || '#71717a';
            ctx.beginPath();
            const r = 10 + Math.sin(Date.now() * 0.02) * 2;
            for(let i=0; i<4; i++) {
                ctx.rotate(Math.PI/2);
                ctx.fillRect(-r, -2, r*2, 4);
            }
            ctx.beginPath();
            ctx.arc(0, 0, r*0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Beating light
            ctx.fillStyle = (Math.floor(Date.now() / 300) % 2 === 0) ? '#fff' : b.color;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.isSupernovaCore) {
            // Tier 3 Supernova Singularity Core
            const now = Date.now();
            const r = (b.isSubMunition ? 10 : 16) + Math.sin(now * 0.015) * 2;

            // Swirling Event Horizon Distortion Rings
            ctx.save();
            ctx.rotate(now * 0.008);
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r + 8, 0, Math.PI * 1.5);
            ctx.stroke();

            ctx.rotate(-now * 0.014);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 14, 0, Math.PI * 1.2);
            ctx.stroke();
            ctx.restore();

            // Singularity Star Body
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.isSubMunition) {
            // Cluster Mini-Bomb Sub-Munition
            const heading = Math.atan2(b.vel.y, b.vel.x);
            ctx.rotate(heading);

            // Thruster Tail
            ctx.fillStyle = '#fdba74';
            ctx.beginPath();
            ctx.moveTo(-10, -3);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-10, 3);
            ctx.closePath();
            ctx.fill();

            // Mini Warhead Body
            ctx.fillStyle = b.color || '#fb923c';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Standard Bomb / Recursive Warhead
            ctx.fillStyle = b.color || '#f87171';
            ctx.beginPath();
            const r = 9 + Math.sin(Date.now() * 0.01) * 2;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', 0, 3);
        }

        ctx.restore();
    });

    // Draw Clones with Specialized Archetype Visuals
    engine.clones.forEach(c => {
        ctx.save();
        ctx.translate(c.pos.x, c.pos.y);

        if (c.archetype === 'MELEE') {
            // --- 1. PURPLE SPINNING BLADE MELEE CLONE ---
            if (settings.gfxEnemyDetail) {
                // Shaded holographic hull: same 3D look as enemies but translucent
                drawEnemyBody(ctx, '#7e22ce', c.radius, false, 0.6);
            } else {
                ctx.fillStyle = '#3b0764';
                ctx.beginPath();
                ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Core energy eye
            ctx.fillStyle = '#f0abfc';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw TWO prominent spinning energy broadswords (180deg opposite)
            const mAng = c.meleeAngle || 0;
            for (let b = 0; b < 2; b++) {
                const swordAng = mAng + b * Math.PI;
                ctx.save();
                ctx.rotate(swordAng);

                // Spinning Arc Slash Trail
                ctx.strokeStyle = 'rgba(233, 213, 255, 0.45)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, 44, -0.9, 0);
                ctx.stroke();

                // Sword Hilt & Guard
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(10, -4, 4, 8); // Guard
                ctx.fillRect(6, -2, 4, 4);  // Handle

                // Razor Double-Edged Broadsword Blade
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.moveTo(14, -3);
                ctx.lineTo(44, 0);
                ctx.lineTo(14, 3);
                ctx.closePath();
                ctx.fill();

                // Glowing Blade Edge & Spine
                ctx.strokeStyle = '#f0abfc';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(14, -3);
                ctx.lineTo(44, 0);
                ctx.lineTo(14, 3);
                ctx.stroke();

                ctx.restore();
            }
        } else if (c.archetype === 'SHOTGUN') {
            // --- 2. HEAVY ROTATING SHOTGUN ENFORCER CLONE ---
            const aimAng = c.aimAngle !== undefined ? c.aimAngle : 0;
            const spin = c.gunSpin || 0;

            // Rotate entire clone assembly to aim directly at target enemy
            ctx.rotate(aimAng + Math.PI / 2);

            // Heavy Red/Gold Body
            if (settings.gfxEnemyDetail) {
                drawEnemyBody(ctx, '#b91c1c', c.radius, false, 0.6);
            } else {
                ctx.fillStyle = '#7f1d1d';
                ctx.beginPath();
                ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Heavy Shotgun Twin Cannons (Extending forward towards target, -Y)
            ctx.fillStyle = '#18181b';
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-6, -c.radius - 16, 4, 18);
            ctx.strokeRect(-6, -c.radius - 16, 4, 18);
            ctx.fillRect(2, -c.radius - 16, 4, 18);
            ctx.strokeRect(2, -c.radius - 16, 4, 18);

            // Spinning Gatling Barrel Assembly Ring
            ctx.save();
            ctx.translate(0, -c.radius - 8);
            ctx.rotate(spin);
            ctx.fillStyle = '#fca5a5';
            for (let g = 0; g < 4; g++) {
                const gA = (Math.PI * 2 / 4) * g;
                ctx.beginPath();
                ctx.arc(Math.cos(gA) * 6, Math.sin(gA) * 6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Red / Yellow Laser Sight Beam aiming at target - ONLY visible when in close range (Red <= 140, Yellow <= 280)
            if (c.hasTarget && c.isLockedOn) {
                const dist = c.targetDist || 400;
                const isReallyClose = dist <= 140;
                const isKindOfClose = dist <= 280;
                if (isReallyClose || isKindOfClose) {
                    const laserColor = isReallyClose ? '#ef4444' : '#eab308';
                    const reticleColor = isReallyClose ? '#fca5a5' : '#fde047';
                    const glowColor = isReallyClose ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.25)';

                    ctx.strokeStyle = laserColor;
                    ctx.lineWidth = isReallyClose ? 2.2 : 1.5;
                    ctx.setLineDash(isReallyClose ? [2, 2] : [4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(0, -c.radius - 16);
                    ctx.lineTo(0, -dist);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Lock Reticle on targeted enemy
                    ctx.strokeStyle = reticleColor;
                    ctx.lineWidth = isReallyClose ? 2.0 : 1.4;
                    ctx.beginPath();
                    ctx.arc(0, -dist, isReallyClose ? 16 : 12, 0, Math.PI * 2);
                    ctx.moveTo(-8, -dist); ctx.lineTo(8, -dist);
                    ctx.moveTo(0, -dist - 8); ctx.lineTo(0, -dist + 8);
                    ctx.stroke();

                    ctx.fillStyle = glowColor;
                    ctx.beginPath();
                    ctx.arc(0, -dist, isReallyClose ? 8 : 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (c.archetype === 'SNIPER') {
            // --- 3. CYAN PRECISION SNIPER CLONE ---
            const aimAng = c.aimAngle !== undefined ? c.aimAngle : 0;
            const spin = c.gunSpin || 0;

            // Rotate context to aim directly at target enemy
            ctx.rotate(aimAng + Math.PI / 2);

            // Precision Body
            if (settings.gfxEnemyDetail) {
                drawEnemyBody(ctx, '#0369a1', c.radius, false, 0.6);
            } else {
                ctx.fillStyle = '#0c4a6e';
                ctx.beginPath();
                ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Long High-Caliber Railgun Barrel (Extending forward -Y)
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-2, -c.radius - 24, 4, 26);

            // Capacitor Energy Coils along barrel
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(-4, -c.radius - 8, 8, 3);
            ctx.fillRect(-4, -c.radius - 15, 8, 3);
            ctx.fillRect(-4, -c.radius - 22, 8, 3);

            // Spinning Precision Optic Lens with charging energy diode
            ctx.save();
            ctx.translate(0, -c.radius - 10);
            ctx.rotate(-spin * 0.5);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
            ctx.moveTo(0, -9); ctx.lineTo(0, 9);
            ctx.stroke();
            ctx.restore();

            // Muzzle charging diode (No full screen laser lines for non-shotguns)
            ctx.fillStyle = c.isLockedOn ? '#38bdf8' : '#0284c7';
            ctx.beginPath();
            ctx.arc(0, -c.radius - 24, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // --- 4. TACTICAL / DECOY HOLOGRAPHIC CLONE ---
            const aimAng = c.aimAngle !== undefined ? c.aimAngle : 0;
            ctx.rotate(aimAng + Math.PI / 2);

            if (settings.gfxEnemyDetail) {
                drawEnemyBody(ctx, '#0ea5e9', c.radius, false, 0.55);
            } else {
                ctx.fillStyle = c.color || 'rgba(56, 189, 248, 0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dual pulse blaster barrels
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-5, -c.radius - 8, 2, 10);
            ctx.fillRect(3, -c.radius - 8, 2, 10);

            if (Math.random() < 0.15) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-c.radius, -2, c.radius * 2, 2);
            }
        }

        ctx.restore();
    });

    // Draw Warp Zones (Chrono Distortion Rifts from WARP_WARLOCK)
    if (engine.warpZones && engine.warpZones.length > 0) {
        engine.warpZones.forEach(wz => {
            ctx.save();
            const ratio = Math.max(0, wz.duration / wz.maxDuration);
            const grad = ctx.createRadialGradient(wz.pos.x, wz.pos.y, 10, wz.pos.x, wz.pos.y, wz.radius);
            grad.addColorStop(0, `rgba(168, 85, 247, ${0.35 * ratio})`);
            grad.addColorStop(0.6, `rgba(147, 51, 234, ${0.2 * ratio})`);
            grad.addColorStop(1, 'rgba(126, 34, 206, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(wz.pos.x, wz.pos.y, wz.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(192, 132, 252, ${0.75 * ratio})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(wz.pos.x, wz.pos.y, wz.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        });
    }

    // Draw Ion Storm Zones (from PLASMA_STORMER)
    if (engine.ionZones && engine.ionZones.length > 0) {
        engine.ionZones.forEach(iz => {
            ctx.save();
            const ratio = Math.max(0, iz.duration / iz.maxDuration);
            const grad = ctx.createRadialGradient(iz.pos.x, iz.pos.y, 10, iz.pos.x, iz.pos.y, iz.radius);
            grad.addColorStop(0, `rgba(56, 189, 248, ${0.35 * ratio})`);
            grad.addColorStop(0.7, `rgba(2, 132, 199, ${0.2 * ratio})`);
            grad.addColorStop(1, 'rgba(3, 105, 161, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(iz.pos.x, iz.pos.y, iz.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(125, 211, 252, ${0.8 * ratio})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(iz.pos.x, iz.pos.y, iz.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }

    // Draw Turrets
    if ((engine as any).turrets) {
        (engine as any).turrets.forEach((t: any) => {
            ctx.save();
            ctx.translate(t.pos.x, t.pos.y);

            // Base circle
            ctx.fillStyle = '#18181b'; // dark zinc
            ctx.strokeStyle = t.color || '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Outer alpha glow ring (high FPS alternative to shadowBlur)
            ctx.strokeStyle = t.color || '#06b6d4';
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Inner styling depending on type
            if (t.type === 'turret_tesla') {
                // Draw lightning core rings pulsing
                ctx.fillStyle = '#60a5fa'; // neon blue
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();

                // Double rings
                ctx.strokeStyle = '#93c5fd';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.7, 0, Math.PI * 2);
                ctx.stroke();

                // Antenna apex indicator node
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'turret_sword') {
                // Spinning blade turret core
                ctx.fillStyle = '#f97316'; // orange core
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();

                const weaponSize = engine.player?.stats?.weaponSize || 1.0;
                const swordLength = (70 + (t.level || 1) * 5) * weaponSize;

                // Draw rotating beautiful laser swords at matching range
                ctx.save();
                ctx.rotate(t.angle || 0);

                for (const dir of [-1, 1]) {
                    // Outer glowing blade beam
                    ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)';
                    ctx.lineWidth = 5.0;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(dir * t.radius * 0.4, 0);
                    ctx.lineTo(dir * swordLength, 0);
                    ctx.stroke();

                    // Central white-hot plasma beam core
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.moveTo(dir * t.radius * 0.4, 0);
                    ctx.lineTo(dir * (swordLength - 2), 0);
                    ctx.stroke();

                    // Crossguard hilt
                    ctx.strokeStyle = '#71717a';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.moveTo(dir * t.radius * 0.5, -6);
                    ctx.lineTo(dir * t.radius * 0.5, 6);
                    ctx.stroke();
                }

                ctx.restore();
            } else if (t.type === 'turret_autoshooter') {
                // Barrel facing the targeting direction
                ctx.save();
                ctx.rotate(t.angle || 0);
                ctx.fillStyle = '#c084fc';
                ctx.fillRect(0, -3.5, t.radius * 1.2, 7);
                ctx.fillStyle = '#a855f7';
                ctx.fillRect(t.radius * 0.8, -2.5, t.radius * 0.4, 5);
                ctx.restore();

                // Inner core
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'turret_ricochet') {
                // Multi-sided faceted crystal core
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const ang = (Math.PI * 2 / 6) * i + (t.angle || 0);
                    const rx = Math.cos(ang) * (t.radius * 0.55);
                    const ry = Math.sin(ang) * (t.radius * 0.55);
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#34d399';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.75, 0, Math.PI * 2);
                ctx.stroke();
            } else if (t.type === 'turret_shotgun') {
                // Directional 3-barrel heavy shotgun
                ctx.save();
                ctx.rotate(t.angle || 0);
                ctx.fillStyle = '#f43f5e';
                // Mid barrel
                ctx.fillRect(0, -3, t.radius * 1.25, 6);
                // Top angled barrel
                ctx.save();
                ctx.rotate(0.2);
                ctx.fillRect(0, -2, t.radius * 1.15, 4);
                ctx.restore();
                // Bottom angled barrel
                ctx.save();
                ctx.rotate(-0.2);
                ctx.fillRect(0, -2, t.radius * 1.15, 4);
                ctx.restore();
                ctx.restore();

                // Core shell casing cap
                ctx.fillStyle = '#be123c';
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'turret_fire') {
                // Torch flame nozzle
                ctx.save();
                ctx.rotate(t.angle || 0);
                // Brass shield
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(t.radius * 0.5, 0, 7, -Math.PI/2, Math.PI/2);
                ctx.fill();
                // Core exhaust barrel
                ctx.fillStyle = '#78350f';
                ctx.fillRect(0, -4, t.radius * 1.1, 8);
                // Golden nozzle throat
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(t.radius * 0.9, -2, 4, 4);
                ctx.restore();

                // Fire indicator light blinking
                ctx.fillStyle = (Math.sin(Date.now() * 0.015) > 0) ? '#ff5a1f' : '#78350f';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'turret_shield') {
                // Cyan energy generator barrier emitter
                ctx.fillStyle = '#0891b2';
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // 4 revolving mini satellites shielding it
                ctx.save();
                ctx.rotate(Date.now() * 0.002);
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const ang = (Math.PI / 2) * i;
                    const sx = Math.cos(ang) * (t.radius + 6);
                    const sy = Math.sin(ang) * (t.radius + 6);
                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            } else if (t.type === 'turret_bomb') {
                // Mortar launcher
                ctx.save();
                ctx.rotate(t.angle || 0);
                // Heavy grey base platform launcher
                ctx.fillStyle = '#3f3f46';
                ctx.fillRect(-4, -6, 12, 12);
                // Launcher pipe
                ctx.fillStyle = '#18181b';
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.rect(4, -5, t.radius * 0.9, 10);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Blinking signal sensor dot
                ctx.fillStyle = (Math.sin(Date.now() * 0.01) > 0) ? '#f59e0b' : '#3f3f46';
                ctx.beginPath();
                ctx.arc(0, 0, t.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (t.type === 'turret_plasma') {
                // Fusion dual-rail muzzle linear rails
                ctx.save();
                ctx.rotate(t.angle || 0);
                // Rails
                ctx.fillStyle = '#db2777';
                ctx.fillRect(0, -6, t.radius * 1.3, 3);
                ctx.fillRect(0, 3, t.radius * 1.3, 3);
                // Middle plasma core charges sparks
                ctx.fillStyle = '#fdf2f8';
                ctx.fillRect(t.radius * 0.2, -2, 6, 4);
                ctx.restore();

                // Glowing crystal nucleus
                ctx.fillStyle = '#f472b6';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Draw Sentry Health Bar above the node (or below if top cuts off)
            const hpWidth = t.radius * 2;
            const hpHeight = 3.5;
            const hpx = t.pos.x - t.radius;
            let hpy = t.pos.y - t.radius - 8;
            if (hpy < 6) {
                hpy = t.pos.y + t.radius + 6;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(hpx, hpy, hpWidth, hpHeight);

            const hpPct = Math.max(0, Math.min(1.0, t.hp / t.maxHp));
            ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.2 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(hpx, hpy, hpWidth * hpPct, hpHeight);

            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(hpx, hpy, hpWidth, hpHeight);
        });
    }

    // Draw Mining Drills
    if ((engine as any).mines) {
        (engine as any).mines.forEach((m: any) => {
            ctx.save();
            ctx.translate(m.pos.x, m.pos.y);

            // Base circle
            ctx.fillStyle = '#09090b';
            ctx.strokeStyle = m.color || '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Rotating industrial drills structure
            ctx.rotate(m.angle || 0);
            
            // Draw 3 drill teeth
            ctx.fillStyle = '#27272a';
            ctx.strokeStyle = '#52525b';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / 3);
                ctx.beginPath();
                ctx.moveTo(-4, -m.radius);
                ctx.lineTo(4, -m.radius);
                ctx.lineTo(0, -m.radius + 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // Draw core spinner
            ctx.fillStyle = m.color || '#10b981';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Inner nuclear core dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Draw HP bar for mines (or below if top cuts off)
            const hpWidth = m.radius * 2;
            const hpHeight = 3.5;
            const hpx = m.pos.x - m.radius;
            let hpy = m.pos.y - m.radius - 8;
            if (hpy < 6) {
                hpy = m.pos.y + m.radius + 6;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(hpx, hpy, hpWidth, hpHeight);

            const hpPct = Math.max(0, Math.min(1.0, m.hp / m.maxHp));
            ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.2 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(hpx, hpy, hpWidth * hpPct, hpHeight);

            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(hpx, hpy, hpWidth, hpHeight);
        });
    }

    // Draw Active Control Tactical Fields
    if ((engine as any).activeControlFields && (engine as any).activeControlFields.length > 0) {
        (engine as any).activeControlFields.forEach((f: any) => {
            ctx.save();
            ctx.translate(f.pos.x, f.pos.y);

            const now = Date.now() / 1000;
            const lifePct = Math.max(0, Math.min(1.0, f.life / f.maxLife));

            if (f.type === 'shockwave_blast') {
                // Expanding kinetic shockwave ring
                const r = f.radius;
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 4 * lifePct;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();

                // Outer shockwave wave edge
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.lineWidth = 10 * lifePct;
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(0, r - 8), 0, Math.PI * 2);
                ctx.stroke();

                // Center impact burst
                ctx.fillStyle = `rgba(245, 158, 11, ${0.3 * lifePct})`;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            } else if (f.type === 'gravity_well') {
                // Swirling gravitational singularity
                const r = f.radius;
                
                // Outer gravity threshold ring
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Swirling vortex accretion disk
                const numRays = 8;
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
                ctx.lineWidth = 2.5;
                for (let i = 0; i < numRays; i++) {
                    const angle = (i * Math.PI * 2) / numRays + now * 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.7, angle, angle + Math.PI / 3);
                    ctx.stroke();
                }

                // Event horizon central black hole core
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#ec4899';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (f.type === 'temporal_freeze') {
                // Shimmering stasis freeze ring
                const r = f.radius;

                // Frost background fill
                ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // Outer chronos ring
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();

                // Chrono tick marks
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI * 2) / 12 + now * 0.5;
                    const x1 = Math.cos(angle) * (r - 10);
                    const y1 = Math.sin(angle) * (r - 10);
                    const x2 = Math.cos(angle) * r;
                    const y2 = Math.sin(angle) * r;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            } else if (f.type === 'toxin_cloud') {
                // Toxic green poisonous cloud at field location
                const r = f.radius;
                const lifePct = Math.max(0, Math.min(1, f.life / (f.maxLife || 6)));

                // Outer green haze
                const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
                grad.addColorStop(0, `rgba(74, 222, 128, ${0.28 * lifePct})`);
                grad.addColorStop(0.6, `rgba(21, 128, 61, ${0.22 * lifePct})`);
                grad.addColorStop(1, 'rgba(21, 128, 61, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // Pulsing inner toxin core
                const corePulse = 0.7 + Math.sin(now * 4 + (f.pos.x + f.pos.y) * 0.01) * 0.3;
                ctx.fillStyle = `rgba(163, 230, 53, ${0.5 * lifePct * corePulse})`;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.4 * corePulse, 0, Math.PI * 2);
                ctx.fill();

                // Poison droplet particles drifting
                ctx.fillStyle = `rgba(187, 253, 123, ${0.6 * lifePct})`;
                for (let i = 0; i < 5; i++) {
                    const a = now * 1.5 + i * 1.256;
                    const d = r * (0.4 + Math.sin(now * 2 + i * 1.7) * 0.25);
                    ctx.beginPath();
                    ctx.arc(Math.cos(a) * d, Math.sin(a * 0.7) * d * 0.6, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (f.type === 'incendiary_blast') {
                // Burning fire cone/zone at field location
                const r = f.radius;
                const lifePct = Math.max(0, Math.min(1, f.life / (f.maxLife || 2)));

                // Outer fire aura
                const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.5 * lifePct})`);
                grad.addColorStop(0.25, `rgba(251, 191, 36, ${0.5 * lifePct})`);
                grad.addColorStop(0.6, `rgba(249, 115, 22, ${0.35 * lifePct})`);
                grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // Fire flicker licks
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * lifePct})`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 7; i++) {
                    const a = now * 8 + i * 0.9;
                    const d = r * (0.5 + Math.sin(now * 5 + i * 2.3) * 0.3);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
                    const ex = Math.cos(a + 0.4) * d;
                    const ey = Math.sin(a + 0.4) * d;
                    ctx.quadraticCurveTo(
                        Math.cos(a + 0.2) * d * 0.7,
                        Math.sin(a + 0.2) * d * 0.7,
                        ex, ey
                    );
                    ctx.stroke();
                }

            } else if (f.type === 'arc_chain') {
                // Fading in-flight chain lightning arcs
                for (const arc of (f.arcTargets || [])) {
                    const alpha = Math.max(0, arc.life / 0.35);
                    const midX = (arc.from.x + arc.to.x) / 2 + Math.sin(now * 12 + arc.from.x) * 18;
                    const midY = (arc.from.y + arc.to.y) / 2 + Math.cos(now * 10 + arc.from.y) * 18;

                    // Outer discharge glow
                    ctx.strokeStyle = `rgba(125, 211, 252, ${0.7 * alpha})`;
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(arc.from.x, arc.from.y);
                    ctx.quadraticCurveTo(midX, midY, arc.to.x, arc.to.y);
                    ctx.stroke();

                    // Inner bright core
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(arc.from.x, arc.from.y);
                    ctx.quadraticCurveTo(midX, midY, arc.to.x, arc.to.y);
                    ctx.stroke();

                    // Branch sparks
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * alpha})`;
                    ctx.lineWidth = 1.5;
                    for (let b = 0; b < 3; b++) {
                        const ba = 0.33 + b * 0.33;
                        const bx = arc.from.x + (arc.to.x - arc.from.x) * ba;
                        const by = arc.from.y + (arc.to.y - arc.from.y) * ba;
                        const offX = Math.sin(now * 15 + b * 2 + arc.from.x) * 14;
                        const offY = Math.cos(now * 13 + b * 2 + arc.from.y) * 14;
                        ctx.beginPath();
                        ctx.moveTo(bx, by);
                        ctx.lineTo(bx + offX, by + offY);
                        ctx.stroke();
                    }
                }

            }

            ctx.restore();
        });
    }

    // Ghost Sentry Placement Preview Mode
    if (engine.placingTurretType && engine.pointerX !== undefined && engine.pointerY !== undefined) {
        const px = engine.pointerX;
        const py = engine.pointerY;
        const tType = engine.placingTurretType;

        let previewColor = '#06b6d4';
        let previewRadius = 16;
        let previewRange = 280;

        if (tType === 'turret_tesla') {
            previewColor = '#3b82f6';
            previewRadius = 16;
            previewRange = 280;
        } else if (tType === 'turret_sword') {
            previewColor = '#f97316';
            previewRadius = 18;
            previewRange = 75;
        } else if (tType === 'turret_autoshooter') {
            previewColor = '#a855f7';
            previewRadius = 16;
            previewRange = 380;
        } else if (tType === 'turret_ricochet') {
            previewColor = '#10b981';
            previewRadius = 16;
            previewRange = 385;
        } else if (tType === 'turret_shotgun') {
            previewColor = '#f43f5e';
            previewRadius = 16;
            previewRange = 280;
        } else if (tType === 'turret_fire') {
            previewColor = '#f97316';
            previewRadius = 16;
            previewRange = 250;
        } else if (tType === 'turret_shield') {
            previewColor = '#06b6d4';
            previewRadius = 18;
            previewRange = 160;
        } else if (tType === 'turret_bomb') {
            previewColor = '#f59e0b';
            previewRadius = 20;
            previewRange = 450;
        } else if (tType === 'turret_plasma') {
            previewColor = '#ec4899';
            previewRadius = 16;
            previewRange = 320;
        }

        ctx.save();
        ctx.translate(px, py);

        // Faint fill area for range check
        ctx.fillStyle = previewColor + '10'; // Translucent
        ctx.beginPath();
        ctx.arc(0, 0, previewRange, 0, Math.PI * 2);
        ctx.fill();

        // Dashed range outline
        ctx.strokeStyle = previewColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, previewRange, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // clear

        // Sentry base
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = previewColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, previewRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sentry center glass flash
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Ghost Mine Placement Preview Mode
    if ((engine as any).placingMineType && engine.pointerX !== undefined && engine.pointerY !== undefined) {
        const px = engine.pointerX;
        const py = engine.pointerY;
        const mType = (engine as any).placingMineType;

        let previewColor = '#10b981';
        let previewRadius = 13;
        if (mType === 'mine_heavy') {
            previewColor = '#f59e0b';
            previewRadius = 21;
        } else if (mType === 'mine_quantum') {
            previewColor = '#c084fc';
            previewRadius = 28;
        } else if (mType === 'mine_ultra') {
            previewColor = '#22d3ee';
            previewRadius = 34;
        }

        const checkOverlap = (pos1: any, r1: number, pos2: any, r2: number) => {
            if (!pos1 || !pos2) return false;
            return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y) < (r1 + r2) * 0.85;
        };
        const overlapsTurret = (engine.turrets || []).some((t: any) => checkOverlap(t.pos, t.radius, { x: px, y: py }, previewRadius));
        const overlapsMine = (engine.mines || []).some((m: any) => checkOverlap(m.pos, m.radius, { x: px, y: py }, previewRadius));
        const isOverlapping = overlapsTurret || overlapsMine;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = isOverlapping ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, previewRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isOverlapping ? '#ef4444' : previewColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, previewRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isOverlapping ? 'rgba(239, 68, 68, 0.6)' : previewColor;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw Projectiles
    engine.projectiles.forEach(p => {
      // Menacing Boss Projectiles
      if (p.isBossProjectile) {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        const pAngle = Math.atan2(p.vel.y, p.vel.x);
        ctx.rotate(pAngle);

        const now = Date.now();
        const pulse = Math.sin(now * 0.015) * 2.5;
        const rad = p.radius + pulse;

        // 1. Dark ominous outer aura
        ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, rad * 2.0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Heavy dark outline
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, rad + 2, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Fiery Menacing Core with gradient (radius-quantized cache; the
        // pulse animation quantizes to whole pixels, so the ramp is identical)
        const gradKey = Math.max(0, Math.round(rad));
        let grad = bossProjGradCache.get(gradKey);
        if (!grad) {
            grad = ctx.createRadialGradient(0, 0, 2, 0, 0, gradKey);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, '#fef08a');
            grad.addColorStop(0.55, '#ea580c');
            grad.addColorStop(1, '#991b1b');
            bossProjGradCache.set(gradKey, grad);
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fill();

        // 4. Jagged Menacing Energy Spikes revolving around projectile
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2.5;
        const spikeCount = 6;
        for (let i = 0; i < spikeCount; i++) {
            const spAng = (i / spikeCount) * Math.PI * 2 + now * 0.005;
            const len = rad * (1.25 + Math.sin(now * 0.02 + i) * 0.35);
            ctx.beginPath();
            ctx.moveTo(Math.cos(spAng) * (rad * 0.75), Math.sin(spAng) * (rad * 0.75));
            ctx.lineTo(Math.cos(spAng) * len, Math.sin(spAng) * len);
            ctx.stroke();
        }

        // 5. Heavy burning exhaust trail
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = rad * 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-rad * 2.2, 0);
        ctx.stroke();

        ctx.restore();
        return;
      }

      const isIceProj = Boolean(p.isIce || p.weaponType === 'ice_sword' || p.weaponType === 'glacial_greatsword' || p.weaponType === 'absolute_zero_siphon' || p.color === '#7dd3fc' || p.color === '#38bdf8' || p.color === '#e0f2fe');
      const isFireProj = Boolean(p.isFire || p.weaponType === 'fire_sword' || p.weaponType === 'solar_eclipse_blade' || p.weaponType === 'supernova_slayer' || p.weaponType === 'turret_fire' || p.color === '#f97316' || p.color === '#ef4444' || p.color === '#ea580c' || p.color === '#f59e0b');

      if (settings.simpleProjectiles) {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);

        // Optional high contrast outline
        if (settings.highContrast) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        const now = Date.now();

        // Fire effect for simple balls that are on fire
        if (isFireProj) {
          // Dynamic fire corona aura
          const firePulse = Math.sin(now * 0.02 + p.pos.x * 0.05) * 0.2 + 0.5;
          ctx.fillStyle = `rgba(249, 115, 22, ${firePulse * 0.45})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Licking flame sparks trailing backwards
          const angle = Math.atan2(p.vel.y, p.vel.x);
          ctx.save();
          ctx.rotate(angle);
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = Math.max(1.5, p.radius * 0.4);
          for (let i = 0; i < 3; i++) {
            const flameOffset = (i - 1) * p.radius * 0.45;
            const flameLen = p.radius * (1.2 + Math.sin(now * 0.03 + i * 2) * 0.5);
            ctx.beginPath();
            ctx.moveTo(-p.radius * 0.3, flameOffset);
            ctx.lineTo(-flameLen - p.radius, flameOffset * 1.4);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Ice effect for simple balls that are frozen / ice
        if (isIceProj) {
          // Shimmering frost aura
          const icePulse = Math.sin(now * 0.015 + p.pos.y * 0.05) * 0.2 + 0.6;
          ctx.fillStyle = `rgba(125, 211, 252, ${icePulse * 0.45})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 2.0, 0, Math.PI * 2);
          ctx.fill();

          // Rotating 4-point crystalline frost star
          ctx.save();
          ctx.rotate(now * 0.003 + p.pos.x * 0.01);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 4; i++) {
            const ang = (Math.PI / 2) * i;
            const gx = Math.cos(ang) * (p.radius + 3.5);
            const gy = Math.sin(ang) * (p.radius + 3.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(gx, gy);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Outer ball glow
        ctx.fillStyle = isIceProj ? '#7dd3fc' : (isFireProj ? '#f97316' : p.color);
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Base Simple Solid Ball
        ctx.fillStyle = isIceProj ? '#38bdf8' : (isFireProj ? '#ea580c' : p.color);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hot inner specular core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1.5, p.radius * 0.45), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
      }

      if (p.isIce) {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        const angle = Math.atan2(p.vel.y, p.vel.x);
        ctx.rotate(angle);

        // Optional high contrast outline for accessibility
        if (settings.highContrast) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p.radius * 2.7, 0);
          ctx.lineTo(p.radius * 0.3, -p.radius * 1.0);
          ctx.lineTo(-p.radius * 1.8, -p.radius * 0.5);
          ctx.lineTo(-p.radius * 0.6, p.radius * 0.2);
          ctx.lineTo(-p.radius * 1.4, p.radius * 0.9);
          ctx.lineTo(p.radius * 0.5, p.radius * 0.7);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.fillStyle = p.color;
        
        // Draw highly sharp, asymmetrical jagged glacier shards
        ctx.beginPath();
        ctx.moveTo(p.radius * 2.5, 0); // Very long needle-sharp tip
        ctx.lineTo(p.radius * 0.3, -p.radius * 0.9); // Top jagged notch
        ctx.lineTo(-p.radius * 1.6, -p.radius * 0.4); // Back upper tail notch
        ctx.lineTo(-p.radius * 0.5, p.radius * 0.2); // Inner notched step
        ctx.lineTo(-p.radius * 1.2, p.radius * 0.8); // Back lower tail notch
        ctx.lineTo(p.radius * 0.5, p.radius * 0.6); // Bottom right angled edge
        ctx.closePath();
        ctx.fill();

        // Draw intricate cracked 3D ice facets/cracks inside the shard for double refraction
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Central fracture line
        ctx.moveTo(-p.radius * 1.6, -p.radius * 0.4);
        ctx.lineTo(p.radius * 2.5, 0);
        // Secondary facet cracks
        ctx.moveTo(-p.radius * 0.5, p.radius * 0.2);
        ctx.lineTo(p.radius * 0.3, -p.radius * 0.9);
        ctx.moveTo(0, 0);
        ctx.lineTo(p.radius * 0.5, p.radius * 0.6);
        ctx.stroke();
        
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        const pAngle = Math.atan2(p.vel.y, p.vel.x);
        ctx.rotate(pAngle);

        if (settings.highContrast) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 2 + 2, p.radius + 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Plasma exhaust trail line extending backward along velocity
        const speedSq = p.vel.x * p.vel.x + p.vel.y * p.vel.y;
        const speed = speedSq > 0 ? Math.sqrt(speedSq) : 0;
        const trailLen = Math.min(32, Math.max(12, speed * 0.05));
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(2, p.radius * 1.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-trailLen, 0);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Fast outer glow shell (no software blur kernel)
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.30;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 2.4, Math.max(3.5, p.radius * 1.2), 0, 0, Math.PI * 2);
        ctx.fill();

        // High quality directional plasma energy bolt shell
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 1.8, Math.max(2.5, p.radius * 0.85), 0, 0, Math.PI * 2);
        ctx.fill();

        // Ultra hot white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(p.radius * 0.3, 0, p.radius * 0.9, Math.max(1.2, p.radius * 0.45), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });

    // Draw Enemies
    engine.enemies.forEach(e => {
      // Draw targeting laser from center if target exists
      if ((e as any).targetTurretId) {
          const targetPos = (e as any).targetTurretId;
          ctx.save();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5 + Math.sin(Date.now() * 0.05) * 1.0;
          ctx.globalAlpha = 0.70;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(e.pos.x, e.pos.y);
          ctx.lineTo(targetPos.x, targetPos.y);
          ctx.stroke();
          
          // Outer locking reticle
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(targetPos.x, targetPos.y, 15 + Math.sin(Date.now() * 0.03) * 5, 0, Math.PI * 2);
          ctx.stroke();
          
          // Target reticle crosshairs
          ctx.beginPath();
          ctx.moveTo(targetPos.x - 20, targetPos.y); ctx.lineTo(targetPos.x + 20, targetPos.y);
          ctx.moveTo(targetPos.x, targetPos.y - 20); ctx.lineTo(targetPos.x, targetPos.y + 20);
          ctx.stroke();
          ctx.restore();
      }

      // Draw Bio-Leech siphon tether line
      if ((e as any).tetherTarget) {
          const tPos = (e as any).tetherTarget;
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(e.pos.x, e.pos.y);
          ctx.lineTo(tPos.x, tPos.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
      }

      ctx.save();
      ctx.translate(e.pos.x, e.pos.y);
      
      const isBoss = e.isBoss;
      const isShielded = e.shieldHp && e.shieldHp > 0;
      
      // Subtle Pulse for mechanical feel
      const pulse = Math.sin(Date.now() * 0.008) * (isBoss ? 4 : 1.5);
      const visualRadius = e.radius + pulse;

      // Draw Rocket Thruster if enemy has thruster
      if (e.hasThruster) {
          ctx.save();
          const tAngle = e.thrusterAngle !== undefined ? e.thrusterAngle : Math.atan2(e.vel.y, e.vel.x);
          ctx.rotate(tAngle + Math.PI); // Point to rear of movement
          // Thruster casing
          ctx.fillStyle = '#1f2937';
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(visualRadius - 2, -6);
          ctx.lineTo(visualRadius + 9, -10);
          ctx.lineTo(visualRadius + 9, 10);
          ctx.lineTo(visualRadius - 2, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Rocket flame flickering
          const flameLen = 12 + Math.sin(Date.now() * 0.05 + e.pos.x) * 6;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(visualRadius + 9, -7);
          ctx.lineTo(visualRadius + 9 + flameLen, 0);
          ctx.lineTo(visualRadius + 9, 7);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(visualRadius + 9, -3.5);
          ctx.lineTo(visualRadius + 9 + flameLen * 0.55, 0);
          ctx.lineTo(visualRadius + 9, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
      }

      // Boss Glow/Aura
      if (isBoss) {
          // Rotating outer ring for bosses
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 10]);
          ctx.rotate(Date.now() * 0.001);
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.rotate(-Date.now() * 0.001);
      }

      // Shield Visual
      if (isShielded) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
          
          // Shield Hex Pattern or Pulse
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      }

      if (settings.highContrast) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = isBoss ? 10 : 6;
        ctx.beginPath();
        ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (settings.gfxEnemyDetail && !e.isFrozen) {
        // Enhanced body: hue-shifted shading, rim light and hot core
        drawEnemyBody(ctx, e.color, visualRadius, isBoss);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = isBoss ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = e.isFrozen ? '#7dd3fc' : e.color;
        ctx.strokeStyle = e.isFrozen ? '#fff' : '#fff';
        ctx.lineWidth = isBoss ? 4 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Frost / Slow overlay
      if (e.isFrozen) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, Math.PI * 0.2, Math.PI * 0.8);
          ctx.fill();
          
          // Ice shards
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          for(let i=0; i<3; i++) {
              const ang = (Date.now() * 0.002 + i) % (Math.PI * 2);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(ang) * visualRadius, Math.sin(ang) * visualRadius);
              ctx.stroke();
          }
      } else if (e.isSlowed) {
          ctx.save();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'; // bright ice-blue overlay
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#7dd3fc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
      }

      // Fire Overlay
      if (e.isOnFire) {
          ctx.save();
          const pulse = Math.sin(Date.now() * 0.015) * 0.15 + 0.35;
          ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`; // Pulsing bright hot orange overlay
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();

          // Licking Flame visual arcs
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
              const angVal = (Date.now() * 0.004 + (i * Math.PI / 2)) % (Math.PI * 2);
              const fH = visualRadius * (0.35 + Math.random() * 0.2);
              ctx.beginPath();
              ctx.moveTo(Math.cos(angVal) * visualRadius, Math.sin(angVal) * visualRadius);
              ctx.lineTo(Math.cos(angVal) * (visualRadius + fH), Math.sin(angVal) * (visualRadius + fH) - 4);
              ctx.stroke();
          }
          ctx.restore();
      }

      // Corrosive Acid Overlay
      if ((e as any).isCorroded) {
          ctx.save();
          const acidPulse = Math.sin(Date.now() * 0.012) * 0.2 + 0.4;
          ctx.fillStyle = `rgba(163, 230, 53, ${acidPulse})`; // Pulsing bright radioactive acid lime-green overlay
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();

          // Acid bubble visual rings
          ctx.strokeStyle = '#84cc16';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 4 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
      }

      // Mechanical Details & Force Fields
      ctx.save();
      
      // A. Force Fields Rendering (Golden Spawn Shield, Cyan Periodic Shell, Front Orange Deflector, Rotating Magenta Vulnerable Ring)
      if (e.forceFieldType) {
          if (e.forceFieldType === 'SPAWN_IMMUNITY' && e.forceFieldTimer !== undefined && e.forceFieldTimer > -0.5) {
              ctx.save();
              const opacity = e.forceFieldTimer > 0 
                  ? 1.0 
                  : Math.max(0.0, (0.5 + e.forceFieldTimer) / 0.5);
              ctx.strokeStyle = `rgba(245, 158, 11, ${opacity * 0.8})`;
              ctx.lineWidth = (4 + Math.sin(Date.now() * 0.02) * 1.5) * opacity;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 11, 0, Math.PI * 2);
              ctx.stroke();
              
              // Duration sweep ring
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.55})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 14, 0, (Math.PI * 2) * Math.max(0, e.forceFieldTimer / 1.0));
              ctx.stroke();
              ctx.restore();
          } else if (e.forceFieldType === 'PERIODIC') {
              ctx.save();
              const isActive = e.forceFieldState === true;
              ctx.strokeStyle = isActive ? '#01edf2' : 'rgba(1, 237, 242, 0.2)';
              ctx.lineWidth = isActive ? 4 : 1.5;
              if (!isActive) {
                  ctx.setLineDash([4, 4]);
              }
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 10, 0, Math.PI * 2);
              ctx.stroke();
              
              if (e.forceFieldTimer) {
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                  ctx.lineWidth = 1.2;
                  ctx.setLineDash([]);
                  ctx.beginPath();
                  ctx.arc(0, 0, visualRadius + 13, 0, (Math.PI * 2) * (e.forceFieldTimer / 3.0));
                  ctx.stroke();
              }
              ctx.restore();
          } else if (e.forceFieldType === 'DIRECTIONAL') {
              ctx.save();
              ctx.rotate(e.forceFieldAngle || 0);
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 9, -1.0, 1.0);
              ctx.stroke();
              
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 6, -1.0, 1.0);
              ctx.stroke();
              ctx.restore();
          } else if (e.forceFieldType === 'VULNERABLE') {
              ctx.save();
              ctx.rotate(e.forceFieldAngle || 0);
              ctx.strokeStyle = '#ec4899';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius + 11, 0.65, Math.PI * 2 - 0.65);
              ctx.stroke();
              
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(Math.cos(0.65) * (visualRadius + 11), Math.sin(0.65) * (visualRadius + 11), 3.5, 0, Math.PI * 2);
              ctx.arc(Math.cos(-0.65) * (visualRadius + 11), Math.sin(-0.65) * (visualRadius + 11), 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
          }
      }

      // B. Mechanics Details Rendering
      if (e.enemyType === 'SHOOTER' || e.enemyType === 'GUNNER') {
          // Add a barrel pointing at player
          const angle = Math.atan2(engine.player.pos.y - e.pos.y, engine.player.pos.x - e.pos.x);
          ctx.rotate(angle);
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(visualRadius - 5, -6, 18, 12);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(visualRadius - 5, -6, 18, 12);
      } else if (e.enemyType === 'TANK') {
          // Heavy armor spikes
          ctx.fillStyle = e.color;
          for(let i=0; i<4; i++) {
              ctx.rotate(Math.PI/2);
              ctx.beginPath();
              ctx.moveTo(visualRadius - 5, -10);
              ctx.lineTo(visualRadius + 12, 0);
              ctx.lineTo(visualRadius - 5, 10);
              ctx.fill();
              ctx.stroke();
          }
      } else if (e.enemyType === 'SHIELDED') {
          // Inner core pattern
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-visualRadius/2, -visualRadius/2);
          ctx.lineTo(visualRadius/2, visualRadius/2);
          ctx.moveTo(visualRadius/2, -visualRadius/2);
          ctx.lineTo(-visualRadius/2, visualRadius/2);
          ctx.stroke();
      } else if (e.enemyType === 'BOMBER') {
          // Dangerous pulsing core
          ctx.fillStyle = '#ef4444';
          const bPulse = Math.sin(Date.now() * 0.02) * 5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + bPulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
      } else if (e.enemyType === 'SWARMER') {
          // Winged bug look
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.ellipse(0, 0, visualRadius, visualRadius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(-visualRadius, 0);
          ctx.lineTo(-visualRadius - 10, -10 * Math.sin(Date.now() * 0.05));
          ctx.moveTo(visualRadius, 0);
          ctx.lineTo(visualRadius + 10, -10 * Math.sin(Date.now() * 0.05));
          ctx.stroke();
      } else if (e.enemyType === 'PHANTOM') {
          // Ghostly flicker
          ctx.globalAlpha = 0.3 + Math.random() * 0.4;
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
      } else if (e.enemyType === 'TESLA_COIL') {
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius - 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.rotate(Date.now() * 0.003);
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 4; i++) {
              ctx.rotate(Math.PI / 2);
              ctx.fillRect(visualRadius - 4, -2, 6, 4);
          }
      } else if (e.enemyType === 'GRAVITY_DRAIN') {
          ctx.rotate(-Date.now() * 0.005);
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < 18; i++) {
              const r = visualRadius * (i / 18);
              const th = (i * Math.PI) / 6;
              ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r);
          }
          ctx.stroke();
      } else if (e.enemyType === 'MIRAGE') {
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(Math.sin(Date.now() * 0.02) * 3, Math.cos(Date.now() * 0.02) * 3, visualRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#14b8a6';
          ctx.beginPath();
          ctx.arc(Math.cos(Date.now() * 0.02) * 3, Math.sin(Date.now() * 0.02) * 3, visualRadius - 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
      } else if (e.enemyType === 'CRYOMANCER') {
          ctx.fillStyle = '#22d3ee';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 6; i++) {
              ctx.rotate(Math.PI / 3);
              ctx.beginPath();
              ctx.moveTo(visualRadius - 4, -4);
              ctx.lineTo(visualRadius + 8, 0);
              ctx.lineTo(visualRadius - 4, 4);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
          }
      } else if (e.enemyType === 'STALKER') {
          const isFaded = e.hurtTimer && e.hurtTimer > 0;
          ctx.globalAlpha = isFaded ? 0.8 : 0.15;
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#27272a';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius - 2, 0, Math.PI * 2);
          ctx.fill();
      } else if (e.enemyType === 'HEALER') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(10, 0);
          ctx.moveTo(0, -10);
          ctx.lineTo(0, 10);
          ctx.stroke();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1;
          const outerPulse = visualRadius + Math.sin(Date.now() * 0.01) * 4;
          ctx.beginPath();
          ctx.arc(0, 0, outerPulse, 0, Math.PI * 2);
          ctx.stroke();
      } else if (e.enemyType === 'WARP_WARLOCK') {
          // Chrono Distortion rune rings
          ctx.rotate(Date.now() * 0.002);
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(visualRadius - 2, -6);
              ctx.lineTo(visualRadius + 10, 0);
              ctx.lineTo(visualRadius - 2, 6);
              ctx.stroke();
          }
      } else if (e.enemyType === 'PLASMA_STORMER') {
          // Crackling ion storm coils
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + 4, 0, Math.PI * 2);
          ctx.stroke();
          // Revolving ion sparks
          const t = Date.now() * 0.006;
          ctx.fillStyle = '#0284c7';
          for (let i = 0; i < 3; i++) {
              const a = t + (i * Math.PI * 2) / 3;
              const ix = Math.cos(a) * (visualRadius + 8);
              const iy = Math.sin(a) * (visualRadius + 8);
              ctx.beginPath();
              ctx.arc(ix, iy, 4, 0, Math.PI * 2);
              ctx.fill();
          }
      } else if (e.enemyType === 'BIO_LEECH') {
          // Pulsing organic biological leech core
          const bPulse = Math.sin(Date.now() * 0.015) * 4;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + bPulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius * 0.55, 0, Math.PI * 2);
          ctx.fill();
      } else if (e.enemyType === 'VOID_MARAUDER') {
          // Blink predator: dark violet core with a wispy warp aura
          const vPulse = Math.sin(Date.now() * 0.008) * 3;
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + vPulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          // Twin warp wisps orbiting
          const wt = Date.now() * 0.004;
          ctx.fillStyle = '#c4b5fd';
          for (let i = 0; i < 2; i++) {
              const wa = wt + i * Math.PI;
              ctx.beginPath();
              ctx.arc(Math.cos(wa) * (visualRadius + 6), Math.sin(wa) * (visualRadius + 6), 3.5, 0, Math.PI * 2);
              ctx.fill();
          }
      } else if (e.enemyType === 'TIME_EATER') {
          // Temporal parasite: golden clockwork core with orbiting chrono ticks
          const tPulse = Math.sin(Date.now() * 0.012) * 3;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + tPulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius * 0.62, 0, Math.PI * 2);
          ctx.fill();
          // Rotating tick marks like a clock face
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 2;
          const ct = Date.now() * 0.002;
          for (let i = 0; i < 4; i++) {
              const ta = ct + (i / 4) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(Math.cos(ta) * (visualRadius * 0.4), Math.sin(ta) * (visualRadius * 0.4));
              ctx.lineTo(Math.cos(ta) * (visualRadius * 0.85), Math.sin(ta) * (visualRadius * 0.85));
              ctx.stroke();
          }
      } else if (e.enemyType === 'SINGULARITY_SEED') {
          // Collapsing core: dark indigo sphere with a tight accretion ring
          const sPulse = Math.sin(Date.now() * 0.02) * 4;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, visualRadius);
          grad.addColorStop(0, '#000');
          grad.addColorStop(0.7, '#1e1b4b');
          grad.addColorStop(1, '#6366f1');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + sPulse, 0, Math.PI * 2);
          ctx.stroke();
      } else if (e.enemyType === 'PLAGUE_SPREADER') {
          // Contagion carrier: sickly green bloated core with dripping spore sacs
          const pPulse = Math.sin(Date.now() * 0.009) * 3;
          ctx.fillStyle = '#4d7c0f';
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#84cc16';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + pPulse, 0, Math.PI * 2);
          ctx.stroke();
          // Spore sacs around the rim
          ctx.fillStyle = '#a3e635';
          for (let i = 0; i < 6; i++) {
              const sa = (i / 6) * Math.PI * 2 + (Date.now() * 0.001);
              ctx.beginPath();
              ctx.arc(Math.cos(sa) * (visualRadius - 4), Math.sin(sa) * (visualRadius - 4), 4, 0, Math.PI * 2);
              ctx.fill();
          }
      } else if (e.enemyType === 'FROST_TYRANT') {
          // Blizzard tyrant: icy white-blue core with crystal shards orbiting
          const fPulse = Math.sin(Date.now() * 0.01) * 3;
          const fGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, visualRadius);
          fGrad.addColorStop(0, '#e0f2fe');
          fGrad.addColorStop(0.6, '#67e8f9');
          fGrad.addColorStop(1, '#164e63');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a5f3fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, visualRadius + fPulse, 0, Math.PI * 2);
          ctx.stroke();
          // Crystal shards
          ctx.fillStyle = '#22d3ee';
          for (let i = 0; i < 5; i++) {
              const sa = (i / 5) * Math.PI * 2 + (Date.now() * 0.002);
              ctx.beginPath();
              ctx.moveTo(Math.cos(sa) * (visualRadius - 3), Math.sin(sa) * (visualRadius - 3));
              ctx.lineTo(Math.cos(sa + 0.12) * (visualRadius + 9), Math.sin(sa + 0.12) * (visualRadius + 9));
              ctx.lineTo(Math.cos(sa - 0.12) * (visualRadius + 9), Math.sin(sa - 0.12) * (visualRadius + 9));
              ctx.closePath();
              ctx.fill();
          }
      } else if (e.isBoss) {
          const subtype = e.bossSubtype || 'WARRIOR';
          
          if (subtype === 'WARRIOR') {
              // Menacing Oversized Heavy Dread Twin-Cannons!
              ctx.save();
              ctx.rotate(Math.atan2(engine.player.pos.y - e.pos.y, engine.player.pos.x - e.pos.x));
              for (const side of [-1, 1]) {
                  const cy0 = side < 0 ? -34 : 20;
                  // Mount collar
                  drawMetalPlate(ctx, visualRadius - 10, cy0 + 1, 14, 12, '#1f2937', shadeColor('#f87171', -0.2), 3);
                  // Heavy cannon body, softly shaded to match the ball look
                  drawMetalPlate(ctx, visualRadius - 6, cy0, 34, 14, '#374151', '#f87171', 3);
                  // Barrel bore: dark recess with glowing muzzle ring
                  ctx.fillStyle = '#0b0b10';
                  ctx.beginPath();
                  ctx.arc(visualRadius + 26, cy0 + 7, 4.2, 0, Math.PI * 2);
                  ctx.fill();
                  const mz = ctx.createRadialGradient(visualRadius + 27, cy0 + 7, 0, visualRadius + 27, cy0 + 7, 8);
                  mz.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
                  mz.addColorStop(1, 'rgba(239, 68, 68, 0)');
                  ctx.fillStyle = mz;
                  ctx.beginPath();
                  ctx.arc(visualRadius + 27, cy0 + 7, 8, 0, Math.PI * 2);
                  ctx.fill();
              }
              ctx.restore();
          } else if (subtype === 'TITAN') {
              // Massive Heavy fortified Dread plates with 3D bevel + rivets
              ctx.save();
              for(let i=0; i<6; i++) {
                  ctx.rotate(Math.PI/3);
                  drawMetalPlate(ctx, visualRadius - 8, -20, 30, 40, '#1e293b', '#f59e0b', 4);
                  // Soft amber accent line on the plate's outer face
                  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(visualRadius + 6, -8);
                  ctx.lineTo(visualRadius + 6, 8);
                  ctx.stroke();
              }
              ctx.restore();
          } else if (subtype === 'STORM_BRINGER') {
              // Crackling core & massive storm arcs
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3;
              for(let i=0; i<6; i++) {
                  const ang = Math.random() * Math.PI * 2;
                  const targetR = visualRadius * (0.9 + Math.random() * 0.6);
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(Math.cos(ang) * targetR, Math.sin(ang) * targetR);
                  ctx.stroke();
              }
          } else if (subtype === 'PHANTOM_ACE') {
              // Massive razor shard perimeter
              ctx.globalAlpha = 0.75;
              for(let i=0; i<8; i++) {
                  const ang = (i / 8) * Math.PI * 2 + (Date.now() * 0.0025);
                  const dist = visualRadius + Math.sin(Date.now() * 0.005 + i) * 14;
                  ctx.fillStyle = e.color;
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(Math.cos(ang) * (dist + 8), Math.sin(ang) * (dist + 8));
                  ctx.lineTo(Math.cos(ang+0.25) * (dist-20), Math.sin(ang+0.25) * (dist-20));
                  ctx.lineTo(Math.cos(ang-0.25) * (dist-20), Math.sin(ang-0.25) * (dist-20));
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
              }
              ctx.globalAlpha = 1.0;
          } else if (subtype === 'SWARM_QUEEN') {
              // Massive Organic Hive appendage clusters
              ctx.fillStyle = '#14532d';
              for(let i=0; i<12; i++) {
                  const ang = (i / 12) * Math.PI * 2 + (Date.now() * 0.001);
                  const r = 20;
                  ctx.beginPath();
                  ctx.arc(Math.cos(ang) * (visualRadius - 6), Math.sin(ang) * (visualRadius - 6), r, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = '#22c55e';
                  ctx.lineWidth = 2.5;
                  ctx.stroke();
              }
          } else if (subtype === 'VOID_SENTINEL') {
              // Massive Dark core with event horizon & abyssal spikes
              const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, visualRadius * 1.2);
              grad.addColorStop(0, '#000');
              grad.addColorStop(0.75, '#09090b');
              grad.addColorStop(1, '#a855f7');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius * 1.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#c084fc';
              ctx.lineWidth = 3;
              ctx.stroke();
          } else if (subtype === 'ARCHITECT') {
              // Massive spiky crystal dread spikes
              ctx.fillStyle = '#7c3aed';
              for(let i=0; i<8; i++) {
                  ctx.rotate(Math.PI/4);
                  ctx.beginPath();
                  ctx.moveTo(visualRadius + 22, 0);
                  ctx.lineTo(visualRadius - 20, -18);
                  ctx.lineTo(visualRadius - 20, 18);
                  ctx.closePath();
                  ctx.fill();
                  ctx.strokeStyle = '#e9d5ff';
                  ctx.lineWidth = 2;
                  ctx.stroke();
              }
          } else if (subtype === 'REAPER') {
              // Menacing giant scythe protrusions
              ctx.fillStyle = '#b91c1c';
              for(let i=0; i<3; i++) {
                  ctx.rotate((Math.PI * 2) / 3);
                  ctx.beginPath();
                  ctx.moveTo(visualRadius, 0);
                  ctx.quadraticCurveTo(visualRadius + 44, 28, visualRadius + 16, 56);
                  ctx.lineTo(visualRadius - 12, 14);
                  ctx.closePath();
                  ctx.fill();
                  ctx.strokeStyle = '#fee2e2';
                  ctx.lineWidth = 2.5;
                  ctx.stroke();
              }
          } else if (subtype === 'CHRONO_WARDEN') {
              // Chrono warden: golden clockwork rings with rotating hour markers
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 3;
              const ringPulse = Math.sin(Date.now() * 0.006) * 4;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius * 0.85 + ringPulse, 0, Math.PI * 2);
              ctx.stroke();
              // Hour markers
              ctx.fillStyle = '#fde68a';
              for (let i = 0; i < 12; i++) {
                  const ha = (i / 12) * Math.PI * 2 + (Date.now() * 0.0006);
                  ctx.beginPath();
                  ctx.arc(Math.cos(ha) * (visualRadius * 0.85), Math.sin(ha) * (visualRadius * 0.85), 3, 0, Math.PI * 2);
                  ctx.fill();
              }
              // Giant sweeping hand
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 3.5;
              const handAng = Date.now() * 0.0025;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(handAng) * visualRadius * 1.15, Math.sin(handAng) * visualRadius * 1.15);
              ctx.stroke();
          } else if (subtype === 'GRAVITON_CORE') {
              // Graviton core: dark indigo mass with swirling accretion rings
              const gGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, visualRadius * 1.1);
              gGrad.addColorStop(0, '#000');
              gGrad.addColorStop(0.65, '#1e1b4b');
              gGrad.addColorStop(1, '#6366f1');
              ctx.fillStyle = gGrad;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius * 1.05, 0, Math.PI * 2);
              ctx.fill();
              // Triple swirling accretion rings
              ctx.strokeStyle = '#818cf8';
              ctx.lineWidth = 2.5;
              for (let r = 0; r < 3; r++) {
                  ctx.beginPath();
                  ctx.ellipse(0, 0, visualRadius * (0.5 + r * 0.28), visualRadius * (0.22 + r * 0.12), Date.now() * (0.001 + r * 0.0006), 0, Math.PI * 2);
                  ctx.stroke();
              }
          } else if (subtype === 'PLAGUE_LORD') {
              // Plague lord: massive bloated bile-green mass with pulsing boils
              ctx.fillStyle = '#365314';
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#84cc16';
              ctx.lineWidth = 3;
              ctx.stroke();
              // Pulsing boils
              for (let i = 0; i < 8; i++) {
                  const ba = (i / 8) * Math.PI * 2 + (Date.now() * 0.0008);
                  const boilPulse = 5 + Math.sin(Date.now() * 0.01 + i) * 2.5;
                  ctx.fillStyle = '#a3e635';
                  ctx.beginPath();
                  ctx.arc(Math.cos(ba) * (visualRadius * 0.65), Math.sin(ba) * (visualRadius * 0.65), boilPulse, 0, Math.PI * 2);
                  ctx.fill();
              }
          } else if (subtype === 'CRYO_SOVEREIGN') {
              // Cryo sovereign: glacial crystal fortress with orbiting ice shards
              const cGrad = ctx.createRadialGradient(-4, -4, 0, 0, 0, visualRadius);
              cGrad.addColorStop(0, '#e0f2fe');
              cGrad.addColorStop(0.55, '#67e8f9');
              cGrad.addColorStop(1, '#0e7490');
              ctx.fillStyle = cGrad;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#a5f3fc';
              ctx.lineWidth = 3;
              ctx.stroke();
              // Hexagonal ice facets
              ctx.strokeStyle = 'rgba(224, 242, 254, 0.6)';
              ctx.lineWidth = 2;
              for (let i = 0; i < 6; i++) {
                  const fa = (i / 6) * Math.PI * 2 + (Date.now() * 0.0004);
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(Math.cos(fa) * visualRadius * 0.92, Math.sin(fa) * visualRadius * 0.92);
                  ctx.stroke();
              }
              // Orbiting shards
              ctx.fillStyle = '#22d3ee';
              for (let i = 0; i < 6; i++) {
                  const sa = (i / 6) * Math.PI * 2 + (Date.now() * 0.0015);
                  ctx.beginPath();
                  ctx.arc(Math.cos(sa) * (visualRadius + 16), Math.sin(sa) * (visualRadius + 16), 5, 0, Math.PI * 2);
                  ctx.fill();
              }
          } else if (subtype === 'NEXUS_OVERLORD') {
              // Giant doom machine visual: dark metallic hexagonal core with hyper-glowing cyber design
              ctx.fillStyle = '#1e1b4b'; // deep violet-indigo hull
              ctx.strokeStyle = e.color || '#f43f5e'; // shifting neon aura
              ctx.lineWidth = 4;
              ctx.beginPath();
              // Draw a massive hexagon
              for (let i = 0; i < 6; i++) {
                  const ang = (i / 6) * Math.PI * 2 + (Date.now() * 0.001);
                  const px = Math.cos(ang) * visualRadius;
                  const py = Math.sin(ang) * visualRadius;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Shifting energy ring
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(0, 0, visualRadius * 0.75 + Math.sin(Date.now() * 0.01) * 6, 0, Math.PI * 2);
              ctx.stroke();

              // Spinning outer turrets visually anchored to the boss
              for (let i = 0; i < 4; i++) {
                  const ang = (i / 4) * Math.PI * 2 - (Date.now() * 0.0015);
                  const tx = Math.cos(ang) * (visualRadius + 15);
                  const ty = Math.sin(ang) * (visualRadius + 15);
                  // Shaded dome turret base
                  const dome = ctx.createRadialGradient(tx - 4, ty - 4, 1, tx, ty, 13);
                  dome.addColorStop(0, '#a1a1aa');
                  dome.addColorStop(0.55, '#52525b');
                  dome.addColorStop(1, '#18181b');
                  ctx.fillStyle = dome;
                  ctx.beginPath();
                  ctx.arc(tx, ty, 12, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = '#ef4444';
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                  // Twin barrel block aimed outward
                  ctx.save();
                  ctx.translate(tx, ty);
                  ctx.rotate(ang + Math.PI);
                  drawMetalPlate(ctx, 0, -5, 16, 10, '#27272a', '#3f3f46', 2);
                  ctx.fillStyle = '#ef4444';
                  ctx.fillRect(14, -4, 2.5, 3);
                  ctx.fillRect(14, 1, 2.5, 3);
                  ctx.restore();
              }
          }

          // Shared: Single big center eye that always tracks the player
          const eyeR = Math.max(12, visualRadius * 0.62);
          const trackAng = Math.atan2(pPos.y - e.pos.y, pPos.x - e.pos.x);
          // Sclera: deep socket with a subtle inner depth ring so it reads recessed
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = shadeColor(e.color, -0.7);
          ctx.lineWidth = Math.max(1.5, eyeR * 0.08);
          ctx.beginPath();
          ctx.arc(0, 0, eyeR - ctx.lineWidth * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          // Layered gaze: the black pupil locks on instantly and stretches
          // toward you with distance; the colored iris follows the same motion
          // but delayed and gentler, since it is the bigger, heavier layer.
          const prevGaze = e.eyeGaze ?? trackAng;
          let gazeDelta = trackAng - prevGaze;
          while (gazeDelta > Math.PI) gazeDelta -= Math.PI * 2;
          while (gazeDelta < -Math.PI) gazeDelta += Math.PI * 2;
          const irisAng = prevGaze + gazeDelta * 0.08; // smoothed, lagging follow
          e.eyeGaze = irisAng;

          const gazeDist = Math.hypot(pPos.x - e.pos.x, pPos.y - e.pos.y);
          const gazeReach = Math.min(1, gazeDist / 500) * 0.65 + 0.35; // farther = looks harder

          // Iris (colored): delayed, softer drift toward the player.
          // Gradient geometry is drawn in a local translate+rotate frame so
          // the ramps can be cached per (color, radius); this avoids building
          // two fresh gradients for every boss on every frame.
          const irisR = eyeR * 0.62;
          const irisOff = eyeR * 0.22 * gazeReach;
          const irisX = Math.cos(irisAng) * irisOff;
          const irisY = Math.sin(irisAng) * irisOff;
          const irisRq = Math.max(1, Math.round(irisR));
          const irisKey = `I|${e.color}|${irisRq}`;
          let irisGrad = bossEyeGradCache.get(irisKey);
          if (!irisGrad) {
            irisGrad = ctx.createRadialGradient(irisRq * 0.4, 0, irisRq * 0.15, 0, 0, irisRq);
            irisGrad.addColorStop(0, shadeColor(e.color, 0.35));
            irisGrad.addColorStop(0.6, e.color);
            irisGrad.addColorStop(1, shadeColor(e.color, -0.55));
            if (bossEyeGradCache.size > 256) bossEyeGradCache.clear();
            bossEyeGradCache.set(irisKey, irisGrad);
          }
          ctx.save();
          ctx.translate(irisX, irisY);
          ctx.rotate(irisAng);
          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.arc(0, 0, irisR, 0, Math.PI * 2);
          ctx.fill();
          // Iris fibers: thin radial spokes for organic texture
          ctx.strokeStyle = shadeColor(e.color, -0.45);
          ctx.lineWidth = Math.max(1, eyeR * 0.045);
          ctx.beginPath();
          for (let f = 0; f < 10; f++) {
            const fa = (f / 10) * Math.PI * 2;
            ctx.moveTo(Math.cos(fa) * irisR * 0.55, Math.sin(fa) * irisR * 0.55);
            ctx.lineTo(Math.cos(fa) * irisR * 0.92, Math.sin(fa) * irisR * 0.92);
          }
          ctx.stroke();
          ctx.restore();
          // Pupil: the free-moving black core, always locked on you and
          // pushing further out the farther away you are
          const pupilR = irisR * 0.52;
          const pupilOff = eyeR * 0.34 * gazeReach;
          const pupilX = Math.cos(trackAng) * pupilOff;
          const pupilY = Math.sin(trackAng) * pupilOff;
          const pupilRq = Math.max(1, Math.round(pupilR));
          const pupilKey = `P|${pupilRq}`;
          let pupilGrad = bossEyeGradCache.get(pupilKey);
          if (!pupilGrad) {
            pupilGrad = ctx.createRadialGradient(0, 0, pupilRq * 0.2, 0, 0, pupilRq);
            pupilGrad.addColorStop(0, '#1a1024');
            pupilGrad.addColorStop(1, '#000');
            bossEyeGradCache.set(pupilKey, pupilGrad);
          }
          ctx.save();
          ctx.translate(pupilX, pupilY);
          ctx.fillStyle = pupilGrad;
          ctx.beginPath();
          ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
      }
      ctx.restore();

      if (!isBoss) {
        // HP Bar (Sleek line): bosses use the dedicated top health bar instead
        const hpWidth = (e.hp / e.maxHp) * e.radius * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-e.radius, -e.radius - 8, e.radius * 2, 2);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(-e.radius, -e.radius - 8, hpWidth, 2);

        // Shield HP bar
        if (e.maxShieldHp && e.maxShieldHp > 0) {
            const sHpWidth = (e.shieldHp! / e.maxShieldHp) * e.radius * 2;
            ctx.fillStyle = '#0ea5e9';
            ctx.fillRect(-e.radius, -e.radius - 12, sHpWidth, 2);
        }
      }

      ctx.restore();
    });

    // Draw Player
    const p = engine.player;
    
    // Draw Tactical Overdrive active elements
    if (engine.gameMode === 'OVERDRIVE' || engine.gameMode === 'OVERDRIVE_SANDBOX') {
      // 0. Draw Directional Redirection Lasso Pulling force
      if (engine.deflectLassoTarget && engine.deflectLassoTimer > 0) {
        ctx.save();
        const startX = p.pos.x;
        const startY = p.pos.y;
        const endX = engine.deflectLassoTarget.x;
        const endY = engine.deflectLassoTarget.y;
        
        const opacity = Math.min(1.0, engine.deflectLassoTimer / 0.25);
        
        ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
        ctx.lineWidth = 3.5 * opacity;
        
        // Draw a springy lasso with segment arcs that shows pulling action
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.hypot(dx, dy);
        const segments = 15;
        
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const currX = startX + dx * t;
          const currY = startY + dy * t;
          
          // Sine wave oscillation based on current timer to look elastic/springy
          const waveAmp = 14 * Math.sin(t * Math.PI) * (engine.deflectLassoTimer / 0.25);
          const angle = Math.atan2(dy, dx) + Math.PI / 2;
          const offset = Math.sin(t * Math.PI * 3 + Date.now() * 0.045) * waveAmp;
          
          ctx.lineTo(currX + Math.cos(angle) * offset, currY + Math.sin(angle) * offset);
        }
        ctx.stroke();
        
        // Glow anchor point
        ctx.beginPath();
        ctx.arc(endX, endY, 6 * opacity, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`;
        ctx.fill();
        ctx.restore();
      }

      // 1. Draw Gravity Tether connection beam
      if (engine.isTetherActive) {
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -Date.now() * 0.08;
        ctx.beginPath();
        ctx.moveTo(p.pos.x, p.pos.y);
        ctx.lineTo(engine.pointerX, engine.pointerY);
        ctx.stroke();
        ctx.restore();

        // Targeting reticle HUD on cursor position
        ctx.save();
        ctx.translate(engine.pointerX, engine.pointerY);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(Date.now() * 0.002);
        ctx.beginPath();
        ctx.moveTo(-18, 0); ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0); ctx.lineTo(18, 0);
        ctx.moveTo(0, -18); ctx.lineTo(0, -10);
        ctx.moveTo(0, 10); ctx.lineTo(0, 18);
        ctx.stroke();
        ctx.restore();
      }

      // 1.5 Draw dual subtle cursor loading indicators around pointer if controls are unlocked
      if (p.stats.isControlUnlocked && engine.pointerX !== undefined && engine.pointerY !== undefined) {
        ctx.save();
        ctx.translate(engine.pointerX, engine.pointerY);

        // Define a helper to determine max cooldown
        const getControlMaxCd = (id: string, level: number) => {
          if (id === 'redirection_pull') {
            const reductionCount = p.stats.deflectCooldownReduction || 0;
            return Math.max(0.5, 5.0 - reductionCount * 0.1);
          } else if (id === 'gravity_tether') {
            const stabilizer = p.stats.ownedControls?.find(c => c.id === 'stabilizer');
            const reduction = stabilizer ? stabilizer.level * 1.5 : 0;
            return Math.max(1.0, 10.0 - reduction);
          } else if (id === 'gravity_warp') {
            return Math.max(3.0, 10.0 - (level - 1) * 0.8);
          } else if (id === 'reflective_pulse') {
            return Math.max(2.0, 8.0 - (level - 1) * 0.5);
          } else if (id === 'nitro_jet') {
            return Math.max(1.5, 4.0 - (level - 1) * 0.3);
          } else if (id === 'shock_blast' || id === 'shockwave_blast') {
            return Math.max(2.0, 6.0 - (level - 1) * 0.5);
          } else if (id === 'gravity_well') {
            return Math.max(3.0, 8.0 - (level - 1) * 0.6);
          } else if (id === 'temporal_freeze') {
            return Math.max(4.0, 12.0 - (level - 1) * 0.8);
          }
          return 1.0;
        };

        // Left click cooldown
        const leftId = p.stats.leftClickSlot;
        let leftPercent = 1.0;
        if (leftId) {
          const leftLevel = p.stats.ownedControls?.find(c => c.id === leftId)?.level || 1;
          const leftRemaining = p.stats.controlCooldowns?.[leftId] || 0;
          const leftMax = getControlMaxCd(leftId, leftLevel);
          leftPercent = leftRemaining > 0 ? Math.max(0, 1.0 - leftRemaining / leftMax) : 1.0;
        }

        // Right click cooldown
        const rightId = p.stats.rightClickSlot;
        let rightPercent = 1.0;
        let rightIsActive = false;
        let rightIsLocked = false;
        if (rightId) {
          if (rightId === 'gravity_tether') {
            rightIsActive = engine.isTetherActive;
            if (engine.tetherDisableTimer > 0) {
              rightIsLocked = true;
              const maxLock = getControlMaxCd('gravity_tether', 1);
              rightPercent = Math.max(0, 1.0 - engine.tetherDisableTimer / maxLock);
            }
          } else {
            const rightLevel = p.stats.ownedControls?.find(c => c.id === rightId)?.level || 1;
            const rightRemaining = p.stats.controlCooldowns?.[rightId] || 0;
            const rightMax = getControlMaxCd(rightId, rightLevel);
            rightPercent = rightRemaining > 0 ? Math.max(0, 1.0 - rightRemaining / rightMax) : 1.0;
          }
        }

        // Draw smaller inner circle for Left Click (MB1) if equipped
        if (leftId) {
          const innerRadius = 15;
          ctx.lineWidth = 3.2;
          
          // Faint complete track (more opaque)
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Active charge arc
          if (leftPercent < 1.0) {
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * leftPercent);
            ctx.stroke();
          } else {
            // Active state
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Draw bigger outer circle for Right Click (MB2) if equipped
        if (rightId) {
          const outerRadius = 22;
          ctx.lineWidth = 3.2;
          
          ctx.strokeStyle = rightIsLocked ? 'rgba(239, 68, 68, 0.45)' : 'rgba(168, 85, 247, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
          ctx.stroke();

          if (rightIsLocked) {
            // Red locked arc
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rightPercent);
            ctx.stroke();
          } else if (rightPercent < 1.0) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rightPercent);
            ctx.stroke();
          } else {
            ctx.strokeStyle = rightIsActive ? 'rgba(52, 211, 153, 0.95)' : 'rgba(168, 85, 247, 0.75)';
            ctx.beginPath();
            if (rightIsActive) {
              const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.1;
              ctx.arc(0, 0, outerRadius * pulse, 0, Math.PI * 2);
            } else {
              ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
            }
            ctx.stroke();
          }
        }

        // Draw tiny dot at dead center
        ctx.fillStyle = ((leftId && leftPercent < 1.0) || (rightId && rightPercent < 1.0)) ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

    }
    
    const bloodLust = p.abilities.find(a => a.type === AbilityType.BLOOD_LUST && a.isActive);
    const overdrive = p.abilities.find(a => a.type === AbilityType.OVERDRIVE && a.isActive);
    const healingAura = p.abilities.find(a => a.type === AbilityType.HEALING_AURA && a.isActive);
    const naniteAegis = p.abilities.find(a => a.type === AbilityType.NANITE_AEGIS && a.isActive);
    const timeWarp = p.abilities.find(a => (a.type === AbilityType.TIME_WARP || a.type === AbilityType.TEMPORAL_COLLAPSE) && a.isActive);

    // Ability Auras
    if (bloodLust) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = Date.now() * 0.1;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (overdrive) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pulseRatio = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
        ctx.arc(p.pos.x, p.pos.y, p.radius + 10 + pulseRatio * 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (healingAura) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 150, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    if (naniteAegis) {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 150, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 150, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 156, 0, Math.PI * 2);
        ctx.stroke();
        
        const time = Date.now() * 0.002;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            ctx.beginPath();
            ctx.moveTo(p.pos.x, p.pos.y);
            ctx.lineTo(p.pos.x + Math.cos(angle) * 150, p.pos.y + Math.sin(angle) * 150);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
    }

    if (timeWarp) {
        ctx.save();
        const isCollapse = timeWarp.type === AbilityType.TEMPORAL_COLLAPSE;
        const mainColor = isCollapse ? '#a855f7' : '#06b6d4';
        const dialColor = isCollapse ? 'rgba(168, 85, 247, 0.4)' : 'rgba(6, 182, 212, 0.4)';
        const radius = isCollapse ? 200 : 160;
        const now = Date.now() * 0.0015;

        // Ambient chronosphere field
        ctx.fillStyle = isCollapse ? 'rgba(147, 51, 234, 0.08)' : 'rgba(6, 182, 212, 0.06)';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer boundary
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -now * 30;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner counter-rotating dial with tick marks
        ctx.strokeStyle = dialColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 10]);
        ctx.lineDashOffset = now * 20;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
    }

    if (settings.highContrast) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const skinId = localStorage.getItem('game_equipped_skin') || 'classic';
    const skin = getSkinById(skinId);

    // Skins styling (from central registry)
    const coreFill = skin?.color ?? '#06b6d4';
    const coreStroke = skin?.stroke ?? '#22d3ee';

    if (settings.gfxEnemyDetail && p.hurtTimer <= 0 && !bloodLust) {
      // Enhanced 3D-shaded ball matching the enemy detail look (skin colors, own rim/core)
      drawEnemyBody(ctx, coreFill, p.radius, false, 1, p.pos.x, p.pos.y);
    } else {
      ctx.fillStyle = p.hurtTimer > 0 ? '#ef4444' : (bloodLust ? '#991b1b' : coreFill);
    }
    ctx.strokeStyle = p.hurtTimer > 0 ? '#fca5a5' : (bloodLust ? '#fca5a5' : coreStroke);
    ctx.lineWidth = 4;
    if (!(settings.gfxEnemyDetail && p.hurtTimer <= 0 && !bloodLust)) {
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Unique skin pattern overlays (drawn on top of the ball)
    if (!p.hurtTimer || p.hurtTimer <= 0) {
      drawSkinPattern(ctx, skin, p.pos.x, p.pos.y, p.radius);
    }

    // Spawn Forcefield Visual Option (Fades away gently after 1s over 0.5s)
    if (p.spawnShieldTimer !== undefined && p.spawnShieldTimer > -0.5) {
      ctx.save();
      const opacity = p.spawnShieldTimer > 0 
        ? 1.0 
        : Math.max(0.0, (0.5 + p.spawnShieldTimer) / 0.5);
      ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
      ctx.lineWidth = 3 * opacity;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = `rgba(56, 189, 248, ${0.15 * opacity})`;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius + 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Weapons
    p.weapons.forEach(w => {
      ctx.save();
      if (w.type === WeaponType.SPINNING_BLADE || w.type === WeaponType.VORTEX_SCYTHE || w.type === WeaponType.CHRONO_REAPER) {
        const isEvo = w.type === WeaponType.VORTEX_SCYTHE;
        const isUlt = w.type === WeaponType.CHRONO_REAPER;
        const angle = w.angle || 0;
        const length = (w.length || (isUlt ? 150 : (isEvo ? 115 : 80)));
        
        // Energy Beam effect (double pass with alpha glow for 60 FPS performance)
        ctx.strokeStyle = isUlt ? 'rgba(239, 68, 68, 0.45)' : (isEvo ? 'rgba(168, 85, 247, 0.45)' : 'rgba(34, 211, 238, 0.45)');
        ctx.lineWidth = isUlt ? 12 : (isEvo ? 9 : 6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.pos.x, p.pos.y);
        ctx.lineTo(
          p.pos.x + Math.cos(angle) * length,
          p.pos.y + Math.sin(angle) * length
        );
        ctx.stroke();

        ctx.strokeStyle = isUlt ? '#fca5a5' : (isEvo ? '#c084fc' : '#67e8f9');
        ctx.lineWidth = isUlt ? 5 : (isEvo ? 3.5 : 2.5);
        ctx.beginPath();
        ctx.moveTo(p.pos.x, p.pos.y);
        ctx.lineTo(
          p.pos.x + Math.cos(angle) * length,
          p.pos.y + Math.sin(angle) * length
        );
        ctx.stroke();

        // Core line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isUlt ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(p.pos.x + Math.cos(angle) * (length * 0.3), p.pos.y + Math.sin(angle) * (length * 0.3));
        ctx.lineTo(
          p.pos.x + Math.cos(angle) * length,
          p.pos.y + Math.sin(angle) * length
        );
        ctx.stroke();

        // Draw iconic 90-degree Reaper Scythe blade at shaft tip
        ctx.save();
        ctx.translate(
          p.pos.x + Math.cos(angle) * length,
          p.pos.y + Math.sin(angle) * length
        );
        ctx.rotate(angle);

        const s = isUlt ? 1.4 : (isEvo ? 1.15 : 0.95);
        const bLen = (isUlt ? 76 : (isEvo ? 58 : 46)) * s;

        // 1. Socket Collar Mount at tip of handle (0, 0)
        ctx.fillStyle = isUlt ? '#18181b' : (isEvo ? '#1e1b4b' : '#0f172a');
        ctx.strokeStyle = isUlt ? '#fca5a5' : (isEvo ? '#c084fc' : '#38bdf8');
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const hAng = (Math.PI * 2 / 6) * h;
          const hx = Math.cos(hAng) * (7.5 * s);
          const hy = Math.sin(hAng) * (7.5 * s);
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rear Scythe Spike / Counter-Beak (opposite the main blade, pointing along -Y and +X)
        ctx.fillStyle = isUlt ? '#3f3f46' : (isEvo ? '#2e1065' : '#1e293b');
        ctx.strokeStyle = isUlt ? '#ef4444' : (isEvo ? '#a855f7' : '#06b6d4');
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(3 * s, -4 * s);
        ctx.lineTo(10 * s, -14 * s);
        ctx.lineTo(-4 * s, -5 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Power Core Eye in collar
        ctx.fillStyle = isUlt ? '#ef4444' : (isEvo ? '#a855f7' : '#06b6d4');
        ctx.beginPath();
        ctx.arc(0, 0, 4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2 * s, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main 90-Degree Scythe Crescent Blade (Projects perpendicular at 90° along +Y)
        // Outer spine starts at collar, projects out along +Y with gentle outward sweep (+X), then curves into sharp hooked tip
        ctx.fillStyle = isUlt ? 'rgba(69, 10, 10, 0.95)' : (isEvo ? 'rgba(46, 16, 101, 0.95)' : 'rgba(8, 47, 73, 0.95)');
        ctx.beginPath();
        ctx.moveTo(4 * s, 3 * s);
        ctx.bezierCurveTo(16 * s, bLen * 0.35, 12 * s, bLen * 0.75, -12 * s, bLen);
        // Inner concave razor cutting edge sweeps back down to collar
        ctx.bezierCurveTo(0 * s, bLen * 0.65, 4 * s, bLen * 0.3, -2 * s, 5 * s);
        ctx.closePath();
        ctx.fill();

        // 3. Glowing Inner Razor Cutting Edge Arc (Perpendicular cutting sweep)
        ctx.save();
        ctx.strokeStyle = isUlt ? '#ffffff' : (isEvo ? '#f5d0fe' : '#e0f2fe');
        ctx.lineWidth = isUlt ? 3.5 : (isEvo ? 2.8 : 2.2);
        ctx.beginPath();
        ctx.moveTo(-12 * s, bLen);
        ctx.bezierCurveTo(0 * s, bLen * 0.65, 4 * s, bLen * 0.3, -2 * s, 5 * s);
        ctx.stroke();
        ctx.restore();

        // 4. Outer Convex Spine Reinforcement & Neon Plasma Edge
        ctx.strokeStyle = isUlt ? '#ef4444' : (isEvo ? '#a855f7' : '#38bdf8');
        ctx.lineWidth = isUlt ? 2.8 : (isEvo ? 2.2 : 1.8);
        ctx.beginPath();
        ctx.moveTo(4 * s, 3 * s);
        ctx.bezierCurveTo(16 * s, bLen * 0.35, 12 * s, bLen * 0.75, -12 * s, bLen);
        ctx.stroke();

        // Energy Core Line running through center of blade
        ctx.strokeStyle = isUlt ? '#fca5a5' : (isEvo ? '#d8b4fe' : '#7dd3fc');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(2 * s, 6 * s);
        ctx.bezierCurveTo(8 * s, bLen * 0.35, 6 * s, bLen * 0.7, -10 * s, bLen * 0.95);
        ctx.stroke();

        // 5. Secondary Inner Parrying Hook & Temporal Stasis Rings (Ultimate - Chrono Reaper)
        if (isUlt) {
          const subLen = bLen * 0.52;
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.moveTo(2 * s, 10 * s);
          ctx.bezierCurveTo(12 * s, subLen * 0.4, 8 * s, subLen * 0.8, -8 * s, subLen);
          ctx.bezierCurveTo(2 * s, subLen * 0.6, 4 * s, subLen * 0.25, -1 * s, 12 * s);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-8 * s, subLen);
          ctx.bezierCurveTo(2 * s, subLen * 0.6, 4 * s, subLen * 0.25, -1 * s, 12 * s);
          ctx.stroke();

          // Temporal stasis rings around blade tip
          ctx.save();
          ctx.translate(-12 * s, bLen);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.4;
          for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate((Date.now() * 0.003 * (i % 2 === 0 ? 1 : -1)) + i);
            ctx.beginPath();
            ctx.ellipse(0, 0, 16 + i * 8, 8 + i * 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }

        ctx.restore();
      }

      if (w.type === WeaponType.ORBITAL_SHIELD || w.type === WeaponType.SENTINEL_DRONES || w.type === WeaponType.CELESTIAL_GUARD) {
        const isEvo = w.type === WeaponType.SENTINEL_DRONES;
        const isUlt = w.type === WeaponType.CELESTIAL_GUARD;
        const angle = w.angle || 0;
        const shieldCount = (isUlt ? 6 : isEvo ? 3 : 1) + Math.floor(w.level / 2);
        const orbitRadius = (isUlt ? 100 : isEvo ? 65 : 45) + (w.level * 2);
        
        for (let i = 0; i < shieldCount; i++) {
          const angleOffset = (Math.PI * 2 / shieldCount) * i;
          const shieldX = p.pos.x + Math.cos(angle + angleOffset) * orbitRadius;
          const shieldY = p.pos.y + Math.sin(angle + angleOffset) * orbitRadius;

          ctx.save();
          ctx.translate(shieldX, shieldY);
          ctx.rotate(angle + angleOffset + Math.PI / 2);

          if (isUlt) {
            // Celestial Guard Aegis Drone - Heavy golden/amber cyber armor hull with rotating hex shield
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(14, -6);
            ctx.lineTo(10, 14);
            ctx.lineTo(-10, 14);
            ctx.lineTo(-14, -6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Wing pylons
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(-24, 6);
            ctx.lineTo(-20, 12);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(24, 6);
            ctx.lineTo(20, 12);
            ctx.lineTo(10, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Rotating Hex Aegis Barrier
            ctx.save();
            ctx.rotate(Date.now() * 0.004 + i);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let h = 0; h < 6; h++) {
              const hAng = (Math.PI * 2 / 6) * h;
              const hx = Math.cos(hAng) * 22;
              const hy = Math.sin(hAng) * 22;
              if (h === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            // Glowing blue reactor core Eye
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, -2, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Cyan/Amber thruster plume
            ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.beginPath();
            ctx.moveTo(-6, 14);
            ctx.lineTo(0, 22 + Math.sin(Date.now() * 0.02 + i) * 4);
            ctx.lineTo(6, 14);
            ctx.closePath();
            ctx.fill();

          } else if (isEvo) {
            // Sentinel Drone - Sleek emerald triangular drone hull
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(10, 8);
            ctx.lineTo(0, 4);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Side winglets
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-10, 2);
            ctx.lineTo(-18, 10);
            ctx.moveTo(10, 2);
            ctx.lineTo(18, 10);
            ctx.stroke();

            // Glowing lens eye
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(0, -2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Emerald thruster plume
            ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
            ctx.beginPath();
            ctx.moveTo(-4, 6);
            ctx.lineTo(0, 14 + Math.sin(Date.now() * 0.02 + i) * 3);
            ctx.lineTo(4, 6);
            ctx.closePath();
            ctx.fill();

          } else {
            // Basic Orbital Shield cell
            ctx.fillStyle = '#818cf8';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      if (w.type === WeaponType.MAGIC_BURST || w.type === WeaponType.SINGULARITY || w.type === WeaponType.VOID_EATER) {
        const isEvo = w.type === WeaponType.SINGULARITY;
        const isUlt = w.type === WeaponType.VOID_EATER;
        const cooldownPercent = (Date.now() - w.lastUsed) / (w.cooldown * p.stats.cooldownMult);
        if (cooldownPercent > 0.8) {
           ctx.strokeStyle = isUlt ? '#000' : isEvo ? '#a855f7' : '#c084fc';
           ctx.lineWidth = isUlt ? 12 : isEvo ? 6 : 2;
           ctx.beginPath();
           const radius = isUlt ? 500 : isEvo ? 350 : 200;
           ctx.arc(p.pos.x, p.pos.y, Math.max(0, radius * (1 - cooldownPercent)), 0, Math.PI * 2);
           ctx.stroke();
           
           if (isEvo || isUlt) {
               ctx.fillStyle = isUlt ? 'rgba(0,0,0,0.4)' : `rgba(168, 85, 247, ${0.1 * cooldownPercent})`;
               ctx.fill();
           }
        }
      }
      

      if (w.type === WeaponType.CHAIN_ARC_SWORD || w.type === WeaponType.ARC_WHIP || w.type === WeaponType.THUNDER_GOD) {
        const isEvo = w.type === WeaponType.ARC_WHIP;
        const isUlt = w.type === WeaponType.THUNDER_GOD;
        const angle = w.angle || 0;
        const length = (w.length || (isUlt ? 78 : (isEvo ? 68 : 58))); 
        
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(angle);
        
        ctx.strokeStyle = isUlt ? '#fca5a5' : (isEvo ? '#fff' : '#fbbf24');
        ctx.lineWidth = isUlt ? 8 : (isEvo ? 5 : 3);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (isEvo || isUlt) {
            ctx.moveTo(0, 0);
            const segments = isUlt ? 30 : 15;
            for(let i=1; i<=segments; i++) {
                const segX = (length/segments) * i;
                const jitter = isUlt ? 20 : 12;
                const segY = Math.sin(Date.now() * (isUlt ? 0.04 : 0.02) + i) * jitter + (Math.random() - 0.5) * jitter * 0.8;
                ctx.lineTo(segX, segY);
            }
        } else {
            ctx.moveTo(0, 0); 
            ctx.lineTo(length * 0.2, -6);
            ctx.lineTo(length * 0.5, 6);
            ctx.lineTo(length * 0.8, -3);
            ctx.lineTo(length, 0);
        }
        ctx.stroke();
        
        // Inner white hot core
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isUlt ? 3 : 1.5;
        ctx.stroke();

        if (isUlt) {
          // Thunder God - 3 orbiting Ball Lightning plasma orbs around handle
          for (let b = 0; b < 3; b++) {
            const bAng = Date.now() * 0.006 + (Math.PI * 2 / 3) * b;
            const bx = Math.cos(bAng) * 20;
            const by = Math.sin(bAng) * 20;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx, by, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      if (w.type === WeaponType.SHOTGUN || w.type === WeaponType.FLAK_CANNON || w.type === WeaponType.OBLITERATOR_CANNON) {
          const isUlt = w.type === WeaponType.OBLITERATOR_CANNON;
          const isEvo = w.type === WeaponType.FLAK_CANNON;
          const orbitAngle = w.angle || 0; 
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(orbitAngle);

          // Highly optimized distance evaluation using squared distance:
          // Red range (much closer point-blank): <= 140px (140^2 = 19600)
          // Yellow range (close tactical spread): <= 280px (280^2 = 78400)
          // If > 280px (or no enemy), aiming line is completely invisible (inAimRange = false)
          const nearest = engine.getNearestEnemyTo(p.pos);
          let targetDist = 0;
          let isReallyClose = false;
          let isKindOfClose = false;

          if (nearest) {
            const dx = nearest.pos.x - p.pos.x;
            const dy = nearest.pos.y - p.pos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= 19600) {
              isReallyClose = true;
              targetDist = Math.sqrt(distSq);
            } else if (distSq <= 78400) {
              isKindOfClose = true;
              targetDist = Math.sqrt(distSq);
            }
          }

          const inAimRange = isReallyClose || isKindOfClose;
          const laserColor = isReallyClose ? '#ef4444' : '#eab308';
          const reticleColor = isReallyClose ? '#f87171' : '#fde047';
          const glowColor = isReallyClose ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.25)';

          if (isUlt) {
            // ==================== TIER 3: OBLITERATOR CANNON ====================
            const primaryColor = isReallyClose ? '#ef4444' : (isKindOfClose ? '#eab308' : '#06b6d4');
            const glowColorUlt = isReallyClose ? '#f87171' : (isKindOfClose ? '#fde047' : '#38bdf8');

            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4 Heavy Siege Barrels
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = glowColorUlt;
            ctx.lineWidth = 1;

            ctx.fillRect(10, -10, 22, 4);
            ctx.strokeRect(10, -10, 22, 4);
            ctx.fillRect(10, -4, 24, 4);
            ctx.strokeRect(10, -4, 24, 4);
            ctx.fillRect(10, 2, 24, 4);
            ctx.strokeRect(10, 2, 24, 4);
            ctx.fillRect(10, 8, 22, 4);
            ctx.strokeRect(10, 8, 22, 4);

            // Glowing Plasma Muzzle Caps
            ctx.fillStyle = primaryColor;
            ctx.fillRect(32, -11, 3, 6);
            ctx.fillRect(34, -5, 3, 6);
            ctx.fillRect(34, 1, 3, 6);
            ctx.fillRect(32, 7, 3, 6);

            // Muzzle energy charging diodes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(36, -3, 1.5, 0, Math.PI * 2);
            ctx.arc(36, 3, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Target aiming line & reticle (ONLY visible when in Red or Yellow close range)
            if (inAimRange) {
              ctx.strokeStyle = laserColor;
              ctx.lineWidth = isReallyClose ? 2.4 : 1.6;
              ctx.setLineDash(isReallyClose ? [2, 2] : [4, 4]);
              ctx.beginPath();
              // Heavy central siege beam
              ctx.moveTo(37, 0);
              ctx.lineTo(targetDist, 0);
              // Converging flank rail tracers
              ctx.moveTo(34, -4);
              ctx.lineTo(targetDist, -3);
              ctx.moveTo(34, 4);
              ctx.lineTo(targetDist, 3);
              ctx.stroke();
              ctx.setLineDash([]);

              // Heavy Siege Reticle & Quad Brackets
              ctx.strokeStyle = reticleColor;
              ctx.lineWidth = isReallyClose ? 2.5 : 1.8;
              const rSize = isReallyClose ? 18 : 14;
              ctx.beginPath();
              ctx.arc(targetDist, 0, rSize, 0, Math.PI * 2);
              
              const chSize = isReallyClose ? 22 : 16;
              ctx.moveTo(targetDist - chSize, 0);
              ctx.lineTo(targetDist + chSize, 0);
              ctx.moveTo(targetDist, -chSize);
              ctx.lineTo(targetDist, chSize);
              ctx.stroke();

              // Pulsing core
              ctx.fillStyle = glowColor;
              ctx.beginPath();
              ctx.arc(targetDist, 0, isReallyClose ? 9 : 6, 0, Math.PI * 2);
              ctx.fill();
            }

          } else if (isEvo) {
            // ==================== TIER 2: FLAK CANNON ====================
            const muzzleColor = isReallyClose ? '#ef4444' : (isKindOfClose ? '#eab308' : '#f59e0b');

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = muzzleColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Twin heavy rifled barrels
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = isReallyClose ? '#fca5a5' : '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.fillRect(8, -6, 18, 4);
            ctx.strokeRect(8, -6, 18, 4);
            ctx.fillRect(8, 2, 18, 4);
            ctx.strokeRect(8, 2, 18, 4);

            // Muzzle brake ports
            ctx.fillStyle = muzzleColor;
            ctx.fillRect(24, -7, 3, 6);
            ctx.fillRect(24, 1, 3, 6);

            // Brass ammo cylinder
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(-2, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            // Target aiming line & reticle (ONLY visible when in Red or Yellow close range)
            if (inAimRange) {
              ctx.strokeStyle = laserColor;
              ctx.lineWidth = isReallyClose ? 2.0 : 1.4;
              ctx.setLineDash(isReallyClose ? [2, 2] : [4, 4]);
              ctx.beginPath();
              // Twin collimated barrel lasers
              ctx.moveTo(27, -4);
              ctx.lineTo(targetDist, -2);
              ctx.moveTo(27, 4);
              ctx.lineTo(targetDist, 2);
              ctx.stroke();
              ctx.setLineDash([]);

              // Flak Heavy Reticle & Crosshairs
              ctx.strokeStyle = reticleColor;
              ctx.lineWidth = isReallyClose ? 2.2 : 1.6;
              const rSize = isReallyClose ? 16 : 12;
              ctx.beginPath();
              ctx.arc(targetDist, 0, rSize, 0, Math.PI * 2);
              
              const chSize = isReallyClose ? 20 : 15;
              ctx.moveTo(targetDist - chSize, 0);
              ctx.lineTo(targetDist + chSize, 0);
              ctx.moveTo(targetDist, -chSize);
              ctx.lineTo(targetDist, chSize);
              ctx.stroke();

              // Center core glow
              ctx.fillStyle = glowColor;
              ctx.beginPath();
              ctx.arc(targetDist, 0, isReallyClose ? 8 : 5, 0, Math.PI * 2);
              ctx.fill();
            }

          } else {
            // ==================== TIER 1: BASIC SHOTGUN ====================
            const muzzleColor = isReallyClose ? '#ef4444' : (isKindOfClose ? '#eab308' : '#64748b');

            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(18, -3, 14, 6);
            ctx.strokeStyle = muzzleColor;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(18, -3, 14, 6);

            // Muzzle indicator
            ctx.fillStyle = muzzleColor;
            ctx.fillRect(30, -2, 3, 4);

            // Target aiming line & reticle (ONLY visible when in Red or Yellow close range)
            if (inAimRange) {
              // Tactical laser line to target
              ctx.strokeStyle = laserColor;
              ctx.lineWidth = isReallyClose ? 1.8 : 1.2;
              ctx.setLineDash(isReallyClose ? [2, 2] : [4, 4]);
              ctx.beginPath();
              ctx.moveTo(33, 0);
              ctx.lineTo(targetDist, 0);
              ctx.stroke();
              ctx.setLineDash([]);

              // Target lock-on ring & crosshairs
              ctx.strokeStyle = reticleColor;
              ctx.lineWidth = isReallyClose ? 2.0 : 1.4;
              ctx.beginPath();
              ctx.arc(targetDist, 0, isReallyClose ? 14 : 10, 0, Math.PI * 2);
              
              // Crosshairs
              const chSize = isReallyClose ? 18 : 14;
              ctx.moveTo(targetDist - chSize, 0);
              ctx.lineTo(targetDist + chSize, 0);
              ctx.moveTo(targetDist, -chSize);
              ctx.lineTo(targetDist, chSize);
              ctx.stroke();

              // Glow center
              ctx.fillStyle = glowColor;
              ctx.beginPath();
              ctx.arc(targetDist, 0, isReallyClose ? 8 : 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
      }

      if (w.type === WeaponType.MAGIC_BLASTER || w.type === WeaponType.SPELL_WEAVER) {
          const isEvo = w.type === WeaponType.SPELL_WEAVER;
          const angle = w.angle || 0;
          const dist = 35;

          if (isEvo) {
            // Spell Weaver - Tri-elemental orb cluster (Arcane Violet, Frost Cyan, Solar Orange) orbiting in a triangular matrix
            const elements = [
              { color: '#c084fc', core: '#e9d5ff', angleOffset: 0 },
              { color: '#38bdf8', core: '#e0f2fe', angleOffset: (Math.PI * 2) / 3 },
              { color: '#f97316', core: '#fef08a', angleOffset: (Math.PI * 4) / 3 }
            ];

            const orbPositions: { x: number; y: number }[] = [];

            elements.forEach(elem => {
              const curAng = angle + elem.angleOffset;
              const ox = p.pos.x + Math.cos(curAng) * dist;
              const oy = p.pos.y + Math.sin(curAng) * dist;
              orbPositions.push({ x: ox, y: oy });

              ctx.save();
              ctx.fillStyle = elem.color;
              ctx.beginPath();
              const r = 6 + Math.sin(Date.now() * 0.008 + elem.angleOffset) * 1.5;
              ctx.arc(ox, oy, r, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = elem.core;
              ctx.beginPath();
              ctx.arc(ox, oy, r * 0.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            });

            // Glowing mana tether lines forming a triangular planar field
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(orbPositions[0].x, orbPositions[0].y);
            ctx.lineTo(orbPositions[1].x, orbPositions[1].y);
            ctx.lineTo(orbPositions[2].x, orbPositions[2].y);
            ctx.closePath();
            ctx.stroke();

            // Flamboyant Spell Weaver Orbital Mana Runes Matrix
            ctx.save();
            ctx.translate(p.pos.x, p.pos.y);
            ctx.rotate(-Date.now() * 0.002);
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(0, 0, dist + 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

          } else {
            const bx = p.pos.x + Math.cos(angle) * dist;
            const by = p.pos.y + Math.sin(angle) * dist;
            ctx.fillStyle = '#fda4af';
            ctx.beginPath();
            const r = 6 + Math.sin(Date.now() * 0.01) * 2;
            ctx.arc(bx, by, r, 0, Math.PI * 2);
            ctx.fill();
          }
      }

      if (w.type === WeaponType.BOMB_LAUNCHER || w.type === WeaponType.RECURSIVE_BOMB || w.type === WeaponType.SUPERNOVA_BOMB) {
          const isUlt = w.type === WeaponType.SUPERNOVA_BOMB;
          const isEvo = w.type === WeaponType.RECURSIVE_BOMB;
          const orbitAngle = Date.now() * 0.003;
          const dist = 32;
          const bx = p.pos.x + Math.cos(orbitAngle) * dist;
          const by = p.pos.y + Math.sin(orbitAngle) * dist;

          // Flamboyant Thermonuclear Heat Exhaust & Hazard Halo
          if (isUlt || isEvo) {
              ctx.save();
              ctx.translate(bx, by);
              ctx.rotate(-Date.now() * 0.004);
              ctx.strokeStyle = isUlt ? 'rgba(239, 68, 68, 0.6)' : 'rgba(245, 158, 11, 0.5)';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([10, 6]);
              ctx.beginPath();
              ctx.arc(0, 0, isUlt ? 22 : 18, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              // Heat exhaust sparks
              ctx.fillStyle = isUlt ? '#f87171' : '#fde047';
              for (let s = 0; s < 3; s++) {
                  const sAng = Date.now() * 0.008 + (Math.PI * 2 / 3) * s;
                  ctx.beginPath();
                  ctx.arc(Math.cos(sAng) * (isUlt ? 24 : 19), Math.sin(sAng) * (isUlt ? 24 : 19), 2, 0, Math.PI * 2);
                  ctx.fill();
              }
              ctx.restore();
          }

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(orbitAngle * 2);

          if (isUlt) {
            // Supernova Bomb - Thermonuclear ordnance dispenser with pulsing red eye & hazard warning stripes
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4 stabilization fins
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            for (let f = 0; f < 4; f++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(11, -2);
              ctx.lineTo(16, -5);
              ctx.lineTo(16, 5);
              ctx.lineTo(11, 2);
              ctx.stroke();
            }

            // Pulsing core eye
            const pulse = Math.sin(Date.now() * 0.01) * 2;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, 4 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();

          } else if (isEvo) {
            // Recursive Bomb - Cluster pod launcher with twin sub-warheads
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Twin sub-warheads
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
            ctx.arc(3, 3, 2.5, 0, Math.PI * 2);
            ctx.fill();

          } else {
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
      }

      if (w.type === WeaponType.CLONE_PROJECTION || w.type === WeaponType.HOLOGRAPHIC_ARMY || w.type === WeaponType.MIRAGE_LEGION) {
          ctx.strokeStyle = w.type === WeaponType.MIRAGE_LEGION ? 'rgba(168, 85, 247, 0.6)' : 'rgba(56, 189, 248, 0.5)';
          ctx.setLineDash([5, 10]);
          ctx.lineDashOffset = -Date.now() * 0.02;
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, w.type === WeaponType.MIRAGE_LEGION ? 150 : 100, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
      }

      if (w.type === WeaponType.PLASMA_RAZOR || w.type === WeaponType.NEUTRINO_SHREDDER || w.type === WeaponType.GOD_SLAYER_WHEEL) {
          const isUlt = w.type === WeaponType.GOD_SLAYER_WHEEL;
          const isEvo = w.type === WeaponType.NEUTRINO_SHREDDER;
          const angle = w.angle || 0;
          let targetRadius = 60 + (w.level * 3);
          if (isUlt) targetRadius = 100 + (w.level * 5);
          
          const razorPos = { x: p.pos.x + Math.cos(angle) * targetRadius, y: p.pos.y + Math.sin(angle) * targetRadius };
          ctx.save();
          ctx.translate(razorPos.x, razorPos.y);
          ctx.rotate(angle * 2.5);
          ctx.strokeStyle = isUlt ? '#ef4444' : (isEvo ? '#38bdf8' : '#fff');
          ctx.lineWidth = isUlt ? 8 : 4; // Thicker lines
          ctx.beginPath();
          const rSize = isUlt ? 35 : 20;
          for(let i=0; i<12; i++) { // More teeth for cooler look
              const ang = (Math.PI*2/12)*i;
              ctx.lineTo(Math.cos(ang)*rSize, Math.sin(ang)*rSize);
              ctx.lineTo(Math.cos(ang+0.15)*rSize*1.5, Math.sin(ang+0.15)*rSize*1.5);
          }
          ctx.closePath();
          ctx.stroke();
          
          // Inner hub
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.arc(0, 0, rSize * 0.3, 0, Math.PI * 2);
          ctx.fill();

          if (isEvo || isUlt) {
              ctx.fillStyle = isUlt ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)';
              ctx.fill();
              ctx.strokeStyle = isUlt ? '#f87171' : '#7dd3fc';
              ctx.lineWidth = 2.5;
              ctx.stroke();
          }
          ctx.restore();
          
          // Thicker Tether (trimmed: starts at the player's hull edge, ends short of the razor)
          const tetherAng = Math.atan2(razorPos.y - p.pos.y, razorPos.x - p.pos.x);
          const tetherGap = 14;
          ctx.strokeStyle = isUlt ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = isUlt ? 3 : 1;
          ctx.setLineDash(isUlt ? [] : [5, 5]);
          ctx.beginPath();
          ctx.moveTo(p.pos.x + Math.cos(tetherAng) * (p.radius + 2), p.pos.y + Math.sin(tetherAng) * (p.radius + 2));
          ctx.lineTo(razorPos.x - Math.cos(tetherAng) * tetherGap, razorPos.y - Math.sin(tetherAng) * tetherGap);
          ctx.stroke();
          ctx.setLineDash([]);
      }

      if (w.type === WeaponType.ICE_SWORD || w.type === WeaponType.GLACIAL_GREATSWORD || w.type === WeaponType.ABSOLUTE_ZERO_SIPHON) {
          const isUlt = w.type === WeaponType.ABSOLUTE_ZERO_SIPHON;
          const isEvo = w.type === WeaponType.GLACIAL_GREATSWORD;

          const baseRadius = isUlt ? 85 : (isEvo ? 75 : 65);
          const iceRadius = (baseRadius + w.level * 4) * (p.stats.weaponSize || 1.0);
          const swordPos = {
              x: p.pos.x + Math.cos(w.angle || 0) * iceRadius,
              y: p.pos.y + Math.sin(w.angle || 0) * iceRadius
          };
          
          ctx.save();
          ctx.translate(swordPos.x, swordPos.y);
          ctx.rotate((w.angle || 0) + Math.PI / 2);

          ctx.fillStyle = isUlt ? 'rgba(224, 242, 254, 0.55)' : (isEvo ? 'rgba(14, 165, 233, 0.45)' : 'rgba(56, 189, 248, 0.35)');
          ctx.strokeStyle = isUlt ? '#ffffff' : (isEvo ? '#e0f2fe' : '#bae6fd');
          ctx.lineWidth = isUlt ? 4.0 : (isEvo ? 3.0 : 2.5);

          const sizeMult = (isUlt ? 1.7 : (isEvo ? 1.35 : 1.0)) * (p.stats.weaponSize || 1.0);
          
          // Draw crystalline blade shape
          ctx.beginPath();
          ctx.moveTo(0, -32 * sizeMult);
          ctx.lineTo(8 * sizeMult, -10 * sizeMult);
          ctx.lineTo(6 * sizeMult, 18 * sizeMult);
          ctx.lineTo(-6 * sizeMult, 18 * sizeMult);
          ctx.lineTo(-8 * sizeMult, -10 * sizeMult);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Inner frost spine core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -28 * sizeMult);
          ctx.lineTo(0, 16 * sizeMult);
          ctx.stroke();

          if (isEvo || isUlt) {
            // Crystalline Guard Wings
            ctx.fillStyle = isUlt ? '#0284c7' : '#0369a1';
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-6 * sizeMult, 18 * sizeMult);
            ctx.lineTo(-16 * sizeMult, 12 * sizeMult);
            ctx.lineTo(-12 * sizeMult, 22 * sizeMult);
            ctx.lineTo(-4 * sizeMult, 22 * sizeMult);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(6 * sizeMult, 18 * sizeMult);
            ctx.lineTo(16 * sizeMult, 12 * sizeMult);
            ctx.lineTo(12 * sizeMult, 22 * sizeMult);
            ctx.lineTo(4 * sizeMult, 22 * sizeMult);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Hilt & Pommel
          ctx.fillStyle = isUlt ? '#38bdf8' : (isEvo ? '#0284c7' : '#0369a1');
          ctx.fillRect(-10 * sizeMult, 22 * sizeMult, 20 * sizeMult, 4 * sizeMult);
          ctx.fillStyle = isUlt ? '#0369a1' : '#1e3a8a';
          ctx.fillRect(-2.5 * sizeMult, 26 * sizeMult, 5 * sizeMult, 9 * sizeMult);

          if (isUlt) {
            // Absolute Zero - 3 floating frost crystals orbiting blade tip
            ctx.restore(); // Restore to swordPos space
            ctx.save();
            ctx.translate(swordPos.x, swordPos.y);
            for (let c = 0; c < 3; c++) {
              const cAng = Date.now() * 0.005 + (Math.PI * 2 / 3) * c;
              const cx = Math.cos(cAng) * (26 * sizeMult);
              const cy = Math.sin(cAng) * (26 * sizeMult);
              ctx.fillStyle = '#e0f2fe';
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(cx, cy, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
          ctx.restore();

          // Draw icy link (trimmed: starts at the player's hull edge, ends at the sword hilt)
          const iceLinkAng = Math.atan2(swordPos.y - p.pos.y, swordPos.x - p.pos.x);
          ctx.strokeStyle = isUlt ? 'rgba(224, 242, 254, 0.45)' : (isEvo ? 'rgba(14, 165, 233, 0.3)' : 'rgba(56, 189, 248, 0.25)');
          ctx.lineWidth = isUlt ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(p.pos.x + Math.cos(iceLinkAng) * (p.radius + 2), p.pos.y + Math.sin(iceLinkAng) * (p.radius + 2));
          ctx.lineTo(swordPos.x - Math.cos(iceLinkAng) * 24, swordPos.y - Math.sin(iceLinkAng) * 24);
          ctx.stroke();
      }

      if (w.type === WeaponType.FIRE_SWORD || w.type === WeaponType.SOLAR_ECLIPSE_BLADE || w.type === WeaponType.SUPERNOVA_SLAYER) {
          const isUlt = w.type === WeaponType.SUPERNOVA_SLAYER;
          const isEvo = w.type === WeaponType.SOLAR_ECLIPSE_BLADE;

          const baseRadius = isUlt ? 80 : (isEvo ? 70 : 60);
          const fireRadius = (baseRadius + w.level * 3) * (p.stats.weaponSize || 1.0);
          const swordPos = {
              x: p.pos.x + Math.cos(w.angle || 0) * fireRadius,
              y: p.pos.y + Math.sin(w.angle || 0) * fireRadius
          };
          
          ctx.save();
          ctx.translate(swordPos.x, swordPos.y);
          ctx.rotate((w.angle || 0) + Math.PI / 2);

          ctx.fillStyle = isUlt ? 'rgba(254, 240, 138, 0.55)' : (isEvo ? 'rgba(249, 115, 22, 0.45)' : 'rgba(239, 68, 68, 0.35)');
          ctx.strokeStyle = isUlt ? '#ffffff' : (isEvo ? '#fef08a' : '#fca5a5');
          ctx.lineWidth = isUlt ? 4.0 : (isEvo ? 3.0 : 2.5);

          const sizeMult = (isUlt ? 1.6 : (isEvo ? 1.3 : 1.0)) * (p.stats.weaponSize || 1.0);

          // Kinetic flame blade shape
          ctx.beginPath();
          ctx.moveTo(0, -30 * sizeMult);
          ctx.lineTo(8 * sizeMult, -8 * sizeMult);
          ctx.lineTo(5 * sizeMult, 18 * sizeMult);
          ctx.lineTo(-5 * sizeMult, 18 * sizeMult);
          ctx.lineTo(-8 * sizeMult, -8 * sizeMult);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Dark solar core line inside blade
          ctx.fillStyle = isUlt ? '#0f172a' : (isEvo ? '#451a03' : '#7f1d1d');
          ctx.fillRect(-2 * sizeMult, -20 * sizeMult, 4 * sizeMult, 36 * sizeMult);

          if (isEvo || isUlt) {
            // Solar Guard Wings
            ctx.fillStyle = isUlt ? '#f97316' : '#ea580c';
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5 * sizeMult, 18 * sizeMult);
            ctx.lineTo(-15 * sizeMult, 12 * sizeMult);
            ctx.lineTo(-12 * sizeMult, 22 * sizeMult);
            ctx.lineTo(-3 * sizeMult, 22 * sizeMult);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(5 * sizeMult, 18 * sizeMult);
            ctx.lineTo(15 * sizeMult, 12 * sizeMult);
            ctx.lineTo(12 * sizeMult, 22 * sizeMult);
            ctx.lineTo(3 * sizeMult, 22 * sizeMult);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Hilt
          ctx.fillStyle = isUlt ? '#f97316' : '#ea580c';
          ctx.fillRect(-10 * sizeMult, 22 * sizeMult, 20 * sizeMult, 4 * sizeMult);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-2.5 * sizeMult, 26 * sizeMult, 5 * sizeMult, 8 * sizeMult);

          ctx.restore();

          // Thermal link (trimmed: starts at the player's hull edge, ends at the sword hilt)
          const fireLinkAng = Math.atan2(swordPos.y - p.pos.y, swordPos.x - p.pos.x);
          ctx.strokeStyle = isUlt ? 'rgba(254, 240, 138, 0.4)' : (isEvo ? 'rgba(249, 115, 22, 0.3)' : 'rgba(239, 68, 68, 0.25)');
          ctx.lineWidth = isUlt ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(p.pos.x + Math.cos(fireLinkAng) * (p.radius + 2), p.pos.y + Math.sin(fireLinkAng) * (p.radius + 2));
          ctx.lineTo(swordPos.x - Math.cos(fireLinkAng) * 24, swordPos.y - Math.sin(fireLinkAng) * 24);
          ctx.stroke();
      }

      if (w.type === WeaponType.TESLA_COIL || w.type === WeaponType.STATIC_STORM || w.type === WeaponType.EMP_HARVESTER) {
          const isUlt = w.type === WeaponType.EMP_HARVESTER;
          const isEvo = w.type === WeaponType.STATIC_STORM;
          const range = isUlt ? 450 : (isEvo ? 350 : 250);
          
          ctx.save();
          ctx.strokeStyle = isUlt ? '#fff' : (isEvo ? '#38bdf8' : '#fbbf24');
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, range, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          
          // Draw Tesla base on player
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
      }

      if (w.type === WeaponType.GRAVITY_BEAM || w.type === WeaponType.EVENT_HORIZON || w.type === WeaponType.SINGULARITY_CORE) {
          const isUlt = w.type === WeaponType.SINGULARITY_CORE;
          const isEvo = w.type === WeaponType.EVENT_HORIZON;
          const range = isUlt ? 400 : (isEvo ? 300 : 200);
          
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          
          const grad = ctx.createRadialGradient(0, 0, isUlt ? 15 : 0, 0, 0, range);
          if (isUlt) {
              // Gentle, stable accretion disk glow (no screen flash or strobe)
              grad.addColorStop(0, 'rgba(34, 211, 238, 0.28)'); // Soft cyan core
              grad.addColorStop(0.3, 'rgba(168, 85, 247, 0.16)'); // Soothing violet
              grad.addColorStop(0.8, 'rgba(244, 63, 94, 0.04)');  // Subtle outer fringe
              grad.addColorStop(1, 'transparent');
          } else {
              const color = isEvo ? 'rgba(168, 85, 247, 0.18)' : 'rgba(192, 132, 252, 0.14)';
              grad.addColorStop(0, color);
              grad.addColorStop(1, 'transparent');
          }
          
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.55; // Stable non-flashing alpha
          ctx.beginPath();
          ctx.arc(0, 0, range, 0, Math.PI * 2);
          ctx.fill();
          
          if (isUlt) {
              // Draw a crisp solid void event horizon sphere at the core of the singularity
              ctx.save();
              ctx.fillStyle = '#020204'; // True void black hole core
              ctx.beginPath();
              ctx.arc(0, 0, 24, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
              ctx.lineWidth = 2;
              ctx.setLineDash([8, 12]);
              ctx.rotate(Date.now() * 0.001); // Smooth, gentle rotation
              ctx.beginPath();
              ctx.arc(0, 0, range, 0, Math.PI * 2);
              ctx.stroke();

              // Draw secondary counter-rotating orbital core
              ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
              ctx.lineWidth = 1.2;
              ctx.setLineDash([12, 8]);
              ctx.rotate(-Date.now() * 0.0015);
              ctx.beginPath();
              ctx.arc(0, 0, range - 80, 0, Math.PI * 2);
              ctx.stroke();
          }
          ctx.restore();
      }

       if (w.type === WeaponType.ION_CANNON || w.type === WeaponType.ORBITAL_STRIKE || w.type === WeaponType.DEATH_STAR_BEAM) {
          const isUlt = w.type === WeaponType.DEATH_STAR_BEAM;
          const isEvo = w.type === WeaponType.ORBITAL_STRIKE;
          const orbitAngle = w.angle || 0; 
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(orbitAngle);
          
          if (isUlt) {
              // Draw the spectacular synchronized continuous laser beam shooting directly from the tip of the muzzle (X = 34)
              ctx.save();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 10 + Math.sin(Date.now() * 0.05) * 3; // flickering size
              ctx.beginPath();
              ctx.moveTo(34, 0);
              ctx.lineTo(800, 0);
              ctx.stroke();

              ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.lineWidth = 22 + Math.sin(Date.now() * 0.05) * 6; // outer glow size
              ctx.beginPath();
              ctx.moveTo(34, 0);
              ctx.lineTo(800, 0);
              ctx.stroke();
              ctx.restore();
          }

          // Draw active mechanical connection support linkage to eliminate floating gaps
          ctx.strokeStyle = '#3f3f46'; // Gunmetal linkage holster extension
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(15, 0);
          ctx.stroke();

          // Draw the gun holster base anchor ring at the player core center
          ctx.fillStyle = '#27272a';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isUlt ? '#ef4444' : '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw a cool tapered polygonal "ion cannon" mount using polygons
          ctx.fillStyle = isUlt ? 'rgba(239, 68, 68, 0.95)' : isEvo ? 'rgba(56, 189, 248, 0.95)' : 'rgba(6, 182, 212, 0.95)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(12, -7);
          ctx.lineTo(26, -5);
          ctx.lineTo(34, -2);
          ctx.lineTo(34, 2);
          ctx.lineTo(26, 5);
          ctx.lineTo(12, 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Internal energy core lining inside the cannon
          ctx.strokeStyle = isUlt ? '#fca5a5' : '#e0f2fe';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(30, 0);
          ctx.stroke();

          // Small cooling fin/shielding polygons on the side of the cannon base
          ctx.fillStyle = '#27272a';
          ctx.strokeStyle = isUlt ? '#ef4444' : '#06b6d4';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(10, -10);
          ctx.lineTo(18, -10);
          ctx.lineTo(14, -6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(10, 10);
          ctx.lineTo(18, 10);
          ctx.lineTo(14, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          if (isUlt || isEvo) {
              ctx.strokeStyle = isUlt ? '#ef4444' : '#06b6d4';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 22, -0.5, 0.5); // Coordinates are already rotated by orbitAngle, so use fixed offsets!
              ctx.stroke();
          }
          ctx.restore();
      }
      if (w.type === WeaponType.MINE_LAYER || w.type === WeaponType.SENSOR_CLUSTER || w.type === WeaponType.VOID_MINES) {
          const orbitAngle = w.angle || 0; 
          const isEvo = w.type === WeaponType.SENSOR_CLUSTER;
          const isUlt = w.type === WeaponType.VOID_MINES;
          
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(orbitAngle);
          
          // Swirling Void Rift Halo underneath Mine Dispenser
          ctx.save();
          ctx.rotate(-Date.now() * 0.003);
          ctx.strokeStyle = isUlt ? 'rgba(239, 68, 68, 0.5)' : (isEvo ? 'rgba(168, 85, 247, 0.4)' : 'rgba(234, 179, 8, 0.35)');
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Dispenser body
          ctx.fillStyle = isUlt ? '#000' : (isEvo ? '#a855f7' : '#71717a');
          ctx.fillRect(-28, -6, 12, 12);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(-28, -6, 12, 12);
          
          // Glow light on dispenser
          ctx.fillStyle = isUlt ? '#ef4444' : '#facc15';
          ctx.beginPath();
          ctx.arc(-22, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
      }

      if (w.type === WeaponType.PHOTON_REPEATER || w.type === WeaponType.LANCE_ARRAY || w.type === WeaponType.HYPER_LIGHT_ARRAY) {
          const isUlt = w.type === WeaponType.HYPER_LIGHT_ARRAY;
          const isEvo = w.type === WeaponType.LANCE_ARRAY;
          const orbitAngle = Date.now() * 0.004; // Steady spin, same convention as the other orbiting weapons
          const orbCount = isUlt ? 3 : (isEvo ? 2 : 1);
          const orbitR = 30;

          // Glowing photon orb(s) rotating around the player, with a short motion trail
          for (let i = 0; i < orbCount; i++) {
              const a = orbitAngle + (Math.PI * 2 / orbCount) * i;
              const ox = p.pos.x + Math.cos(a) * orbitR;
              const oy = p.pos.y + Math.sin(a) * orbitR;

              ctx.strokeStyle = isUlt ? 'rgba(125, 211, 252, 0.35)' : (isEvo ? 'rgba(56, 189, 248, 0.35)' : 'rgba(253, 224, 71, 0.35)');
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(p.pos.x, p.pos.y, orbitR, a - 0.9, a);
              ctx.stroke();

              const orbR = isUlt ? 9 : 7;
              const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbR);
              grad.addColorStop(0, isUlt ? '#ffffff' : (isEvo ? '#e0f2fe' : '#fef9c3'));
              grad.addColorStop(0.55, isUlt ? '#7dd3fc' : (isEvo ? '#38bdf8' : '#fde047'));
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
              ctx.fill();
          }
      }

      if (w.type === WeaponType.RICOCHET_CANNON || w.type === WeaponType.REFRACTION_LANCE || w.type === WeaponType.ECHO_STRIKE) {
          const orbitAngle = Date.now() * 0.002;
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(orbitAngle);

          // Flamboyant Sonic Resonance Wave Ring
          const pulseR = 28 + (Date.now() % 800) / 800 * 20;
          const alpha = 1.0 - (Date.now() % 800) / 800;
          ctx.strokeStyle = w.type === WeaponType.ECHO_STRIKE ? `rgba(244, 114, 182, ${alpha})` : `rgba(251, 146, 60, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = w.type === WeaponType.ECHO_STRIKE ? '#f472b6' : '#fb923c';
          ctx.lineWidth = 2;
          for(let i=0; i<4; i++) {
              ctx.rotate(Math.PI/2);
              ctx.beginPath();
              ctx.moveTo(25, -10);
              ctx.lineTo(25, 10);
              ctx.stroke();
          }
          ctx.restore();
      }
      ctx.restore();
    });

    // Draw Kinetic floating numbers (shaking on crits and matching weapon colors)
    if (engine.floatingTexts && engine.floatingTexts.length > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const normalFont = 'bold 18px "JetBrains Mono", monospace';
      const critFont = '900 32px "Space Grotesk", "Outfit", "Inter", sans-serif';
      let currentFont = '';

      for (let i = 0; i < engine.floatingTexts.length; i++) {
        const ft = engine.floatingTexts[i];
        const progress = ft.life / ft.maxLife; // 1 down to 0
        const alpha = Math.max(0, Math.min(1, progress * 1.4));
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        
        if (ft.isCrit) {
            if (currentFont !== critFont) {
              ctx.font = critFont;
              currentFont = critFont;
            }
            const textShakeX = (Math.random() - 0.5) * 4;
            const textShakeY = (Math.random() - 0.5) * 4;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(ft.text, ft.pos.x + textShakeX, ft.pos.y + textShakeY);
            ctx.fillText(ft.text, ft.pos.x + textShakeX, ft.pos.y + textShakeY);
        } else {
            if (currentFont !== normalFont) {
              ctx.font = normalFont;
              currentFont = normalFont;
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.pos.x, ft.pos.y);
            ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
        }
      }
      ctx.restore();
    }

    // Player Red Damage Vignette (clean perimeter warning, no full-screen white/red flash fill)
    if (p && p.hurtTimer > 0) {
      const alphaVal = Math.min(0.2, p.hurtTimer * 0.8);
      ctx.strokeStyle = `rgba(239, 68, 68, ${alphaVal * 1.8})`;
      ctx.lineWidth = 12;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 50);
      } else {
        ctx.rect(0, 0, canvas.width, canvas.height);
      }
      ctx.stroke();
    }

    // CINEMATIC POST-PROCESSING OVERLAY (SWITCH 4)
    if (settings.gfxCinematicFx && bgGradsRef.current?.vig) {
      ctx.save();
      // Cockpit Dark Edge Vignette (Cached Gradient)
      ctx.fillStyle = bgGradsRef.current.vig;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (settings.retroTheme) {
      // Clear horizontal retro arcade scanlines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    ctx.restore();

  };

  // Coordinate scaling logic for pointers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = engine.width / rect.width;
    const scaleY = engine.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (e.button === 0) { // Left Click
      engine.onLeftClick?.(coords.x, coords.y);
    } else if (e.button === 2) { // Right Click
      engine.onRightClickChange?.(true, coords.x, coords.y);
    }
    try {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    engine.updatePointerPos?.(coords.x, coords.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      engine.onLeftClickChange?.(false);
    } else if (e.button === 2) {
      engine.onRightClickChange?.(false);
    }
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${settings.retroTheme ? 'retro-viewport' : ''}`}>
      <canvas
        ref={canvasRef}
        id="game-canvas"
        width={engine.width}
        height={engine.height}
        style={{ aspectRatio: '800 / 500' }}
        className={`${settings.retroTheme ? 'shadow-[0_0_35px_rgba(245,158,11,0.25)] bg-[#030306]' : 'shadow-2xl shadow-cyan-500/10 bg-[#020205]'} w-full h-full max-w-full max-h-full object-contain transition-all ${
          (engine.gameMode === 'OVERDRIVE' || engine.gameMode === 'OVERDRIVE_SANDBOX') ? 'cursor-crosshair' : 'cursor-default'
        } touch-none`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      {settings.retroTheme && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.45)_100%)] rounded-lg mix-blend-multiply" />
      )}
    </div>
  );
});
