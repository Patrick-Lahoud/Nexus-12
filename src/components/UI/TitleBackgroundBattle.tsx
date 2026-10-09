import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface SimulatedEnemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  enemyType: 'BASIC' | 'SHOOTER' | 'TANK' | 'BOMBER' | 'SWARMER' | 'GUARDIAN';
  flashDuration: number;
  shootTimer: number;
  wander: boolean;
  wanderAngle: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  isDeflected: boolean;
}

interface OrbDrop {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'CREDIT' | 'XP';
  value: number;
  color: string;
  life: number; // remaining frames before expiry (bounds long-session accumulation)
}

// Frame pacing: the background sim targets 30fps. It sits behind menus and a
// dark tint overlay, so half-rate motion is indistinguishable, while CPU/GPU
// cost (and battery drain on laptops) drops by ~50%. On very slow devices an
// adaptive governor drops it further to 20fps instead of stuttering.
const BASE_FRAME_MS = 1000 / 30;
const MIN_FRAME_MS = 1000 / 20;

// Sim speed multiplier: scales every sim process (movement, fire timers,
// decays) uniformly on top of the frame pacing, so the action reads briskly
// even at the reduced frame rate.
const SIM_SPEED = 1.4;

// Adaptive resolution: canvas backing store is capped at this vertical
// resolution. Everything is drawn relative to layout size, so a lower backing
// resolution is invisible behind menus yet slashes fill-rate on 1440p/4K and
// scaled (DPR 1.25/1.5/2) displays, which is where the lag concentrates.
const MAX_BACKING_HEIGHT = 720;

// Long-session bounds: the sim can run for the whole menu session, so every
// growing structure needs a ceiling. Gems expire (long idle periods otherwise
// accumulate hundreds of off-screen orbs, each costing a distance check + draw
// call per frame); particles/bullets get hard caps as a safety net.
const ORB_LIFETIME = 60 * 60; // ~60s of sim at 60fps-frame units
const MAX_ORBS = 120;
const MAX_PARTICLES = 400;
const MAX_BULLETS = 160;

// TENTATIVE colour-reveal: the scene is painted in NATIVE colour; the cursor
// aura overlay in TitleScreen.tsx (mix-blend-mode: saturation) desaturates
// everything outside its light circle, so colour shows only inside the
// radius of light. Paint colours directly — no canvas-side grayscale here.

export default function TitleBackgroundBattle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Backdrop cache (declared before handleResize, which invalidates it).
    // The arena cutout, corner brackets, border, tint and vignette only change
    // on resize. They are rendered once into an offscreen canvas and blitted
    // every frame with a single drawImage, replacing four full-screen gradient
    // fills, an even-odd path fill and several strokes per frame.
    let staticLayer: HTMLCanvasElement | null = null;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width || canvas.parentElement?.clientWidth || window.innerWidth);
      const h = Math.floor(rect.height || canvas.parentElement?.clientHeight || window.innerHeight);
      if (w <= 0 || h <= 0) return;
      // Cap the backing store; CSS stretches it back to layout size.
      const cap = Math.min(h, MAX_BACKING_HEIGHT);
      const bw = Math.max(1, Math.floor(w * (cap / h)));
      const bh = Math.max(1, cap);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        staticLayer = null; // backdrop cache invalidated on resize
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(canvas);
      if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
      }
    }

    handleResize();

    const initialW = canvas.width || 800;
    const initialH = canvas.height || 500;

    // Player Vessel State
    const player = {
      x: initialW / 2,
      y: initialH / 2,
      vx: 3.8,
      vy: -2.7,
      radius: 14,
      bladeAngle: 0,
    };

    let enemies: SimulatedEnemy[] = [];
    let bullets: Bullet[] = [];
    let particles: Particle[] = [];
    let orbDrops: OrbDrop[] = [];

    let enemyIdCounter = 0;
    let bulletIdCounter = 0;
    let orbIdCounter = 0;
    let spawnTimer = 0;
    let animationFrameId = 0;

    const buildStaticLayer = () => {
      const width = canvas.width;
      const height = canvas.height;

      const baseW = 800;
      const baseH = 500;
      let scale = Math.min(width / 880, height / 550);
      if (width < 640) scale = 0.55;

      const arenaW = baseW * scale;
      const arenaH = baseH * scale;
      const arenaX = (width - arenaW) / 2;
      const arenaY = (height - arenaH) / 2;
      const CR = 100 * scale;

      const layer = document.createElement('canvas');
      layer.width = width;
      layer.height = height;
      const s = layer.getContext('2d');
      if (!s) return null;

      const arenaPath = () => {
        s.beginPath();
        s.moveTo(arenaX + CR, arenaY);
        s.lineTo(arenaX + arenaW - CR, arenaY);
        s.quadraticCurveTo(arenaX + arenaW, arenaY, arenaX + arenaW, arenaY + CR);
        s.lineTo(arenaX + arenaW, arenaY + arenaH - CR);
        s.quadraticCurveTo(arenaX + arenaW, arenaY + arenaH, arenaX + arenaW - CR, arenaY + arenaH);
        s.lineTo(arenaX + CR, arenaY + arenaH);
        s.quadraticCurveTo(arenaX, arenaY + arenaH, arenaX, arenaY + arenaH - CR);
        s.lineTo(arenaX, arenaY + CR);
        s.quadraticCurveTo(arenaX, arenaY, arenaX + CR, arenaY);
        s.closePath();
      };

      // Arena interior: exact tone the sim previously accumulated to
      // (opaque #08080c fill) before the tint overlay was composited on top.
      s.fillStyle = '#08080c';
      arenaPath();
      s.fill();

      // SOLID BLACK SURROUND: everything outside the arena cutout is pure
      // black, matching the real game's cutout look (even-odd fill).
      s.fillStyle = '#000000';
      s.beginPath();
      s.rect(0, 0, width, height);
      s.moveTo(arenaX + CR, arenaY);
      s.lineTo(arenaX + arenaW - CR, arenaY);
      s.quadraticCurveTo(arenaX + arenaW, arenaY, arenaX + arenaW, arenaY + CR);
      s.lineTo(arenaX + arenaW, arenaY + arenaH - CR);
      s.quadraticCurveTo(arenaX + arenaW, arenaY + arenaH, arenaX + arenaW - CR, arenaY + arenaH);
      s.lineTo(arenaX + CR, arenaY + arenaH);
      s.quadraticCurveTo(arenaX, arenaY + arenaH, arenaX, arenaY + arenaH - CR);
      s.lineTo(arenaX, arenaY + CR);
      s.quadraticCurveTo(arenaX, arenaY, arenaX + CR, arenaY);
      s.closePath();
      s.fill('evenodd');

      // SCI-FI CORNER ALIGNMENT HUDS & SYSTEM READOUTS
      s.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      s.lineWidth = 1.5;
      const bLen = 20 * scale;
      // Top-Left corner bracket
      s.beginPath();
      s.moveTo(arenaX - 6, arenaY + bLen);
      s.lineTo(arenaX - 6, arenaY - 6);
      s.lineTo(arenaX + bLen, arenaY - 6);
      s.stroke();
      // Top-Right corner bracket
      s.beginPath();
      s.moveTo(arenaX + arenaW + 6 - bLen, arenaY - 6);
      s.lineTo(arenaX + arenaW + 6, arenaY - 6);
      s.lineTo(arenaX + arenaW + 6, arenaY + bLen);
      s.stroke();
      // Bottom-Left corner bracket
      s.beginPath();
      s.moveTo(arenaX - 6, arenaY + arenaH - bLen);
      s.lineTo(arenaX - 6, arenaY + arenaH + 6);
      s.lineTo(arenaX + bLen, arenaY + arenaH + 6);
      s.stroke();
      // Bottom-Right corner bracket
      s.beginPath();
      s.moveTo(arenaX + arenaW + 6 - bLen, arenaY + arenaH + 6);
      s.lineTo(arenaX + arenaW + 6, arenaY + arenaH + 6);
      s.lineTo(arenaX + arenaW + 6, arenaY + arenaH - bLen);
      s.stroke();

      // Final outer arena border
      s.strokeStyle = '#334155';
      s.lineWidth = 4 * scale;
      arenaPath();
      s.stroke();

      // Dark tinting overlay & radial vignette for high-contrast UI readability
      s.fillStyle = 'rgba(2, 2, 8, 0.42)';
      s.fillRect(0, 0, width, height);

      const vig = s.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.2,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
      vig.addColorStop(0.65, 'rgba(2, 2, 8, 0.55)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.90)');
      s.fillStyle = vig;
      s.fillRect(0, 0, width, height);

      return layer;
    };

    const createExplosion = (x: number, y: number, color: string, count = 12) => {
      // Hard ceiling: a burst storm (deflections + one-shots in one frame) can
      // never push the pool past MAX_PARTICLES
      const budget = MAX_PARTICLES - particles.length;
      for (let i = 0; i < Math.min(count, budget); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.8 + 0.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: Math.random() * 2.5 + 1.0,
          alpha: 1,
          decay: Math.random() * 0.025 + 0.015,
        });
      }
    };

    // Main animation loop (driven by the frame-paced scheduler below)
    let lastRenderTime = 0;

    const render = (now: number) => {
      const width = canvas.width;
      const height = canvas.height;

      // ---- Static backdrop blit (replaces per-frame full-screen fills) ----
      if (!staticLayer) {
        staticLayer = buildStaticLayer();
      }
      if (staticLayer) {
        ctx.drawImage(staticLayer, 0, 0);
      } else {
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, width, height);
      }

      // Framerate independence: all sim logic below is authored per 60fps frame.
      // ts converts per-frame rates so motion speed is identical at any frame
      // rate (ts ~= 2 at the paced 30fps, ~= 3 at the governor's 20fps floor).
      // Clamped so a long hitch (tab hidden, GC pause) cannot teleport entities.
      const rawTs = lastRenderTime === 0 ? 1 : (now - lastRenderTime) / (1000 / 60);
      lastRenderTime = now;
      const ts = Math.min(Math.max(rawTs, 0.25), 4) * SIM_SPEED;

      // Centered arena geometry (cheap math, needed for sim layout)
      const baseW = 800;
      const baseH = 500;
      let scale = Math.min(width / 880, height / 550);
      if (width < 640) scale = 0.55;

      const arenaW = baseW * scale;
      const arenaH = baseH * scale;
      const arenaX = (width - arenaW) / 2;
      const arenaY = (height - arenaH) / 2;
      const CR = 100 * scale;

      const createArenaPath = () => {
        ctx.beginPath();
        ctx.moveTo(arenaX + CR, arenaY);
        ctx.lineTo(arenaX + arenaW - CR, arenaY);
        ctx.quadraticCurveTo(arenaX + arenaW, arenaY, arenaX + arenaW, arenaY + CR);
        ctx.lineTo(arenaX + arenaW, arenaY + arenaH - CR);
        ctx.quadraticCurveTo(arenaX + arenaW, arenaY + arenaH, arenaX + arenaW - CR, arenaY + arenaH);
        ctx.lineTo(arenaX + CR, arenaY + arenaH);
        ctx.quadraticCurveTo(arenaX, arenaY + arenaH, arenaX, arenaY + arenaH - CR);
        ctx.lineTo(arenaX, arenaY + CR);
        ctx.quadraticCurveTo(arenaX, arenaY, arenaX + CR, arenaY);
        ctx.closePath();
      };

      const spawnEnemyOnEdge = () => {
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        const margin = 20 * scale;

        if (edge === 0) {
          x = arenaX + Math.random() * arenaW;
          y = arenaY - margin;
        } else if (edge === 1) {
          x = arenaX + arenaW + margin;
          y = arenaY + Math.random() * arenaH;
        } else if (edge === 2) {
          x = arenaX + Math.random() * arenaW;
          y = arenaY + arenaH + margin;
        } else {
          x = arenaX - margin;
          y = arenaY + Math.random() * arenaH;
        }

        const rolls: Array<SimulatedEnemy['enemyType']> = ['BASIC', 'SHOOTER', 'TANK', 'BOMBER', 'SWARMER'];
        if (enemies.filter(e => e.enemyType === 'GUARDIAN').length === 0 && Math.random() > 0.6) {
          rolls.push('GUARDIAN');
        }
        const enemyType = rolls[Math.floor(Math.random() * rolls.length)];

        let radius = 10 * scale;
        let hp = 100;
        let color = '#ef4444';

        if (enemyType === 'SHOOTER') {
          color = '#fbbf24';
          radius = 11 * scale;
          hp = 120;
        } else if (enemyType === 'TANK') {
          color = '#ea580c';
          radius = 15 * scale;
          hp = 350;
        } else if (enemyType === 'BOMBER') {
          color = '#ec4899';
          radius = 9 * scale;
          hp = 80;
        } else if (enemyType === 'SWARMER') {
          color = '#f87171';
          radius = 7 * scale;
          hp = 60;
        } else if (enemyType === 'GUARDIAN') {
          color = '#a855f7';
          radius = 22 * scale;
          hp = 800;
        }

        const angle = Math.atan2(player.y - y, player.x - x);
        const speed = (enemyType === 'BASIC' ? 1.5 : enemyType === 'SHOOTER' ? 1.1 : enemyType === 'TANK' ? 0.7 : enemyType === 'SWARMER' ? 2.1 : enemyType === 'GUARDIAN' ? 0.5 : 1.8) * scale;
        // Some enemies ignore the player and wander the arena instead, so the
        // background reads as a living battlefield rather than a conga line.
        const wander = enemyType !== 'GUARDIAN' && Math.random() < 0.45;

        enemies.push({
          id: enemyIdCounter++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius,
          hp,
          maxHp: hp,
          color,
          enemyType,
          flashDuration: 0,
          shootTimer: Math.floor(Math.random() * 40),
          wander,
          wanderAngle: Math.random() * Math.PI * 2,
        });
      };

      // Periodic enemy spawning
      spawnTimer += ts;
      if (spawnTimer > 14 && enemies.length < 20) {
        spawnEnemyOnEdge();
        spawnTimer = 0;
      }

      if (enemies.length === 0) {
        for (let i = 0; i < 5; i++) {
          spawnEnemyOnEdge();
        }
      }

      // -------------------------------------------------------------
      // 2. RENDER THE GAMEPLAY SIMULATION (CLIPPED WITHIN THE ARENA)
      // -------------------------------------------------------------
      ctx.save();
      createArenaPath();
      ctx.clip();

      // -------------------------------------------------------------
      // PLAYER KINETICS & PHYSICS
      // -------------------------------------------------------------
      player.x += player.vx * scale * ts;
      player.y += player.vy * scale * ts;

      const pPad = player.radius + 15 * scale;
      if (player.x < arenaX + pPad) {
        player.x = arenaX + pPad;
        player.vx = Math.abs(player.vx);
        createExplosion(player.x, player.y, '#38bdf8', 5);
      }
      if (player.x > arenaX + arenaW - pPad) {
        player.x = arenaX + arenaW - pPad;
        player.vx = -Math.abs(player.vx);
        createExplosion(player.x, player.y, '#38bdf8', 5);
      }
      if (player.y < arenaY + pPad) {
        player.y = arenaY + pPad;
        player.vy = Math.abs(player.vy);
        createExplosion(player.x, player.y, '#38bdf8', 5);
      }
      if (player.y > arenaY + arenaH - pPad) {
        player.y = arenaY + arenaH - pPad;
        player.vy = -Math.abs(player.vy);
        createExplosion(player.x, player.y, '#38bdf8', 5);
      }

      // Render Player Vessel Body: minimalist outline circle, matching the
      // outlined enemy look (no fill, no glow, no trail).
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // WEAPON 1: ACTIVE SPINNING DEFLECTION BLADE
      // -------------------------------------------------------------
      player.bladeAngle += 0.04 * ts;
      const bladeLength = 52 * scale;
      const bladeEndX = player.x + Math.cos(player.bladeAngle) * bladeLength;
      const bladeEndY = player.y + Math.sin(player.bladeAngle) * bladeLength;

      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(bladeEndX, bladeEndY);
      ctx.stroke();
      ctx.restore();

      // Blade Slicing Hostiles (one-shot on contact with any part of the sword)
      enemies.forEach(e => {
        // Distance from the enemy center to the blade segment (player -> tip)
        const dx = bladeEndX - player.x;
        const dy = bladeEndY - player.y;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((e.x - player.x) * dx + (e.y - player.y) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const closestX = player.x + t * dx;
        const closestY = player.y + t * dy;
        const dToBlade = Math.sqrt((e.x - closestX) * (e.x - closestX) + (e.y - closestY) * (e.y - closestY));
        if (dToBlade < e.radius + 6 * scale) {
          e.hp = 0;
          e.flashDuration = 3;
          createExplosion(e.x, e.y, '#22d3ee', 1);
        }
      });

      // -------------------------------------------------------------
      // BULLET SIMULATION (BOTH ENEMY AND DEFLECTED PLAYER BULLETS)
      // -------------------------------------------------------------
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * ts;
        b.y += b.vy * ts;

        // Draw Bullet Sphere
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Check Deflection against player
        if (!b.isDeflected) {
          const distToPlayer = Math.sqrt((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y));
          if (distToPlayer < player.radius + 18 * scale) {
            // DEFLECTION TRIGGER!
            b.isDeflected = true;
            b.vx = -b.vx * 1.8;
            b.vy = -b.vy * 1.8;
            b.color = '#22d3ee'; // Turns electric cyan!
            createExplosion(b.x, b.y, '#22d3ee', 8);
            continue;
          }
        }

        // Check Bullet Collision against Enemies if deflected or player bullet
        let removeBullet = false;
        if (b.isDeflected) {
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            const d = Math.sqrt((e.x - b.x) * (e.x - b.x) + (e.y - b.y) * (e.y - b.y));
            if (d < e.radius + b.size + 2 * scale) {
              e.hp -= 45;
              e.flashDuration = 3;
              removeBullet = true;
              createExplosion(b.x, b.y, b.color, 4);

              break;
            }
          }
        } else {
          // Enemy bullet hitting player
          const distToPlayer = Math.sqrt((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y));
          if (distToPlayer < player.radius + b.size) {
            removeBullet = true;
            createExplosion(b.x, b.y, '#ef4444', 4);
          }
        }

        const outBounds = b.x < arenaX || b.x > arenaX + arenaW || b.y < arenaY || b.y > arenaY + arenaH;
        if (removeBullet || outBounds) {
          bullets.splice(i, 1);
        }
      }

      // -------------------------------------------------------------
      // SIMULATED ACTUAL GAMEPLAY ENEMIES (DRAWING & COLLISION)
      // -------------------------------------------------------------
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Movement: chasers home in on the player, wanderers drift on a
        // slowly turning heading and bounce off the arena edges.
        const forceSpeed = (e.enemyType === 'BASIC' ? 1.3 : e.enemyType === 'SHOOTER' ? 1.0 : e.enemyType === 'TANK' ? 0.6 : e.enemyType === 'SWARMER' ? 2.0 : e.enemyType === 'GUARDIAN' ? 0.45 : 1.6) * scale;
        // Exponential steering blend, evaluated for the real elapsed time so
        // the approach speed matches the authored 60fps behaviour at any rate.
        const steer = 1 - Math.pow(0.92, ts);
        if (e.wander) {
          e.wanderAngle += (Math.random() - 0.5) * 0.12 * ts;
          e.vx = e.vx * (1 - steer) + Math.cos(e.wanderAngle) * forceSpeed * steer;
          e.vy = e.vy * (1 - steer) + Math.sin(e.wanderAngle) * forceSpeed * steer;
          e.x += e.vx * ts;
          e.y += e.vy * ts;
          if (e.x < arenaX + e.radius) { e.x = arenaX + e.radius; e.vx = Math.abs(e.vx); e.wanderAngle = Math.PI - e.wanderAngle; }
          if (e.x > arenaX + arenaW - e.radius) { e.x = arenaX + arenaW - e.radius; e.vx = -Math.abs(e.vx); e.wanderAngle = Math.PI - e.wanderAngle; }
          if (e.y < arenaY + e.radius) { e.y = arenaY + e.radius; e.vy = Math.abs(e.vy); e.wanderAngle = -e.wanderAngle; }
          if (e.y > arenaY + arenaH - e.radius) { e.y = arenaY + arenaH - e.radius; e.vy = -Math.abs(e.vy); e.wanderAngle = -e.wanderAngle; }
        } else {
          const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
          e.vx = e.vx * (1 - steer) + Math.cos(angleToPlayer) * forceSpeed * steer;
          e.vy = e.vy * (1 - steer) + Math.sin(angleToPlayer) * forceSpeed * steer;
          e.x += e.vx * ts;
          e.y += e.vy * ts;
        }

        // Shooter / Guardian enemy firing red bullets (chasers only;
        // wanderers are not engaging the player)
        if ((e.enemyType === 'SHOOTER' || e.enemyType === 'GUARDIAN') && !e.wander) {
          e.shootTimer += ts;
          const fireInterval = e.enemyType === 'GUARDIAN' ? 50 : 70;
          if (e.shootTimer > fireInterval) {
            e.shootTimer = 0;
            const bAngle = Math.atan2(player.y - e.y, player.x - e.x);

            if (e.enemyType === 'GUARDIAN') {
              // Spread 3 bullets
              for (let sa = -0.25; sa <= 0.25; sa += 0.25) {
                if (bullets.length >= MAX_BULLETS) break;
                bullets.push({
                  id: bulletIdCounter++,
                  x: e.x + Math.cos(bAngle + sa) * e.radius,
                  y: e.y + Math.sin(bAngle + sa) * e.radius,
                  vx: Math.cos(bAngle + sa) * 7 * scale,
                  vy: Math.sin(bAngle + sa) * 7 * scale,
                  color: '#f87171',
                  size: 3 * scale,
                  isDeflected: false,
                });
              }
            } else if (bullets.length < MAX_BULLETS) {
              bullets.push({
                id: bulletIdCounter++,
                x: e.x + Math.cos(bAngle) * e.radius,
                y: e.y + Math.sin(bAngle) * e.radius,
                vx: Math.cos(bAngle) * 6.2 * scale,
                vy: Math.sin(bAngle) * 6.2 * scale,
                color: '#fbbf24',
                size: 2.5 * scale,
                isDeflected: false,
              });
            }
          }
        }

        // Check health depletion
        if (e.hp <= 0) {
          createExplosion(e.x, e.y, e.color, e.enemyType === 'GUARDIAN' ? 25 : 12);

          // Drop Credit & XP Gems (bounded: capped pool + expiry)
          const gemVal = e.enemyType === 'GUARDIAN' ? 150 : e.enemyType === 'TANK' ? 35 : 15;
          if (orbDrops.length < MAX_ORBS) {
            orbDrops.push({
              id: orbIdCounter++,
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              type: Math.random() > 0.4 ? 'CREDIT' : 'XP',
              value: gemVal,
              color: Math.random() > 0.4 ? '#34d399' : '#c084fc',
              life: ORB_LIFETIME,
            });
          }

          enemies.splice(i, 1);
          continue;
        }

        // Check direct player bounce collision (one-shot on contact)
        const dToPlayer = Math.sqrt((player.x - e.x) * (player.x - e.x) + (player.y - e.y) * (player.y - e.y));
        if (dToPlayer < player.radius + e.radius + 2 * scale) {
          createExplosion(e.x, e.y, '#c084fc', 8);
          e.hp = 0;
          e.vx = -e.vx * 2;
          e.vy = -e.vy * 2;
        }

        // DRAW ENEMY GRAPHICS: pure outline art. Shapes match the real
        // game's enemy silhouettes, but everything is stroked, nothing filled.
        ctx.save();
        if (e.flashDuration > 0) {
          e.flashDuration -= ts;
          ctx.strokeStyle = '#ffffff';
        } else {
          ctx.strokeStyle = e.color;
        }
        ctx.lineWidth = 2 * scale;
        ctx.translate(e.x, e.y);

        if (e.enemyType === 'BASIC') {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.stroke();

        } else if (e.enemyType === 'SHOOTER') {
          const bAngle = Math.atan2(player.y - e.y, player.x - e.x);
          ctx.rotate(bAngle);

          // Barrel outline
          ctx.strokeRect(e.radius - 3, -4 * scale, 12 * scale, 8 * scale);

          // Hexagon body outline
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s * Math.PI * 2) / 6;
            ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
          }
          ctx.closePath();
          ctx.stroke();

        } else if (e.enemyType === 'TANK') {
          for (let s = 0; s < 4; s++) {
            ctx.save();
            ctx.rotate((s * Math.PI) / 2);
            ctx.beginPath();
            ctx.moveTo(e.radius - 3 * scale, -6 * scale);
            ctx.lineTo(e.radius + 8 * scale, 0);
            ctx.lineTo(e.radius - 3 * scale, 6 * scale);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }

          ctx.beginPath();
          ctx.arc(0, 0, e.radius - 1 * scale, 0, Math.PI * 2);
          ctx.stroke();

        } else if (e.enemyType === 'BOMBER') {
          const bPulseVal = Math.sin(now / 50) * 2.5 * scale;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + bPulseVal, 0, Math.PI * 2);
          ctx.stroke();

        } else if (e.enemyType === 'SWARMER') {
          // Small circle instead of the old filled oval
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.stroke();

        } else if (e.enemyType === 'GUARDIAN') {
          // Large Boss Guardian: rotating octagon inside an outer ring
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 6 * scale, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          for (let s = 0; s < 8; s++) {
            const a = (s * Math.PI * 2) / 8 + now / 1000;
            ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }

      // -------------------------------------------------------------
      // LOOT ORB DROPS (MAGNETIC ATTRACTION TO PLAYER)
      // -------------------------------------------------------------
      for (let i = orbDrops.length - 1; i >= 0; i--) {
        const orb = orbDrops[i];
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Expiry: bounds the standing orb count during long idle sessions
        orb.life -= ts;
        if (orb.life <= 0) {
          orbDrops.splice(i, 1);
          continue;
        }

        if (dist < 180 * scale && dist > 0) {
          orb.vx += (dx / dist) * 0.6 * scale * ts;
          orb.vy += (dy / dist) * 0.6 * scale * ts;
        }

        orb.x += orb.vx * ts;
        orb.y += orb.vy * ts;
        orb.vx *= Math.pow(0.92, ts);
        orb.vy *= Math.pow(0.92, ts);

        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (dist < player.radius + 6 * scale) {
          orbDrops.splice(i, 1);
        }
      }

      // -------------------------------------------------------------
      // PARTICLES RENDERING
      // -------------------------------------------------------------
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * ts;
        p.y += p.vy * ts;
        p.alpha -= p.decay * ts;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // END CLIP REGION
    };

    // Frame-paced driver: safeRender is the SOLE scheduler. render() draws one
    // frame and returns; safeRender paces frames to BASE_FRAME_MS (30fps) with
    // an adaptive governor that drops to 20fps when a device cannot keep up
    // and recovers back to 30fps once frames are consistently fast again.
    let lastFrame = 0;
    let slowFrames = 0;
    let fastFrames = 0;
    let minFrameMs = BASE_FRAME_MS;

    const safeRender = (now: number) => {
      if (document.hidden) {
        lastFrame = now;
      } else {
        const elapsed = now - lastFrame;
        if (elapsed >= minFrameMs) {
          if (elapsed > BASE_FRAME_MS * 1.8) {
            // Frames are arriving late: the device is behind.
            slowFrames++;
            fastFrames = 0;
            if (slowFrames > 20) minFrameMs = MIN_FRAME_MS;
          } else {
            fastFrames++;
            if (fastFrames > 120 && minFrameMs !== BASE_FRAME_MS) {
              minFrameMs = BASE_FRAME_MS; // recovered, restore 30fps
              slowFrames = 0;
              fastFrames = 0;
            } else if (slowFrames > 0) {
              slowFrames--;
            }
          }
          lastFrame = now;
          render(now);
        }
      }
      animationFrameId = requestAnimationFrame(safeRender);
    };

    animationFrameId = requestAnimationFrame(safeRender);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-100 z-[1] select-none block"
    />
  );
}
