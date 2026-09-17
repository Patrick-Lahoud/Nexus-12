import { useEffect, useRef } from 'react';
import { useLanguage } from '../../game/localization';

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

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
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
}

interface ActiveSkillFx {
  type: 'GRAVITY_WELL' | 'SHOCKWAVE';
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  timer: number;
  maxTimer: number;
}

export default function TitleBackgroundBattle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width || canvas.parentElement?.clientWidth || window.innerWidth);
      const h = Math.floor(rect.height || canvas.parentElement?.clientHeight || window.innerHeight);
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);

    const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const handlePointerMove = (e: PointerEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };
    window.addEventListener('pointermove', handlePointerMove);

    const stardustColors = ['#e4e4e7', '#a1a1aa', '#71717a', '#d4d4d8', '#52525b'];
    const stardust = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas.width || 1200),
      y: Math.random() * (canvas.height || 800),
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.15 - Math.random() * 0.35,
      size: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
    }));

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
      vx: 2.5,
      vy: -1.8,
      radius: 14,
      hp: 88,
      maxHp: 100,
      shield: 42,
      maxShield: 50,
      deflectCd: 0,
      maxDeflectCd: 60,
      bladeAngle: 0,
      turretAngle: 0,
      turretShootTimer: 0,
      level: 12,
      xpPct: 0.72,
      credits: 14850,
      score: 52900,
    };

    // Mining Drill Zone
    const drill = {
      x: 0,
      y: 0,
      radius: 18,
      angle: 0,
      color: '#10b981',
      mineTimer: 0,
    };

    let enemies: SimulatedEnemy[] = [];
    let bullets: Bullet[] = [];
    let particles: Particle[] = [];
    let floatingTexts: FloatingText[] = [];
    let orbDrops: OrbDrop[] = [];
    let activeSkillsFx: ActiveSkillFx[] = [];

    let enemyIdCounter = 0;
    let bulletIdCounter = 0;
    let textIdCounter = 0;
    let orbIdCounter = 0;
    let spawnTimer = 0;
    let skillCycleTimer = 0;
    let animationFrameId: number;

    const createExplosion = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
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

    const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTexts.push({
        id: textIdCounter++,
        x,
        y,
        text,
        color,
        alpha: 1,
        scale: 1,
        vy: -0.9,
      });
    };

    // Main animation loop
    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark space canvas clear
      ctx.fillStyle = 'rgba(2, 2, 5, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const timeSec = Date.now() / 1000;

      // -------------------------------------------------------------
      // FULL-VIEWPORT DYNAMIC SPACE DESIGN SFX (NEBULAE, 3D MESH, RADAR)
      // -------------------------------------------------------------
      ctx.save();
      
      // 1. Dynamic Deep-Space Cosmic Nebulae Blooms (Dark Gray & Steel Tones)
      const neb1 = ctx.createRadialGradient(width * 0.2, height * 0.25, 10, width * 0.2, height * 0.25, width * 0.55);
      neb1.addColorStop(0, 'rgba(63, 63, 70, 0.18)');
      neb1.addColorStop(0.5, 'rgba(39, 39, 42, 0.10)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(width * 0.8, height * 0.75, 10, width * 0.8, height * 0.75, width * 0.5);
      neb2.addColorStop(0, 'rgba(82, 82, 91, 0.14)');
      neb2.addColorStop(0.5, 'rgba(39, 39, 42, 0.08)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      const nebPtr = ctx.createRadialGradient(mousePos.x, mousePos.y, 5, mousePos.x, mousePos.y, 280);
      nebPtr.addColorStop(0, 'rgba(161, 161, 170, 0.07)');
      nebPtr.addColorStop(0.5, 'rgba(113, 113, 122, 0.03)');
      nebPtr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebPtr;
      ctx.fillRect(0, 0, width, height);

      // 2. Full-Viewport 3D Reactive Space Mesh Grid (Dark Slate Gray)
      ctx.strokeStyle = 'rgba(161, 161, 170, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      const moveX = (timeSec * 12) % gridSize;
      const moveY = (timeSec * 9) % gridSize;

      for (let x = moveX; x < width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= height; y += 40) {
          const dx = x - mousePos.x;
          const dy = y - mousePos.y;
          const distSq = dx * dx + dy * dy;
          let px = x;
          if (distSq < 57600 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const warp = (1 - dist / 240) * 10 * Math.sin(timeSec * 3);
            px += (dx / dist) * warp;
          }
          if (y === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      for (let y = moveY; y < height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 40) {
          const dx = x - mousePos.x;
          const dy = y - mousePos.y;
          const distSq = dx * dx + dy * dy;
          let py = y;
          if (distSq < 57600 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const warp = (1 - dist / 240) * 10 * Math.cos(timeSec * 3);
            py += (dy / dist) * warp;
          }
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }

      // 3. Full-Viewport Concentric Tactical Radar Rings & Sweeping Beam
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(161, 161, 170, 0.03)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 280, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 520, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(161, 161, 170, 0.02)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Rotating radar sweep ray sector
      const sweepAngle = timeSec * 0.4;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createConicGradient(0, 0, 0);
      sweepGrad.addColorStop(0, 'rgba(161, 161, 170, 0.04)');
      sweepGrad.addColorStop(0.12, 'rgba(161, 161, 170, 0.01)');
      sweepGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(width, height), 0, Math.PI / 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Floating Cosmic Stardust Particles
      stardust.forEach(star => {
        star.y += star.vy;
        star.x += star.vx;
        if (star.y < -10) star.y = height + 10;
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;

        const alpha = Math.max(0.1, Math.sin(timeSec * 2 + star.phase) * 0.4 + 0.5);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha * 0.65;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // Centered arena geometry
      const baseW = 800;
      const baseH = 500;
      let scale = Math.min(width / 880, height / 550);
      if (width < 640) scale = 0.55;

      const arenaW = baseW * scale;
      const arenaH = baseH * scale;
      const arenaX = (width - arenaW) / 2;
      const arenaY = (height - arenaH) / 2;
      const CR = 100 * scale;

      // Mining drill position relative to arena
      drill.x = arenaX + 90 * scale;
      drill.y = arenaY + 90 * scale;

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

      // Adds the arena outline as a subpath (no beginPath) for even-odd composite fills
      const addArenaSubpath = () => {
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
        });
      };

      // Periodic enemy spawning
      spawnTimer++;
      if (spawnTimer > 45 && enemies.length < 12) {
        spawnEnemyOnEdge();
        spawnTimer = 0;
      }

      if (enemies.length === 0) {
        for (let i = 0; i < 5; i++) {
          spawnEnemyOnEdge();
        }
      }

      // Periodic Skill Triggering (Gravity Well or Shockwave)
      skillCycleTimer++;
      if (skillCycleTimer > 280) {
        skillCycleTimer = 0;
        const skillType = Math.random() > 0.5 ? 'GRAVITY_WELL' : 'SHOCKWAVE';
        const targetX = player.x + (Math.random() - 0.5) * 200 * scale;
        const targetY = player.y + (Math.random() - 0.5) * 160 * scale;

        if (skillType === 'GRAVITY_WELL') {
          activeSkillsFx.push({
            type: 'GRAVITY_WELL',
            x: targetX,
            y: targetY,
            radius: 10 * scale,
            maxRadius: 110 * scale,
            timer: 120,
            maxTimer: 120,
          });
          spawnFloatingText(targetX, targetY - 15, 'GRAVITY WELL!', '#c084fc');
        } else {
          activeSkillsFx.push({
            type: 'SHOCKWAVE',
            x: player.x,
            y: player.y,
            radius: 10 * scale,
            maxRadius: 140 * scale,
            timer: 45,
            maxTimer: 45,
          });
          spawnFloatingText(player.x, player.y - 20, 'KINETIC SHOCKWAVE!', '#22d3ee');
          createExplosion(player.x, player.y, '#22d3ee', 18);

          // Deflect all enemy bullets in shockwave!
          bullets.forEach(b => {
            if (!b.isDeflected) {
              b.isDeflected = true;
              b.vx = -b.vx * 1.8;
              b.vy = -b.vy * 1.8;
              b.color = '#22d3ee';
            }
          });
        }
      }

      // -------------------------------------------------------------
      // 1. SCI-FI CORNER ALIGNMENT HUDS & SYSTEM READOUTS
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 1.5;
      const bLen = 20 * scale;

      // Top-Left corner bracket
      ctx.beginPath();
      ctx.moveTo(arenaX - 6, arenaY + bLen);
      ctx.lineTo(arenaX - 6, arenaY - 6);
      ctx.lineTo(arenaX + bLen, arenaY - 6);
      ctx.stroke();

      // Top-Right corner bracket
      ctx.beginPath();
      ctx.moveTo(arenaX + arenaW + 6 - bLen, arenaY - 6);
      ctx.lineTo(arenaX + arenaW + 6, arenaY - 6);
      ctx.lineTo(arenaX + arenaW + 6, arenaY + bLen);
      ctx.stroke();

      // Bottom-Left corner bracket
      ctx.beginPath();
      ctx.moveTo(arenaX - 6, arenaY + arenaH - bLen);
      ctx.lineTo(arenaX - 6, arenaY + arenaH + 6);
      ctx.lineTo(arenaX + bLen, arenaY + arenaH + 6);
      ctx.stroke();

      // Bottom-Right corner bracket
      ctx.beginPath();
      ctx.moveTo(arenaX + arenaW + 6 - bLen, arenaY + arenaH + 6);
      ctx.lineTo(arenaX + arenaW + 6, arenaY + arenaH + 6);
      ctx.lineTo(arenaX + arenaW + 6, arenaY + arenaH - bLen);
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // SOLID BLACK SURROUND: everything outside the arena cutout is pure
      // black, matching the real game's cutout look (even-odd fill).
      // -------------------------------------------------------------
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      addArenaSubpath();
      ctx.fill('evenodd');
      ctx.restore();

      // -------------------------------------------------------------
      // 2. RENDER THE GAMEPLAY SIMULATION (CLIPPED WITHIN THE ARENA)
      // -------------------------------------------------------------
      ctx.save();
      createArenaPath();
      ctx.clip();

      // Dark gameplay arena background
      ctx.fillStyle = '#08080c';
      ctx.fillRect(arenaX, arenaY, arenaW, arenaH);

      // Subtle background scrolling grid
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
      ctx.lineWidth = 1;
      const gridShiftX = (timeSec * 15) % (35 * scale);
      const gridShiftY = (timeSec * 10) % (35 * scale);
      ctx.beginPath();
      for (let x = arenaX + gridShiftX; x < arenaX + arenaW; x += 35 * scale) {
        ctx.moveTo(x, arenaY);
        ctx.lineTo(x, arenaY + arenaH);
      }
      for (let y = arenaY + gridShiftY; y < arenaY + arenaH; y += 35 * scale) {
        ctx.moveTo(arenaX, y);
        ctx.lineTo(arenaX + arenaW, y);
      }
      ctx.stroke();
      ctx.restore();

      // Radar pulse sweep circle at center
      const radarPulse = (timeSec * 60) % (Math.hypot(arenaW, arenaH) / 2);
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(arenaX + arenaW / 2, arenaY + arenaH / 2, radarPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // MINING DRILL ZONE
      // -------------------------------------------------------------
      ctx.save();
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = drill.color;
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.arc(drill.x, drill.y, drill.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      drill.angle += 0.03;
      ctx.translate(drill.x, drill.y);
      ctx.rotate(drill.angle);
      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(-4 * scale, -drill.radius);
        ctx.lineTo(4 * scale, -drill.radius);
        ctx.lineTo(0, -drill.radius + 6 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      drill.mineTimer++;
      if (drill.mineTimer > 80) {
        drill.mineTimer = 0;
        spawnFloatingText(drill.x, drill.y - 12 * scale, '+15 Cr', '#10b981');
        createExplosion(drill.x, drill.y, '#10b981', 3);
      }

      // -------------------------------------------------------------
      // ACTIVE SKILL EFFECTS RENDERING (GRAVITY WELL & SHOCKWAVE)
      // -------------------------------------------------------------
      for (let i = activeSkillsFx.length - 1; i >= 0; i--) {
        const fx = activeSkillsFx[i];
        fx.timer--;

        if (fx.type === 'GRAVITY_WELL') {
          const progress = 1 - fx.timer / fx.maxTimer;
          const currentRadius = fx.radius + (fx.maxRadius - fx.radius) * Math.sin(progress * Math.PI);

          ctx.save();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2 * scale;

          // Swirling vortex rings
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, currentRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.rotate(timeSec * 3);
          for (let a = 0; a < 4; a++) {
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, currentRadius * 0.6, a * (Math.PI / 2), a * (Math.PI / 2) + 1.2);
            ctx.stroke();
          }
          ctx.restore();

          // Gravitational suction on enemies
          enemies.forEach(e => {
            const dx = fx.x - e.x;
            const dy = fx.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist < currentRadius + 30 * scale && dist > 5) {
              e.vx += (dx / dist) * 0.8 * scale;
              e.vy += (dy / dist) * 0.8 * scale;
            }
          });
        } else if (fx.type === 'SHOCKWAVE') {
          const progress = 1 - fx.timer / fx.maxTimer;
          const currentRadius = fx.radius + (fx.maxRadius - fx.radius) * progress;

          ctx.save();
          ctx.strokeStyle = `rgba(34, 211, 238, ${1 - progress})`;
          ctx.lineWidth = 4 * scale * (1 - progress);
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Push enemies back
          enemies.forEach(e => {
            const dx = e.x - fx.x;
            const dy = e.y - fx.y;
            const dist = Math.hypot(dx, dy);
            if (Math.abs(dist - currentRadius) < 25 * scale) {
              e.vx += (dx / (dist || 1)) * 3 * scale;
              e.vy += (dy / (dist || 1)) * 3 * scale;
              e.hp -= 2;
              e.flashDuration = 3;
            }
          });
        }

        if (fx.timer <= 0) {
          activeSkillsFx.splice(i, 1);
        }
      }

      // -------------------------------------------------------------
      // PLAYER KINETICS & PHYSICS
      // -------------------------------------------------------------
      player.x += player.vx * scale;
      player.y += player.vy * scale;

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

      // Draw Player Dash Trail
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(player.x - player.vx * 2 * i, player.y - player.vy * 2 * i, player.radius * (1 - i * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw Player Deflect Pulse Radial Arc Cooldown Ring
      player.deflectCd = (player.deflectCd + 1) % player.maxDeflectCd;
      const deflectPct = player.deflectCd / player.maxDeflectCd;
      ctx.save();
      ctx.strokeStyle = deflectPct >= 0.9 ? 'rgba(34, 211, 238, 0.9)' : 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 6 * scale, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * deflectPct);
      ctx.stroke();
      ctx.restore();

      // Render Player Vessel Body (Matching Actual Game Canvas!)
      ctx.save();
      const pRadialGlow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.radius * 1.8);
      pRadialGlow.addColorStop(0, '#ffffff');
      pRadialGlow.addColorStop(0.35, '#06b6d4');
      pRadialGlow.addColorStop(0.8, 'rgba(56, 189, 248, 0.3)');
      pRadialGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = pRadialGlow;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Outer Vessel Hull Boundary
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // OVERHEAD PLAYER HEALTH & SHIELD BARS (Actual Game Detail)
      ctx.save();
      const hpBarW = 32 * scale;
      const hpBarH = 4 * scale;
      const hpBarX = player.x - hpBarW / 2;
      const hpBarY = player.y - player.radius - 16 * scale;

      // HP Bar Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);

      // HP Bar Fill (Green/Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(hpBarX, hpBarY, hpBarW * (player.hp / player.maxHp), hpBarH);

      // Shield Bar
      if (player.shield > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(hpBarX, hpBarY - hpBarH - 1, hpBarW * (player.shield / player.maxShield), hpBarH - 1);
      }
      ctx.restore();

      // -------------------------------------------------------------
      // WEAPON 1: ACTIVE SPINNING DEFLECTION BLADE
      // -------------------------------------------------------------
      player.bladeAngle += 0.04;
      const bladeLength = 52 * scale;
      const bladeEndX = player.x + Math.cos(player.bladeAngle) * bladeLength;
      const bladeEndY = player.y + Math.sin(player.bladeAngle) * bladeLength;

      ctx.save();
      const bladeGrad = ctx.createLinearGradient(player.x, player.y, bladeEndX, bladeEndY);
      bladeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      bladeGrad.addColorStop(0.5, '#67e8f9');
      bladeGrad.addColorStop(1, '#22d3ee');

      ctx.strokeStyle = bladeGrad;
      ctx.lineWidth = 3.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(bladeEndX, bladeEndY);
      ctx.stroke();
      ctx.restore();

      // Blade Slicing Hostiles
      enemies.forEach(e => {
        const dToBladeTip = Math.hypot(e.x - bladeEndX, e.y - bladeEndY);
        if (dToBladeTip < e.radius + 10 * scale) {
          e.hp -= 5;
          e.flashDuration = 3;
          createExplosion(e.x, e.y, '#22d3ee', 1);
          if (Math.random() > 0.92) {
            spawnFloatingText(e.x, e.y - 12 * scale, '-280', '#67e8f9');
          }
        }
      });

      // -------------------------------------------------------------
      // WEAPON 2: TURRET / ORBITAL DRONE COMPANION
      // -------------------------------------------------------------
      player.turretAngle += 0.02;
      const turretRadius = 34 * scale;
      const turretX = player.x + Math.cos(player.turretAngle) * turretRadius;
      const turretY = player.y + Math.sin(player.turretAngle) * turretRadius;

      // Target nearest enemy
      let nearestEnemy: SimulatedEnemy | null = null;
      let minEnemyDist = 320 * scale;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - turretX, e.y - turretY);
        if (d < minEnemyDist) {
          minEnemyDist = d;
          nearestEnemy = e;
        }
      });

      let turretFacingAngle = player.turretAngle + Math.PI / 2;
      if (nearestEnemy) {
        turretFacingAngle = Math.atan2((nearestEnemy as SimulatedEnemy).y - turretY, (nearestEnemy as SimulatedEnemy).x - turretX);
        player.turretShootTimer++;
        if (player.turretShootTimer > 18) {
          player.turretShootTimer = 0;
          bullets.push({
            id: bulletIdCounter++,
            x: turretX,
            y: turretY,
            vx: Math.cos(turretFacingAngle) * 4.5 * scale,
            vy: Math.sin(turretFacingAngle) * 4.5 * scale,
            color: '#38bdf8',
            size: 2.5 * scale,
            isDeflected: true, // Player bullet
          });
          createExplosion(turretX, turretY, '#38bdf8', 2);
        }
      }

      ctx.save();
      ctx.translate(turretX, turretY);
      ctx.rotate(turretFacingAngle);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillRect(4 * scale, -2 * scale, 6 * scale, 4 * scale);
      ctx.restore();
      // -------------------------------------------------------------
      // BULLET SIMULATION (BOTH ENEMY AND DEFLECTED PLAYER BULLETS)
      // -------------------------------------------------------------
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Draw Bullet Sphere
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check Deflection against player
        if (!b.isDeflected) {
          const distToPlayer = Math.hypot(player.x - b.x, player.y - b.y);
          if (distToPlayer < player.radius + 18 * scale) {
            // DEFLECTION TRIGGER!
            b.isDeflected = true;
            b.vx = -b.vx * 1.8;
            b.vy = -b.vy * 1.8;
            b.color = '#22d3ee'; // Turns electric cyan!
            createExplosion(b.x, b.y, '#22d3ee', 8);
            spawnFloatingText(b.x, b.y - 10 * scale, 'DEFLECT!', '#22d3ee');
            continue;
          }
        }

        // Check Bullet Collision against Enemies if deflected or player bullet
        let removeBullet = false;
        if (b.isDeflected) {
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            const d = Math.hypot(e.x - b.x, e.y - b.y);
            if (d < e.radius + b.size + 2 * scale) {
              e.hp -= 45;
              e.flashDuration = 3;
              removeBullet = true;
              createExplosion(b.x, b.y, b.color, 4);

              if (Math.random() > 0.7) {
                spawnFloatingText(e.x, e.y - 12 * scale, `-450`, '#38bdf8');
              }
              break;
            }
          }
        } else {
          // Enemy bullet hitting player
          const distToPlayer = Math.hypot(player.x - b.x, player.y - b.y);
          if (distToPlayer < player.radius + b.size) {
            removeBullet = true;
            createExplosion(b.x, b.y, '#ef4444', 4);
            spawnFloatingText(player.x, player.y - 10 * scale, '-12', '#ef4444');
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

        // Move towards player
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        const forceSpeed = (e.enemyType === 'BASIC' ? 1.3 : e.enemyType === 'SHOOTER' ? 1.0 : e.enemyType === 'TANK' ? 0.6 : e.enemyType === 'SWARMER' ? 2.0 : e.enemyType === 'GUARDIAN' ? 0.45 : 1.6) * scale;
        e.vx = e.vx * 0.92 + Math.cos(angleToPlayer) * forceSpeed * 0.08;
        e.vy = e.vy * 0.92 + Math.sin(angleToPlayer) * forceSpeed * 0.08;
        e.x += e.vx;
        e.y += e.vy;

        // Shooter / Guardian enemy firing red bullets
        if (e.enemyType === 'SHOOTER' || e.enemyType === 'GUARDIAN') {
          e.shootTimer++;
          const fireInterval = e.enemyType === 'GUARDIAN' ? 50 : 70;
          if (e.shootTimer > fireInterval) {
            e.shootTimer = 0;
            const bAngle = Math.atan2(player.y - e.y, player.x - e.x);

            if (e.enemyType === 'GUARDIAN') {
              // Spread 3 bullets
              for (let sa = -0.25; sa <= 0.25; sa += 0.25) {
                bullets.push({
                  id: bulletIdCounter++,
                  x: e.x + Math.cos(bAngle + sa) * e.radius,
                  y: e.y + Math.sin(bAngle + sa) * e.radius,
                  vx: Math.cos(bAngle + sa) * 3.2 * scale,
                  vy: Math.sin(bAngle + sa) * 3.2 * scale,
                  color: '#f87171',
                  size: 3 * scale,
                  isDeflected: false,
                });
              }
            } else {
              bullets.push({
                id: bulletIdCounter++,
                x: e.x + Math.cos(bAngle) * e.radius,
                y: e.y + Math.sin(bAngle) * e.radius,
                vx: Math.cos(bAngle) * 2.8 * scale,
                vy: Math.sin(bAngle) * 2.8 * scale,
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
          
          // Drop Credit & XP Gems
          const gemVal = e.enemyType === 'GUARDIAN' ? 150 : e.enemyType === 'TANK' ? 35 : 15;
          orbDrops.push({
            id: orbIdCounter++,
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            type: Math.random() > 0.4 ? 'CREDIT' : 'XP',
            value: gemVal,
            color: Math.random() > 0.4 ? '#34d399' : '#c084fc',
          });

          spawnFloatingText(e.x, e.y, `+${gemVal} Cr`, '#34d399');
          enemies.splice(i, 1);
          continue;
        }

        // Check direct player bounce collision
        const dToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
        if (dToPlayer < player.radius + e.radius + 2 * scale) {
          createExplosion(e.x, e.y, '#c084fc', 8);
          spawnFloatingText(player.x, player.y - 18 * scale, 'BOUNCE! +5 Cr', '#c084fc');
          e.hp -= 80;
          e.vx = -e.vx * 2;
          e.vy = -e.vy * 2;
        }

        // DRAW ACTUAL ENEMY GRAPHICS
        ctx.save();
        if (e.flashDuration > 0) {
          e.flashDuration--;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#ffffff';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = e.color;
        }

        ctx.lineWidth = 1.8 * scale;
        ctx.translate(e.x, e.y);

        if (e.enemyType === 'BASIC') {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();

        } else if (e.enemyType === 'SHOOTER') {
          const bAngle = Math.atan2(player.y - e.y, player.x - e.x);
          ctx.rotate(bAngle);

          ctx.fillStyle = '#4b5563';
          ctx.fillRect(e.radius - 3, -4 * scale, 12 * scale, 8 * scale);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8 * scale;
          ctx.strokeRect(e.radius - 3, -4 * scale, 12 * scale, 8 * scale);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 1.8 * scale;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s * Math.PI * 2) / 6;
            ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

        } else if (e.enemyType === 'TANK') {
          ctx.fillStyle = e.color;
          for (let s = 0; s < 4; s++) {
            ctx.save();
            ctx.rotate((s * Math.PI) / 2);
            ctx.beginPath();
            ctx.moveTo(e.radius - 3 * scale, -6 * scale);
            ctx.lineTo(e.radius + 8 * scale, 0);
            ctx.lineTo(e.radius - 3 * scale, 6 * scale);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius - 1 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

        } else if (e.enemyType === 'BOMBER') {
          const bPulseVal = Math.sin(Date.now() * 0.02) * 2.5 * scale;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + bPulseVal, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

        } else if (e.enemyType === 'SWARMER') {
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.ellipse(0, 0, e.radius, e.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

        } else if (e.enemyType === 'GUARDIAN') {
          // Large Boss Guardian
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5 * scale;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 6 * scale, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(30, 20, 50, 0.95)';
          ctx.beginPath();
          for (let s = 0; s < 8; s++) {
            const a = (s * Math.PI * 2) / 8 + timeSec;
            ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        // Enemy HP Bar overhead
        if (e.hp < e.maxHp) {
          ctx.save();
          const eBarW = e.radius * 2;
          const eBarH = 3 * scale;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 8 * scale, eBarW, eBarH);
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 8 * scale, eBarW * (e.hp / e.maxHp), eBarH);
          ctx.restore();
        }
      }

      // -------------------------------------------------------------
      // LOOT ORB DROPS (MAGNETIC ATTRACTION TO PLAYER)
      // -------------------------------------------------------------
      for (let i = orbDrops.length - 1; i >= 0; i--) {
        const orb = orbDrops[i];
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 180 * scale) {
          orb.vx += (dx / dist) * 0.6 * scale;
          orb.vy += (dy / dist) * 0.6 * scale;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vx *= 0.92;
        orb.vy *= 0.92;

        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (dist < player.radius + 6 * scale) {
          spawnFloatingText(player.x, player.y - 12 * scale, `+${orb.value} Cr`, orb.color);
          orbDrops.splice(i, 1);
        }
      }

      // -------------------------------------------------------------
      // PARTICLES RENDERING
      // -------------------------------------------------------------
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

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

      // -------------------------------------------------------------
      // FLOATING NUMBERS & TEXT POPUPS
      // -------------------------------------------------------------
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.015;

        if (ft.alpha <= 0) {
          floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${Math.floor(10 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // END CLIP REGION



      // Final outer arena border
      ctx.save();
      createArenaPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4 * scale;
      ctx.stroke();
      ctx.restore();

      // Dark tinting overlay & radial vignette for high-contrast UI readability
      ctx.save();
      ctx.fillStyle = 'rgba(2, 2, 8, 0.42)';
      ctx.fillRect(0, 0, width, height);

      const vig = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.2,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
      vig.addColorStop(0.65, 'rgba(2, 2, 8, 0.55)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.90)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    const safeRender = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(safeRender);
        return;
      }
      render();
    };

    safeRender();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
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
