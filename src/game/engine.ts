import { EntityType, WeaponType, AbilityType, type Vector, type Entity, type PlayerBall, type EnemyBall, type Projectile, type Weapon, type Clone, type FloatingText } from './types.ts';
import { gameAudio } from './audio.ts';
import { balance } from './balance.ts';

// Global-ability bursts (nova / shockwave / meteor / chain / inferno-activation) are capped per
// enemy so a single press can never one-shot most enemies; the utility (knockback, freeze, burn) is what carries them.
const ABILITY_BURST_HP_CAP = 0.35;

export interface ActiveControlField {
  id: string;
  type: 'shockwave_blast' | 'gravity_well' | 'temporal_freeze';
  pos: { x: number; y: number };
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  level: number;
  tickTimer?: number;
}

export class GameEngine {
  width: number = 800;
  height: number = 600;
  player: PlayerBall;
  enemies: EnemyBall[] = [];
  projectiles: Projectile[] = [];
  clones: Clone[] = [];
  turrets: any[] = [];
  placingTurretType: string | null = null;
  mines: any[] = [];
  placingMineType: string | null = null;
  bombs: any[] = [];
  pendingBombs: any[] = [];
  warpZones: { id: string; pos: Vector; radius: number; duration: number; maxDuration: number }[] = [];
  ionZones: { id: string; pos: Vector; radius: number; duration: number; maxDuration: number }[] = [];

  addBomb(bomb: any) {
    this.pendingBombs.push(bomb);
  }
  particles: any[] = [];
  floatingTexts: FloatingText[] = [];
  activeControlFields: ActiveControlField[] = [];
  enemiesKilled: number = 0;
  currentRoom: number = 1;
  shake: number = 0;
  hitstopTimer: number = 0;
  spawnQueue: { room: number, type?: string, delay: number }[] = [];
  nextSpawnTime: number = 0;
  waveQueue: { room: number, count: number }[] = [];
  damageEvents: { time: number, amount: number }[] = [];
  
  // Tactical Overdrive Interactive Mode variables
  gameMode: 'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX' = 'SURVIVAL';
  pointerX: number = 0;
  pointerY: number = 0;
  isTetherActive: boolean = false;
  deflectPulseCooldownRemaining: number = 0;
  tetherDisableTimer: number = 0;
  deflectLassoTarget: { x: number, y: number } | null = null;
  deflectLassoTimer: number = 0;

  onGameOver?: () => void;
  onRoomClear?: () => void;
  onShake?: (intensity: number) => void;

  getDPS(): number {
    const now = Date.now();
    const duration = 2000;
    const threshold = now - duration;
    this.damageEvents = this.damageEvents.filter(e => e.time >= threshold);
    const total = this.damageEvents.reduce((sum, e) => sum + e.amount, 0);
    return Math.round(total / (duration / 1000));
  }

  getMinersCPS(): number {
    if (!this.mines) return 0;
    return this.mines
      .filter(m => m.hp > 0)
      .reduce((sum, m) => {
        const prodLvl = m.levelProd || 1;
        const multiplier = 1 + (prodLvl - 1) * 0.25;
        return sum + Math.round(m.income * multiplier);
      }, 0);
  }

  // Tactical Overdrive interactive handlers
  onLeftClick(x: number, y: number) {
    if (this.placingMineType) {
      const mType = this.placingMineType;
      const currentMineCount = this.mines ? this.mines.filter(m => m.hp > 0).length : 0;
      const maxCap = this.player.stats.maxMines || 2;
      if (currentMineCount >= maxCap) {
        gameAudio.playHitSound(false, 'laser');
        this.placingMineType = null;
        return;
      }

      let cost = 24000;
      let radius = 13;
      let mineColor = '#10b981';
      let income = 150;
      let baseHp = 100;

      if (mType === 'mine_basic') {
        cost = 24000;
        radius = 13;
        mineColor = '#10b981';
        income = 150;
        baseHp = 100;
      } else if (mType === 'mine_heavy') {
        cost = 48000;
        radius = 21;
        mineColor = '#f59e0b';
        income = 350;
        baseHp = 160;
      } else if (mType === 'mine_quantum') {
        cost = 95000;
        radius = 28;
        mineColor = '#c084fc';
        income = 720;
        baseHp = 250;
      }

      // Check overlap too close (allowed is 85% of standard radius distance)
      const overlapTooMuch = (pos1: any, r1: number, pos2: any, r2: number) => {
        if (!pos1 || !pos2) return false;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.hypot(dx, dy) < (r1 + r2) * 0.85;
      };

      const overlapsTurret = (this.turrets || []).some(t => overlapTooMuch(t.pos, t.radius, { x, y }, radius));
      const overlapsMine = (this.mines || []).some(m => overlapTooMuch(m.pos, m.radius, { x, y }, radius));

      if (overlapsTurret || overlapsMine) {
        gameAudio.playHitSound(false, 'laser');
        this.addFloatingText("OVERLAPPING!", { x, y }, "#ef4444", true);
        return; // Retain placingMineType so player can click elsewhere
      }

      const balance = this.player.stats.currency || 0;
      if (balance >= cost || this.gameMode.includes('SANDBOX')) {
        if (!this.gameMode.includes('SANDBOX')) {
          this.player.stats.currency = balance - cost;
        }

        const hpLvl = (this.player.stats.mineHpLevels as any)[mType] || 1;
        const prodLvl = (this.player.stats.mineProdLevels as any)[mType] || 1;
        const finalMaxHp = baseHp + (hpLvl - 1) * 120;

        this.mines.push({
          id: Math.random().toString(36).substring(2, 9),
          type: mType,
          pos: { x, y },
          radius,
          hp: finalMaxHp,
          maxHp: finalMaxHp,
          color: mineColor,
          income,
          levelProd: prodLvl,
          levelHp: hpLvl,
          lastIncomeTime: 0,
          angle: 0
        });

        for (let k = 0; k < 15; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 110 + Math.random() * 120;
          this.particles.push({
            type: 'SPARK',
            pos: { x, y },
            vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
            life: 0.5,
            color: mineColor
          });
        }
        gameAudio.playUpgradePickSound();
      } else {
        gameAudio.playHitSound(false, 'laser');
      }

      this.placingMineType = null;
      return;
    }

    if (this.placingTurretType) {
      const tType = this.placingTurretType;
      
      // Capacity check
      const currentTurretCount = this.turrets ? this.turrets.filter(t => t.hp > 0).length : 0;
      const maxCap = this.player.stats.maxTurrets || 3;
      if (currentTurretCount >= maxCap) {
        gameAudio.playHitSound(false, 'laser');
        this.placingTurretType = null;
        return;
      }

      let cost = 1800;
      if (tType === 'turret_tesla') cost = 2000;
      else if (tType === 'turret_sword') cost = 2500;
      else if (tType === 'turret_autoshooter') cost = 1800;
      else if (tType === 'turret_ricochet') cost = 3600;
      else if (tType === 'turret_shotgun') cost = 2200;
      else if (tType === 'turret_fire') cost = 2400;
      else if (tType === 'turret_shield') cost = 2800;
      else if (tType === 'turret_bomb') cost = 2700;
      else if (tType === 'turret_plasma') cost = 2600;

      let turretColor = '#06b6d4';
      let radius = 16;
      if (tType === 'turret_tesla') {
        turretColor = '#3b82f6';
      } else if (tType === 'turret_sword') {
        turretColor = '#f97316';
        radius = 18;
      } else if (tType === 'turret_autoshooter') {
        turretColor = '#a855f7';
      } else if (tType === 'turret_ricochet') {
        turretColor = '#10b981';
      } else if (tType === 'turret_shotgun') {
        turretColor = '#f43f5e';
        radius = 17;
      } else if (tType === 'turret_fire') {
        turretColor = '#ef4444';
      } else if (tType === 'turret_shield') {
        turretColor = '#06b6d4';
        radius = 18;
      } else if (tType === 'turret_bomb') {
        turretColor = '#f59e0b';
        radius = 17;
      } else if (tType === 'turret_plasma') {
        turretColor = '#ec4899';
      }

      // Check overlap too close (allowed is 85% of standard radius distance)
      const overlapTooMuch = (pos1: any, r1: number, pos2: any, r2: number) => {
        if (!pos1 || !pos2) return false;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.hypot(dx, dy) < (r1 + r2) * 0.85;
      };

      const overlapsTurret = (this.turrets || []).some(t => overlapTooMuch(t.pos, t.radius, { x, y }, radius));
      const overlapsMine = (this.mines || []).some(m => overlapTooMuch(m.pos, m.radius, { x, y }, radius));

      if (overlapsTurret || overlapsMine) {
        gameAudio.playHitSound(false, 'laser');
        this.addFloatingText("OVERLAPPING!", { x, y }, "#ef4444", true);
        return; // Retain placingTurretType so player can click elsewhere
      }

      const balance = this.player.stats.currency || 0;
      if (balance >= cost || this.gameMode.includes('SANDBOX')) {
        if (!this.gameMode.includes('SANDBOX')) {
          this.player.stats.currency = balance - cost;
        }

        if (!this.player.stats.turretHpLevels) {
          this.player.stats.turretHpLevels = {};
        }
        if (!this.player.stats.turretDmgLevels) {
          this.player.stats.turretDmgLevels = {};
        }

        const hpLvl = (this.player.stats.turretHpLevels as any)[tType] || 1;
        const dmgLvl = (this.player.stats.turretDmgLevels as any)[tType] || 1;
        const finalMaxHp = this.getTurretMaxHp(tType, hpLvl);

        this.turrets.push({
          id: Math.random().toString(36).substring(2, 9),
          type: tType,
          pos: { x, y },
          radius,
          hp: finalMaxHp,
          maxHp: finalMaxHp,
          lastShot: 0,
          angle: 0,
          color: turretColor,
          level: (this.player.stats.turretLevels as any)[tType] || 1,
          hpLevel: hpLvl,
          dmgLevel: dmgLvl
        });

        for (let k = 0; k < 15; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 110 + Math.random() * 120;
          this.particles.push({
            type: 'SPARK',
            pos: { x, y },
            vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
            life: 0.5,
            color: turretColor
          });
        }
        gameAudio.playUpgradePickSound();
      } else {
        gameAudio.playHitSound(false, 'laser');
      }

      this.placingTurretType = null;
      return;
    }
    this.onLeftClickChange(true, x, y);
  }

  onLeftClickChange(active: boolean, x?: number, y?: number) {
    if (this.player.isDead) {
      return;
    }
    if (!this.player.stats.isControlUnlocked) {
      return;
    }
    const currentControl = this.player.stats.leftClickSlot;
    if (currentControl === 'gravity_tether') {
      if (active) {
        if (this.tetherDisableTimer > 0) {
          this.isTetherActive = false;
          return;
        }
        this.isTetherActive = !this.isTetherActive;
        if (x !== undefined && y !== undefined) {
          this.pointerX = x;
          this.pointerY = y;
        }
      }
    } else {
      if (active && x !== undefined && y !== undefined) {
        this.executeControl('left', x, y);
      }
    }
  }

  onRightClickChange(active: boolean, x?: number, y?: number) {
    if (this.player.isDead) {
      this.isTetherActive = false;
      return;
    }
    if (!this.player.stats.isControlUnlocked) {
      this.isTetherActive = false;
      return;
    }
    const currentControl = this.player.stats.rightClickSlot;
    if (currentControl === 'gravity_tether') {
      if (active) {
        if (this.tetherDisableTimer > 0) {
          this.isTetherActive = false;
          return;
        }
        this.isTetherActive = !this.isTetherActive;
        if (x !== undefined && y !== undefined) {
          this.pointerX = x;
          this.pointerY = y;
        }
      }
    } else {
      if (active && x !== undefined && y !== undefined) {
        this.executeControl('right', x, y);
      }
    }
  }

  executeControl(slot: 'left' | 'right', x: number, y: number) {
    if (this.player.isDead) return;
    if (!this.player.stats.isControlUnlocked) return;
    
    // Get the control ID equipped in this slot
    const controlId = slot === 'left' ? this.player.stats.leftClickSlot : this.player.stats.rightClickSlot;
    if (!controlId) return;

    // Determine level
    const owned = this.player.stats.ownedControls?.find(c => c.id === controlId);
    if (!owned) return;
    const level = owned.level;

    // Check cooldown
    const cooldownKey = controlId;
    const cdRemaining = this.player.stats.controlCooldowns?.[cooldownKey] || 0;
    if (cdRemaining > 0) return;

    // Calculate action cooldown
    let cooldownDuration = 0;
    if (controlId === 'redirection_pull') {
      cooldownDuration = Math.max(1.0, 2.5 - (level - 1) * 0.10);
    } else if (controlId === 'gravity_tether') {
      cooldownDuration = 0.1; // hold state
    } else if (controlId === 'gravity_warp') {
      cooldownDuration = Math.max(3.0, 10.0 - (level - 1) * 0.8);
    } else if (controlId === 'shockwave_blast') {
      cooldownDuration = Math.max(2.0, 6.0 - (level - 1) * 0.5);
    } else if (controlId === 'gravity_well') {
      cooldownDuration = Math.max(3.0, 8.0 - (level - 1) * 0.6);
    } else if (controlId === 'temporal_freeze') {
      cooldownDuration = Math.max(4.0, 12.0 - (level - 1) * 0.8);
    } else if (controlId === 'emp_pulse') {
      cooldownDuration = Math.max(3.0, 10.0 - (level - 1) * 0.7);
    } else if (controlId?.startsWith('turret_')) {
      cooldownDuration = 10.0; // cooldown for redeployment has 10s default
    }

    // Set cooldown in engine state
    if (!this.player.stats.controlCooldowns) {
      this.player.stats.controlCooldowns = {};
    }
    this.player.stats.controlCooldowns[cooldownKey] = cooldownDuration;

    // Mirror to standard deflect pulse cooldown visual if it's the redirection_pull
    if (controlId === 'redirection_pull') {
      this.deflectPulseCooldownRemaining = cooldownDuration;
    }

    // Play action visual details
    if (controlId === 'redirection_pull') {
      // Regular Redirection Pull (Enhanced default speed)
      this.deflectLassoTarget = { x, y };
      this.deflectLassoTimer = 0.25;
      const angle = Math.atan2(y - this.player.pos.y, x - this.player.pos.x);
      // Increased default speed from 820 to 1200 for a much better pull feel
      const launchSpeed = (1200 + (level - 1) * 75) * (this.player.stats.speed || 1.0);
      this.player.vel.x = Math.cos(angle) * launchSpeed;
      this.player.vel.y = Math.sin(angle) * launchSpeed;
      gameAudio.playHitSound(false, 'laser');
      this.shake = Math.min(10, this.shake + 2.5);

      // Perform bullet redirection
      const blastRadius = 145 + (level - 1) * 15;
      this.projectiles = this.projectiles.map(p => {
        if (p.ownerId === 'player') return p;
        const dist = Math.hypot(p.pos.x - this.player.pos.x, p.pos.y - this.player.pos.y);
        if (dist < blastRadius + p.radius) {
          const nearestEnemy = this.getNearestEnemyTo(p.pos);
          const redirectAngle = nearestEnemy 
            ? Math.atan2(nearestEnemy.pos.y - p.pos.y, nearestEnemy.pos.x - p.pos.x)
            : Math.atan2(p.pos.y - this.player.pos.y, p.pos.x - this.player.pos.x);

          p.ownerId = 'player';
          const speed = (Math.hypot(p.vel.x, p.vel.y) * (1.6 + (level - 1) * 0.1) || 700);
          p.vel.x = Math.cos(redirectAngle) * speed;
          p.vel.y = Math.sin(redirectAngle) * speed;
          p.damage = Math.max(p.damage || 20, 75 * (1 + this.currentRoom * 0.08) * (1 + (level - 1) * 0.12));
          
          for (let k = 0; k < 4; k++) {
            this.particles.push({
              type: 'SPARK',
              pos: { ...p.pos },
              vel: {
                x: p.vel.x * 0.35 + (Math.random() - 0.5) * 120,
                y: p.vel.y * 0.35 + (Math.random() - 0.5) * 120
              },
              life: 0.3,
              color: '#34d399'
            });
          }
        }
        return p;
      });
    } else if (controlId === 'gravity_warp') {
      // Direct spatial teleportation
      gameAudio.playHitSound(false, 'laser');
      const oldPos = { ...this.player.pos };
      
      // Relocate player
      const margin = 20;
      this.player.pos.x = Math.max(margin, Math.min(this.width - margin, x));
      this.player.pos.y = Math.max(margin, Math.min(this.height - margin, y));
      
      this.shake = Math.min(15, this.shake + 8);
      
      // Starburst sparks at departure
      for (let k = 0; k < 12; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 120 + Math.random() * 150;
        this.particles.push({
          type: 'SPARK',
          pos: { ...oldPos },
          vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
          life: 0.45,
          color: '#ec4899'
        });
      }
      
      // Starburst sparks at arrival
      for (let k = 0; k < 12; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 120 + Math.random() * 150;
        this.particles.push({
          type: 'SPARK',
          pos: { ...this.player.pos },
          vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
          life: 0.45,
          color: '#06b6d4'
        });
      }

      // Quantum displacement push AOE around arrival point (No damage)
      const warpRadius = 135 + (level - 1) * 15;

      this.enemies.forEach(e => {
        if (e.isDead) return;
        const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
        if (dist < warpRadius) {
          // Apply shockwave repelling push
          const ang = Math.atan2(e.pos.y - this.player.pos.y, e.pos.x - this.player.pos.x);
          e.vel.x += Math.cos(ang) * 450;
          e.vel.y += Math.sin(ang) * 450;

          this.floatingTexts.push({
            id: Math.random().toString(),
            pos: { ...e.pos },
            vel: { x: (Math.random() - 0.5) * 40, y: -60 },
            text: `TELEPORT!`,
            color: '#ec4899',
            life: 1.2,
            maxLife: 1.2,
            isCrit: true
          });
        }
      });
    } else if (controlId === 'shockwave_blast') {
      // Localized kinetic shockwave burst centered at cursor (x, y) (No damage)
      gameAudio.playHitSound(false, 'laser');
      const maxRadius = 220 + (level - 1) * 20;
      this.shake = Math.min(18, this.shake + 9);

      // Localized shockwave push and stun on enemies
      this.enemies.forEach(e => {
        if (e.isDead) return;
        const dist = Math.hypot(e.pos.x - x, e.pos.y - y);
        if (dist < maxRadius) {
          const ang = Math.atan2(e.pos.y - y, e.pos.x - x) || 0;
          const pushForce = 850 + level * 70;
          e.vel.x += Math.cos(ang) * pushForce;
          e.vel.y += Math.sin(ang) * pushForce;
          e.stunTimer = Math.max(e.stunTimer || 0, 1.8 + level * 0.2);

          this.floatingTexts.push({
            id: Math.random().toString(),
            pos: { ...e.pos },
            vel: { x: (Math.random() - 0.5) * 40, y: -60 },
            text: `SHOCKWAVE!`,
            color: '#f59e0b',
            life: 1.1,
            maxLife: 1.1,
            isCrit: true
          });
        }
      });

      // Deflect/push enemy projectiles inside the cursor shockwave radius
      this.projectiles = this.projectiles.map(p => {
        if (p.ownerId === 'player') return p;
        const dist = Math.hypot(p.pos.x - x, p.pos.y - y);
        if (dist < maxRadius + p.radius) {
          const ang = Math.atan2(p.pos.y - y, p.pos.x - x) || 0;
          p.ownerId = 'player';
          p.vel.x = Math.cos(ang) * 900;
          p.vel.y = Math.sin(ang) * 900;
          p.damage = Math.max(p.damage || 20, 80 * (1 + (level - 1) * 0.15));
        }
        return p;
      });

      this.activeControlFields.push({
        id: Math.random().toString(),
        type: 'shockwave_blast',
        pos: { x, y },
        radius: 10,
        maxRadius,
        life: 0.35,
        maxLife: 0.35,
        level
      });

    } else if (controlId === 'gravity_well') {
      // Localized singularity gravity well at cursor position (x, y)
      gameAudio.playHitSound(false, 'laser');
      const maxRadius = 190 + (level - 1) * 15;
      const maxLife = 3.5 + (level - 1) * 0.5;

      this.activeControlFields.push({
        id: Math.random().toString(),
        type: 'gravity_well',
        pos: { x, y },
        radius: maxRadius,
        maxRadius,
        life: maxLife,
        maxLife,
        level,
        tickTimer: 0
      });

      this.floatingTexts.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: { x: 0, y: -50 },
        text: "GRAVITY WELL ACTIVE!",
        color: '#a855f7',
        life: 1.2,
        maxLife: 1.2,
        isCrit: true
      });

    } else if (controlId === 'temporal_freeze') {
      // Localized stasis freeze ring centered at cursor (x, y)
      gameAudio.playHitSound(false, 'laser');
      const maxRadius = 200 + (level - 1) * 20;
      const maxLife = 3.0 + (level - 1) * 0.5;

      this.activeControlFields.push({
        id: Math.random().toString(),
        type: 'temporal_freeze',
        pos: { x, y },
        radius: maxRadius,
        maxRadius,
        life: maxLife,
        maxLife,
        level
      });

      this.floatingTexts.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: { x: 0, y: -50 },
        text: "STASIS FREEZE!",
        color: '#38bdf8',
        life: 1.2,
        maxLife: 1.2,
        isCrit: true
      });
    } else if (controlId?.startsWith('turret_')) {
      // Spawn new defensive sentry turret
      let maxHp = 120;
      let turretColor = '#06b6d4';
      let radius = 16;
      if (controlId === 'turret_tesla') {
        maxHp = 150;
        turretColor = '#3b82f6';
      } else if (controlId === 'turret_sword') {
        maxHp = 250; // Sword has more health by default as requested
        turretColor = '#f97316';
        radius = 18;
      } else if (controlId === 'turret_autoshooter') {
        maxHp = 120;
        turretColor = '#a855f7';
      } else if (controlId === 'turret_ricochet') {
        maxHp = 180;
        turretColor = '#10b981';
      }

      // Scaling health based on owned upgrade level
      const hpScale = 1.0 + (level - 1) * 0.2;
      const finalMaxHp = Math.round(maxHp * hpScale);

      this.turrets.push({
        id: Math.random().toString(36).substring(2, 9),
        type: controlId,
        pos: { x, y },
        radius,
        hp: finalMaxHp,
        maxHp: finalMaxHp,
        lastShot: 0,
        angle: 0,
        color: turretColor,
        level: level
      });

      gameAudio.playUpgradePickSound();

      // Spawn mechanical placement sparks
      for (let k = 0; k < 15; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 110 + Math.random() * 120;
        this.particles.push({
          type: 'SPARK',
          pos: { x, y },
          vel: { x: Math.cos(a) * s, y: Math.sin(a) * s },
          life: 0.5,
          color: turretColor
        });
      }
    }
  }

  updatePointerPos(x: number, y: number) {
    this.pointerX = x;
    this.pointerY = y;
  }

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.player = this.createPlayer();
    
    // Register shake handler with smooth clamped limits (greatly reduced screen shake)
    this.onShake = (intensity) => {
        const clamped = Math.min(8, intensity * 0.2);
        if (clamped >= this.shake) {
            this.shake = Math.min(8, clamped);
        } else {
            this.shake = Math.min(8, this.shake + clamped * 0.08);
        }
    };
  }

  startRoom(room: number, totalEnemies: number, wavesCount: number) {
      if (this.player) {
          this.player.spawnShieldTimer = 1.0;
          (this.player as any).tookDamageInCurRoom = false;
      }
      (this as any).startingEnemiesInPlay = totalEnemies;
      this.currentRoom = room;
      this.spawnQueue = [];
      this.waveQueue = [];
      this.enemies = [];
      this.warpZones = [];
      this.ionZones = [];

      // Restore full health to active turrets and mines when starting or restoring a room
      if (this.turrets && Array.isArray(this.turrets)) {
          this.turrets.forEach(t => {
              if (t.maxHp) t.hp = t.maxHp;
          });
      }
      if (this.mines && Array.isArray(this.mines)) {
          this.mines.forEach(m => {
              if (m.maxHp) m.hp = m.maxHp;
          });
      }
      
      const enemiesPerWave = Math.floor(totalEnemies / wavesCount);
      const remainder = totalEnemies % wavesCount;

      for (let i = 0; i < wavesCount; i++) {
          this.waveQueue.push({
              room,
              count: enemiesPerWave + (i === 0 ? remainder : 0)
          });
      }
      
      this.triggerNextWave();
  }

  triggerNextWave() {
      const wave = this.waveQueue.shift();
      if (wave) {
          for (let i = 0; i < wave.count; i++) {
              this.spawnEnemy(wave.room);
          }
      }
  }

  createPlayer(): PlayerBall {
    return {
      id: 'player',
      type: EntityType.PLAYER_BALL,
      pos: { x: this.width / 2, y: this.height / 2 },
      vel: { x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600 },
      radius: 18,
      hp: 300,
      maxHp: 300,
      color: '#38bdf8',
      isDead: false,
      weapons: [],
      abilities: [],
      hurtTimer: 0,
      lastDamageTime: 0,
      stats: {
        speed: 1.2,
        bounceDmg: 10,
        defense: 1,
        critChance: 0.05,
        regen: 0.6, // Slow health regeneration by default
        lifesteal: 0,
        accuracy: 0.15,
        cooldownMult: 1,
        currency: 1000,
        weaponSynergy: 0.1,
        damageMult: 1.0,
        pierce: 0,
        meleeSpeed: 1.0,
        weaponSize: 1.0,
        projectileSlow: 0.0,
        slowDmgBoost: 0.0,
        fireDmgBoost: 0.0,
        fireMeleeDmgBoost: 0.0,
        isTetherUnlocked: false,
        isStabilizerUnlocked: false,
        isReflectorUnlocked: false,
        equippedMovementModules: [],
        deflectCooldownReduction: 0,
        isControlUnlocked: false,
        isTurretsUnlocked: false,
        isMinesUnlocked: false,
        maxMines: 2,
        totalMiningEarnings: 0,
        mineHpLevels: {
          mine_basic: 1,
          mine_heavy: 1,
          mine_quantum: 1
        },
        mineProdLevels: {
          mine_basic: 1,
          mine_heavy: 1,
          mine_quantum: 1
        },
        turretLevels: {
          turret_tesla: 1,
          turret_sword: 1,
          turret_autoshooter: 1,
          turret_ricochet: 1,
          turret_shotgun: 1,
          turret_fire: 1,
          turret_shield: 1,
          turret_bomb: 1,
          turret_plasma: 1
        },
        maxTurrets: 3,
        turretHpLevels: {
          turret_tesla: 1,
          turret_sword: 1,
          turret_autoshooter: 1,
          turret_ricochet: 1,
          turret_shotgun: 1,
          turret_fire: 1,
          turret_shield: 1,
          turret_bomb: 1,
          turret_plasma: 1
        },
        turretDmgLevels: {
          turret_tesla: 1,
          turret_sword: 1,
          turret_autoshooter: 1,
          turret_ricochet: 1,
          turret_shotgun: 1,
          turret_fire: 1,
          turret_shield: 1,
          turret_bomb: 1,
          turret_plasma: 1
        },
        leftClickSlot: null,
        rightClickSlot: null,
        ownedControls: [],
        controlCooldowns: {},
        upgradeChoicesCount: 3,
      },
    };
  }

  spawnEnemy(room: number, forceType?: string) {
    const types: ('BASIC' | 'SHOOTER' | 'SPLITTER' | 'TANK' | 'SHIELDED' | 'GUNNER' | 'BOMBER' | 'SWARMER' | 'PHANTOM' | 'TESLA_COIL' | 'GRAVITY_DRAIN' | 'MIRAGE' | 'CRYOMANCER' | 'STALKER' | 'HEALER' | 'WARP_WARLOCK' | 'PLASMA_STORMER' | 'BIO_LEECH')[] = ['BASIC'];
    if (room > 1) types.push('SHOOTER');
    if (room > 5) types.push('SPLITTER');
    if (room > 8) types.push('TANK');
    if (room > 11) {
        types.push('SHIELDED');
        types.push('TESLA_COIL');
    }
    if (room > 15) {
        types.push('HEALER');
    }
    if (room > 21) {
        types.push('GUNNER');
        types.push('MIRAGE');
    }
    if (room > 25) {
        types.push('BOMBER');
        types.push('GRAVITY_DRAIN');
    }
    if (room > 30) {
        types.push('SWARMER');
        types.push('CRYOMANCER');
        types.push('WARP_WARLOCK');
        types.push('WARP_WARLOCK');
        types.push('PLASMA_STORMER');
        types.push('PLASMA_STORMER');
        types.push('BIO_LEECH');
    }
    if (room > 35) {
        types.push('PHANTOM');
        types.push('STALKER');
        types.push('BIO_LEECH');
        types.push('WARP_WARLOCK');
        types.push('PLASMA_STORMER');
    }

    const type = forceType as any || types[Math.floor(Math.random() * types.length)];
    
    // Position finding with safe zone around player
    let spawnPos = { x: 0, y: 0 };
    let tooClose = true;
    let attempts = 0;
    while (tooClose && attempts < 20) {
        // Pick one of the four edges
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { // Left
            spawnPos = { x: 50, y: Math.random() * (this.height - 200) + 100 };
        } else if (side === 1) { // Right
            spawnPos = { x: this.width - 50, y: Math.random() * (this.height - 200) + 100 };
        } else if (side === 2) { // Top
            spawnPos = { x: Math.random() * (this.width - 200) + 100, y: 50 };
        } else { // Bottom
            spawnPos = { x: Math.random() * (this.width - 200) + 100, y: this.height - 50 };
        }

        const dist = Math.hypot(spawnPos.x - this.player.pos.x, spawnPos.y - this.player.pos.y);
        if (dist > 250) {
            tooClose = false;
        }
        attempts++;
    }

    // Scaling logic: gentle and progressive in early rounds, accelerating curve past level 20
    let roomScale = room;
    if (room === 63) {
        roomScale = 45; // Significantly soften level 63 difficulty
    } else if (room <= 10) {
        roomScale = room * 0.4;
    } else if (room <= 20) {
        roomScale = 4 + (room - 10) * 0.6;
    } else {
        // Difficulty curves up noticeably faster past level 20
        roomScale = 10 + Math.pow(room - 20, 1.25) * 2.2;
        if (room > 50) {
            roomScale = 110 + Math.pow(room - 50, 1.35) * 4.2;
        }
    }

    let defaultSpeed = 1.2;
    let radius = 15;
    let hpBaseVal = 15;
    let color = '#f87171';

    switch (type) {
        case 'TANK':
            radius = 25;
            hpBaseVal = 80;
            color = '#a855f7';
            defaultSpeed = 0.8;
            break;
        case 'SHIELDED':
            radius = 25;
            hpBaseVal = 40;
            color = '#38bdf8';
            defaultSpeed = 0.7;
            break;
        case 'SWARMER':
            radius = 9;
            hpBaseVal = 8;
            color = '#f87171';
            defaultSpeed = 1.8;
            break;
        case 'SHOOTER':
            radius = 15;
            hpBaseVal = 18;
            color = '#fbbf24';
            defaultSpeed = 1.0;
            break;
        case 'GUNNER':
            radius = 17;
            hpBaseVal = 30;
            color = '#f59e0b';
            defaultSpeed = 0.9;
            break;
        case 'SPLITTER':
            radius = 12;
            hpBaseVal = 15;
            color = '#f472b6';
            defaultSpeed = 1.3;
            break;
        case 'BOMBER':
            radius = 18;
            hpBaseVal = 25;
            color = '#b91c1c';
            defaultSpeed = 1.4;
            break;
        case 'PHANTOM':
            radius = 15;
            hpBaseVal = 20;
            color = '#818cf8';
            defaultSpeed = 1.5;
            break;
        case 'TESLA_COIL':
            radius = 18;
            hpBaseVal = 45;
            color = '#c084fc';
            defaultSpeed = 0.6;
            break;
        case 'GRAVITY_DRAIN':
            radius = 22;
            hpBaseVal = 60;
            color = '#4f46e5';
            defaultSpeed = 0.7;
            break;
        case 'MIRAGE':
            radius = 15;
            hpBaseVal = 22;
            color = '#fda4af';
            defaultSpeed = 1.3;
            break;
        case 'CRYOMANCER':
            radius = 16;
            hpBaseVal = 35;
            color = '#22d3ee';
            defaultSpeed = 1.1;
            break;
        case 'STALKER':
            radius = 14;
            hpBaseVal = 25;
            color = '#3f3f46';
            defaultSpeed = 1.7;
            break;
        case 'HEALER':
            radius = 16;
            hpBaseVal = 28;
            color = '#22c55e';
            defaultSpeed = 1.0;
            break;
        case 'WARP_WARLOCK':
            radius = 20;
            hpBaseVal = 55;
            color = '#9333ea';
            defaultSpeed = 1.0;
            break;
        case 'PLASMA_STORMER':
            radius = 18;
            hpBaseVal = 48;
            color = '#0284c7';
            defaultSpeed = 1.2;
            break;
        case 'BIO_LEECH':
            radius = 19;
            hpBaseVal = 52;
            color = '#059669';
            defaultSpeed = 1.1;
            break;
        default:
            radius = 15;
            hpBaseVal = 15;
            color = '#f87171';
            defaultSpeed = 1.2;
    }

    // Speed scaling: keep enemy speed controlled and readable
    // Past room 40: enforce a grounded speed cap (max 1.25x) so enemies move deliberately instead of flying super fast
    let speedMult = defaultSpeed + Math.min(roomScale * 0.015, 0.4);
    if (room > 40) {
        speedMult = Math.min(speedMult, 1.25);
    }

    let hp = hpBaseVal * (1 + roomScale * 0.08);

    // Past room 40: MASSIVE HEALTH BOOST
    // Enemies are formidable and heavy; they are no longer one-shot by stray bullets
    if (room > 40) {
        const lateRoomTier = room - 40;
        // Significant escalating health boost giving basic enemies 3,500 to 20,000+ HP, and Tanks 20,000 to 100,000+ HP
        const healthMultiplier = 220 + lateRoomTier * 45 + Math.pow(lateRoomTier, 1.45) * 12;
        hp = hpBaseVal * healthMultiplier;
    }

    // Apply specific level range adjustments:
    // Buffed health for rounds 2-20 and 11-20 so enemies are not one-shot by weapons
    if (room === 1) {
        hp *= 0.55;        // Intro room with gentle health
        speedMult *= 0.75;
    } else if (room >= 2 && room <= 10) {
        // Buffed significantly from 0.40 to 1.25 so enemies have sturdy HP and survive multiple hits
        hp *= 1.25;
        speedMult *= 0.82;
    } else if (room >= 11 && room <= 20) {
        // Buffed from 0.55 to 1.15 so enemies scale appropriately against upgraded armaments
        hp *= 1.15;
        speedMult *= 0.88;
    }

    let enemyDamageMult = 1.0;
    if (room > 50) {
        hp *= 1.8;
        enemyDamageMult = 1.8;
    }

    // Balance bot knob: global enemy health multiplier (default 1.0)
    hp *= balance.enemyHpMult;

    const launchBase = room > 40 ? 280 : 360;
    const enemy: EnemyBall = {
      id: Math.random().toString(36),
      type: EntityType.ENEMY_BALL,
      enemyType: type,
      pos: spawnPos,
      vel: { x: (Math.random() - 0.5) * launchBase * speedMult, y: (Math.random() - 0.5) * launchBase * speedMult },
      radius,
      hp,
      maxHp: hp,
      color,
      isDead: false,
    };
    if (enemyDamageMult > 1.0) {
        (enemy as any).damageMult = enemyDamageMult;
    }

    if (type === 'SHIELDED') {
        enemy.maxShieldHp = hp * 0.8;
        enemy.shieldHp = enemy.maxShieldHp;
    }

    // Thruster assignment: Bomber is permanently equipped with rear rocket thrusters so it can charge and explode
    if (type === 'BOMBER') {
        enemy.hasThruster = true;
    }

    // Past level 40: Rocket thrusters start spawning randomly on any spawned enemies
    if (room > 40 && !enemy.isBoss && Math.random() < 0.35) {
        enemy.hasThruster = true;
    }

    // Force fields assignment for room > 30 (Milestone past 30)
    if (room > 30) {
        // Starts rare (8% chance) at level 31, slowly scales up by 1.5% per level, capped at 45%
        const ffChance = Math.min(0.45, 0.08 + (room - 30) * 0.015);
        if (Math.random() < ffChance) {
            const ffTypes: ('SPAWN_IMMUNITY' | 'PERIODIC' | 'DIRECTIONAL' | 'VULNERABLE')[] = 
                ['SPAWN_IMMUNITY', 'PERIODIC', 'DIRECTIONAL', 'VULNERABLE'];
            const chosenType = ffTypes[Math.floor(Math.random() * ffTypes.length)];
            enemy.forceFieldType = chosenType;
            
            if (chosenType === 'SPAWN_IMMUNITY') {
                enemy.forceFieldTimer = 1.0; // active invulnerability seconds (Only one second)
            } else if (chosenType === 'PERIODIC') {
                enemy.forceFieldTimer = 3.0; // toggles every 3.0s
                enemy.forceFieldState = true; 
            } else if (chosenType === 'DIRECTIONAL') {
                enemy.forceFieldAngle = Math.random() * Math.PI * 2;
                enemy.forceFieldTimer = 0; // rotation timer
            } else if (chosenType === 'VULNERABLE') {
                enemy.forceFieldAngle = Math.random() * Math.PI * 2; // rotating vulnerability angle gap
                enemy.forceFieldTimer = 1.2; // spin rate
            }
        }
    }

    // Spawn effect
    this.particles.push({
        type: 'WARP',
        pos: { ...enemy.pos },
        radius: 0,
        maxRadius: radius * 3,
        life: 0.5,
        color: enemy.color
    });

    this.enemies.push(enemy);
  }

  spawnBoss(room: number, isUltra: boolean = false) {
    if (this.player) {
        this.player.spawnShieldTimer = 1.0;
    }
    const hpBase = isUltra ? 45000 : 4500; // Base health heavily buffed (from 15000 / 1800)
    let roomScale = room;
    if (room > 10) roomScale = 10 + (room - 10) * 2.5; 
    if (room > 40) roomScale = 85 + (room - 40) * 5.0;
    
    let hpValue = hpBase * (1 + roomScale * 0.22); 
    
    // Substantial boss buffs for Room 30 and above
    if (room >= 30) {
        hpValue *= 3.5; // Ultimate mechanical boss gets +250% additional health scaling!
    }
    
    // Additional special buffs for Round 20 and Round 30 bosses (TITAN and PHANTOM_ACE)
    if (room === 20 || (roomScale > 15 && roomScale < 25)) {
        hpValue *= 1.8; // Titan boss gets an additional +80% health multiplier!
    }
    if (room === 30 || (roomScale >= 25 && roomScale < 35)) {
        hpValue *= 2.2; // Phantom Ace gets an additional +120% health multiplier!
    }

    // Force specific bosses at milestones
    let bossSubtype: any = 'WARRIOR';
    
    const subtypes: ('WARRIOR' | 'TITAN' | 'SWARM_QUEEN' | 'PHANTOM_ACE' | 'VOID_SENTINEL' | 'STORM_BRINGER' | 'ARCHITECT' | 'REAPER' | 'NEXUS_OVERLORD')[] = 
        ['WARRIOR', 'TITAN', 'STORM_BRINGER'];
    if (room >= 30) subtypes.push('PHANTOM_ACE', 'ARCHITECT');
    if (room >= 40) subtypes.push('VOID_SENTINEL');
    if (room >= 50) subtypes.push('SWARM_QUEEN', 'REAPER', 'NEXUS_OVERLORD');

    bossSubtype = subtypes[Math.floor(Math.random() * subtypes.length)];

    if (room === 10) bossSubtype = 'WARRIOR';
    if (room === 20) bossSubtype = 'TITAN';
    if (room === 30) bossSubtype = 'PHANTOM_ACE';
    if (room === 40) bossSubtype = 'STORM_BRINGER';
    if (room === 50) bossSubtype = 'NEXUS_OVERLORD';
    if (room % 100 === 0) bossSubtype = 'NEXUS_OVERLORD';

    const radius = (bossSubtype === 'NEXUS_OVERLORD') ? 110 : (isUltra ? 95 : 68);
    let bossType: any = isUltra ? 'ULTRA_BOSS' : 'BOSS';

    if (bossSubtype === 'WARRIOR' || room === 10) {
        hpValue = isUltra ? 8000 : 950; // Greatly reduced Level 10 / Warrior boss health to make it accessible
    } else if (bossSubtype === 'TITAN' || room === 20) {
        hpValue = isUltra ? 14000 : 2800; // Balanced Level 20 Titan boss health
    }

    let color = '#ef4444';
    let shieldHp = 0;

    if (bossSubtype === 'TITAN') {
        shieldHp = (room === 20 || !isUltra) ? (room === 20 ? 800 : hpValue * 0.4) : hpValue * 0.8;
        color = '#38bdf8';
    } else if (bossSubtype === 'STORM_BRINGER') {
        color = '#fbbf24'; 
    } else if (bossSubtype === 'PHANTOM_ACE') {
        color = '#ec4899'; 
    } else if (bossSubtype === 'VOID_SENTINEL') {
        color = '#ffffff'; 
        shieldHp = hpValue * 0.5;
    } else if (bossSubtype === 'ARCHITECT') {
        color = '#a855f7';
        shieldHp = hpValue * 0.4;
    } else if (bossSubtype === 'REAPER') {
        color = '#ef4444';
    } else if (bossSubtype === 'NEXUS_OVERLORD') {
        if (room === 50) {
            hpValue = 3500000; // 3.5 Million (way less than 25M)
            shieldHp = 500000;
        } else {
            hpValue = 28000000; // 28 Million (way less than 10B)
            shieldHp = 5000000;
        }
        color = '#f43f5e';
    }

    // Balance bot knob: global boss health multiplier (default 1.0)
    hpValue *= balance.enemyHpMult;
    if (shieldHp > 0) shieldHp *= balance.enemyHpMult;

    const boss: EnemyBall = {
        id: 'boss-' + Math.random(),
        type: EntityType.ENEMY_BALL,
        enemyType: bossType,
        bossSubtype: bossSubtype,
        pos: { x: this.width / 2, y: -radius * 2 },
        vel: { x: (Math.random() - 0.5) * 200, y: 300 },
        radius,
        hp: hpValue,
        maxHp: hpValue,
        color,
        isDead: false,
        isBoss: true,
        shieldHp: shieldHp,
        maxShieldHp: shieldHp,
        bossStage: 1,
        bossAttackTimer: 0
    };

    // Equip bosses at room 30+ with powerful dynamic on/off periodic, directional, or rotating gap/hole force-fields
    if (room >= 30) {
        const bossFFTypes: ('PERIODIC' | 'VULNERABLE' | 'DIRECTIONAL')[] = ['PERIODIC', 'VULNERABLE', 'DIRECTIONAL'];
        const chosenFFType = bossFFTypes[Math.floor(Math.random() * bossFFTypes.length)];
        boss.forceFieldType = chosenFFType;
        
        if (chosenFFType === 'PERIODIC') {
            boss.forceFieldTimer = 3.0; // tumbles every 3 seconds
            boss.forceFieldState = true; 
        } else if (chosenFFType === 'DIRECTIONAL') {
            boss.forceFieldAngle = Math.random() * Math.PI * 2;
            boss.forceFieldTimer = 0;
        } else if (chosenFFType === 'VULNERABLE') {
            boss.forceFieldAngle = Math.random() * Math.PI * 2; // rotating vulnerability ring with holes
            boss.forceFieldTimer = 1.0; // spin rate
        }
    }

    // Spawn effect for boss
    this.particles.push({
        type: 'WARP',
        pos: { x: this.width/2, y: 150 },
        radius: 0,
        maxRadius: 300,
        life: 0.5,
        color: color
    });

    this.enemies.push(boss);
  }

  nexusBossTransition(enemy: EnemyBall, stage: number, msg: string, color: string) {
      this.explodeBomb({
          pos: enemy.pos,
          radius: 280,
          damage: 0,
          color: color
      });
      this.floatingTexts.push({
          id: Math.random().toString(36),
          pos: { x: enemy.pos.x, y: enemy.pos.y - 50 },
          vel: { x: 0, y: -90 },
          text: msg,
          color: color,
          life: 3.0,
          maxLife: 3.0,
          isCrit: true
      });
      gameAudio.playHitSound(false, 'impact');
      
      // Ring particle burst
      for (let i = 0; i < 30; i++) {
          const ang = (Math.PI * 2 / 30) * i;
          this.particles.push({
              type: 'NOVA',
              pos: { ...enemy.pos },
              vel: { x: Math.cos(ang) * 450, y: Math.sin(ang) * 450 },
              life: 0.8,
              color: color
          });
      }

      // Restore/mutate shield depending on stage
      if (stage === 2) {
          enemy.maxShieldHp = (enemy.maxHp || 1) * 0.4;
          enemy.shieldHp = enemy.maxShieldHp;
          enemy.forceFieldType = 'VULNERABLE';
          enemy.forceFieldState = true;
          enemy.forceFieldAngle = 0;
          enemy.forceFieldTimer = 1.5;
      } else if (stage === 3) {
          enemy.maxShieldHp = (enemy.maxHp || 1) * 0.5;
          enemy.shieldHp = enemy.maxShieldHp;
          enemy.forceFieldType = 'DIRECTIONAL';
          enemy.forceFieldState = true;
          enemy.forceFieldAngle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
      } else if (stage === 4) {
          enemy.maxShieldHp = (enemy.maxHp || 1) * 0.6;
          enemy.shieldHp = enemy.maxShieldHp;
          enemy.forceFieldType = 'PERIODIC';
          enemy.forceFieldState = true;
          enemy.forceFieldTimer = 2.0;
      } else if (stage === 5) {
          enemy.maxShieldHp = (enemy.maxHp || 1) * 0.75;
          enemy.shieldHp = enemy.maxShieldHp;
          enemy.forceFieldType = 'PERIODIC';
          enemy.forceFieldState = true;
          enemy.forceFieldTimer = 1.0;
      }
  }

  bossStageTransition(enemy: EnemyBall, stage: number) {
      const bannerColor = stage === 3 ? '#ef4444' : (enemy.color || '#ec4899');
      this.explodeBomb({
          pos: enemy.pos,
          radius: 220,
          damage: 0,
          color: bannerColor
      });

      let stageText = `STAGE ${stage}: OVERDRIVE ACTIVATED!`;

      if (stage === 2) {
          switch (enemy.bossSubtype) {
              case 'WARRIOR':
                  stageText = 'STAGE 2: CHARGE RUSH & FLAME WALLS!';
                  break;
              case 'TITAN':
                  stageText = 'STAGE 2: FORTRESS ORBIT & SHIELD RECHARGE!';
                  enemy.maxShieldHp = (enemy.maxHp || 1) * 0.45;
                  enemy.shieldHp = enemy.maxShieldHp;
                  break;
              case 'PHANTOM_ACE':
                  stageText = 'STAGE 2: TRI-CORNER AMBUSH & DECOYS!';
                  break;
              case 'STORM_BRINGER':
                  stageText = 'STAGE 2: CYCLONE ORBIT & LIGHTNING STORM!';
                  break;
              case 'VOID_SENTINEL':
                  stageText = 'STAGE 2: EVENT HORIZON SINGULARITY!';
                  break;
              case 'SWARM_QUEEN':
                  stageText = 'STAGE 2: FIGURE-8 BROOD FLIGHT & ACID!';
                  break;
              case 'ARCHITECT':
                  stageText = 'STAGE 2: PERIMETER GRID-LOCK LASERS!';
                  break;
              case 'REAPER':
                  stageText = 'STAGE 2: DEATH VORTEX & SOUL DRAIN!';
                  break;
          }
      } else if (stage === 3) {
          stageText = `STAGE 3: ${enemy.bossSubtype || 'BOSS'} - MAXIMUM APOCALYPSE!`;
          if (enemy.bossSubtype === 'TITAN') {
              enemy.maxShieldHp = (enemy.maxHp || 1) * 0.35;
              enemy.shieldHp = enemy.maxShieldHp;
          }
      }

      this.floatingTexts.push({
          id: Math.random().toString(36),
          pos: { x: enemy.pos.x, y: enemy.pos.y - 45 },
          vel: { x: 0, y: -80 },
          text: stageText,
          color: bannerColor,
          life: 2.5,
          maxLife: 2.5,
          isCrit: true
      });

      for (let i = 0; i < 24; i++) {
          const ang = (Math.PI * 2 / 24) * i;
          this.particles.push({
              type: 'NOVA',
              pos: { ...enemy.pos },
              vel: { x: Math.cos(ang) * 350, y: Math.sin(ang) * 350 },
              life: 0.7,
              color: bannerColor
          });
      }
      gameAudio.playHitSound(true, 'explosion');
  }

  update(dt: number) {
    if (this.player.isDead) return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
    }

    this.shake = Math.max(0, this.shake - dt * 110);

    this.deflectPulseCooldownRemaining = Math.max(0, this.deflectPulseCooldownRemaining - dt);
    this.tetherDisableTimer = Math.max(0, this.tetherDisableTimer - dt);

    if (this.player.stats.controlCooldowns) {
        for (const key in this.player.stats.controlCooldowns) {
            if (this.player.stats.controlCooldowns[key] > 0) {
                this.player.stats.controlCooldowns[key] = Math.max(0, this.player.stats.controlCooldowns[key] - dt);
            }
        }
    }

    if (this.deflectLassoTimer > 0) {
        this.deflectLassoTimer -= dt;
        if (this.deflectLassoTimer <= 0) {
            this.deflectLassoTarget = null;
        }
    }

    // Update active tactical control fields
    if (this.activeControlFields && this.activeControlFields.length > 0) {
      this.activeControlFields.forEach(field => {
        field.life -= dt;

        if (field.type === 'shockwave_blast') {
          field.radius = field.maxRadius * (1 - Math.max(0, field.life / field.maxLife));
        } else if (field.type === 'gravity_well') {
          // Continuously pull nearby enemies toward singularity position (field.pos.x, field.pos.y) (No damage)
          this.enemies.forEach(e => {
            if (e.isDead) return;
            const dx = field.pos.x - e.pos.x;
            const dy = field.pos.y - e.pos.y;
            const dist = Math.hypot(dx, dy);
            if (dist < field.radius && dist > 10) {
              const pullForce = 600 + field.level * 80;
              e.vel.x += (dx / dist) * pullForce * dt;
              e.vel.y += (dy / dist) * pullForce * dt;
              e.vel.x *= 0.92;
              e.vel.y *= 0.92;
            }
          });
        } else if (field.type === 'temporal_freeze') {
          // Completely freeze enemies inside the localized cursor radius
          this.enemies.forEach(e => {
            if (e.isDead) return;
            const dist = Math.hypot(e.pos.x - field.pos.x, e.pos.y - field.pos.y);
            if (dist < field.radius) {
              e.stunTimer = Math.max(e.stunTimer || 0, 0.2);
              e.vel.x = 0;
              e.vel.y = 0;
            }
          });

          // Freeze enemy bullets inside ring
          this.projectiles.forEach(p => {
            if (p.ownerId === 'player') return;
            const dist = Math.hypot(p.pos.x - field.pos.x, p.pos.y - field.pos.y);
            if (dist < field.radius) {
              p.vel.x *= 0.1;
              p.vel.y *= 0.1;
            }
          });
        }
      });

      this.activeControlFields = this.activeControlFields.filter(f => f.life > 0);
    }

        if (this.isTetherActive) {
            const dx = this.pointerX - this.player.pos.x;
            const dy = this.pointerY - this.player.pos.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 10) {
                // Apply magnet tether attraction force to player ball velocity vector
                const tetherCard = this.player.stats.equippedMovementModules?.find(m => m.id === 'tether');
                const tetherLevel = tetherCard ? tetherCard.level : 1;
                const extraPullMult = 1.0 + (tetherLevel - 1) * 0.15;
                const forceMagnitude = 1800 * (this.player.stats.speed || 1.0) * extraPullMult;
                const fx = (dx / dist) * forceMagnitude * dt;
                const fy = (dy / dist) * forceMagnitude * dt;
                this.player.vel.x += fx;
                this.player.vel.y += fy;
                
                // Limit speed when tethering so control is fine-tuned
                const maxTetherSpeed = 1100 * (this.player.stats.speed || 1.0);
                const curSpeed = Math.hypot(this.player.vel.x, this.player.vel.y);
                if (curSpeed > maxTetherSpeed) {
                    this.player.vel.x = (this.player.vel.x / curSpeed) * maxTetherSpeed;
                    this.player.vel.y = (this.player.vel.y / curSpeed) * maxTetherSpeed;
                }

                // Trailing particles connecting player to cursor
                if (Math.random() < 0.45) {
                    const ratio = Math.random();
                    const tx = this.player.pos.x + dx * ratio;
                    const ty = this.player.pos.y + dy * ratio;
                    this.particles.push({
                        type: 'SPARK',
                        pos: { x: tx, y: ty },
                        vel: { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 },
                        life: 0.2,
                        color: '#22d3ee'
                    });
                }
            }
        }

    const now = Date.now();
    // Prune old damage events for performance
    const pruneThreshold = now - 2000;
    if (this.damageEvents.length > 0 && this.damageEvents[0].time < pruneThreshold) {
        this.damageEvents = this.damageEvents.filter(e => e.time >= pruneThreshold);
    }

    // Spawning Logic
    if (this.spawnQueue.length > 0) {
        this.nextSpawnTime -= dt;
        if (this.nextSpawnTime <= 0) {
            const next = this.spawnQueue.shift();
            if (next) {
                this.spawnEnemy(next.room, next.type);
                this.nextSpawnTime = next.delay;
            }
        }
    }

    // Update Abilities
    this.player.abilities.forEach(a => {
        if (a.isActive && now - a.lastUsed > a.duration) {
            a.isActive = false;
        }
    });

    this.player.hurtTimer = Math.max(0, this.player.hurtTimer - dt);
    if (this.player.healEffectTimer && this.player.healEffectTimer > 0) {
        this.player.healEffectTimer = Math.max(0, this.player.healEffectTimer - dt);
    }
    
    if (this.player.spawnShieldTimer !== undefined) {
        this.player.spawnShieldTimer = Math.max(-0.5, this.player.spawnShieldTimer - dt);
    }

    // Default Slow Health Regeneration
    if (this.player.hp < this.player.maxHp && this.player.stats.regen > 0) {
      const regenDelay = 2000; // 2 seconds after taking damage for full accelerated regen
      
      // Reduce healing by 50% if a boss is active on the field to retain boss tension
      const hasActiveBoss = this.enemies.some(e => e.isBoss && !e.isDead);
      const bossHealMult = hasActiveBoss ? 0.5 : 1.0;

      // Constant baseline drip-feed (40% of regen rate operates continuously with zero combat delay)
      const constantHeal = (this.player.stats.regen * 0.4) * dt * bossHealMult;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + constantHeal);
      this.player.healEffectTimer = 0.35;

      // Remaining portion (60%) triggers when outside the 2s damage delay
      if (now - this.player.lastDamageTime > regenDelay) {
        const delayedHeal = (this.player.stats.regen * 0.6) * dt * bossHealMult;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + delayedHeal);
        this.player.healEffectTimer = 0.35;
      }
    }

    // Update Player
    let effectiveDt = dt;
    const timeWarp = this.player.abilities.find(a => (a.type === AbilityType.TIME_WARP || a.type === AbilityType.TEMPORAL_COLLAPSE) && a.isActive);
    const timeWarpFactor = timeWarp ? (timeWarp.type === AbilityType.TEMPORAL_COLLAPSE ? 0.10 : 0.20) : 1.0;
    if (timeWarp) {
        effectiveDt *= timeWarpFactor;
        if (timeWarp.type === AbilityType.TEMPORAL_COLLAPSE) {
            this.enemies.forEach(e => {
                if (Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y) < 900) {
                    this.damageEnemy(e, 150 * dt);
                }
            });
        }
    }

    const dimensionalDash = this.player.abilities.find(a => a.type === AbilityType.DIMENSIONAL_DASH && a.isActive);
    if (dimensionalDash) {
        if (Math.random() < 0.3) {
            this.particles.push({
                type: 'NOVA',
                pos: { ...this.player.pos },
                radius: 0,
                maxRadius: 40,
                life: 0.5,
                color: '#ec4899'
            });
            this.enemies.forEach(e => {
                if (Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y) < 60) {
                    this.damageEnemy(e, 300 * dt);
                }
            });
        }
    }

    const apexOverdrive = this.player.abilities.find(a => a.type === AbilityType.APEX_OVERDRIVE && a.isActive);
    if (apexOverdrive) {
        if (!(apexOverdrive as any).tickCounter) (apexOverdrive as any).tickCounter = 0;
        (apexOverdrive as any).tickCounter += dt;
        if ((apexOverdrive as any).tickCounter >= 0.12) {
            (apexOverdrive as any).tickCounter = 0;
            const target = this.getNearestEnemy();
            if (target) {
                this.damageEnemy(target, 120 * apexOverdrive.level);
                this.particles.push({
                    type: 'ARC',
                    p1: { ...this.player.pos },
                    p2: { ...target.pos },
                    life: 0.25,
                    color: '#ca8a04'
                });
                const secondary = this.enemies
                    .filter(e => e.id !== target.id)
                    .sort((r1, r2) => Math.hypot(r1.pos.x - target.pos.x, r1.pos.y - target.pos.y) - Math.hypot(r2.pos.x - target.pos.x, r2.pos.y - target.pos.y))[0];
                if (secondary && Math.hypot(secondary.pos.x - target.pos.x, secondary.pos.y - target.pos.y) < 250) {
                    this.damageEnemy(secondary, 80 * apexOverdrive.level);
                    this.particles.push({
                        type: 'ARC',
                        p1: { ...target.pos },
                        p2: { ...secondary.pos },
                        life: 0.2,
                        color: '#60a5fa'
                    });
                }
            }
        }
    }

    const sanguineFrenzy = this.player.abilities.find(a => a.type === AbilityType.SANGUINE_FRENZY && a.isActive);
    if (sanguineFrenzy) {
        if (!(sanguineFrenzy as any).tickCounter) (sanguineFrenzy as any).tickCounter = 0;
        (sanguineFrenzy as any).tickCounter += dt;
        if ((sanguineFrenzy as any).tickCounter >= 0.15) {
            (sanguineFrenzy as any).tickCounter = 0;
            const target = this.getNearestEnemy();
            if (target) {
                const drainAmount = 100 * sanguineFrenzy.level;
                this.damageEnemy(target, drainAmount);
                this.particles.push({
                    type: 'ARC',
                    p1: { ...target.pos },
                    p2: { ...this.player.pos },
                    life: 0.35,
                    color: '#f43f5e'
                });
                const hasActiveBoss = this.enemies.some(e => e.isBoss && !e.isDead);
                const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + drainAmount * 0.025 * bossHealMult);
            }
        }
    }

    const healingAura = this.player.abilities.find(a => (a.type === AbilityType.HEALING_AURA || a.type === AbilityType.NANITE_AEGIS) && a.isActive);
    if (healingAura) {
        // Nerfed healing ability: HEALING_AURA does 1.5 HP/sec per level, NANITE_AEGIS does 4.0 HP/sec per level
        // Heals no matter if enemies are close!
        const healingRate = healingAura.type === AbilityType.NANITE_AEGIS ? 4.0 : 1.5;
        const hasActiveBoss = this.enemies.some(e => e.isBoss && !e.isDead);
        const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
        if (this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + (healingRate * healingAura.level) * dt * bossHealMult);
            this.player.healEffectTimer = 0.35;
        }
        const randLimit = healingAura.type === AbilityType.NANITE_AEGIS ? 0.35 : 0.15;
        const color = healingAura.type === AbilityType.NANITE_AEGIS ? '#34d399' : '#4ade80';
        if (Math.random() < randLimit) {
            this.particles.push({
                type: 'SPARK',
                pos: { ...this.player.pos },
                vel: { x: (Math.random()-0.5)*200, y: (Math.random()-0.5)*200 },
                life: 0.6,
                color: color
            });
        }
    }

    const blizzard = this.player.abilities.find(a => (a.type === AbilityType.BLIZZARD || a.type === AbilityType.FROSTBITE_TEMPEST) && a.isActive);
    if (blizzard) {
        const isEvo = blizzard.type === AbilityType.FROSTBITE_TEMPEST;
        const radius = isEvo ? 480 : 400;
        const slowFactor = isEvo ? 0.35 : 0.55;
        
        if (Math.random() < 0.6) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            this.particles.push({
                type: 'SNOW',
                pos: {
                    x: this.player.pos.x + Math.sin(angle) * dist,
                    y: this.player.pos.y + Math.cos(angle) * dist
                },
                vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
                life: 0.5 + Math.random() * 0.5,
                color: isEvo ? '#a5f3fc' : '#e0f2fe',
                size: 2 + Math.random() * 3
            });
        }

        this.enemies.forEach(e => {
            const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
            if (dist < radius) {
                e.vel.x *= slowFactor;
                e.vel.y *= slowFactor;
                // Heavily nerfed Frostbite Tempest damage: 8 per level per second
                const dmg = (isEvo ? 8 : 12) * blizzard.level * dt;
                this.damageEnemy(e, dmg, false, isEvo ? 'frostbite_tempest' : 'blizzard_storm');
                e.isFrozen = true;
                e.freezeTimer = Math.max(e.freezeTimer || 0, isEvo ? 2.2 : 1.5);
            }
        });
    }

    const infernoAbility = this.player.abilities.find(a => (a.type === AbilityType.INFERNO || a.type === AbilityType.HELLFIRE_STORM) && a.isActive);
    if (infernoAbility) {
        const isEvo = infernoAbility.type === AbilityType.HELLFIRE_STORM;
        
        if (!isEvo) {
            const radius = 220 + infernoAbility.level * 20;
            const time = Date.now() / 1000;
            const count = 4;
            for (let i = 0; i < count; i++) {
                const angle = time * 3 + (i / count) * Math.PI * 2;
                const firePos = {
                    x: this.player.pos.x + Math.cos(angle) * radius,
                    y: this.player.pos.y + Math.sin(angle) * radius
                };
                
                if (Math.random() < 0.6) {
                    this.particles.push({
                        type: 'FIRE',
                        pos: firePos,
                        vel: { x: (Math.random() - 0.5) * 40, y: -Math.random() * 60 },
                        life: 0.5 + Math.random() * 0.4,
                        color: '#f97316'
                    });
                }
                
                this.enemies.forEach(e => {
                    const distToFire = Math.hypot(e.pos.x - firePos.x, e.pos.y - firePos.y);
                    if (distToFire < e.radius + 60) {
                        this.damageEnemy(e, 85 * infernoAbility.level * dt, false, 'inferno_burn');
                        e.isOnFire = true;
                        e.fireTimer = Math.max(e.fireTimer || 0, 4.0);
                        (e as any).explodeOnDeath = true;
                        (e as any).explodeOnDeathDmg = 120 * infernoAbility.level;
                    }
                });
            }
        } else {
            if (this.enemies.length > 0 && Math.random() < 0.15) {
                const targets = [...this.enemies].sort(() => 0.5 - Math.random()).slice(0, Math.min(this.enemies.length, 3));
                targets.forEach(target => {
                    this.particles.push({
                        type: 'NOVA',
                        pos: { ...target.pos },
                        radius: 0,
                        maxRadius: 140,
                        life: 0.4,
                        color: '#ef4444'
                    });
                    
                    for (let j = 0; j < 5; j++) {
                        this.particles.push({
                            type: 'FIRE',
                            pos: { x: target.pos.x + (Math.random() - 0.5) * 40, y: target.pos.y + (Math.random() - 0.5) * 40 },
                            vel: { x: 0, y: -150 - Math.random() * 150 },
                            life: 0.7,
                            color: '#fb923c'
                        });
                    }
                    
                    this.damageEnemy(target, 450 * infernoAbility.level * dt, false, 'hellfire_column');
                    target.isOnFire = true;
                    target.fireTimer = Math.max(target.fireTimer || 0, 6.0);
                });
                if (targets.length > 0 && Math.random() < 0.1) {
                    gameAudio.playExplosionSound();
                }
            }
        }
    }

    const bloodLust = this.player.abilities.find(a => (a.type === AbilityType.BLOOD_LUST || a.type === AbilityType.SANGUINE_FRENZY) && a.isActive);
    const overdrive = this.player.abilities.find(a => (a.type === AbilityType.OVERDRIVE || a.type === AbilityType.APEX_OVERDRIVE) && a.isActive);
    
    let speedMult = 1.0;
    if (bloodLust) speedMult *= (bloodLust.type === AbilityType.SANGUINE_FRENZY ? 2.0 : 1.5);
    if (overdrive) speedMult *= (overdrive.type === AbilityType.APEX_OVERDRIVE ? 1.7 : 1.4);

    this.updateBall(this.player, dt * speedMult);
    
    // Update Clones
    this.clones = this.clones.filter(c => {
        c.life -= dt;
        c.gunSpin = (c.gunSpin || 0) + dt * 20;

        // Aim angle calculation toward nearest target for all shooter clones
        const target = this.getNearestEnemyTo(c.pos);
        if (target && Math.hypot(target.pos.x - c.pos.x, target.pos.y - c.pos.y) < 700) {
            const dist = Math.hypot(target.pos.x - c.pos.x, target.pos.y - c.pos.y);
            c.targetDist = dist;
            const targetAngle = Math.atan2(target.pos.y - c.pos.y, target.pos.x - c.pos.x);
            if (c.aimAngle === undefined) c.aimAngle = targetAngle;
            else {
                let diff = targetAngle - c.aimAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                c.aimAngle += diff * dt * 14;
                c.isLockedOn = Math.abs(diff) < 0.28;
            }
            c.hasTarget = true;
        } else {
            c.aimAngle = (c.aimAngle || 0) + dt * 1.5;
            c.hasTarget = false;
            c.isLockedOn = false;
        }

        // Specialized clone behaviors
        if (c.archetype === 'MELEE') {
            c.meleeAngle = (c.meleeAngle || 0) + dt * 18; // Rapidly spinning double broadswords
            // Orbit player at radius 85px while actively seeking close enemies
            c.angle = (c.angle || 0) + dt * 2.5;
            if (target && Math.hypot(target.pos.x - c.pos.x, target.pos.y - c.pos.y) < 220) {
                // Leap towards enemy
                const ang = Math.atan2(target.pos.y - c.pos.y, target.pos.x - c.pos.x);
                c.vel.x += Math.cos(ang) * 700 * dt;
                c.vel.y += Math.sin(ang) * 700 * dt;
                this.updateBall(c, dt * speedMult);
            } else {
                c.pos.x = this.player.pos.x + Math.cos(c.angle) * 85;
                c.pos.y = this.player.pos.y + Math.sin(c.angle) * 85;
            }

            // Melee slicing double broadswords hitboxes
            for (let bIdx = 0; bIdx < 2; bIdx++) {
                const bAng = c.meleeAngle + bIdx * Math.PI;
                const bladePos = {
                    x: c.pos.x + Math.cos(bAng) * 42,
                    y: c.pos.y + Math.sin(bAng) * 42
                };
                this.enemies.forEach(e => {
                    const dist = Math.hypot(e.pos.x - bladePos.x, e.pos.y - bladePos.y);
                    if (dist < e.radius + 32) {
                        this.damageEnemy(e, c.damage * dt * 22, true, 'MIRAGE_LEGION');
                    }
                });
            }
        } else if (c.archetype === 'SNIPER') {
            // Hover behind player at radius 180px
            c.angle = c.angle || Math.random() * Math.PI * 2;
            c.pos.x = this.player.pos.x + Math.cos(c.angle) * 180;
            c.pos.y = this.player.pos.y + Math.sin(c.angle) * 180;
        } else if (c.archetype === 'SHOTGUN') {
            // Sprint toward nearest enemy
            if (target) {
                const ang = Math.atan2(target.pos.y - c.pos.y, target.pos.x - c.pos.x);
                c.vel.x += Math.cos(ang) * 650 * dt;
                c.vel.y += Math.sin(ang) * 650 * dt;
            }
            this.updateBall(c, dt * speedMult);
        } else {
            this.updateBall(c, dt * speedMult);
        }
        return c.life > 0;
    });

    // Update Bombs
    this.bombs = this.bombs.filter(b => {
        b.timer -= dt;
        if (b.armTimer && b.armTimer > 0) {
            b.armTimer -= dt;
        }

        if (b.isSupernovaCore) {
            // Event horizon implosion gravity well pulling all enemies across 450px (220px for sub-munition)
            const pullRadius = b.isSubMunition ? 220 : 450;
            this.enemies.forEach(e => {
                const dx = b.pos.x - e.pos.x;
                const dy = b.pos.y - e.pos.y;
                const dist = Math.hypot(dx, dy);
                if (dist < pullRadius) {
                    const pull = (pullRadius - dist) * 8;
                    e.vel.x += (dx / (dist || 1)) * pull * dt;
                    e.vel.y += (dy / (dist || 1)) * pull * dt;
                    this.damageEnemy(e, b.damage * dt * (b.isSubMunition ? 2 : 3.5), false, 'SUPERNOVA_BOMB');
                }
            });
            if (Math.random() < 0.35) {
                this.particles.push({
                    type: 'SPARK',
                    pos: {
                        x: b.pos.x + (Math.random() - 0.5) * (b.isSubMunition ? 60 : 120),
                        y: b.pos.y + (Math.random() - 0.5) * (b.isSubMunition ? 60 : 120)
                    },
                    vel: {
                        x: (b.pos.x - (b.pos.x + (Math.random() - 0.5) * 100)) * 2,
                        y: (b.pos.y - (b.pos.y + (Math.random() - 0.5) * 100)) * 2
                    },
                    life: 0.25,
                    color: b.color || '#c084fc'
                });
            }
        }

        if (b.isHoming) {
            const target = this.getNearestEnemyTo(b.pos);
            if (target) {
                const angle = Math.atan2(target.pos.y - b.pos.y, target.pos.x - b.pos.x);
                const homingForce = (b.armTimer && b.armTimer > 0 ? 600 : 1600) * dt;
                b.vel.x += Math.cos(angle) * homingForce;
                b.vel.y += Math.sin(angle) * homingForce;
            }
        }

        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        b.vel.x *= (b.isMine ? 0.94 : 0.96);
        b.vel.y *= (b.isMine ? 0.94 : 0.96);

        // Proximity Detonation for non-mine bombs (ONLY when armed)
        if (!b.armTimer || b.armTimer <= 0) {
            if (!b.isMine) {
                const proxRadius = b.isSubMunition ? 32 : 45;
                for (let i = 0; i < this.enemies.length; i++) {
                    const enemy = this.enemies[i];
                    const dx = b.pos.x - enemy.pos.x;
                    const dy = b.pos.y - enemy.pos.y;
                    if (dx * dx + dy * dy < (enemy.radius + proxRadius) * (enemy.radius + proxRadius)) {
                        this.explodeBomb(b);
                        return false;
                    }
                }
            } else {
                for (let i = 0; i < this.enemies.length; i++) {
                    const enemy = this.enemies[i];
                    const dx = b.pos.x - enemy.pos.x;
                    const dy = b.pos.y - enemy.pos.y;
                    const r = enemy.radius + 28;
                    if (dx * dx + dy * dy < r * r) {
                        this.explodeBomb(b);
                        return false;
                    }
                }
            }
        }
        
        if (b.timer <= 0) {
            this.explodeBomb(b);
            return false;
        }
        return true;
    });

    if (this.pendingBombs.length > 0) {
        this.bombs.push(...this.pendingBombs);
        this.pendingBombs = [];
    }

    // Maintain & Buff Speed
    const currentSpeed = Math.hypot(this.player.vel.x, this.player.vel.y);
    const baseTargetSpeed = 400;
    
    const hasContactWeapon = this.player.weapons.some(w => 
      w.type === WeaponType.SPINNING_BLADE || w.type === WeaponType.VORTEX_SCYTHE || w.type === WeaponType.CHRONO_REAPER ||
      w.type === WeaponType.CHAIN_ARC_SWORD || w.type === WeaponType.ARC_WHIP || w.type === WeaponType.THUNDER_GOD ||
      w.type === WeaponType.PLASMA_RAZOR || w.type === WeaponType.NEUTRINO_SHREDDER || w.type === WeaponType.GOD_SLAYER_WHEEL
    );
    
    // Update Warp Zones (from WARP_WARLOCK)
    let inWarpZone = false;
    this.warpZones = this.warpZones.filter(wz => {
        wz.duration -= dt;
        const dist = Math.hypot(this.player.pos.x - wz.pos.x, this.player.pos.y - wz.pos.y);
        if (dist < wz.radius) {
            inWarpZone = true;
        }
        if (Math.random() < 0.25) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * wz.radius;
            this.particles.push({
                type: 'SPARK',
                pos: { x: wz.pos.x + Math.cos(a) * r, y: wz.pos.y + Math.sin(a) * r },
                vel: { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30 },
                life: 0.35,
                color: '#c084fc'
            });
        }
        return wz.duration > 0;
    });

    // Update Ion Storm Zones (from PLASMA_STORMER)
    this.ionZones = this.ionZones.filter(iz => {
        iz.duration -= dt;
        const distP = Math.hypot(this.player.pos.x - iz.pos.x, this.player.pos.y - iz.pos.y);
        if (distP < iz.radius) {
            if (!this.player.spawnShieldTimer || this.player.spawnShieldTimer <= 0) {
                this.player.hp = Math.max(1, this.player.hp - 10 * balance.enemyDmgMult * dt);
                this.player.hurtTimer = 0.15;
            }
        }
        // Also shock non-plasma enemies standing in the storm
        this.enemies.forEach(e => {
            if (e.enemyType !== 'PLASMA_STORMER' && !e.isDead && Math.hypot(e.pos.x - iz.pos.x, e.pos.y - iz.pos.y) < iz.radius) {
                this.damageEnemy(e, 25 * dt, false, 'lightning');
            }
        });
        if (Math.random() < 0.3) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * iz.radius;
            this.particles.push({
                type: 'SPARK',
                pos: { x: iz.pos.x + Math.cos(a) * r, y: iz.pos.y + Math.sin(a) * r },
                vel: { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 },
                life: 0.3,
                color: '#38bdf8'
            });
        }
        return iz.duration > 0;
    });

    // Contact weapon gives +40% speed boost
    const contactSpeedBoost = hasContactWeapon ? 1.4 : 1.0;
    let targetSpeed = baseTargetSpeed * this.player.stats.speed * contactSpeedBoost;
    if (inWarpZone) {
        targetSpeed *= 0.60; // 40% speed penalty inside Chrono Distortion Rift
    }
    if ((this.player as any).slowTimer && (this.player as any).slowTimer > 0) {
        (this.player as any).slowTimer -= dt;
        targetSpeed *= 0.45; // reduced speed by 55%
        // Spawn frost trails under player
        if (Math.random() < 0.25) {
            this.particles.push({
                type: 'SPARK',
                pos: { ...this.player.pos },
                vel: { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 },
                life: 0.35,
                color: '#38bdf8'
            });
        }
    }
    if (overdrive) targetSpeed *= (overdrive.type === AbilityType.APEX_OVERDRIVE ? 1.85 : 1.5);
    if (bloodLust) targetSpeed *= (bloodLust.type === AbilityType.SANGUINE_FRENZY ? 1.6 : 1.3);
    
    // Smoothly adjust current speed towards target speed unless dashing
    const isDashing = this.player.abilities.find(a => a.type === AbilityType.DASH && a.isActive);
    if (!isDashing && currentSpeed > 0) {
        const lerpFactor = 0.15;
        const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * lerpFactor;
        this.player.vel.x = (this.player.vel.x / currentSpeed) * newSpeed;
        this.player.vel.y = (this.player.vel.y / currentSpeed) * newSpeed;
    }

    this.updateWeapons(this.player, dt);
    this.updateTurrets(dt);
    this.updateMines(dt);

    // Update Enemies
    this.enemies.forEach(enemy => {
      // 1. Update Force Fields conditions (for levels past 30)
      if (enemy.forceFieldType) {
          if (enemy.forceFieldType === 'SPAWN_IMMUNITY') {
              if (enemy.forceFieldTimer !== undefined) {
                  enemy.forceFieldTimer = Math.max(-0.5, enemy.forceFieldTimer - dt);
              }
          } else if (enemy.forceFieldType === 'PERIODIC') {
              if (enemy.forceFieldTimer !== undefined) {
                  enemy.forceFieldTimer -= dt;
                  if (enemy.forceFieldTimer <= 0) {
                      enemy.forceFieldTimer = 3.0; // toggles every 3.0s
                      enemy.forceFieldState = !enemy.forceFieldState;
                  }
              }
          } else if (enemy.forceFieldType === 'DIRECTIONAL') {
              // Rotate to face the player to guard forward sector
              enemy.forceFieldAngle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
          } else if (enemy.forceFieldType === 'VULNERABLE') {
              // Spin the vulnerable gap channel
              const speedVal = enemy.forceFieldTimer || 1.2;
              enemy.forceFieldAngle = ((enemy.forceFieldAngle || 0) + speedVal * dt * timeWarpFactor) % (Math.PI * 2);
          }
      }

      // 2. Custom Unique Enemy Logic & Abilities
      if (enemy.enemyType === 'TESLA_COIL') {
          if (!enemy.lastShot) enemy.lastShot = Date.now() - Math.random() * 1500;
          const now = Date.now();
          const teslaInterval = 2500 / timeWarpFactor;
          if (now - enemy.lastShot > teslaInterval) {
              const d = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
              if (d < 300) {
                  this.player.hp -= 20 * balance.enemyDmgMult * (this.player.spawnShieldTimer && this.player.spawnShieldTimer > 0 ? 0 : 1);
                  this.player.hurtTimer = 0.2;
                  gameAudio.playHitSound(false, 'laser');
                  enemy.lastShot = now;
                  
                  // Spark visual discharge arcing straight to player
                  for (let i = 0; i <= 6; i++) {
                      const ratio = i / 6;
                      this.particles.push({
                          type: 'SPARK',
                          pos: { 
                              x: enemy.pos.x + (this.player.pos.x - enemy.pos.x) * ratio + (Math.random() - 0.5) * 12,
                              y: enemy.pos.y + (this.player.pos.y - enemy.pos.y) * ratio + (Math.random() - 0.5) * 12
                          },
                          vel: { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 },
                          life: 0.35,
                          color: '#c084fc'
                      });
                  }
              }
          }
      }

      if (enemy.enemyType === 'GRAVITY_DRAIN') {
          const d = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
          if (d < 250) {
              const pullStrength = (1 - d / 250) * 160 * dt * timeWarpFactor;
              const ang = Math.atan2(enemy.pos.y - this.player.pos.y, enemy.pos.x - this.player.pos.x);
              this.player.pos.x += Math.cos(ang) * pullStrength;
              this.player.pos.y += Math.sin(ang) * pullStrength;
              
              if (Math.random() < 0.15) {
                  this.particles.push({
                      type: 'SPARK',
                      pos: { x: this.player.pos.x + (Math.random() - 0.5) * 20, y: this.player.pos.y + (Math.random() - 0.5) * 20 },
                      vel: { x: Math.cos(ang) * 90, y: Math.sin(ang) * 90 },
                      life: 0.3,
                      color: '#4f46e5'
                  });
              }
          }
      }

      if (enemy.enemyType === 'CRYOMANCER') {
          const now = Date.now();
          if (!enemy.lastShot) enemy.lastShot = now - Math.random() * 1200;
          const cryoInterval = 1600 / timeWarpFactor;
          if (now - enemy.lastShot > cryoInterval) {
              const d = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
              if (d < 500) {
                  const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  const shooterVelX = enemy.vel?.x || 0;
                  const shooterVelY = enemy.vel?.y || 0;
                  this.projectiles.push({
                      pos: { ...enemy.pos },
                      vel: { x: Math.cos(angle) * 440 + shooterVelX, y: Math.sin(angle) * 440 + shooterVelY },
                      radius: 5,
                      damage: 15,
                      ownerId: enemy.id,
                      color: '#38bdf8', // Blue ice bullet
                      isIce: true as any
                  });
                  enemy.lastShot = now;
              }
          }
      }

      if (enemy.enemyType === 'HEALER') {
          if (!enemy.lastShot) enemy.lastShot = Date.now() - Math.random() * 1500;
          const now = Date.now();
          if (now - enemy.lastShot > 2000) {
              let didHeal = false;
              for (let i = 0; i < this.enemies.length; i++) {
                  const other = this.enemies[i];
                  if (other.id !== enemy.id && !other.isDead && !other.isBoss) {
                      const dx = other.pos.x - enemy.pos.x;
                      const dy = other.pos.y - enemy.pos.y;
                      if (dx * dx + dy * dy < 40000 && other.hp < other.maxHp) {
                          other.hp = Math.min(other.maxHp, other.hp + other.maxHp * 0.15);
                          didHeal = true;
                          this.particles.push({
                              type: 'SPARK',
                              pos: { ...other.pos },
                              vel: { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 },
                              life: 0.4,
                              color: '#22c55e'
                          });
                      }
                  }
              }
              if (didHeal) {
                  enemy.lastShot = now;
                  this.particles.push({
                      type: 'WARP',
                      pos: { ...enemy.pos },
                      radius: 0,
                      maxRadius: 200,
                      life: 0.4,
                      color: 'rgba(34, 197, 94, 0.25)'
                  });
              }
          }
      }

      if (enemy.enemyType === 'WARP_WARLOCK') {
          if (!enemy.warpCooldown) enemy.warpCooldown = 3.5 + Math.random() * 2;
          enemy.warpCooldown -= dt * timeWarpFactor;
          if (enemy.warpCooldown <= 0) {
              enemy.warpCooldown = 5.0;
              // Cast a Chrono Distortion Rift at the player's current location
              this.warpZones.push({
                  id: Math.random().toString(),
                  pos: { ...this.player.pos },
                  radius: 125,
                  duration: 4.5,
                  maxDuration: 4.5
              });
              gameAudio.playHitSound(false, 'laser');
              this.particles.push({
                  type: 'WARP',
                  pos: { ...enemy.pos },
                  radius: 0,
                  maxRadius: 60,
                  life: 0.4,
                  color: '#a855f7'
              });
          }
      }

      if (enemy.enemyType === 'PLASMA_STORMER') {
          if (!enemy.ionCooldown) enemy.ionCooldown = 2.5 + Math.random() * 2;
          enemy.ionCooldown -= dt * timeWarpFactor;
          if (enemy.ionCooldown <= 0) {
              enemy.ionCooldown = 3.8;
              // Fire an Ion Chain Bolt towards the player
              const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
              this.projectiles.push({
                  pos: { ...enemy.pos },
                  vel: { x: Math.cos(angle) * 360, y: Math.sin(angle) * 360 },
                  radius: 8,
                  damage: 18,
                  ownerId: enemy.id,
                  color: '#0284c7',
                  bounces: 2
              });
              gameAudio.playHitSound(false, 'laser');
          }
      }

      if (enemy.enemyType === 'BIO_LEECH') {
          const distToPlayer = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
          if (distToPlayer < 350) {
              enemy.tetherTarget = { x: this.player.pos.x, y: this.player.pos.y };
              // Drain vitality from player
              const drainDamage = 12 * balance.enemyDmgMult * dt * timeWarpFactor;
              if (!this.player.spawnShieldTimer || this.player.spawnShieldTimer <= 0) {
                  this.player.hp = Math.max(1, this.player.hp - drainDamage);
                  this.player.hurtTimer = 0.15;
              }
              // Channel bio-shield to all nearby enemy comrades within 240px
              this.enemies.forEach(other => {
                  if (other.id !== enemy.id && !other.isDead) {
                      const dOther = Math.hypot(other.pos.x - enemy.pos.x, other.pos.y - enemy.pos.y);
                      if (dOther < 240) {
                          other.shieldHp = Math.min(other.maxHp * 0.4, (other.shieldHp || 0) + 16 * dt * timeWarpFactor);
                          if (Math.random() < 0.15) {
                              this.particles.push({
                                  type: 'SPARK',
                                  pos: { ...other.pos },
                                  vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                                  life: 0.3,
                                  color: '#10b981'
                              });
                          }
                      }
                  }
              });
              // Particles along tether
              if (Math.random() < 0.3) {
                  const t = Math.random();
                  this.particles.push({
                      type: 'SPARK',
                      pos: {
                          x: enemy.pos.x + (this.player.pos.x - enemy.pos.x) * t + (Math.random() - 0.5) * 8,
                          y: enemy.pos.y + (this.player.pos.y - enemy.pos.y) * t + (Math.random() - 0.5) * 8
                      },
                      vel: { x: (enemy.pos.x - this.player.pos.x) * 0.4, y: (enemy.pos.y - this.player.pos.y) * 0.4 },
                      life: 0.25,
                      color: '#34d399'
                  });
              }
          } else {
              enemy.tetherTarget = undefined;
          }
      }

      if (enemy.hurtTimer && enemy.hurtTimer > 0) {
          enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      }
      if (enemy.armorShred && enemy.armorShred > 0) {
          enemy.armorShred = Math.max(0, enemy.armorShred - dt);
      }
      if (enemy.stunTimer && enemy.stunTimer > 0) {
          enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      }

      if (enemy.isSlowed) {
          enemy.slowTimer = (enemy.slowTimer || 0) - dt;
          if (enemy.slowTimer <= 0) {
              enemy.isSlowed = false;
          }
          // Active cold/sparkle frost emission
          if (Math.random() < 0.25) {
              this.particles.push({
                  type: 'SPARK',
                  pos: { 
                      x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius * 1.2, 
                      y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius * 1.2 
                  },
                  vel: { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30 },
                  life: 0.4,
                  color: '#7dd3fc' // icy cyan spark
              });
          }
      }
      if (enemy.isOnFire) {
          enemy.fireTimer = (enemy.fireTimer || 0) - dt;
          if (enemy.fireTimer <= 0) {
              enemy.isOnFire = false;
          }
          // Actively tick minimal fire damage over time
          this.damageEnemy(enemy, 15 * dt, false);
          if (Math.random() < 0.35) { // Increased spawn probability for high visibility of flames
              this.particles.push({
                  type: 'FIRE',
                  pos: { 
                      x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius, 
                      y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius 
                  },
                  vel: { x: (Math.random() - 0.5) * 50, y: -Math.random() * 70 },
                  life: 0.6,
                  color: '#f97316' // Intense orange flame
              });
          }
      }

      if ((enemy as any).isCorroded) {
          (enemy as any).corrodedTimer = ((enemy as any).corrodedTimer || 0) - dt;
          if ((enemy as any).corrodedTimer <= 0) {
              (enemy as any).isCorroded = false;
          }
          // Tick direct corrosive decay acid melting DoT (45 * dt base damage)
          this.damageEnemy(enemy, 45 * dt, false, 'toxic');
          // Emit acid radioactive bubbles
          if (Math.random() < 0.25) {
              this.particles.push({
                  type: 'SPARK',
                  pos: {
                      x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius * 1.2,
                      y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius * 1.2
                  },
                  vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                  life: 0.5,
                  color: '#a3e635' // acid lime green bubbles
              });
          }
      }

      if (enemy.isFrozen) {
          enemy.freezeTimer = (enemy.freezeTimer || 0) - dt;
          if (enemy.freezeTimer <= 0) {
              enemy.isFrozen = false;
              const hasTempestActive = this.player.abilities.some(a => a.type === AbilityType.FROSTBITE_TEMPEST && a.isActive);
              if (hasTempestActive) {
                  this.explodeShatter(enemy);
              }
          }
          enemy.vel.x *= 0.9; // Friction while frozen
          enemy.vel.y *= 0.9;
          this.updateBall(enemy, dt);
          return; // Skip AI logic while frozen
      }

      // Ensure slow cannot reduce movement to 0 (minimum speed floor of 30% so all enemies can always move)
      const slowReduction = (this.player.stats.projectileSlow || 0);
      const enemySlowFactor = enemy.isSlowed ? Math.max(0.30, 1.0 - slowReduction) : 1.0;
      const speedFactor = Math.max(0.28, enemySlowFactor * timeWarpFactor);
      this.updateBall(enemy, dt * speedFactor);

      // Movement behavior:
      // Most enemies bounce around the arena naturally!
      // Only a handful of special enemies whose specific design/ability is to follow pursue the player:
      // STALKER (hunter), SWARMER (chaser), BOMBER (rocket thruster kamikaze), PHANTOM (pursuing ghost), or any enemy with rear thrusters
      if (!enemy.isBoss) {
          const isFollower = enemy.hasThruster || enemy.enemyType === 'STALKER' || enemy.enemyType === 'SWARMER' || enemy.enemyType === 'BOMBER' || enemy.enemyType === 'PHANTOM';

          if (isFollower) {
              const curSpeed = Math.hypot(enemy.vel.x, enemy.vel.y);
              const baseCruisingSpeed = (enemy.enemyType === 'BOMBER' ? 260 : (enemy.enemyType === 'SWARMER' ? 220 : (enemy.enemyType === 'STALKER' ? 240 : (enemy.hasThruster ? 210 : 170)))) * (this.currentRoom > 40 ? 1.15 : 1.0);
              const angleToP = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
              const wanderOffset = Math.sin(Date.now() * 0.003 + (enemy.pos.x + enemy.pos.y) * 0.04) * (enemy.hasThruster ? 0.15 : 0.35);
              const targetAngle = angleToP + wanderOffset;

              if (curSpeed < 25) {
                  enemy.vel.x = Math.cos(targetAngle) * baseCruisingSpeed;
                  enemy.vel.y = Math.sin(targetAngle) * baseCruisingSpeed;
              } else if (curSpeed < baseCruisingSpeed) {
                  const boostRate = (enemy.hasThruster ? 440 : 340) * dt;
                  enemy.vel.x += Math.cos(targetAngle) * boostRate;
                  enemy.vel.y += Math.sin(targetAngle) * boostRate;
              } else {
                  const steerX = Math.cos(targetAngle) * curSpeed;
                  const steerY = Math.sin(targetAngle) * curSpeed;
                  const steerRate = (enemy.enemyType === 'BOMBER' || enemy.hasThruster) ? 3.8 : (enemy.enemyType === 'SWARMER' ? 3.5 : 2.5);
                  enemy.vel.x += (steerX - enemy.vel.x) * Math.min(1.0, steerRate * dt);
                  enemy.vel.y += (steerY - enemy.vel.y) * Math.min(1.0, steerRate * dt);
              }

              // Thruster flame particles when thruster is active
              if (enemy.hasThruster) {
                  enemy.thrusterAngle = Math.atan2(enemy.vel.y, enemy.vel.x);
                  if (Math.random() < 0.4) {
                      const exhaustAng = (enemy.thrusterAngle || 0) + Math.PI + (Math.random() - 0.5) * 0.4;
                      const exSpeed = 100 + Math.random() * 60;
                      this.particles.push({
                          type: 'FIRE',
                          pos: {
                              x: enemy.pos.x + Math.cos(exhaustAng) * (enemy.radius + 3),
                              y: enemy.pos.y + Math.sin(exhaustAng) * (enemy.radius + 3)
                          },
                          vel: { x: Math.cos(exhaustAng) * exSpeed, y: Math.sin(exhaustAng) * exSpeed },
                          life: 0.25,
                          color: Math.random() < 0.5 ? '#f97316' : '#facc15'
                      });
                  }
              }
          } else {
              // Non-tracker enemies bounce around freely!
              // They do NOT track the player; they bounce around and ricochet off walls
              const curSpeed = Math.hypot(enemy.vel.x, enemy.vel.y);
              const minBounceSpeed = 130 * (this.currentRoom > 40 ? 1.15 : 1.0);
              const maxBounceSpeed = 230 * (this.currentRoom > 40 ? 1.15 : 1.0);

              if (curSpeed < minBounceSpeed) {
                  // Keep them bouncing at healthy speeds without slowing to a halt
                  const bounceAng = curSpeed > 1 ? Math.atan2(enemy.vel.y, enemy.vel.x) : (Math.random() * Math.PI * 2);
                  enemy.vel.x = Math.cos(bounceAng) * minBounceSpeed;
                  enemy.vel.y = Math.sin(bounceAng) * minBounceSpeed;
              } else if (curSpeed > maxBounceSpeed) {
                  const scale = maxBounceSpeed / curSpeed;
                  enemy.vel.x *= scale;
                  enemy.vel.y *= scale;
              }
          }
      }

      if (enemy.enemyType === 'BOMBER') {
          const dist = Math.hypot(enemy.pos.x - this.player.pos.x, enemy.pos.y - this.player.pos.y);
          if (dist < 40 + enemy.radius) {
              this.explodeBomb({
                  pos: enemy.pos,
                  radius: 150,
                  damage: 40,
                  color: '#ef4444'
              });
              enemy.isDead = true;
          }
      }

      if (enemy.enemyType === 'PHANTOM') {
          if (Math.random() < (0.01 * timeWarpFactor)) {
              // Sudden dash
              const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
              enemy.vel.x = Math.cos(angle) * 1200 * timeWarpFactor;
              enemy.vel.y = Math.sin(angle) * 1200 * timeWarpFactor;
          }
      }

      if (enemy.enemyType === 'SHOOTER' || enemy.enemyType === 'GUNNER' || enemy.enemyType === 'ULTRA_BOSS') {
        const now = Date.now();
        const baseShootInterval = enemy.enemyType === 'GUNNER' ? 1000 : 1800;
        const shootInterval = baseShootInterval / timeWarpFactor;
        if (!enemy.lastShot || now - enemy.lastShot > shootInterval) {
          if (enemy.enemyType === 'ULTRA_BOSS') {
              // Spray projectiles
              for(let i=0; i<8; i++) {
                  const angle = (Math.PI * 2 / 8) * i + (now * 0.001);
                  this.shootProjectile(enemy, { 
                      x: enemy.pos.x + Math.cos(angle) * 100, 
                      y: enemy.pos.y + Math.sin(angle) * 100 
                  });
              }
          } else {
            this.shootProjectile(enemy, this.player.pos);
          }
          enemy.lastShot = now;
        }
      }

      // Boss Phase and Advanced Weapons Logic
      if (enemy.isBoss) {
          const now = Date.now();
          const hpPct = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1.0;
          
          // Stage Transition
          if (enemy.bossSubtype === 'NEXUS_OVERLORD') {
              if (enemy.bossStage === 1 && hpPct <= 0.8) {
                  enemy.bossStage = 2;
                  this.nexusBossTransition(enemy, 2, "STAGE 2: MINION SYNTHESIS ACTIVATED!", "#a855f7");
              } else if (enemy.bossStage === 2 && hpPct <= 0.65) {
                  enemy.bossStage = 3;
                  this.nexusBossTransition(enemy, 3, "STAGE 3: SHIELD REINFORCED & TURRETS DEPLOYED!", "#38bdf8");
              } else if (enemy.bossStage === 3 && hpPct <= 0.45) {
                  enemy.bossStage = 4;
                  this.nexusBossTransition(enemy, 4, "STAGE 4: DEVASTATOR BEAM ONLINE - DEFEND TURRETS!", "#f59e0b");
              } else if (enemy.bossStage === 4 && hpPct <= 0.2) {
                  enemy.bossStage = 5;
                  this.nexusBossTransition(enemy, 5, "STAGE 5: DOOMSDAY PROTOCOL - MAXIMUM BERSERK!", "#ef4444");
              }
          } else {
              // 3-Stage Progression for all sector bosses
              if (enemy.bossStage === 1 && hpPct <= 0.66) {
                  enemy.bossStage = 2;
                  this.bossStageTransition(enemy, 2);
              } else if (enemy.bossStage === 2 && hpPct <= 0.33) {
                  enemy.bossStage = 3;
                  this.bossStageTransition(enemy, 3);
              }
          }

          // Initialize/update specialized weapon timers
          enemy.bossAttackTimer = (enemy.bossAttackTimer || 0) + dt * timeWarpFactor;

          // Boss Movement System:
          // All bosses actively follow the player, unless executing a specific phase with a dedicated movement path!
          if (enemy.bossSubtype !== 'NEXUS_OVERLORD') {
              const baseSpeed = (enemy.bossSubtype === 'PHANTOM_ACE' ? 240 : (enemy.bossSubtype === 'TITAN' ? 140 : (enemy.bossSubtype === 'SWARM_QUEEN' ? 220 : 185)));
              const bossSpeed = baseSpeed * (enemy.bossStage === 3 ? 1.35 : (enemy.bossStage === 2 ? 1.15 : 1.0));
              const arenaW = this.width || 1200;
              const arenaH = this.height || 800;
              const angleToP = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);

              let customPathHandled = false;

              // Dedicated Phase 2 movement paths
              if (enemy.bossStage === 2) {
                  if (enemy.bossSubtype === 'TITAN') {
                      // FORTRESS ORBIT: Titan orbits the center of the arena
                      customPathHandled = true;
                      const orbitRadius = Math.min(arenaW, arenaH) * 0.28;
                      const orbitAng = (now * 0.0008) + (enemy.id.charCodeAt(0) || 0);
                      const targetX = arenaW / 2 + Math.cos(orbitAng) * orbitRadius;
                      const targetY = arenaH / 2 + Math.sin(orbitAng) * orbitRadius;
                      const dx = targetX - enemy.pos.x;
                      const dy = targetY - enemy.pos.y;
                      const dist = Math.hypot(dx, dy);
                      if (dist > 10) {
                          enemy.vel.x += (dx / dist) * bossSpeed * 2.5 * dt;
                          enemy.vel.y += (dy / dist) * bossSpeed * 2.5 * dt;
                      }
                  } else if (enemy.bossSubtype === 'SWARM_QUEEN') {
                      // FIGURE-8 BROOD FLIGHT: Lissajous figure-8 flight path across the arena
                      customPathHandled = true;
                      const t = now * 0.001;
                      const targetX = arenaW / 2 + Math.sin(t) * (arenaW * 0.35);
                      const targetY = arenaH / 2 + Math.sin(t * 2) * (arenaH * 0.25);
                      const dx = targetX - enemy.pos.x;
                      const dy = targetY - enemy.pos.y;
                      const dist = Math.hypot(dx, dy);
                      if (dist > 10) {
                          enemy.vel.x += (dx / dist) * bossSpeed * 2.8 * dt;
                          enemy.vel.y += (dy / dist) * bossSpeed * 2.8 * dt;
                      }
                  } else if (enemy.bossSubtype === 'STORM_BRINGER') {
                      // CYCLONE ORBIT: Rapidly circles around the player at a 210px vortex distance!
                      customPathHandled = true;
                      const orbitAng = now * 0.0022;
                      const targetX = this.player.pos.x + Math.cos(orbitAng) * 210;
                      const targetY = this.player.pos.y + Math.sin(orbitAng) * 210;
                      const dx = targetX - enemy.pos.x;
                      const dy = targetY - enemy.pos.y;
                      const dist = Math.hypot(dx, dy);
                      if (dist > 10) {
                          enemy.vel.x += (dx / dist) * (bossSpeed * 1.35) * 3.0 * dt;
                          enemy.vel.y += (dy / dist) * (bossSpeed * 1.35) * 3.0 * dt;
                      }
                  } else if (enemy.bossSubtype === 'VOID_SENTINEL') {
                      // EVENT HORIZON: Anchors at arena center as a singularity
                      customPathHandled = true;
                      const dx = (arenaW / 2) - enemy.pos.x;
                      const dy = (arenaH / 2) - enemy.pos.y;
                      const dist = Math.hypot(dx, dy);
                      if (dist > 15) {
                          enemy.vel.x += (dx / dist) * bossSpeed * 1.5 * dt;
                          enemy.vel.y += (dy / dist) * bossSpeed * 1.5 * dt;
                      } else {
                          enemy.vel.x *= 0.85;
                          enemy.vel.y *= 0.85;
                      }
                  } else if (enemy.bossSubtype === 'ARCHITECT') {
                      // PERIMETER GRID PATROL: Moves along outer wall perimeter
                      customPathHandled = true;
                      const pad = 100;
                      const waypoints = [
                          { x: pad, y: pad },
                          { x: arenaW - pad, y: pad },
                          { x: arenaW - pad, y: arenaH - pad },
                          { x: pad, y: arenaH - pad }
                      ];
                      const wpIndex = Math.floor((now * 0.0003) % 4);
                      const target = waypoints[wpIndex];
                      const dx = target.x - enemy.pos.x;
                      const dy = target.y - enemy.pos.y;
                      const dist = Math.hypot(dx, dy);
                      if (dist > 15) {
                          enemy.vel.x += (dx / dist) * bossSpeed * 2.0 * dt;
                          enemy.vel.y += (dy / dist) * bossSpeed * 2.0 * dt;
                      }
                  }
              }

              // All bosses follow the player unless executing a custom phase path above!
              if (!customPathHandled) {
                  const steerX = Math.cos(angleToP) * bossSpeed;
                  const steerY = Math.sin(angleToP) * bossSpeed;
                  enemy.vel.x += (steerX - enemy.vel.x) * Math.min(1.0, 3.5 * dt);
                  enemy.vel.y += (steerY - enemy.vel.y) * Math.min(1.0, 3.5 * dt);
              }

              // Keep minimum cruising speed
              const minSpd = bossSpeed * 0.65;
              const curSpd = Math.hypot(enemy.vel.x, enemy.vel.y);
              if (curSpd < minSpd) {
                  const moveAng = curSpd > 0.01 ? Math.atan2(enemy.vel.y, enemy.vel.x) : angleToP;
                  enemy.vel.x = Math.cos(moveAng) * minSpd;
                  enemy.vel.y = Math.sin(moveAng) * minSpd;
              }
          }

          // Action patterns per subtype across all stages
          if (enemy.bossSubtype === 'WARRIOR') {
              const cooldown = enemy.bossStage === 3 ? 1.1 : (enemy.bossStage === 2 ? 1.8 : 2.8);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  
                  // 1. Twin or Quad kinetic cannon bursts
                  const cannonOffsets = enemy.bossStage === 3 ? [-36, -12, 12, 36] : [-28, 28];
                  cannonOffsets.forEach(offset => {
                      const pos = {
                          x: enemy.pos.x + Math.cos(angle + Math.PI / 2) * offset,
                          y: enemy.pos.y + Math.sin(angle + Math.PI / 2) * offset
                      };
                      this.shootProjectile({ ...enemy, pos }, this.player.pos, 8);
                  });
                  
                  // 2. Fire Orbs / Radial Fire Burst
                  const orbCount = enemy.bossStage === 3 ? 4 : (enemy.bossStage === 2 ? 2 : 1);
                  const shooterVelX = (enemy.vel?.x || 0) * 0.3;
                  const shooterVelY = (enemy.vel?.y || 0) * 0.3;
                  for (let i = 0; i < orbCount; i++) {
                      const orbAngle = angle + (i - (orbCount - 1) / 2) * 0.32;
                      this.projectiles.push({
                          pos: { ...enemy.pos },
                          vel: { x: Math.cos(orbAngle) * 230 + shooterVelX, y: Math.sin(orbAngle) * 230 + shooterVelY },
                          radius: 10,
                          damage: 12,
                          ownerId: enemy.id,
                          color: '#f97316'
                      });
                  }

                  // Stage 3 Ground Slam shockwave
                  if (enemy.bossStage === 3) {
                      this.explodeBomb({
                          pos: { ...enemy.pos },
                          radius: 130,
                          damage: 15,
                          color: '#ea580c'
                      });
                  }
              }
          } 
          
          else if (enemy.bossSubtype === 'STORM_BRINGER') {
              const fireInterval = enemy.bossStage === 3 ? 0.5 : (enemy.bossStage === 2 ? 0.8 : 1.5);
              if (enemy.bossAttackTimer >= fireInterval) {
                  enemy.bossAttackTimer = 0;
                  
                  if (enemy.bossStage === 3) {
                      // Stage 3: Double-spiral thunderstorm (12-way) + chain tracking lightning
                      for (let i = 0; i < 12; i++) {
                          const ang = (Math.PI * 2 / 12) * i + (now * 0.003);
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(ang) * 160,
                              y: enemy.pos.y + Math.sin(ang) * 160
                          });
                      }
                      // 3-way chain blast directly at player
                      const baseAng = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                      for (let i = -1; i <= 1; i++) {
                          const sprayAng = baseAng + i * 0.18;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(sprayAng) * 250,
                              y: enemy.pos.y + Math.sin(sprayAng) * 250
                          });
                      }
                  } else if (enemy.bossStage === 2) {
                      // Stage 2: Superstorm Cannon: 8 radial spiraling sparks, plus 5-spread at player
                      for (let i = 0; i < 8; i++) {
                          const ang = (Math.PI * 2 / 8) * i + (now * 0.002);
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(ang) * 150,
                              y: enemy.pos.y + Math.sin(ang) * 150
                          });
                      }
                      const baseAng = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                      for (let i = -2; i <= 2; i++) {
                          const sprayAng = baseAng + i * 0.25;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(sprayAng) * 200,
                              y: enemy.pos.y + Math.sin(sprayAng) * 200
                          });
                      }
                  } else {
                      // Stage 1: 6-way radial fire + 3-spread at player
                      for (let i = 0; i < 6; i++) {
                          const ang = (Math.PI * 2 / 6) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(ang) * 120,
                              y: enemy.pos.y + Math.sin(ang) * 120
                          });
                      }
                      const baseAng = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                      for (let i = -1; i <= 1; i++) {
                          const sprayAng = baseAng + i * 0.2;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(sprayAng) * 200,
                              y: enemy.pos.y + Math.sin(sprayAng) * 200
                          });
                      }
                  }
              }
          } 
          
          else if (enemy.bossSubtype === 'TITAN') {
              const cooldown = enemy.bossStage === 3 ? 0.8 : (enemy.bossStage === 2 ? 1.1 : 2.0);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  const angleToPlayer = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  
                  if (enemy.bossStage === 3) {
                      // Stage 3: Seismic Quake & Heavy Artillery Barrage
                      this.explodeBomb({
                          pos: { ...enemy.pos },
                          radius: 170,
                          damage: 20,
                          color: '#0284c7'
                      });
                      for (let i = -2; i <= 2; i++) {
                          const ang = angleToPlayer + i * 0.22;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(ang) * 180,
                              y: enemy.pos.y + Math.sin(ang) * 180
                          });
                      }
                  } else if (enemy.bossStage === 2) {
                      // Stage 2: Heavy multi-burst artillery + gravitational pull
                      this.shootProjectile(enemy, this.player.pos);
                      setTimeout(() => {
                          if (!enemy.isDead && !this.player.isDead) {
                              this.shootProjectile(enemy, this.player.pos);
                          }
                      }, 140);
                      setTimeout(() => {
                          if (!enemy.isDead && !this.player.isDead) {
                              this.shootProjectile(enemy, this.player.pos);
                          }
                      }, 280);
                      this.player.vel.x -= Math.cos(angleToPlayer) * 140;
                      this.player.vel.y -= Math.sin(angleToPlayer) * 140;
                  } else {
                      // Stage 1: Giant slow projectile
                      this.shootProjectile(enemy, this.player.pos);
                  }
              }
          }

          else if (enemy.bossSubtype === 'PHANTOM_ACE') {
              const interval = enemy.bossStage === 3 ? 0.9 : (enemy.bossStage === 2 ? 1.5 : 2.5);
              if (enemy.bossAttackTimer >= interval) {
                  enemy.bossAttackTimer = 0;
                  
                  const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  
                  if (enemy.bossStage === 3) {
                      // Stage 3: Instant Warp behind player + 18-needle starburst
                      const warpDist = 140;
                      enemy.pos.x = this.player.pos.x - Math.cos(angle) * warpDist;
                      enemy.pos.y = this.player.pos.y - Math.sin(angle) * warpDist;
                      
                      for (let i = 0; i < 18; i++) {
                          const needleAng = (Math.PI * 2 / 18) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(needleAng) * 90,
                              y: enemy.pos.y + Math.sin(needleAng) * 90
                          });
                      }
                  } else {
                      // Sudden teleport dash & leave projectiles
                      enemy.vel.x = Math.cos(angle) * (enemy.bossStage === 2 ? 1500 : 1000);
                      enemy.vel.y = Math.sin(angle) * (enemy.bossStage === 2 ? 1500 : 1000);
                      
                      const count = enemy.bossStage === 2 ? 12 : 6;
                      for (let i = 0; i < count; i++) {
                          const needleAng = angle + (Math.PI * 2 / count) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(needleAng) * 80,
                              y: enemy.pos.y + Math.sin(needleAng) * 80
                          });
                      }
                      
                      // Spawn decoy phantom
                      if (enemy.bossStage === 2 && Math.random() < 0.45 && this.enemies.length < 15) {
                          const decoy: EnemyBall = {
                              id: 'decoy-' + Math.random(),
                              type: EntityType.ENEMY_BALL,
                              enemyType: 'BASIC',
                              pos: { x: enemy.pos.x + (Math.random() - 0.5) * 100, y: enemy.pos.y + (Math.random() - 0.5) * 100 },
                              vel: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
                              radius: enemy.radius * 0.6,
                              hp: enemy.maxHp * 0.05,
                              maxHp: enemy.maxHp * 0.05,
                              color: 'rgba(236, 72, 153, 0.6)',
                              isDead: false
                          };
                          this.enemies.push(decoy);
                      }
                  }
              }
          }

          else if (enemy.bossSubtype === 'VOID_SENTINEL') {
              const cooldown = enemy.bossStage === 3 ? 1.2 : (enemy.bossStage === 2 ? 2.0 : 3.5);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  
                  if (enemy.bossStage === 3) {
                      // Stage 3: 24-way cosmic void pulse + strong drag pull
                      for (let i = 0; i < 24; i++) {
                          const radAng = (Math.PI * 2 / 24) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(radAng) * 200,
                              y: enemy.pos.y + Math.sin(radAng) * 200
                          });
                      }
                      this.player.vel.x -= Math.cos(angle) * 450;
                      this.player.vel.y -= Math.sin(angle) * 450;
                  } else if (enemy.bossStage === 2) {
                      // Stage 2: 16-way void wave and drag pull
                      for (let i = 0; i < 16; i++) {
                          const radAng = (Math.PI * 2 / 16) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(radAng) * 180,
                              y: enemy.pos.y + Math.sin(radAng) * 180
                          });
                      }
                      this.player.vel.x -= Math.cos(angle) * 350;
                      this.player.vel.y -= Math.sin(angle) * 350;
                  } else {
                      // Stage 1: Gravity blast (8-way)
                      for (let i = 0; i < 8; i++) {
                          const radAng = (Math.PI * 2 / 8) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(radAng) * 120,
                              y: enemy.pos.y + Math.sin(radAng) * 120
                          });
                      }
                  }
              }
          }

          else if (enemy.bossSubtype === 'SWARM_QUEEN') {
              const cooldown = enemy.bossStage === 3 ? 1.0 : (enemy.bossStage === 2 ? 1.5 : 3.0);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  // Spawn SWARMER defenders
                  const spawnCount = enemy.bossStage === 3 ? 4 : (enemy.bossStage === 2 ? 3 : 1);
                  for (let i = 0; i < spawnCount; i++) {
                      const sAng = Math.random() * Math.PI * 2;
                      const swarmer: EnemyBall = {
                          id: 'swarmer-def-' + Math.random(),
                          type: EntityType.ENEMY_BALL,
                          enemyType: 'SWARMER',
                          pos: { x: enemy.pos.x + Math.cos(sAng) * 50, y: enemy.pos.y + Math.sin(sAng) * 50 },
                          vel: { x: Math.cos(sAng) * 250, y: Math.sin(sAng) * 250 },
                          radius: 8,
                          hp: 35,
                          maxHp: 35,
                          color: '#10b981',
                          isDead: false
                      };
                      this.enemies.push(swarmer);
                  }
                  
                  // Launch toxic projectiles
                  const baseAngle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  const spread = enemy.bossStage === 3 ? 10 : (enemy.bossStage === 2 ? 6 : 3);
                  for (let i = 0; i < spread; i++) {
                      const pAng = baseAngle + (i - (spread - 1) / 2) * 0.22;
                      this.shootProjectile(enemy, {
                          x: enemy.pos.x + Math.cos(pAng) * 110,
                          y: enemy.pos.y + Math.sin(pAng) * 110
                      });
                  }
              }
          }

          else if (enemy.bossSubtype === 'ARCHITECT') {
              const cooldown = enemy.bossStage === 3 ? 1.1 : (enemy.bossStage === 2 ? 1.8 : 3.2);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  // Geometric Cross and Plus formations
                  const count = enemy.bossStage === 3 ? 16 : (enemy.bossStage === 2 ? 12 : 8);
                  const offset = enemy.bossStage === 3 ? (now * 0.002) : (enemy.bossStage === 2 ? Math.PI / 4 : 0);
                  for (let i = 0; i < count; i++) {
                      const ang = (Math.PI * 2 / count) * i + offset;
                      this.shootProjectile(enemy, {
                          x: enemy.pos.x + Math.cos(ang) * 130,
                          y: enemy.pos.y + Math.sin(ang) * 130
                      });
                  }
              }
          }

          else if (enemy.bossSubtype === 'REAPER') {
              const cooldown = enemy.bossStage === 3 ? 0.9 : (enemy.bossStage === 2 ? 1.4 : 2.5);
              if (enemy.bossAttackTimer >= cooldown) {
                  enemy.bossAttackTimer = 0;
                  
                  const angle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                  
                  if (enemy.bossStage === 3) {
                      // Stage 3: Apocalyptic Harvest (6 scythes + life drain + 8-way soul wisps)
                      const dist = Math.hypot(enemy.pos.x - this.player.pos.x, enemy.pos.y - this.player.pos.y);
                      if (dist < 260) {
                          this.damagePlayer(60 * dt);
                      }
                      for (let i = 0; i < 6; i++) {
                          const sAng = angle + (i - 2.5) * 0.28;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(sAng) * 130,
                              y: enemy.pos.y + Math.sin(sAng) * 130
                          });
                      }
                      for (let i = 0; i < 8; i++) {
                          const wAng = (Math.PI * 2 / 8) * i;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(wAng) * 100,
                              y: enemy.pos.y + Math.sin(wAng) * 100
                          });
                      }
                  } else if (enemy.bossStage === 2) {
                      // Stage 2: Soul Harvest draining aura (45/s) + 4 scythes
                      const dist = Math.hypot(enemy.pos.x - this.player.pos.x, enemy.pos.y - this.player.pos.y);
                      if (dist < 220) {
                          this.damagePlayer(45 * dt);
                          if (Math.random() < 0.2) {
                              this.particles.push({
                                  type: 'SNOW',
                                  pos: { ...this.player.pos },
                                  vel: { x: (Math.random()-0.5)*30, y: -Math.random()*40 },
                                  life: 0.4,
                                  color: '#7f1d1d'
                              });
                          }
                      }
                      for (let i = 0; i < 4; i++) {
                          const sAng = angle + (i - 1.5) * 0.3;
                          this.shootProjectile(enemy, {
                              x: enemy.pos.x + Math.cos(sAng) * 120,
                              y: enemy.pos.y + Math.sin(sAng) * 120
                          });
                      }
                  } else {
                      // Stage 1: Basic scythe strike
                      this.shootProjectile(enemy, this.player.pos);
                  }
              }
          }

              else if (enemy.bossSubtype === 'NEXUS_OVERLORD') {
                  // Speed depends on stage, can get faster
                  const speedFactor = 1 + (enemy.bossStage - 1) * 0.15;
                  
                  // Keep a general tracking movement towards the player, but hovering above them or drifting
                  const dx = this.player.pos.x - enemy.pos.x;
                  const dy = this.player.pos.y - 120 - enemy.pos.y; // hovers slightly above player
                  const distToTarg = Math.hypot(dx, dy);
                  if (distToTarg > 20) {
                      enemy.vel.x += (dx / distToTarg) * 1500 * dt * speedFactor;
                      enemy.vel.y += (dy / distToTarg) * 1500 * dt * speedFactor;
                  }
                  
                  // Cap speed
                  const maxSpd = 300 * speedFactor;
                  const currentSpd = Math.hypot(enemy.vel.x, enemy.vel.y);
                  if (currentSpd > maxSpd) {
                      enemy.vel.x = (enemy.vel.x / currentSpd) * maxSpd;
                      enemy.vel.y = (enemy.vel.y / currentSpd) * maxSpd;
                  }

                  // 1. Core attack timer (Fires regular weapons)
                  const baseAttackInterval = 1.6 / speedFactor;
                  if (enemy.bossAttackTimer >= baseAttackInterval) {
                      enemy.bossAttackTimer = 0;
                      
                      const pAngle = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
                      
                      // Shoot pattern based on bossStages:
                      // Stage 1: Basic 3-way spread
                      if (enemy.bossStage === 1) {
                          for (let i = -1; i <= 1; i++) {
                              const sAng = pAngle + i * 0.22;
                              this.shootProjectile(enemy, {
                                  x: enemy.pos.x + Math.cos(sAng) * 120,
                                  y: enemy.pos.y + Math.sin(sAng) * 120
                              });
                          }
                      } 
                      // Stage 2: 5-way heavy spread
                      else if (enemy.bossStage === 2) {
                          for (let i = -2; i <= 2; i++) {
                              const sAng = pAngle + i * 0.2;
                              this.shootProjectile(enemy, {
                                  x: enemy.pos.x + Math.cos(sAng) * 130,
                                  y: enemy.pos.y + Math.sin(sAng) * 130
                              });
                          }
                      } 
                      // Stage 3: Spiral 8-way burst
                      else if (enemy.bossStage === 3) {
                          for (let i = 0; i < 8; i++) {
                              const sAng = (Math.PI * 2 / 8) * i + (Date.now() * 0.001);
                              this.shootProjectile(enemy, {
                                  x: enemy.pos.x + Math.cos(sAng) * 140,
                                  y: enemy.pos.y + Math.sin(sAng) * 140
                              });
                          }
                      }
                      // Stage 4: Focus beams (homing or linear hyper speed projectiles)
                      else if (enemy.bossStage === 4) {
                          // Linear heavy blast of 10 rapid projectiles
                          for (let i = 0; i < 6; i++) {
                              const sAng = pAngle + (Math.random() - 0.5) * 0.15;
                              this.shootProjectile(enemy, {
                                  x: enemy.pos.x + Math.cos(sAng) * (140 + i * 20),
                                  y: enemy.pos.y + Math.sin(sAng) * (140 + i * 20)
                              });
                          }
                      }
                      // Stage 5: Full visual doom coverage (double spiral in opposite directions!)
                      else if (enemy.bossStage === 5) {
                          for (let i = 0; i < 12; i++) {
                              const sAng = (Math.PI * 2 / 12) * i + (Date.now() * 0.001);
                              this.shootProjectile(enemy, {
                                  x: enemy.pos.x + Math.cos(sAng) * 140,
                                  y: enemy.pos.y + Math.sin(sAng) * 140
                              });
                          }
                      }
                  }

                  // 2. MINION SUMMONING & TURRETS SUMMONING
                  // Let's keep separate custom cooldown timers on the enemy object
                  if (!(enemy as any).summonTimer) {
                      (enemy as any).summonTimer = 0.0;
                      (enemy as any).turretTimer = 0.0;
                      (enemy as any).devastatorTimer = 0.0;
                  }
                  
                  (enemy as any).summonTimer += dt;
                  (enemy as any).turretTimer += dt;
                  (enemy as any).devastatorTimer += dt;

                  // A. Summon Enemies
                  // Stage 2 and above: Summons minions every 4.0s (faster at stage 5: every 2.5s)
                  const summonCooldown = enemy.bossStage === 5 ? 2.5 : 4.5;
                  if ((enemy as any).summonTimer >= summonCooldown) {
                      (enemy as any).summonTimer = 0;
                      
                      // Spawn visual trigger
                      this.particles.push({
                          type: 'NOVA',
                          pos: { ...enemy.pos },
                          vel: { x: 0, y: 0 },
                          life: 0.5,
                          color: '#a855f7'
                      });

                      const qty = enemy.bossStage === 5 ? 3 : 2;
                      for (let i = 0; i < qty; i++) {
                          const sAng = Math.random() * Math.PI * 2;
                          // Varied minions depending on stage
                          const types: ('SWARMER' | 'SHOOTER' | 'HEALER' | 'TESLA_COIL')[] = ['SWARMER'];
                          if (enemy.bossStage >= 3) types.push('SHOOTER');
                          if (enemy.bossStage >= 4) types.push('HEALER');
                          if (enemy.bossStage === 5) types.push('TESLA_COIL');

                          const chosenType = types[Math.floor(Math.random() * types.length)];
                          // Health scales with room so they aren't instant one-shot or impossible
                          const minionHp = enemy.maxHp >= 28000000 ? 50000 : 2500;

                          const minion: EnemyBall = {
                              id: 'nexus-minion-' + Math.random(),
                              type: EntityType.ENEMY_BALL,
                              enemyType: chosenType,
                              pos: { x: enemy.pos.x + Math.cos(sAng) * 130, y: enemy.pos.y + Math.sin(sAng) * 130 },
                              vel: { x: Math.cos(sAng) * 200, y: Math.sin(sAng) * 200 },
                              radius: chosenType === 'HEALER' ? 14 : 9,
                              hp: minionHp,
                              maxHp: minionHp,
                              color: chosenType === 'HEALER' ? '#10b981' : '#f43f5e',
                              isDead: false
                          };
                          this.enemies.push(minion);
                      }
                  }

                  // B. Summon Turrets (At Stage 3 and 5)
                  // Spawns dangerous stationary TESLA_COIL defenses that zap the player nearby
                  const turretCooldown = enemy.bossStage === 5 ? 4.5 : 7.0;
                  if ((enemy.bossStage === 3 || enemy.bossStage === 5) && (enemy as any).turretTimer >= turretCooldown) {
                      (enemy as any).turretTimer = 0;
                      
                      const tAng = Math.random() * Math.PI * 2;
                      const tx = enemy.pos.x + Math.cos(tAng) * (180 + Math.random() * 80);
                      const ty = Math.min(this.height - 100, Math.max(100, enemy.pos.y + Math.sin(tAng) * (180 + Math.random() * 80)));
                      
                      // Warp effect
                      this.particles.push({
                          type: 'WARP',
                          pos: { x: tx, y: ty },
                          radius: 0,
                          maxRadius: 100,
                          life: 0.6,
                          color: '#c084fc'
                    });

                      const turretHp = enemy.maxHp >= 28000000 ? 80000 : 5000;

                      // stationary tesla coil behaves exactly like a mechanical turret
                      const turretEnemy: EnemyBall = {
                          id: 'nexus-turret-' + Math.random(),
                          type: EntityType.ENEMY_BALL,
                          enemyType: 'TESLA_COIL',
                          pos: { x: tx, y: ty },
                          vel: { x: 0, y: 0 },
                          radius: 20,
                          hp: turretHp,
                          maxHp: turretHp,
                          color: '#a855f7',
                          isDead: false,
                          isBoss: false
                      };
                      this.enemies.push(turretEnemy);

                      this.floatingTexts.push({
                          id: Math.random().toString(36),
                          pos: { x: tx, y: ty - 25 },
                          vel: { x: 0, y: -45 },
                          text: "SENTRY DEPLOYED",
                          color: "#c084fc",
                          life: 1.5,
                          maxLife: 1.5,
                          isCrit: false
                      });
                  }

                  // C. Destroy Player Turrets with Special Devastator Attack (Stage 4 and 5)
                  // Looks at player turrets list, sets target lock, shoots beam that vaporizes them!
                  if ((enemy.bossStage === 4 || enemy.bossStage === 5)) {
                      // Find target turret if not already set or dead
                      if (!(enemy as any).targetTurretId) {
                          const activeTurrets = this.turrets ? this.turrets.filter(t => t.hp > 0) : [];
                          if (activeTurrets.length > 0) {
                              const targetT = activeTurrets[Math.floor(Math.random() * activeTurrets.length)];
                              (enemy as any).targetTurretId = targetT.pos;
                              (enemy as any).targetIsPlayer = false;
                              (enemy as any).devastatorTimer = 0.0;
                              
                              this.floatingTexts.push({
                                  id: Math.random().toString(36),
                                  pos: { x: enemy.pos.x, y: enemy.pos.y - 40 },
                                  vel: { x: 0, y: -50 },
                                  text: "🔒 TURRET TARGET LOCKED!",
                                  color: "#ef4444",
                                  life: 2.0,
                                  maxLife: 2.0,
                                  isCrit: true
                              });
                          } else {
                              // Target player instead!
                              (enemy as any).targetTurretId = { x: this.player.pos.x, y: this.player.pos.y };
                              (enemy as any).targetIsPlayer = true;
                              (enemy as any).devastatorTimer = 0.0;
                              
                              this.floatingTexts.push({
                                  id: Math.random().toString(36),
                                  pos: { x: enemy.pos.x, y: enemy.pos.y - 40 },
                                  vel: { x: 0, y: -50 },
                                  text: "⚠️ COLLAPSE LOCK-ON: GET AWAY!",
                                  color: "#f59e0b",
                                  life: 2.0,
                                  maxLife: 2.0,
                                  isCrit: true
                              });
                          }
                      }
                      
                      // If target exists, lock-on & charge
                      if ((enemy as any).targetTurretId) {
                          const targetPos = (enemy as any).targetTurretId;
                          
                          // Laser target indicator line (draw charge build effect)
                          if (Math.random() < 0.4) {
                              const ratio = Math.random();
                              this.particles.push({
                                  type: 'SPARK',
                                  pos: {
                                      x: enemy.pos.x + (targetPos.x - enemy.pos.x) * ratio,
                                      y: enemy.pos.y + (targetPos.y - enemy.pos.y) * ratio
                                  },
                                  vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                                  life: 0.25,
                                  color: '#f43f5e'
                              });
                          }
                          
                          // Charge time is 2.2 seconds
                          if ((enemy as any).devastatorTimer >= 2.2) {
                              (enemy as any).devastatorTimer = 0.0;
                              (enemy as any).targetTurretId = null; // Clear target
                              
                              // Check if any matching player turret is within 45px of target coordinates to destroy it
                              let destroyedDmg = false;
                              if (!(enemy as any).targetIsPlayer && this.turrets) {
                                  this.turrets.forEach(t => {
                                      const d = Math.hypot(t.pos.x - targetPos.x, t.pos.y - targetPos.y);
                                      if (d < 45) {
                                          t.hp = 0; // Vaporize!
                                          destroyedDmg = true;
                                          
                                          // Spectacular explosion particles centered on turret!
                                          this.explodeBomb({
                                              pos: t.pos,
                                              radius: 140,
                                              damage: 0,
                                              color: '#ec4899'
                                          });
                                          
                                          this.floatingTexts.push({
                                              id: Math.random().toString(36),
                                              pos: { x: t.pos.x, y: t.pos.y - 30 },
                                              vel: { x: 0, y: -60 },
                                              text: "VAPORIZED",
                                              color: "#ef4444",
                                              life: 2.5,
                                              maxLife: 2.5,
                                              isCrit: true
                                          });
                                      }
                                  });
                              }
                              
                              // Massive beam visual
                              const steps = 15;
                              for(let i = 0; i <= steps; i++) {
                                  const ratio = i / steps;
                                  this.particles.push({
                                      type: 'NOVA',
                                      pos: {
                                          x: enemy.pos.x + (targetPos.x - enemy.pos.x) * ratio,
                                          y: enemy.pos.y + (targetPos.y - enemy.pos.y) * ratio
                                      },
                                      vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
                                      life: 0.55,
                                      color: '#7f1d1d'
                                  });
                              }
                              gameAudio.playHitSound(false, 'shatter');
                              
                              // Shake screen heavily
                              this.shake = 35;
                              
                              // Also damage player if standing in blast area!
                              const pDist = Math.hypot(this.player.pos.x - targetPos.x, this.player.pos.y - targetPos.y);
                              if (pDist < 90) {
                                  this.damagePlayer((enemy as any).targetIsPlayer ? 180 : 80);
                              }
                          }
                      }
                  }
              }
      }
    });

    this.updateParticles(effectiveDt);
    this.updateFloatingTexts(effectiveDt);

    // Update Projectiles
    const bouncingAbility = this.player.abilities.find(a => (a.type === AbilityType.BOUNCE_SHOTS || a.type === AbilityType.KINETIC_BOUNCE_STORM) && a.isActive);

    // Cap projectiles if absurdly high
    if (this.projectiles.length > 120) {
      this.projectiles.splice(0, this.projectiles.length - 120);
    }

    this.projectiles = this.projectiles.filter(p => {
      const projDt = (p.ownerId !== 'player') ? (dt * timeWarpFactor) : dt;
      if (p.homing) {
          let target = p.targetId ? this.enemies.find(e => e.id === p.targetId) : null;
          if (!target) {
              target = this.getNearestEnemyTo(p.pos);
              if (target) p.targetId = target.id;
          }

          if (target) {
              const angle = Math.atan2(target.pos.y - p.pos.y, target.pos.x - p.pos.x);
              const currentAngle = Math.atan2(p.vel.y, p.vel.x);
              let diff = angle - currentAngle;
              if (diff < -Math.PI) diff += Math.PI * 2;
              if (diff > Math.PI) diff -= Math.PI * 2;
              
              // Very strong homing: aggressive turning
              const turnSpeed = 45 * projDt; 
              const newAngle = currentAngle + Math.max(-turnSpeed, Math.min(turnSpeed, diff));
              const speedSq = p.vel.x * p.vel.x + p.vel.y * p.vel.y;
              const speed = speedSq > 0 ? Math.sqrt(speedSq) : 0;
              p.vel.x = Math.cos(newAngle) * speed;
              p.vel.y = Math.sin(newAngle) * speed;

              // If close to target, aggressively snap or pull towards it
              const dxT = target.pos.x - p.pos.x;
              const dyT = target.pos.y - p.pos.y;
              const distToTargetSq = dxT * dxT + dyT * dyT;
              if (distToTargetSq < 62500) { // 250^2
                  const distToTarget = Math.sqrt(distToTargetSq);
                  const pullStrength = 0.5 * (1 - distToTarget / 250);
                  const idealVelX = Math.cos(angle) * speed;
                  const idealVelY = Math.sin(angle) * speed;
                  p.vel.x += (idealVelX - p.vel.x) * pullStrength;
                  p.vel.y += (idealVelY - p.vel.y) * pullStrength;
              }
          }
      }
      p.pos.x += p.vel.x * projDt;
      p.pos.y += p.vel.y * projDt;
      
      // Collision with wall
      if (p.pos.x < 0 || p.pos.x > this.width || p.pos.y < 0 || p.pos.y > this.height) {
        if ((bouncingAbility || (p.bounces && p.bounces > 0)) && (!p.bounces || p.bounces >= 0)) {
          gameAudio.playBounceSound();
          if (p.bounces) p.bounces--;
          if (p.pos.x < 0 || p.pos.x > this.width) {
            p.vel.x *= -1;
            p.pos.x = Math.max(0, Math.min(this.width, p.pos.x));
          }
          if (p.pos.y < 0 || p.pos.y > this.height) {
            p.vel.y *= -1;
            p.pos.y = Math.max(0, Math.min(this.height, p.pos.y));
          }
          
          if (bouncingAbility && bouncingAbility.type === AbilityType.KINETIC_BOUNCE_STORM) {
              p.damage += 35 * bouncingAbility.level;
              const bSpeedSq = p.vel.x * p.vel.x + p.vel.y * p.vel.y;
              if (bSpeedSq > 0 && bSpeedSq < 10240000) { // 3200^2
                  p.vel.x *= 1.15;
                  p.vel.y *= 1.15;
              }
          }

          // Echo Strike damage growth
          if (p.color === '#f472b6') { // Ult Bouncing
              p.damage *= 1.2;
              p.radius = Math.min(30, p.radius * 1.05);
          }
          
          return true;
        }
        return false;
      }

      // Projectile collision with Player
      if (p.ownerId !== 'player') {
        const dxP = p.pos.x - this.player.pos.x;
        const dyP = p.pos.y - this.player.pos.y;
        const combinedRP = p.radius + this.player.radius;
        if (dxP * dxP + dyP * dyP < combinedRP * combinedRP) {
          this.damagePlayer(p.damage);
          if ((p as any).isIce) {
              (this.player as any).slowTimer = 3.2; // 3.2s icy freeze slow
          }
          return false;
        }
      }

      // Projectile collision with Enemies
      if (p.ownerId === 'player') {
        for (let i = 0; i < this.enemies.length; i++) {
          const enemy = this.enemies[i];
          if (enemy.isDead) continue;
          const combinedRE = p.radius + enemy.radius;
          const dxE = p.pos.x - enemy.pos.x;
          if (Math.abs(dxE) > combinedRE) continue;
          const dyE = p.pos.y - enemy.pos.y;
          if (Math.abs(dyE) > combinedRE) continue;
          const distSq = dxE * dxE + dyE * dyE;
          
          if (distSq < combinedRE * combinedRE) {
            if (p.hitSet?.has(enemy.id)) continue;

            if ((p as any).isSentryBomb) {
              this.explodeBomb({
                pos: { ...p.pos },
                radius: 140,
                damage: p.damage,
                color: '#f59e0b'
              });
              return false;
            }

            const hitDamaged = this.damageEnemy(enemy, p.damage, false, p.weaponType || (p.isIce ? 'ice_sword' : p.isFire ? 'fire_sword' : 'kinetic'), undefined, p.pos);
            
            // Slow/Freeze/Fire on hit
            if (p.isIce) {
                enemy.isSlowed = true;
                enemy.slowTimer = Math.max(enemy.slowTimer || 0, 4.0);
                
                // Ice shatter effect
                if (this.particles.length < 75) {
                  for (let s = 0; s < 2; s++) {
                      this.particles.push({
                          type: 'SNOW',
                          pos: { ...enemy.pos },
                          vel: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
                          life: 0.35,
                          color: '#7dd3fc',
                          size: 3
                      });
                  }
                }
            } else if (p.isFire) {
                enemy.isOnFire = true;
                enemy.fireTimer = Math.max(enemy.fireTimer || 0, 6.0);
            } else if (this.player.stats.projectileSlow && this.player.stats.projectileSlow > 0) {
                enemy.isSlowed = true;
                enemy.slowTimer = Math.max(enemy.slowTimer || 0, 3.0);
            }
            
            // Blood lust lifesteal bonus
            if (bloodLust) {
                const hasActiveBoss = this.enemies.some(e => e.isBoss && !e.isDead);
                const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
                const factor = bloodLust.type === AbilityType.SANGUINE_FRENZY ? 0.05 : 0.02;
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.damage * factor * bossHealMult);
            }

            if (!hitDamaged) {
                // If blocked by shield, the projectile dies and cannot pierce!
                return false;
            }

            if (p.piercing && p.piercing > 0) {
                p.piercing--;
                if (!p.hitSet) p.hitSet = new Set();
                p.hitSet.add(enemy.id);
                continue;
            }

            if (p.bounces && p.bounces > 0) {
                p.bounces--;
                // Echo Strike damage growth
                if (p.color === '#f472b6') { // Ult Bouncing
                    p.damage *= 1.1;
                }

                // Bounce off enemy
                const dist = distSq > 0 ? Math.sqrt(distSq) : 1;
                const nx = (p.pos.x - enemy.pos.x) / dist;
                const ny = (p.pos.y - enemy.pos.y) / dist;
                const dot = p.vel.x * nx + p.vel.y * ny;
                p.vel.x -= 2 * dot * nx;
                p.vel.y -= 2 * dot * ny;
                
                // Move out of collision
                const overlap = (p.radius + enemy.radius) - dist;
                p.pos.x += nx * (overlap + 1);
                p.pos.y += ny * (overlap + 1);

                if (!p.hitSet) p.hitSet = new Set();
                p.hitSet.add(enemy.id);
                
                // Refraction Lance split
                if (p.color === '#fb923c' && p.radius > 4 && this.projectiles.length < 100) {
                    this.projectiles.push({
                        ...p,
                        radius: p.radius * 0.7,
                        damage: p.damage * 0.5,
                        vel: { x: p.vel.y, y: -p.vel.x },
                        bounces: Math.floor(p.bounces * 0.5)
                    });
                }

                return true;
            }

            return false;
          }
        }
      }

      return true;
    });

    // Ball-Ball Collision
    for (let enemy of this.enemies) {
      const dist = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
      if (dist < this.player.radius + enemy.radius) {
        this.resolveCollision(this.player, enemy);
        
        // Damage player on contact (scaled reasonably for early sectors 1-10 and 11-20)
        if (enemy.isBoss) {
            const bossContact = (enemy.bossSubtype === 'WARRIOR' || this.currentRoom <= 10) ? 20 : (enemy.bossSubtype === 'TITAN' || this.currentRoom <= 20) ? 35 : 75;
            this.damagePlayer(bossContact);
        } else {
            let contactDmg = this.currentRoom <= 10 ? 8 : (this.currentRoom <= 20 ? 14 : 25);
            if ((enemy as any).damageMult) {
                contactDmg *= (enemy as any).damageMult;
            }
            this.damagePlayer(contactDmg);
        }

        let dmg = this.player.stats.bounceDmg;
        if (Math.random() < this.player.stats.critChance) dmg *= 2;
        
        this.damageEnemy(enemy, dmg);
        
        // Blood lust lifesteal bonus on contact (reduced during boss fights)
        if (bloodLust) {
            const hasActiveBoss = this.enemies.some(e => e.isBoss && !e.isDead);
            const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
            const factor = bloodLust.type === AbilityType.SANGUINE_FRENZY ? 0.10 : 0.04;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + (dmg * factor * bossHealMult));
        }
      }
    }

    // Filter dead enemies
    this.enemies = this.enemies.filter(e => {
      if (e.isDead || e.hp <= 0) {
        this.player.stats.currency += Math.ceil(e.maxHp / 0.8);
        this.enemiesKilled++;
        
        // Spawn Death Particles
        const particleCount = e.isBoss ? 40 : 15;
        for (let i = 0; i < particleCount; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 200 + 100) * (e.isBoss ? 2 : 1);
            this.particles.push({
                type: 'DEATH_SHIVER',
                pos: { ...e.pos },
                vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
                life: 0.8 + Math.random() * 0.4,
                color: e.color,
                size: (Math.random() * 3 + 2) * (e.isBoss ? 2 : 1)
            });
        }
        if (this.onShake) this.onShake(e.isBoss ? 40 : 5);

        // Lifesteal (reduced during boss fights)
        let ls = this.player.stats.lifesteal;
        if (bloodLust) ls += (bloodLust.type === AbilityType.SANGUINE_FRENZY ? 0.12 : 0.05); // Extra lifesteal during bloodlust

        if (ls > 0) {
            // Nerf lifesteal so kills don't instant-heal to full. Cap individual heal at 1% maxHp per kill.
            const hasActiveBoss = this.enemies.some(eb => eb.isBoss && !eb.isDead);
            const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
            const healAmount = Math.min(this.player.maxHp * 0.01, e.maxHp * ls * 0.1) * bossHealMult;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
        }

        return false;
      }
      return true;
    });

    // Check if room clear
    if (this.enemies.length === 0 && this.spawnQueue.length === 0 && !this.player.isDead) {
        if (this.waveQueue.length > 0) {
            this.triggerNextWave();
        } else if (this.onRoomClear) {
            const cb = this.onRoomClear;
            this.onRoomClear = undefined; // Prevent double trigger
            cb();
        }
    }
  }

  triggerAbility(index: number) {
    const ability = this.player.abilities[index];
    if (!ability) return;

    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) return;

    ability.lastUsed = now;
    ability.isActive = true;

    if (ability.type === AbilityType.DASH || ability.type === AbilityType.DIMENSIONAL_DASH) {
        const speed = (ability.type === AbilityType.DIMENSIONAL_DASH ? 3500 : 2400) + (ability.level * 200); 
        let angle = Math.atan2(this.player.vel.y, this.player.vel.x);
        
        // If stopped or nearly stopped, pick a direction; otherwise apply ~20% angular variance to avoid 1D wall-bouncing traps
        if (Math.hypot(this.player.vel.x, this.player.vel.y) < 1) {
            angle = Math.random() * Math.PI * 2;
        } else {
            // ~20% directional variance (±0.2 * PI, ~±36 degrees) to allow unstucking from bounce loops
            const variance = (Math.random() - 0.5) * (0.4 * Math.PI);
            angle += variance;
        }

        this.player.vel.x = Math.cos(angle) * speed;
        this.player.vel.y = Math.sin(angle) * speed;
        if (this.onShake) this.onShake(ability.type === AbilityType.DIMENSIONAL_DASH ? 25 : 15);
        
        // Add dash wind particles
        for(let i=0; i<10; i++) {
            this.particles.push({
                type: 'SPARK',
                pos: { ...this.player.pos },
                vel: { x: -this.player.vel.x * 0.2, y: -this.player.vel.y * 0.2 },
                life: 0.5,
                color: ability.type === AbilityType.DIMENSIONAL_DASH ? '#ec4899' : '#fff'
            });
        }
    }

    if (ability.type === AbilityType.SHIELD_BURST || ability.type === AbilityType.PLASMA_NOVA) {
        const radius = (ability.type === AbilityType.PLASMA_NOVA ? 500 : 350) + (ability.level * 50); 
        const damage = (ability.type === AbilityType.PLASMA_NOVA ? 800 : 400) * (ability.level); 
        
        this.enemies.forEach(e => {
            const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
            if (dist < radius) {
                this.burstDamageEnemy(e, damage);
                const angle = Math.atan2(e.pos.y - this.player.pos.y, e.pos.x - this.player.pos.x);
                const knockback = (ability.type === AbilityType.PLASMA_NOVA ? 3000 : 1800) + (ability.level * 200);
                e.vel.x = Math.cos(angle) * knockback;
                e.vel.y = Math.sin(angle) * knockback;
                
                // Visual spark on hit
                this.particles.push({
                    type: 'SPARK',
                    pos: { ...e.pos },
                    vel: { x: Math.cos(angle) * 300, y: Math.sin(angle) * 300 },
                    life: 0.8,
                    color: ability.type === AbilityType.PLASMA_NOVA ? '#ef4444' : '#38bdf8'
                });
            }
        });
        if (this.onShake) this.onShake(ability.type === AbilityType.PLASMA_NOVA ? 50 : 35);
        
        // Add nova ring particle
        this.particles.push({
            type: 'NOVA',
            pos: { ...this.player.pos },
            radius: 0,
            maxRadius: radius,
            life: 0.4,
            color: ability.type === AbilityType.PLASMA_NOVA ? '#ef4444' : '#38bdf8'
        });
    }

    if (ability.type === AbilityType.SHOCKWAVE || ability.type === AbilityType.SEISMIC_CRUSHER) {
        const isEvo = ability.type === AbilityType.SEISMIC_CRUSHER;
        const pulsesCount = isEvo ? 3 : 1;
        const radius = (isEvo ? 700 : 500) + (ability.level * 50);

        for (let pIdx = 0; pIdx < pulsesCount; pIdx++) {
            const delay = pIdx * 250;
            setTimeout(() => {
                this.enemies.forEach(e => {
                    const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
                    if (dist < radius) {
                        const angle = Math.atan2(e.pos.y - this.player.pos.y, e.pos.x - this.player.pos.x);
                        const push = isEvo ? 3200 : 2500;
                        e.vel.x = Math.cos(angle) * push;
                        e.vel.y = Math.sin(angle) * push;
                        
                        const dmg = isEvo ? 200 * ability.level : 50 * ability.level;
                        this.burstDamageEnemy(e, dmg);
                        
                        if (isEvo) {
                            e.isFrozen = true;
                            e.freezeTimer = Math.max(e.freezeTimer || 0, 3.5); // Stunned/Frozen
                        }
                    }
                });

                this.particles.push({
                    type: 'NOVA',
                    pos: { ...this.player.pos },
                    radius: 0,
                    maxRadius: radius,
                    life: 0.35,
                    color: isEvo ? '#f59e0b' : '#fff'
                });

                if (this.onShake) this.onShake(isEvo ? 45 : 25);
            }, delay);
        }
    }

    if (ability.type === AbilityType.TOXIC_CLOUD || ability.type === AbilityType.CORROSIVE_DECAY) {
        const isEvo = ability.type === AbilityType.CORROSIVE_DECAY;
        const radius = (isEvo ? 450 : 300) + (ability.level * 30);
        const count = isEvo ? 35 : 20;
        // Spawn multiple toxic cloud particles for a denser look
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            this.particles.push({
                type: 'TOXIC',
                pos: { 
                    x: this.player.pos.x + Math.cos(angle) * dist,
                    y: this.player.pos.y + Math.sin(angle) * dist
                },
                maxRadius: (isEvo ? 65 : 40) + Math.random() * 40,
                life: (isEvo ? 5 : 3) + ability.level + Math.random() * 2,
                damage: ((isEvo ? 75 : 20) * ability.level) / 5, // Split damage across ticks
                color: isEvo ? '#a3e635' : '#4ade80',
                size: (isEvo ? 22 : 15) + Math.random() * 15,
                isCorrosive: isEvo
            } as any);
        }
        if (this.onShake) this.onShake(isEvo ? 12 : 5);
    }

    if (ability.type === AbilityType.CHAIN_LIGHTNING || ability.type === AbilityType.THUNDERBOLT_STORM) {
        const isEvo = ability.type === AbilityType.THUNDERBOLT_STORM;
        let currentTarget = this.getNearestEnemy();
        if (currentTarget) {
            const chainCount = isEvo ? (26 + Math.floor(ability.level * 3)) : (6 + Math.floor(ability.level * 1.5));
            const visited = new Set<string>();
            let chainSource = this.player.pos;
            
            for (let i = 0; i < chainCount && currentTarget; i++) {
                visited.add(currentTarget.id);
                this.burstDamageEnemy(currentTarget, (isEvo ? 450 : 45) * ability.level);
                
                if (isEvo) {
                    // Huge, thunderous cascading static blasts on Thunderbolt Storm contact hit!
                    this.explodeBomb({
                        pos: { ...currentTarget.pos },
                        radius: 280, // Much larger blast radius
                        damage: 260 * ability.level, // Significantly stronger damage
                        color: '#38bdf8', // Brilliant cyan-blue plasma thunder blast
                        capPerEnemy: true // Burst-capped like other global abilities
                    });

                    // Multi-ring electric shockwave burst
                    for (let s = 0; s < 12; s++) {
                        const sAng = (Math.PI * 2 / 12) * s;
                        this.particles.push({
                            type: 'NOVA',
                            pos: { ...currentTarget.pos },
                            vel: { x: Math.cos(sAng) * 320, y: Math.sin(sAng) * 320 },
                            life: 0.55,
                            color: s % 2 === 0 ? '#38bdf8' : '#c084fc'
                        });
                    }

                    // Intense electric sparks scattering from blast center
                    for (let sp = 0; sp < 6; sp++) {
                        const spAng = Math.random() * Math.PI * 2;
                        const spSpeed = 180 + Math.random() * 260;
                        this.particles.push({
                            type: 'SPARK',
                            pos: { ...currentTarget.pos },
                            vel: { x: Math.cos(spAng) * spSpeed, y: Math.sin(spAng) * spSpeed },
                            life: 0.45,
                            color: '#e0f2fe'
                        });
                    }
                }

                this.particles.push({
                    type: 'ARC',
                    p1: { ...chainSource },
                    p2: { ...currentTarget.pos },
                    life: 0.45,
                    color: isEvo ? '#38bdf8' : '#fbbf24'
                });
                
                chainSource = currentTarget.pos;
                currentTarget = this.enemies
                    .filter(e => !visited.has(e.id))
                    .sort((a, b) => Math.hypot(a.pos.x - chainSource.x, a.pos.y - chainSource.y) - Math.hypot(b.pos.x - chainSource.x, b.pos.y - chainSource.y))[0] || null;
            }
            if (this.onShake) this.onShake(isEvo ? 50 : 20);
            this.shake = Math.min(65, this.shake + (isEvo ? 35 : 10));
            gameAudio.playHitSound(false, 'laser');
        }
    }

    if (ability.type === AbilityType.FROST_NOVA || ability.type === AbilityType.ABSOLUTE_ZERO_RIPPLE) {
        const isEvo = ability.type === AbilityType.ABSOLUTE_ZERO_RIPPLE;
        const radius = (isEvo ? 650 : 400) + ability.level * 50;
        this.enemies.forEach(e => {
            if (Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y) < radius) {
                e.isFrozen = true;
                e.freezeTimer = (isEvo ? 5 : 3) + ability.level;
                e.vel.x = 0;
                e.vel.y = 0;
            }
        });
        
        // Frost Nova Visual - Snow particles
        const snowCount = isEvo ? 60 : 40;
        for (let i = 0; i < snowCount; i++) {
            const ang = (i / snowCount) * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            this.particles.push({
                type: 'SNOW',
                pos: { ...this.player.pos },
                vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
                life: 0.8 + Math.random() * 0.4,
                color: isEvo ? '#06b6d4' : '#bae6fd',
                size: 3 + Math.random() * 4
            });
        }

        this.particles.push({
            type: 'NOVA',
            pos: { ...this.player.pos },
            radius: 0,
            maxRadius: radius,
            life: 0.6,
            color: isEvo ? '#06b6d4' : '#38bdf8'
        });

        if (isEvo) {
            const shardCount = 14;
            for (let i = 0; i < shardCount; i++) {
                const ang = (i / shardCount) * Math.PI * 2;
                const speed = 450;
                this.projectiles.push({
                    pos: { ...this.player.pos },
                    vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
                    radius: 8,
                    damage: 280 * ability.level,
                    color: '#06b6d4',
                    isIce: true,
                    life: 2.0,
                    weaponType: 'ice_sword'
                } as any);
            }
        }

        if (this.onShake) this.onShake(isEvo ? 25 : 15);
    }

    if (ability.type === AbilityType.METEOR_STRIKE) {
        const count = 3 + ability.level;
        for (let i = 0; i < count; i++) {
            const delay = i * 200;
            setTimeout(() => {
                const targetPos = {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height
                };
                // Find random enemy to target if possible
                const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                if (randomEnemy && Math.random() < 0.7) {
                    targetPos.x = randomEnemy.pos.x;
                    targetPos.y = randomEnemy.pos.y;
                }

                this.particles.push({
                    type: 'NOVA',
                    pos: targetPos,
                    radius: 0,
                    maxRadius: 150,
                    life: 0.5,
                    color: '#f97316'
                });
                
                this.enemies.forEach(e => {
                    if (Math.hypot(e.pos.x - targetPos.x, e.pos.y - targetPos.y) < 150) {
                        this.burstDamageEnemy(e, 300 * ability.level);
                    }
                });
                if (this.onShake) this.onShake(15);
            }, delay);
        }
    }

    if (ability.type === AbilityType.SUPERNOVA_RAIN) {
        const count = 8 + ability.level * 2;
        for (let i = 0; i < count; i++) {
            const delay = i * 140; 
            setTimeout(() => {
                const targetPos = {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height
                };
                const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                if (randomEnemy && Math.random() < 0.8) {
                    targetPos.x = randomEnemy.pos.x;
                    targetPos.y = randomEnemy.pos.y;
                }

                this.particles.push({
                    type: 'NOVA',
                    pos: { ...targetPos },
                    radius: 0,
                    maxRadius: 210,
                    life: 0.6,
                    color: '#f97316'
                });

                for (let k = 0; k < 3; k++) {
                    const offsetAngle = Math.random() * Math.PI * 2;
                    const offsetDist = Math.random() * 40;
                    this.particles.push({
                        type: 'FIRE',
                        pos: {
                            x: targetPos.x + Math.cos(offsetAngle) * offsetDist,
                            y: targetPos.y + Math.sin(offsetAngle) * offsetDist
                        },
                        vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                        life: 4.0 + Math.random() * 2.0,
                        damage: 150 * ability.level,
                        color: '#f43f5e',
                        radius: 65,
                        isEvolved: true
                    });
                }
                
                this.enemies.forEach(e => {
                    if (Math.hypot(e.pos.x - targetPos.x, e.pos.y - targetPos.y) < 210) {
                        this.burstDamageEnemy(e, 500 * ability.level);
                        e.isOnFire = true;
                        e.fireTimer = Math.max(e.fireTimer || 0, 8.0);
                    }
                });
                if (this.onShake) this.onShake(18);
            }, delay);
        }
    }

    if (ability.type === AbilityType.HEALING_AURA || ability.type === AbilityType.NANITE_AEGIS) {
        // Handled in update loop
    }
 
    if (ability.type === AbilityType.BLOOD_LUST || ability.type === AbilityType.SANGUINE_FRENZY) {
        // Handled in update loop
    }
     
    if (ability.type === AbilityType.OVERDRIVE || ability.type === AbilityType.APEX_OVERDRIVE) {
        // Handled in cooldown/speed multis
    }
 
    if (ability.type === AbilityType.TIME_WARP || ability.type === AbilityType.TEMPORAL_COLLAPSE) {
        // Handled in effectiveDt
    }

    if (ability.type === AbilityType.BLIZZARD || ability.type === AbilityType.FROSTBITE_TEMPEST) {
        const isEvo = ability.type === AbilityType.FROSTBITE_TEMPEST;
        const radius = isEvo ? 480 : 400;
        
        this.enemies.forEach(e => {
            const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
            if (dist < radius) {
                e.isFrozen = true;
                e.freezeTimer = Math.max(e.freezeTimer || 0, isEvo ? 2.5 : 2.0);
            }
        });
        
        this.particles.push({
            type: 'NOVA',
            pos: { ...this.player.pos },
            radius: 0,
            maxRadius: radius,
            life: 0.5,
            color: isEvo ? '#06b6d4' : '#0ea5e9'
        });
        gameAudio.playExplosionSound();
        if (this.onShake) this.onShake(15);
    }

    if (ability.type === AbilityType.INFERNO || ability.type === AbilityType.HELLFIRE_STORM) {
        const isEvo = ability.type === AbilityType.HELLFIRE_STORM;
        const radius = isEvo ? 550 : 350;
        
        this.enemies.forEach(e => {
            const dist = Math.hypot(e.pos.x - this.player.pos.x, e.pos.y - this.player.pos.y);
            if (dist < radius) {
                e.isOnFire = true;
                e.fireTimer = Math.max(e.fireTimer || 0, isEvo ? 8.0 : 5.0);
                this.burstDamageEnemy(e, isEvo ? 300 : 150, 'inferno_activation');
            }
        });

        this.particles.push({
            type: 'NOVA',
            pos: { ...this.player.pos },
            radius: 0,
            maxRadius: radius,
            life: 0.5,
            color: '#f97316'
        });
        gameAudio.playExplosionSound();
        if (this.onShake) this.onShake(20);
    }
  }

  updateBall(ball: Entity, dt: number) {
    // Velocity cap for stability
    const maxVel = 5000;
    if (Math.abs(ball.vel.x) > maxVel) ball.vel.x = Math.sign(ball.vel.x) * maxVel;
    if (Math.abs(ball.vel.y) > maxVel) ball.vel.y = Math.sign(ball.vel.y) * maxVel;

    ball.pos.x += ball.vel.x * dt;
    ball.pos.y += ball.vel.y * dt;

    let bounced = false;
    const r = ball.radius;
    const cornerR = 52; // Rounded corner radius preventing corner sticking

    // 1. Check rounded corners first
    const w = this.width;
    const h = this.height;

    // Helper to resolve corner collision with a circular arc boundary
    const resolveRoundedCorner = (cx: number, cy: number) => {
      const dx = ball.pos.x - cx;
      const dy = ball.pos.y - cy;
      const dist = Math.hypot(dx, dy);
      const maxAllowedDist = cornerR - r;
      if (dist > maxAllowedDist) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        ball.pos.x = cx + nx * maxAllowedDist;
        ball.pos.y = cy + ny * maxAllowedDist;
        
        // Inward normal pointing into arena
        const inX = -nx;
        const inY = -ny;
        const dot = ball.vel.x * inX + ball.vel.y * inY;
        if (dot < 0) {
          ball.vel.x -= 2 * dot * inX;
          ball.vel.y -= 2 * dot * inY;
          // Add smooth tangential deflection to glide off the curve cleanly
          const tanX = -inY;
          const tanY = inX;
          const tanDot = ball.vel.x * tanX + ball.vel.y * tanY;
          if (Math.abs(tanDot) < 40) {
            ball.vel.x += tanX * 80;
            ball.vel.y += tanY * 80;
          }
        }
        bounced = true;
        return true;
      }
      return false;
    };

    let inCorner = false;
    // Top-Left Corner
    if (ball.pos.x < cornerR && ball.pos.y < cornerR) {
      inCorner = resolveRoundedCorner(cornerR, cornerR);
    }
    // Top-Right Corner
    else if (ball.pos.x > w - cornerR && ball.pos.y < cornerR) {
      inCorner = resolveRoundedCorner(w - cornerR, cornerR);
    }
    // Bottom-Left Corner
    else if (ball.pos.x < cornerR && ball.pos.y > h - cornerR) {
      inCorner = resolveRoundedCorner(cornerR, h - cornerR);
    }
    // Bottom-Right Corner
    else if (ball.pos.x > w - cornerR && ball.pos.y > h - cornerR) {
      inCorner = resolveRoundedCorner(w - cornerR, h - cornerR);
    }

    // 2. Straight wall boundary checks (only if not already resolved by rounded corner arc)
    if (!inCorner) {
      if (ball.pos.x - r < 0) {
        ball.pos.x = r;
        ball.vel.x = Math.abs(ball.vel.x);
        bounced = true;
      } else if (ball.pos.x + r > this.width) {
        ball.pos.x = this.width - r;
        ball.vel.x = -Math.abs(ball.vel.x);
        bounced = true;
      }

      if (ball.pos.y - r < 0) {
        ball.pos.y = r;
        ball.vel.y = Math.abs(ball.vel.y);
        bounced = true;
      } else if (ball.pos.y + r > this.height) {
        ball.pos.y = this.height - r;
        ball.vel.y = -Math.abs(ball.vel.y);
        bounced = true;
      }
    }

    if (bounced && ball.id === 'player') {
      gameAudio.playBounceSound();
    }
  }

  getTurretMaxHp(type: string, hpLevel: number) {
    let baseHp = 120;
    let perLevel = 30;
    
    if (type === 'turret_tesla') { baseHp = 60; perLevel = 30; }
    else if (type === 'turret_sword') { baseHp = 100; perLevel = 50; }
    else if (type === 'turret_autoshooter') { baseHp = 50; perLevel = 25; }
    else if (type === 'turret_ricochet') { baseHp = 70; perLevel = 35; }
    else if (type === 'turret_shotgun') { baseHp = 60; perLevel = 30; }
    else if (type === 'turret_fire') { baseHp = 80; perLevel = 40; }
    else if (type === 'turret_shield') { baseHp = 100; perLevel = 60; }
    else if (type === 'turret_bomb') { baseHp = 65; perLevel = 35; }
    else if (type === 'turret_plasma') { baseHp = 60; perLevel = 30; }

    return baseHp + hpLevel * perLevel;
  }

  implodeAllTurrets() {
    if (!this.turrets || this.turrets.length === 0) return;
    
    this.turrets.forEach(t => {
      const dmgLvl = t.dmgLevel || 1;
      const hpLvl = t.hpLevel || 1;
      const avgLvl = (dmgLvl + hpLvl) / 2;
      const explosionDmg = Math.round((150 + avgLvl * 80) * (this.player.stats.damageMult || 1.0));
      
      this.explodeBomb({
        pos: { ...t.pos },
        radius: 250,
        damage: explosionDmg,
        color: '#f59e0b'
      });
      
      this.floatingTexts.push({
        id: Math.random().toString(),
        pos: { x: t.pos.x, y: t.pos.y - 20 },
        vel: { x: 0, y: -80 },
        text: "IMPLOSION!",
        color: '#f59e0b',
        life: 1.0,
        maxLife: 1.0
      });
    });
    
    this.turrets = [];
    gameAudio.playHitSound(false, 'laser');
  }

  addFloatingText(text: string, pos: { x: number, y: number }, color: string, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: Math.random().toString(36),
      pos: { x: pos.x, y: pos.y },
      vel: { x: (Math.random() - 0.5) * 60, y: -110 },
      text,
      color,
      life: isCrit ? 0.75 : 0.55,
      maxLife: isCrit ? 0.75 : 0.55,
      isCrit
    });
  }

  explodeAllMines() {
    if (!this.mines || this.mines.length === 0) return;

    this.mines.forEach(m => {
      let baseExplosionDmg = 1000;
      if (m.type === 'mine_heavy') baseExplosionDmg = 2500;
      else if (m.type === 'mine_quantum') baseExplosionDmg = 5000;

      const hpLvl = m.levelHp || 1;
      const prodLvl = m.levelProd || 1;
      const explosionDmg = Math.round((baseExplosionDmg + (hpLvl + prodLvl) * 400) * (this.player.stats.damageMult || 1.0));

      this.explodeBomb({
        pos: { ...m.pos },
        radius: 300,
        damage: explosionDmg,
        color: '#ef4444'
      });

      this.floatingTexts.push({
        id: Math.random().toString(),
        pos: { x: m.pos.x, y: m.pos.y - 20 },
        vel: { x: 0, y: -80 },
        text: "MINE DETONATED!",
        color: '#ef4444',
        life: 1.0,
        maxLife: 1.0
      });
    });

    this.mines = [];
    gameAudio.playExplosionSound();
  }

  updateMines(dt: number) {
    if (!this.mines) this.mines = [];

    const previousLen = this.mines.length;
    this.mines = this.mines.filter(m => m.hp > 0);
    if (this.mines.length < previousLen) {
      gameAudio.playExplosionSound();
    }

    this.mines.forEach(m => {
      m.angle = (m.angle || 0) + 1.0 * dt;

      this.enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const dist = Math.hypot(enemy.pos.x - m.pos.x, enemy.pos.y - m.pos.y);
        const contactDist = enemy.radius + m.radius;
        if (dist < contactDist) {
          let enemyContactDmg = 45 * dt;
          if (enemy.enemyType === 'TANK') enemyContactDmg = 90 * dt;
          m.hp -= enemyContactDmg;

          if (Math.random() < 0.25) {
            this.particles.push({
              type: 'SPARK',
              pos: { ...m.pos },
              vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
              life: 0.3,
              color: '#ef4444'
            });
          }

          const pushAngle = Math.atan2(enemy.pos.y - m.pos.y, enemy.pos.x - m.pos.x);
          const pushForce = enemy.isBoss ? 100 : 200;
          enemy.vel.x += Math.cos(pushAngle) * pushForce * dt;
          enemy.vel.y += Math.sin(pushAngle) * pushForce * dt;
        }
      });

      m.lastIncomeTime = (m.lastIncomeTime || 0) + dt;
      if (m.lastIncomeTime >= 2.0) {
        const multiplier = 1 + (m.levelProd - 1) * 0.25;
        const incomeTick = Math.round(m.income * multiplier);
        const finalIncome = incomeTick * 2;

        if (!this.gameMode.includes('SANDBOX')) {
          this.player.stats.currency = (this.player.stats.currency || 0) + finalIncome;
        }

        // Track overall mining earnings
        this.player.stats.totalMiningEarnings = (this.player.stats.totalMiningEarnings || 0) + finalIncome;

        this.addFloatingText(`+${finalIncome} C`, m.pos, '#10b981', true);
        m.lastIncomeTime = 0;
      }
    });
  }

  updateTurrets(dt: number) {
    if (!this.turrets) this.turrets = [];

    // Filter out dead turrets
    this.turrets = this.turrets.filter(t => t.hp > 0);

    const now = Date.now();
    const dmgMult = this.player.stats.damageMult || 1.0;
    const cooldownMult = this.player.stats.cooldownMult || 1.0;
    const pierce = this.player.stats.pierce || 0;

    this.turrets.forEach(t => {
      // Slow rotation for aesthetic idle state, overridden if needed
      t.angle = (t.angle || 0) + 1.2 * dt;

      // Enemy physical collisions and ambient damage to the turret
      this.enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const dist = Math.hypot(enemy.pos.x - t.pos.x, enemy.pos.y - t.pos.y);
        const contactDist = enemy.radius + t.radius;
        if (dist < contactDist) {
          // Enemies deal contact damage to turret
          let enemyContactDmg = 35 * dt;
          if (enemy.enemyType === 'TANK') enemyContactDmg = 70 * dt;
          t.hp -= enemyContactDmg;

          // Push particles on contact
          if (Math.random() < 0.25) {
            this.particles.push({
              type: 'SPARK',
              pos: { ...t.pos },
              vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
              life: 0.3,
              color: '#f43f5e'
            });
          }

          // Push enemy back slightly on contact
          const pushAngle = Math.atan2(enemy.pos.y - t.pos.y, enemy.pos.x - t.pos.x);
          const pushForce = enemy.isBoss ? 100 : 200;
          enemy.vel.x += Math.cos(pushAngle) * pushForce * dt;
          enemy.vel.y += Math.sin(pushAngle) * pushForce * dt;
        }
      });

      // Actions based on turret type
      if (t.type === 'turret_tesla') {
        const fireCooldown = 1200 * cooldownMult; // 1.2 seconds * cooldown modifier
        if (now - t.lastShot > fireCooldown) {
          // Search for 2 nearest enemies in a radius of 280
          const radius = 280;
          const candidates = this.enemies
            .filter(e => !e.isDead && Math.hypot(e.pos.x - t.pos.x, e.pos.y - t.pos.y) < radius)
            .sort((a, b) => Math.hypot(a.pos.x - t.pos.x, a.pos.y - t.pos.y) - Math.hypot(b.pos.x - t.pos.x, b.pos.y - t.pos.y))
            .slice(0, 2);

          if (candidates.length > 0) {
            t.lastShot = now;
            candidates.forEach(e => {
              const damage = (15 + (t.dmgLevel || 1) * 15) * dmgMult;
              this.damageEnemy(e, damage, false, 'turret_tesla', undefined, t.pos);
              
              // Zap lightning effects
              for (let i = 0; i <= 5; i++) {
                const ratio = i / 5;
                this.particles.push({
                  type: 'SPARK',
                  pos: {
                    x: t.pos.x + (e.pos.x - t.pos.x) * ratio + (Math.random() - 0.5) * 10,
                    y: t.pos.y + (e.pos.y - t.pos.y) * ratio + (Math.random() - 0.5) * 10,
                  },
                  vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                  life: 0.25,
                  color: '#60a5fa'
                });
              }

              this.floatingTexts.push({
                id: Math.random().toString(),
                pos: { ...e.pos },
                vel: { x: (Math.random() - 0.5) * 40, y: -40 },
                text: `${Math.round(damage)}`,
                color: '#60a5fa',
                life: 0.8,
                maxLife: 0.8
              });
            });
            gameAudio.playHitSound(false, 'laser');
          }
        }
      } else if (t.type === 'turret_sword') {
        // Rotates physical laser sword rapidly
        const meleeSpeed = this.player.stats.meleeSpeed || 1.0;
        const weaponSize = this.player.stats.weaponSize || 1.0;
        const rotSpeed = 9 * meleeSpeed; // 9 radians/sec fast spin!
        t.angle = (t.angle || 0) + rotSpeed * dt;

        const swordLength = (70 + (t.dmgLevel || 1) * 5) * weaponSize;
        const bladeTip = {
          x: t.pos.x + Math.cos(t.angle) * swordLength,
          y: t.pos.y + Math.sin(t.angle) * swordLength
        };

        // Laser blade spark trail
        if (Math.random() < 0.45) {
          const ratio = Math.random();
          this.particles.push({
            type: 'SPARK',
            pos: {
              x: t.pos.x + (bladeTip.x - t.pos.x) * ratio,
              y: t.pos.y + (bladeTip.y - t.pos.y) * ratio,
            },
            vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
            life: 0.3,
            color: '#f97316'
          });
        }

        this.enemies.forEach(e => {
          if (e.isDead) return;
          const dist = this.distToSegment(e.pos, t.pos, bladeTip);
          const hitboxThickness = 20 * weaponSize;
          if (dist < e.radius + hitboxThickness) {
            const damagePerSec = (10 + (t.dmgLevel || 1) * 10) * dmgMult;
            this.damageEnemy(e, damagePerSec * dt * 15, true, 'turret_sword', undefined, t.pos);
          }
        });
      } else if (t.type === 'turret_autoshooter') {
        const fireCooldown = 320 * cooldownMult; // Rapid bullets
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const bulletSpeed = 650;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, bulletSpeed, accuracy);
          // Align visual barrel direction to predicted lead position
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 380) {
            t.lastShot = now;
            const spreadCone = Math.max(0, (1 - accuracy) * 0.14);
            const angle = t.angle + (Math.random() - 0.5) * spreadCone;
            const damage = (5 + (t.dmgLevel || 1) * 4) * dmgMult;

            this.projectiles.push({
              pos: { ...t.pos },
              vel: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
              radius: 4.5,
              damage,
              ownerId: 'player',
              color: '#c084fc',
              piercing: pierce,
              weaponType: 'turret_autoshooter'
            });

            gameAudio.playHitSound(false, 'kinetic');
          }
        }
      } else if (t.type === 'turret_ricochet') {
        const fireCooldown = 900 * cooldownMult;
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const bulletSpeed = 580;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, bulletSpeed, accuracy);
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 385) {
            t.lastShot = now;
            const spreadCone = Math.max(0, (1 - accuracy) * 0.12);
            const angle = t.angle + (Math.random() - 0.5) * spreadCone;
            const damage = (10 + (t.dmgLevel || 1) * 8) * dmgMult;

            this.projectiles.push({
              pos: { ...t.pos },
              vel: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
              radius: 5.5,
              damage,
              ownerId: 'player',
              color: '#34d399',
              bounces: 3,
              piercing: pierce,
              weaponType: 'turret_ricochet'
            });

            gameAudio.playHitSound(false, 'kinetic');
          }
        }
      } else if (t.type === 'turret_shotgun') {
        const fireCooldown = 1100 * cooldownMult;
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const pelSpeed = 550;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, pelSpeed, accuracy);
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 280) {
            t.lastShot = now;
            const angle = t.angle;
            const damage = (6 + (t.dmgLevel || 1) * 4) * dmgMult;

            // Fire 5 spreads - cone narrows with accuracy
            const spreadStep = 0.12 * Math.max(0.3, 1 - accuracy * 0.7);
            for (let i = -2; i <= 2; i++) {
              const spreadAng = angle + i * spreadStep;
              this.projectiles.push({
                pos: { ...t.pos },
                vel: { x: Math.cos(spreadAng) * pelSpeed, y: Math.sin(spreadAng) * pelSpeed },
                radius: 4,
                damage,
                ownerId: 'player',
                color: '#f43f5e',
                piercing: pierce,
                weaponType: 'turret_shotgun'
              });
            }

            gameAudio.playHitSound(false, 'kinetic');
          }
        }
      } else if (t.type === 'turret_fire') {
        const fireCooldown = 140 * cooldownMult;
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, 400, accuracy);
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 250) {
            t.lastShot = now;
            // Spawn flame particles and direct small short projectiles - cone narrows with accuracy
            const offset = (Math.random() - 0.5) * (0.35 * Math.max(0.25, 1 - accuracy * 0.75));
            const flameAngle = t.angle + offset;
            const fireSpeed = 350 + Math.random() * 150;
            const dVal = (3 + (t.dmgLevel || 1) * 2) * dmgMult;

            this.projectiles.push({
              pos: { ...t.pos },
              vel: { x: Math.cos(flameAngle) * fireSpeed, y: Math.sin(flameAngle) * fireSpeed },
              radius: 7 + Math.random() * 4,
              damage: dVal,
              ownerId: 'player',
              color: '#f97316',
              isFire: true,
              piercing: 2,
              weaponType: 'turret_fire'
            } as any);

            // Red orange sparkles
            if (Math.random() < 0.4) {
              this.particles.push({
                type: 'FIRE',
                pos: { ...t.pos },
                vel: { x: Math.cos(flameAngle) * fireSpeed * 0.8, y: Math.sin(flameAngle) * fireSpeed * 0.8 },
                life: 0.4,
                color: '#ef4444'
              });
            }
          }
        }
      } else if (t.type === 'turret_shield') {
        const fireCooldown = 1500 * cooldownMult;
        if (now - t.lastShot > fireCooldown) {
          const pulseRadius = 150 + (t.dmgLevel || 1) * 10;
          let hitAny = false;

          this.enemies.forEach(e => {
            if (e.isDead) return;
            const dist = Math.hypot(e.pos.x - t.pos.x, e.pos.y - t.pos.y);
            if (dist < pulseRadius) {
              hitAny = true;
              const damage = (15 + (t.dmgLevel || 1) * 10) * dmgMult;
              this.damageEnemy(e, damage, true, 'turret_shield', undefined, t.pos);

              // Repelling force away (cannot push/stop bosses!)
              if (!e.isBoss) {
                const pushAng = Math.atan2(e.pos.y - t.pos.y, e.pos.x - t.pos.x);
                e.vel.x += Math.cos(pushAng) * 450;
                e.vel.y += Math.sin(pushAng) * 450;
              }
            }
          });

          if (hitAny) {
            t.lastShot = now;
            // Spawn ring sparks
            for (let d = 0; d < 360; d += 20) {
              const rad = d * Math.PI / 180;
              this.particles.push({
                type: 'SPARK',
                pos: { x: t.pos.x + Math.cos(rad) * 20, y: t.pos.y + Math.sin(rad) * 20 },
                vel: { x: Math.cos(rad) * 250, y: Math.sin(rad) * 250 },
                life: 0.4,
                color: '#06b6d4'
              });
            }
            gameAudio.playHitSound(false, 'laser');
          }
        }
      } else if (t.type === 'turret_bomb') {
        const fireCooldown = 1850 * cooldownMult;
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, 400, accuracy);
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 450) {
            t.lastShot = now;
            const spreadCone = Math.max(0, (1 - accuracy) * 0.1);
            const angle = t.angle + (Math.random() - 0.5) * spreadCone;
            const damage = (20 + (t.dmgLevel || 1) * 18) * dmgMult;

            // Launcher bomb shell projectile
            this.projectiles.push({
              pos: { ...t.pos },
              vel: { x: Math.cos(angle) * 400, y: Math.sin(angle) * 400 },
              radius: 9,
              damage,
              ownerId: 'player',
              color: '#f59e0b',
              isSentryBomb: true as any,
              weaponType: 'turret_bomb'
            } as any);

            gameAudio.playHitSound(false, 'kinetic');
          }
        }
      } else if (t.type === 'turret_plasma') {
        const fireCooldown = 450 * cooldownMult;
        const nearest = this.getNearestEnemyTo(t.pos);
        if (nearest) {
          const accuracy = this.player.stats.accuracy || 0.15;
          const predPos = this.getPredictiveTargetPos(t.pos, nearest, 720, accuracy);
          t.angle = Math.atan2(predPos.y - t.pos.y, predPos.x - t.pos.x);

          if (now - t.lastShot > fireCooldown && Math.hypot(nearest.pos.x - t.pos.x, nearest.pos.y - t.pos.y) < 320) {
            t.lastShot = now;
            const angle = t.angle;
            const damage = (5 + (t.dmgLevel || 1) * 4) * dmgMult;

            this.projectiles.push({
              pos: { ...t.pos },
              vel: { x: Math.cos(angle) * 720, y: Math.sin(angle) * 720 },
              radius: 7,
              damage,
              ownerId: 'player',
              color: '#ec4899',
              piercing: 99,
              weaponType: 'turret_plasma'
            });

            gameAudio.playHitSound(false, 'laser');
          }
        }
      }
    });
  }

  updateWeapons(player: PlayerBall, dt: number) {
    const originalMeleeSpeed = player.stats.meleeSpeed || 1.0;
    const originalWeaponSize = player.stats.weaponSize || 1.0;

    try {
      const overdrive = this.player.abilities.find(a => (a.type === AbilityType.OVERDRIVE || a.type === AbilityType.APEX_OVERDRIVE) && a.isActive);
      const abilityMult = overdrive ? (overdrive.type === AbilityType.APEX_OVERDRIVE ? 0.25 : 0.4) : 1.0;

      player.weapons.forEach(w => {
      const now = Date.now();

      if (w.type === WeaponType.SPINNING_BLADE || w.type === WeaponType.VORTEX_SCYTHE || w.type === WeaponType.CHRONO_REAPER) {
        const isUlt = w.type === WeaponType.CHRONO_REAPER;
        const isEvo = w.type === WeaponType.VORTEX_SCYTHE;
        const rotationSpeed = (isUlt ? 16 + (w.level * 1.5) : (isEvo ? 10 + (w.level * 0.8) : 6 + (w.level * 0.5))) * (overdrive ? 1.8 : 1.0) * (player.stats.meleeSpeed || 1.0);
        w.angle = (w.angle || 0) + rotationSpeed * dt;
        const radius = (w.length || (isUlt ? 150 : (isEvo ? 115 : 80))) * (player.stats.weaponSize || 1.0);
        const bladeTip = {
          x: player.pos.x + Math.cos(w.angle) * radius,
          y: player.pos.y + Math.sin(w.angle) * radius
        };

        // 1. VORTEX SCYTHE (T2): Spawns Gravitational Vacuum Vortices along cutting arc
        if (isEvo) {
            this.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.pos.x - bladeTip.x, enemy.pos.y - bladeTip.y);
                if (dist < 220) {
                    const pullAngle = Math.atan2(bladeTip.y - enemy.pos.y, bladeTip.x - enemy.pos.x);
                    const pullForce = (220 - dist) * 7;
                    enemy.vel.x += Math.cos(pullAngle) * pullForce * dt;
                    enemy.vel.y += Math.sin(pullAngle) * pullForce * dt;
                }
            });
            if (Math.random() < 0.35) {
                this.particles.push({
                    type: 'NOVA',
                    pos: { ...bladeTip },
                    radius: 0,
                    maxRadius: 35,
                    life: 0.2,
                    color: '#c084fc'
                });
            }
        }

        // 2. CHRONO REAPER (T3): Time Dilation Stasis Zone & Temporal Shatter Pulse
        if (isUlt) {
            // Chronos Time-Dilation Zone (260px radius) - Freeze enemies by 85%
            this.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.pos.x - player.pos.x, enemy.pos.y - player.pos.y);
                if (dist < 260) {
                    enemy.vel.x *= 0.15;
                    enemy.vel.y *= 0.15;
                }
            });
            // Slow enemy projectiles inside Chrono Zone
            this.projectiles.forEach(p => {
                if (p.ownerId !== 'player') {
                    const dist = Math.hypot(p.pos.x - player.pos.x, p.pos.y - player.pos.y);
                    if (dist < 260) {
                        p.vel.x *= 0.2;
                        p.vel.y *= 0.2;
                    }
                }
            });

            // Temporal Shatter Pulse every 2 seconds
            if (!w.lastUsed || now - w.lastUsed > 2000) {
                w.lastUsed = now;
                this.enemies.forEach(enemy => {
                    if ((enemy as any).stasisStacks && (enemy as any).stasisStacks > 0) {
                        const shatterDmg = w.damage * 5 * (enemy as any).stasisStacks;
                        this.damageEnemy(enemy, shatterDmg, true, 'CHRONO_REAPER');
                        (enemy as any).stasisStacks = 0;
                        this.particles.push({
                            type: 'NOVA',
                            pos: { ...enemy.pos },
                            radius: 0,
                            maxRadius: 100,
                            life: 0.4,
                            color: '#ef4444'
                        });
                    }
                });
                if (this.onShake) this.onShake(25);
            }
        }

        // Blade cutting collision
        this.enemies.forEach(enemy => {
          const dist = this.distToSegment(enemy.pos, player.pos, bladeTip);
          const hitboxThickness = (isUlt ? 35 : (isEvo ? 26 : 20)) * (player.stats.weaponSize || 1.0);
          if (dist < enemy.radius + hitboxThickness) {
            this.damageEnemy(enemy, w.damage * dt * (isUlt ? 22 : (isEvo ? 16 : 12)), true, w.type);
            if (isUlt) {
                (enemy as any).stasisStacks = Math.min(((enemy as any).stasisStacks || 0) + 1, 10);
            }
          }
        });
      }

      if (w.type === WeaponType.AUTO_TURRET || w.type === WeaponType.RAIL_GUN || w.type === WeaponType.OMEGA_BEAM) {
          // Continuously update orbit angle
          const orbitSpeed = 1.2 * (overdrive ? 1.5 : 1.0);
          w.angle = (w.angle || 0) + orbitSpeed * dt;

          const isUlt = w.type === WeaponType.OMEGA_BEAM;
          const orbitRadius = 38 + (w.level * 1.5);
          const companionPos = {
              x: player.pos.x + Math.cos(w.angle) * orbitRadius,
              y: player.pos.y + Math.sin(w.angle) * orbitRadius
          };

          if (isUlt) {
              // Constant map-clearing beam starting from the companion drone position!
              this.enemies.forEach(e => {
                  const dist = Math.hypot(e.pos.x - companionPos.x, e.pos.y - companionPos.y);
                  if (dist < 420) {
                      this.damageEnemy(e, w.damage * dt * 12, false, w.type);
                      e.armorShred = Math.max(e.armorShred || 0, 3.0);
                      // Pull towards companion
                      const ang = Math.atan2(companionPos.y - e.pos.y, companionPos.x - e.pos.x);
                      e.vel.x += Math.cos(ang) * 500 * dt;
                      e.vel.y += Math.sin(ang) * 500 * dt;
                  }
              });

              // Omega Beam periodic kinetic strike target lock
              if (!w.lastUsed || now - w.lastUsed > (w.cooldown || 2000) * player.stats.cooldownMult * abilityMult) {
                  let chiefEnemy: EnemyBall | null = null;
                  let maxHpFound = -1;
                  for (const enemy of this.enemies) {
                      if (enemy.maxHp > maxHpFound) {
                          maxHpFound = enemy.maxHp;
                          chiefEnemy = enemy;
                      }
                  }
                  if (chiefEnemy) {
                      this.explodeBomb({
                          pos: { ...chiefEnemy.pos },
                          radius: 140,
                          damage: w.damage * 4,
                          color: '#38bdf8'
                      });
                      this.particles.push({
                          type: 'NOVA',
                          pos: { ...chiefEnemy.pos },
                          radius: 0,
                          maxRadius: 150,
                          life: 0.4,
                          color: '#0ea5e9'
                      });
                  }
                  w.lastUsed = now;
              }
          } else if (now - w.lastUsed > w.cooldown * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              if (target) {
                  const accuracy = player.stats.accuracy || 0.15;
                  if (w.type === WeaponType.RAIL_GUN) {
                      // Piercing Beam starting from companionPos with predictive lead!
                      const predPos = this.getPredictiveTargetPos(companionPos, target, 2500, accuracy);
                      const angle = Math.atan2(predPos.y - companionPos.y, predPos.x - companionPos.x);
                      this.applyRecoil(angle, 25); // Recoil applied to player
                      const beamEnd = {
                          x: companionPos.x + Math.cos(angle) * 1000,
                          y: companionPos.y + Math.sin(angle) * 1000
                      };
                      this.enemies.forEach(e => {
                          const d = this.distToSegment(e.pos, companionPos, beamEnd);
                          if (d < e.radius + 15) {
                              this.damageEnemy(e, w.damage, false, w.type);
                              e.armorShred = Math.max(e.armorShred || 0, 4.0);
                          }
                      });
                      this.particles.push({
                          type: 'RAIL',
                          p1: { ...companionPos },
                          p2: beamEnd,
                          life: 0.3,
                          color: '#38bdf8'
                      });
                  } else {
                      // Normal bullet projectile from companionPos with predictive lead and accuracy spread
                      gameAudio.playShootSound();
                      const bulletSpeed = 1100;
                      const predPos = this.getPredictiveTargetPos(companionPos, target, bulletSpeed, accuracy);
                      const baseAngle = Math.atan2(predPos.y - companionPos.y, predPos.x - companionPos.x);
                      const spreadCone = Math.max(0, (1 - accuracy) * 0.1);
                      const angle = baseAngle + (Math.random() - 0.5) * spreadCone;
                      let finalDamage = w.damage;
                      let isCrit = false;
                      if (Math.random() < player.stats.critChance) {
                          finalDamage *= 2;
                          isCrit = true;
                      }
                      this.projectiles.push({
                          pos: { ...companionPos },
                          vel: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
                          radius: isCrit ? 7 : 5,
                          damage: finalDamage,
                          ownerId: 'player',
                          color: isCrit ? '#fca5a5' : '#38bdf8',
                          homing: false,
                          piercing: player.stats.pierce || 0,
                          weaponType: w.type
                      });
                  }
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.FIRE_TRAIL || w.type === WeaponType.VOLCANIC_PLUME || w.type === WeaponType.COSMIC_FLAME) {
        const isUlt = w.type === WeaponType.COSMIC_FLAME;
        const interval = (isUlt ? 20 : (w.type === WeaponType.VOLCANIC_PLUME ? 55 : 50)) * abilityMult;
        if (!w.lastUsed || now - w.lastUsed > interval) {
          this.particles.push({
            type: 'FIRE',
            pos: { ...player.pos },
            radius: (isUlt ? 28 : (w.type === WeaponType.VOLCANIC_PLUME ? 15 : 12)) + (w.level * (w.type === WeaponType.VOLCANIC_PLUME ? 1.2 : 2)),
            life: (isUlt ? 5 : (w.type === WeaponType.VOLCANIC_PLUME ? 2.5 : 2)) + (w.level * (w.type === WeaponType.VOLCANIC_PLUME ? 0.3 : 0.5)),
            damage: w.damage * (isUlt ? 2.5 : (w.type === WeaponType.VOLCANIC_PLUME ? 0.8 : 1)),
            isEvolved: w.type === WeaponType.VOLCANIC_PLUME || isUlt
          });
          w.lastUsed = now;
        }

        // Mechanical trigger: Cosmic Flame Solar Flare detonation
        if (isUlt) {
          if (!(w as any).lastDetonation || now - (w as any).lastDetonation > 2200 * player.stats.cooldownMult * abilityMult) {
            let totalDetonated = 0;
            this.enemies.forEach(e => {
              if (e.isOnFire) {
                this.damageEnemy(e, w.damage * 6, false, w.type);
                this.particles.push({
                  type: 'NOVA',
                  pos: { ...e.pos },
                  radius: 0,
                  maxRadius: 90,
                  life: 0.3,
                  color: '#f97316'
                });
                totalDetonated++;
              }
            });
            if (totalDetonated > 0) {
              gameAudio.playHitSound(true, 'fire');
            }
            (w as any).lastDetonation = now;
          }
        }
      }

      if (w.type === WeaponType.ORBITAL_SHIELD || w.type === WeaponType.SENTINEL_DRONES || w.type === WeaponType.CELESTIAL_GUARD) {
        const isEvo = w.type === WeaponType.SENTINEL_DRONES;
        const isUlt = w.type === WeaponType.CELESTIAL_GUARD;
        const rotationSpeed = (isUlt ? 6 : isEvo ? 4.5 + (w.level * 0.3) : 3 + (w.level * 0.2)) * (overdrive ? 1.5 : 1.0);
        w.angle = (w.angle || 0) + rotationSpeed * dt;
        const shieldCount = (isUlt ? 6 : isEvo ? 3 : 1) + Math.floor(w.level / 4);
        const radius = (isUlt ? 90 : isEvo ? 60 : 45) + (w.level * 2);
        const shieldPositions: Vector[] = [];

        for (let i = 0; i < shieldCount; i++) {
          const angleOffset = (Math.PI * 2 / shieldCount) * i;
          const shieldPos = {
            x: player.pos.x + Math.cos(w.angle + angleOffset) * radius,
            y: player.pos.y + Math.sin(w.angle + angleOffset) * radius
          };
          shieldPositions.push(shieldPos);
          
          this.projectiles = this.projectiles.filter(p => {
             if (p.ownerId === 'player') return true;
             const dist = Math.hypot(p.pos.x - shieldPos.x, p.pos.y - shieldPos.y);
             const blockRadius = isUlt ? 40 : 18;
             if (dist <= blockRadius) {
                 gameAudio.playShieldReflectSound();
                 
                 p.ownerId = 'player';
                 p.vel.x = -p.vel.x * (isUlt ? 1.5 : 1.2);
                 p.vel.y = -p.vel.y * (isUlt ? 1.5 : 1.2);
                 p.damage = Math.max(p.damage || 15, w.damage * (isUlt ? 2.5 : 1.5));
                 p.pos.x += p.vel.x * dt;
                 p.pos.y += p.vel.y * dt;
                 
                 for (let k = 0; k < 5; k++) {
                     this.particles.push({
                         type: 'SPARK',
                         pos: { ...p.pos },
                         vel: {
                             x: p.vel.x * 0.4 + (Math.random() - 0.5) * 120,
                             y: p.vel.y * 0.4 + (Math.random() - 0.5) * 120
                         },
                         life: 0.35,
                         color: isUlt ? '#a855f7' : isEvo ? '#34d399' : '#38bdf8'
                     });
                 }
                 return true;
             }
             return true;
          });

          this.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.pos.x - shieldPos.x, enemy.pos.y - shieldPos.y);
            if (dist < enemy.radius + (isUlt ? 25 : 15)) {
              const dmgMult = isUlt ? 8 : (isEvo ? 2.5 : 1.0);
              const dmg = w.damage * dt * dmgMult;
              this.damageEnemy(enemy, dmg, false, w.type, undefined, shieldPos);
              if (isEvo || isUlt) {
                  const knockbackAngle = Math.atan2(enemy.pos.y - shieldPos.y, enemy.pos.x - shieldPos.x);
                  const knockForce = isUlt ? 1200 : 500;
                  enemy.vel.x += Math.cos(knockbackAngle) * knockForce * dt;
                  enemy.vel.y += Math.sin(knockbackAngle) * knockForce * dt;
              }
            }
          });
        }

        // Connect electric laser tethers between drones for Sentinel Drones and Celestial Guard
        if ((isEvo || isUlt) && shieldPositions.length > 1) {
          for (let i = 0; i < shieldPositions.length; i++) {
            const p1 = shieldPositions[i];
            const p2 = shieldPositions[(i + 1) % shieldPositions.length];
            this.enemies.forEach(e => {
              const d = this.distToSegment(e.pos, p1, p2);
              if (d < e.radius + 12) {
                this.damageEnemy(e, w.damage * dt * (isUlt ? 6 : 3), false, w.type, undefined, e.pos);
                const ang = Math.atan2(e.pos.y - player.pos.y, e.pos.x - player.pos.x);
                e.vel.x += Math.cos(ang) * 450 * dt;
                e.vel.y += Math.sin(ang) * 450 * dt;
              }
            });
            if (Math.random() < 0.25) {
              this.particles.push({
                type: 'ARC',
                p1: { ...p1 },
                p2: { ...p2 },
                life: 0.15,
                color: isUlt ? '#c084fc' : '#34d399'
              });
            }
          }
        }
      }

      if (w.type === WeaponType.MAGIC_BURST || w.type === WeaponType.SINGULARITY || w.type === WeaponType.VOID_EATER) {
        if (now - w.lastUsed > w.cooldown * player.stats.cooldownMult * abilityMult) {
          const isUlt = w.type === WeaponType.VOID_EATER;
          const radius = isUlt ? 500 : (w.type === WeaponType.SINGULARITY ? 350 : 200);
          this.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.pos.x - player.pos.x, enemy.pos.y - player.pos.y);
            if (dist < radius) {
              this.damageEnemy(enemy, w.damage * (isUlt ? 3 : 1), false, w.type);
              if (w.type === WeaponType.SINGULARITY || isUlt) {
                  const angle = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
                  const pullForce = isUlt ? 3000 : 1500;
                  enemy.vel.x = Math.cos(angle) * pullForce;
                  enemy.vel.y = Math.sin(angle) * pullForce;
              }
            }
          });
          w.lastUsed = now;
          if (this.onShake) this.onShake(isUlt ? 60 : (w.type === WeaponType.SINGULARITY ? 40 : 15));
          
          this.particles.push({
              type: 'NOVA',
              pos: { ...player.pos },
              radius: 0,
              maxRadius: radius,
              life: isUlt ? 1.0 : 0.5,
              color: isUlt ? '#000' : (w.type === WeaponType.SINGULARITY ? '#a855f7' : '#38bdf8')
          });
        }
      }

      if (w.type === WeaponType.CHAIN_ARC_SWORD || w.type === WeaponType.ARC_WHIP || w.type === WeaponType.THUNDER_GOD) {
        const isUlt = w.type === WeaponType.THUNDER_GOD;
        const rotationSpeed = (isUlt ? 9 : (w.type === WeaponType.ARC_WHIP ? 6 + (w.level * 0.6) : 4 + (w.level * 0.4))) * (overdrive ? 1.4 : 1.0);
        w.angle = (w.angle || 0) - rotationSpeed * dt; 
        const radius = (w.length || (isUlt ? 155 : (w.type === WeaponType.ARC_WHIP ? 120 : 85))) * (player.stats.weaponSize || 1.0);
        const swordTip = {
          x: player.pos.x + Math.cos(w.angle) * radius,
          y: player.pos.y + Math.sin(w.angle) * radius
        };
        
        this.enemies.forEach(enemy => {
          const dist = this.distToSegment(enemy.pos, player.pos, swordTip);
          if (dist < enemy.radius + 14) { 
            const dmgBase = (isUlt ? w.damage * 3.0 : (w.type === WeaponType.ARC_WHIP ? w.damage * 1.2 : w.damage * 0.8)) * dt * 5.5;
            this.damageEnemy(enemy, dmgBase, true, w.type);

            if (w.type === WeaponType.ARC_WHIP || isUlt) {
                enemy.stunTimer = Math.max(enemy.stunTimer || 0, isUlt ? 2.0 : 1.0);
            }

            if (isUlt && Math.random() < 0.15) {
                this.explodeBomb({
                    pos: { ...enemy.pos },
                    radius: 90,
                    damage: w.damage * 2.5,
                    color: '#c084fc'
                });
            }

            // Chain arc logic - Nerfed interval and chain damage
            const interval = (isUlt ? 60 : (w.type === WeaponType.ARC_WHIP ? 100 : 200)) * abilityMult;
            if (!w.lastUsed || now - w.lastUsed > interval) {
                const chainCount = isUlt ? 8 : (w.type === WeaponType.ARC_WHIP ? 3 + Math.floor(w.level/6) : 1 + Math.floor(w.level / 6));
                const nearby = this.enemies
                    .filter(e => e.id !== enemy.id)
                    .map(e => ({ e, d: Math.hypot(e.pos.x - enemy.pos.x, e.pos.y - enemy.pos.y) }))
                    .filter(obj => obj.d < (isUlt ? 400 : 180 + (w.level * 15)))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, chainCount);

                nearby.forEach(obj => {
                    this.damageEnemy(obj.e, w.damage * (isUlt ? 0.8 : (w.type === WeaponType.ARC_WHIP ? 0.4 : 0.2)), false, w.type);
                    if (w.type === WeaponType.ARC_WHIP || isUlt) {
                        obj.e.stunTimer = Math.max(obj.e.stunTimer || 0, isUlt ? 1.5 : 0.8);
                    }
                    this.particles.push({
                        type: 'ARC',
                        p1: { ...enemy.pos },
                        p2: { ...obj.e.pos },
                        life: isUlt ? 0.4 : 0.2,
                        color: (isUlt || w.type === WeaponType.ARC_WHIP) ? '#fff' : '#fbbf24'
                    });
                });
                w.lastUsed = now;
            }
          }
        });
      }

      if (w.type === WeaponType.SHOTGUN || w.type === WeaponType.FLAK_CANNON || w.type === WeaponType.OBLITERATOR_CANNON) {
          const isUlt = w.type === WeaponType.OBLITERATOR_CANNON;
          const isEvo = w.type === WeaponType.FLAK_CANNON;
          const rotationSpeed = (isUlt ? 3.5 : (isEvo ? 2.5 : 1.5)) * (overdrive ? 1.5 : 1.0);
          const accuracy = player.stats.accuracy || 0.15;
          const projSpeed = isUlt ? 1350 : 1100;
          
          const nearest = this.getNearestEnemy();
          if (nearest) {
              const predPos = this.getPredictiveTargetPos(player.pos, nearest, projSpeed, accuracy);
              const targetAngle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
              w.angle = targetAngle;
          } else {
              w.angle = (w.angle || 0) + rotationSpeed * dt;
          }

          // Dynamic firing cadence for shotgun (close engagement weapon):
          // Red range (<= 140 units): Rapid point-blank blasts in 0.5s
          // Yellow range (<= 280 units): Medium spread blasts in 1.8s
          // Outside close range (> 280 units): Slower cycling
          let effectiveCd = 2200;
          if (nearest) {
              const dx = nearest.pos.x - player.pos.x;
              const dy = nearest.pos.y - player.pos.y;
              const distSq = dx * dx + dy * dy;
              if (distSq <= 19600) { // 140^2 (Red range)
                  effectiveCd = 500;
              } else if (distSq <= 78400) { // 280^2 (Yellow range)
                  effectiveCd = 1800;
              } else {
                  effectiveCd = 2200;
              }
          }

          if (nearest && (now - w.lastUsed > effectiveCd * player.stats.cooldownMult * abilityMult)) {
              const predPos = this.getPredictiveTargetPos(player.pos, nearest, projSpeed, accuracy);
              const angle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
              this.applyRecoil(angle, isUlt ? 35 : 20);
              if (isUlt) this.onShake(18);
              
              const count = isUlt ? 14 : (isEvo ? 8 : 5);
              // Accuracy stat narrows the shotgun spread cone
              const spread = (isUlt ? 0.38 : 0.5) * Math.max(0.25, 1 - accuracy * 0.75);

              for(let i=0; i<count; i++) {
                  const finalAngle = angle + (Math.random() - 0.5) * spread;
                  this.projectiles.push({
                      pos: { ...player.pos },
                      vel: { x: Math.cos(finalAngle) * projSpeed * (overdrive ? 1.3 : 1.0), y: Math.sin(finalAngle) * projSpeed * (overdrive ? 1.3 : 1.0) },
                      radius: isUlt ? 7 : (isEvo ? 5 : 3),
                      damage: w.damage,
                      ownerId: 'player',
                      color: isUlt ? '#ef4444' : (isEvo ? '#facc15' : '#fff'),
                      bounces: 0,
                      piercing: isUlt ? 2 : (isEvo ? 1 : 0),
                      weaponType: w.type
                  });
              }
              w.lastUsed = now;
          }
      }

      if (w.type === WeaponType.MAGIC_BLASTER || w.type === WeaponType.SPELL_WEAVER) {
          w.angle = (w.angle || 0) + 3 * dt;
          if (now - w.lastUsed > w.cooldown * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              if (target) {
                  const accuracy = player.stats.accuracy || 0.15;
                  const predPos = this.getPredictiveTargetPos(player.pos, target, 1000, accuracy);
                  this.shootProjectileFromPlayer(predPos, w.damage, '#fda4af', 1000, true, target.id, w.type);
                  if (w.type === WeaponType.SPELL_WEAVER) {
                      // Tri-elemental weaving (Frost, Fire, Arcane) with predictive intercept
                      const randomTarget = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                      if (randomTarget) {
                          const pred1 = this.getPredictiveTargetPos(player.pos, randomTarget, overdrive ? 1200 : 1050, accuracy);
                          this.shootProjectileFromPlayer(pred1, w.damage * 1.2, '#38bdf8', overdrive ? 1200 : 1050, true, randomTarget.id, w.type);
                          randomTarget.isFrozen = true;
                          randomTarget.freezeTimer = 1.5;
                      }
                      const randomTarget2 = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                      if (randomTarget2) {
                          const pred2 = this.getPredictiveTargetPos(player.pos, randomTarget2, overdrive ? 1200 : 1050, accuracy);
                          this.shootProjectileFromPlayer(pred2, w.damage * 1.2, '#f97316', overdrive ? 1200 : 1050, true, randomTarget2.id, w.type);
                          randomTarget2.isOnFire = true;
                          randomTarget2.fireTimer = 3.0;
                      }
                  }
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.BOMB_LAUNCHER || w.type === WeaponType.RECURSIVE_BOMB || w.type === WeaponType.SUPERNOVA_BOMB) {
          if (now - w.lastUsed > w.cooldown * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              if (target) {
                  const accuracy = player.stats.accuracy || 0.15;
                  const isUlt = w.type === WeaponType.SUPERNOVA_BOMB;
                  const isEvo = w.type === WeaponType.RECURSIVE_BOMB;
                  const bombSpeed = isUlt ? 650 : (isEvo ? 450 : 350);
                  const predPos = this.getPredictiveTargetPos(player.pos, target, bombSpeed, accuracy);
                  const angle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
                  this.applyRecoil(angle, 25); // Heavy Bomb launching recoil pushback!
                  this.addBomb({
                      pos: { ...player.pos },
                      vel: { x: Math.cos(angle) * (isUlt ? 650 : (isEvo ? 450 : 350)), y: Math.sin(angle) * (isUlt ? 650 : (isEvo ? 450 : 350)) },
                      timer: isUlt ? 3.0 : (isEvo ? 2.0 : 1.5),
                      radius: isUlt ? 450 : (isEvo ? 160 : 120 + (w.level * 10)),
                      damage: isUlt ? w.damage * 10 : (isEvo ? w.damage * 6 : w.damage * 5),
                      color: isUlt ? '#ef4444' : (isEvo ? '#f87171' : '#fca5a5'),
                      isRecursive: isEvo || isUlt,
                      isUlt: isUlt,
                      isSupernovaCore: isUlt,
                      armTimer: 0
                  });
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.CLONE_PROJECTION || w.type === WeaponType.HOLOGRAPHIC_ARMY || w.type === WeaponType.MIRAGE_LEGION) {
          if (now - w.lastUsed > w.cooldown * player.stats.cooldownMult * abilityMult) {
              const maxClones = w.type === WeaponType.MIRAGE_LEGION ? 6 : (w.type === WeaponType.HOLOGRAPHIC_ARMY ? 3 : 1);
              if (this.clones.length < maxClones) {
                  this.spawnClone(player.pos, w.level, w.damage);
                  w.lastUsed = now;
              }
          }
      }

      // Clones archetype attack logic
      this.clones.forEach(clone => {
          if (!clone.lastShot) clone.lastShot = 0;
          const accuracy = player.stats.accuracy || 0.15;

          if (clone.archetype === 'SHOTGUN') {
              if (now - clone.lastShot > 700) {
                  const t = this.getNearestEnemyTo(clone.pos);
                  if (t) {
                      const predPos = this.getPredictiveTargetPos(clone.pos, t, 1050, accuracy);
                      const baseAngle = Math.atan2(predPos.y - clone.pos.y, predPos.x - clone.pos.x);
                      const spreadStep = 0.12 * Math.max(0.3, 1 - accuracy * 0.7);
                      for (let p = 0; p < 6; p++) {
                          const spread = (p - 2.5) * spreadStep;
                          const ang = baseAngle + spread;
                          this.projectiles.push({
                              pos: { ...clone.pos },
                              vel: { x: Math.cos(ang) * 1050, y: Math.sin(ang) * 1050 },
                              radius: 4,
                              damage: clone.damage * 0.7,
                              ownerId: 'player',
                              color: '#ef4444',
                              weaponType: 'MIRAGE_LEGION'
                          });
                      }
                      clone.lastShot = now;
                  }
              }
          } else if (clone.archetype === 'SNIPER') {
              if (now - clone.lastShot > 1100) {
                  const t = this.getNearestEnemyTo(clone.pos);
                  if (t) {
                      const predPos = this.getPredictiveTargetPos(clone.pos, t, 2400, accuracy);
                      const ang = Math.atan2(predPos.y - clone.pos.y, predPos.x - clone.pos.x);
                      this.projectiles.push({
                          pos: { ...clone.pos },
                          vel: { x: Math.cos(ang) * 2400, y: Math.sin(ang) * 2400 },
                          radius: 7,
                          damage: clone.damage * 3.5,
                          ownerId: 'player',
                          color: '#38bdf8',
                          piercing: 5,
                          weaponType: 'MIRAGE_LEGION'
                      });
                      this.particles.push({
                          type: 'ARC',
                          p1: { ...clone.pos },
                          p2: { x: clone.pos.x + Math.cos(ang) * 1200, y: clone.pos.y + Math.sin(ang) * 1200 },
                          life: 0.2,
                          color: '#38bdf8'
                      });
                      clone.lastShot = now;
                  }
              }
          } else if (clone.archetype === 'TACTICAL' || clone.archetype === 'DECOY') {
              if (now - clone.lastShot > 450) {
                  const t = this.getNearestEnemyTo(clone.pos);
                  if (t) {
                      const predPos = this.getPredictiveTargetPos(clone.pos, t, 400, accuracy);
                      this.shootProjectile(clone, predPos, clone.damage || 15, WeaponType.CLONE_PROJECTION);
                      clone.lastShot = now;
                  }
              }
          }
      });

      if (w.type === WeaponType.PLASMA_RAZOR || w.type === WeaponType.NEUTRINO_SHREDDER || w.type === WeaponType.GOD_SLAYER_WHEEL) {
          const isUlt = w.type === WeaponType.GOD_SLAYER_WHEEL;
          const isEvo = w.type === WeaponType.NEUTRINO_SHREDDER;
          const rotationSpeed = (isUlt ? 15 : (isEvo ? 10 : 7)) * (overdrive ? 1.5 : 1.0) * (player.stats.meleeSpeed || 1.0);
          w.angle = (w.angle || 0) + rotationSpeed * dt;
          
          let radius = (60 + (w.level * 3)) * (player.stats.weaponSize || 1.0);
          if (isUlt) radius = (100 + (w.level * 5)) * (player.stats.weaponSize || 1.0);
          
          const pos = {
              x: player.pos.x + Math.cos(w.angle) * radius,
              y: player.pos.y + Math.sin(w.angle) * radius
          };
          
          // God Slayer Wheel scaling with movement speed
          const movementSpeed = Math.hypot(player.vel.x, player.vel.y);
          const dmgBoost = isUlt ? Math.max(1.0, movementSpeed / 300) : 1.0;
          
          this.enemies.forEach(e => {
              const dist = Math.hypot(e.pos.x - pos.x, e.pos.y - pos.y);
              const customHitbox = (isUlt ? 60 : 45) * (player.stats.weaponSize || 1.0);
              if (dist < e.radius + customHitbox) { // Thicker hit radius
                  this.damageEnemy(e, w.damage * (isUlt ? 6 : (isEvo ? 2.5 : 1.2)) * dmgBoost * dt * 20, true, w.type, undefined, pos);
                  
                  if (isEvo || isUlt) {
                      // Vortex effect on collision
                      if (!w.lastUsed || now - w.lastUsed > 100) {
                          this.particles.push({
                              type: 'NOVA',
                              pos: { ...e.pos },
                              radius: 0,
                              maxRadius: isUlt ? 120 : 80,
                              life: 0.3,
                              color: isUlt ? '#ef4444' : '#38bdf8'
                          });
                          w.lastUsed = now;
                      }
                  }
              }
          });
      }
      
      if (w.type === WeaponType.ICE_SWORD || w.type === WeaponType.GLACIAL_GREATSWORD || w.type === WeaponType.ABSOLUTE_ZERO_SIPHON) {
          const isUlt = w.type === WeaponType.ABSOLUTE_ZERO_SIPHON;
          const isEvo = w.type === WeaponType.GLACIAL_GREATSWORD;
          
          const baseSpeed = isUlt ? 8.5 : (isEvo ? 7.2 : 6.0);
          const rotationSpeed = (baseSpeed + w.level * 0.5) * (player.stats.meleeSpeed || 1.0) * (overdrive ? 1.5 : 1.0);
          w.angle = (w.angle || 0) + rotationSpeed * dt;
          
          let baseRadius = isUlt ? 85 : (isEvo ? 75 : 65);
          let radius = (baseRadius + w.level * 4) * (player.stats.weaponSize || 1.0);
          const pos = {
              x: player.pos.x + Math.cos(w.angle) * radius,
              y: player.pos.y + Math.sin(w.angle) * radius
          };
          
          this.enemies.forEach(e => {
              const dist = Math.hypot(e.pos.x - pos.x, e.pos.y - pos.y);
               const customHitbox = (isUlt ? 65 : (isEvo ? 55 : 45)) * (player.stats.weaponSize || 1.0);
              if (dist < e.radius + customHitbox) {
                  const dmgMult = isUlt ? 1.6 : (isEvo ? 1.2 : 0.8);
                  this.damageEnemy(e, w.damage * dmgMult * dt * 20, true, w.type, undefined, pos);
                  
                  // Apply frozen/slowed
                  e.isSlowed = true;
                  e.slowTimer = Math.max(e.slowTimer || 0, isUlt ? 6.0 : (isEvo ? 5.0 : 4.0));
                  
                  if (Math.random() < (isUlt ? 0.45 : (isEvo ? 0.3 : 0.2))) {
                      this.particles.push({
                          type: 'SPARK',
                          pos: { ...e.pos },
                          vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
                          life: 0.4,
                          color: isUlt ? '#e0f2fe' : (isEvo ? '#a5f3fc' : '#7dd3fc')
                      });
                  }
                  
                  // Absolute Zero Siphon siphon-heals small health on kill (reduced during boss fights)
                  if (isUlt && e.hp <= 0 && !e.isDead) {
                      const hasActiveBoss = this.enemies.some(eb => eb.isBoss && !eb.isDead);
                      const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
                      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.005 * bossHealMult);
                  }
              }
          });

          // Ice Shards shooter logic (firing speed matches level)
          const baseCD = isUlt ? 1200 : (isEvo ? 1400 : 1600);
          const shotCooldown = Math.max(400, (baseCD - w.level * 25) * player.stats.cooldownMult * abilityMult);
          if (!(w as any).lastShotTime || now - (w as any).lastShotTime > shotCooldown) {
              const target = this.getNearestEnemyTo(player.pos);
              if (target) {
                  const accuracy = player.stats.accuracy || 0.15;
                  const shardSpeed = isUlt ? 1000 : (isEvo ? 880 : 780);
                  const predPos = this.getPredictiveTargetPos(player.pos, target, shardSpeed, accuracy);
                  const targetAngle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
                  const count = (isUlt ? 3 : (isEvo ? 2 : 1)) + Math.floor(w.level / 5);
                  const spreadStep = (isUlt ? 0.35 : 0.2) * Math.max(0.3, 1 - accuracy * 0.7);
                  for (let i = 0; i < count; i++) {
                      const spread = (i - (count - 1) / 2) * spreadStep;
                      const finalAngle = targetAngle + spread;
                      this.projectiles.push({
                          pos: { ...player.pos },
                          vel: { x: Math.cos(finalAngle) * shardSpeed, y: Math.sin(finalAngle) * shardSpeed },
                          radius: isUlt ? 7 : (isEvo ? 6 : 5),
                          damage: w.damage * (isUlt ? 1.3 : (isEvo ? 1.0 : 0.8)),
                          ownerId: 'player',
                          color: isUlt ? '#e0f2fe' : '#38bdf8',
                          isIce: true,
                          piercing: (player.stats.pierce || 0) + (isUlt ? 2 : (isEvo ? 1 : 0)),
                          weaponType: w.type
                      });
                  }
                  (w as any).lastShotTime = now;
              }
          }
      }

      if (w.type === WeaponType.FIRE_SWORD || w.type === WeaponType.SOLAR_ECLIPSE_BLADE || w.type === WeaponType.SUPERNOVA_SLAYER) {
          const isUlt = w.type === WeaponType.SUPERNOVA_SLAYER;
          const isEvo = w.type === WeaponType.SOLAR_ECLIPSE_BLADE;
          
          const baseSpeed = isUlt ? 7.5 : (isEvo ? 6.2 : 5.0);
          const rotationSpeed = (baseSpeed + w.level * 0.4) * (player.stats.meleeSpeed || 1.0) * (overdrive ? 1.5 : 1.0);
          w.angle = (w.angle || 0) + rotationSpeed * dt;
          
          let baseRadius = isUlt ? 80 : (isEvo ? 70 : 60);
          let radius = (baseRadius + w.level * 3) * (player.stats.weaponSize || 1.0);
          const pos = {
              x: player.pos.x + Math.cos(w.angle) * radius,
              y: player.pos.y + Math.sin(w.angle) * radius
          };
          
          this.enemies.forEach(e => {
              const dist = Math.hypot(e.pos.x - pos.x, e.pos.y - pos.y);
              const customHitbox = (isUlt ? 65 : (isEvo ? 55 : 45)) * (player.stats.weaponSize || 1.0);
              if (dist < e.radius + customHitbox) {
                  const dmgMult = isUlt ? 1.8 : (isEvo ? 1.2 : 0.7);
                  this.damageEnemy(e, w.damage * dmgMult * dt * 20, true, w.type, undefined, pos);
                  
                  // Apply burning status (slow but lasting)
                  e.isOnFire = true;
                  e.fireTimer = Math.max(e.fireTimer || 0, isUlt ? 10.0 : (isEvo ? 8.0 : 6.0));
                  
                  if (Math.random() < (isUlt ? 0.4 : (isEvo ? 0.3 : 0.2))) {
                      this.particles.push({
                          type: 'FIRE',
                          pos: { ...e.pos },
                          vel: { x: (Math.random() - 0.5) * 80, y: -Math.random() * 50 },
                          life: 0.4,
                          color: isUlt ? '#fef08a' : (isEvo ? '#f97316' : '#ef4444')
                      });
                  }
                  
                  // Supernova Slayer triggers thermonuclear explosion on hit
                  if (isUlt && Math.random() < 0.12 * (dt * 60)) {
                      this.explodeBomb({
                          pos: e.pos,
                          radius: 110,
                          damage: w.damage * 2.5,
                          color: '#fef08a'
                      });
                  }
              }
          });
      }

      if (w.type === WeaponType.TESLA_COIL || w.type === WeaponType.STATIC_STORM || w.type === WeaponType.EMP_HARVESTER) {
          if (now - w.lastUsed > (w.cooldown || 2000) * player.stats.cooldownMult * abilityMult) {
              const isUlt = w.type === WeaponType.EMP_HARVESTER;
              const isEvo = w.type === WeaponType.STATIC_STORM;
              const range = isUlt ? 350 : (isEvo ? 280 : 180);
              const target = this.enemies.find(e => Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y) < range);
              
              if (target) {
                  const chainCount = isUlt ? 8 : (isEvo ? 4 : 2);
                  let current: EnemyBall | null = target;
                  let lastPos = player.pos;
                  const hit = new Set<string>();
                  
                  for(let i=0; i<chainCount && current; i++) {
                      hit.add(current.id);
                      this.damageEnemy(current, (w.damage || 50) * (isUlt ? 2.0 : 1.0), false, w.type);
                      
                      this.particles.push({
                          type: 'ARC',
                          p1: { ...lastPos },
                          p2: { ...current.pos },
                          life: 0.2,
                          color: isUlt ? '#fff' : (isEvo ? '#38bdf8' : '#fbbf24')
                      });
                      
                      if (isEvo || isUlt) {
                          current.vel.x *= 0.5;
                          current.vel.y *= 0.5;
                      }

                      lastPos = current.pos;
                      const nextSource = lastPos;
                      current = this.enemies.find(e => !hit.has(e.id) && Math.hypot(e.pos.x - nextSource.x, e.pos.y - nextSource.y) < 150) || null;
                  }
                  
                  if (isUlt) {
                      const hasActiveBoss = this.enemies.some(eb => eb.isBoss && !eb.isDead);
                      const bossHealMult = hasActiveBoss ? 0.3 : 1.0;
                      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (1 * bossHealMult));
                  }
                  
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.GRAVITY_BEAM || w.type === WeaponType.EVENT_HORIZON || w.type === WeaponType.SINGULARITY_CORE) {
          const isUlt = w.type === WeaponType.SINGULARITY_CORE;
          const isEvo = w.type === WeaponType.EVENT_HORIZON;
          const range = isUlt ? 400 : (isEvo ? 300 : 200);
          
          this.enemies.forEach(e => {
              const d = Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y);
              if (d < range) {
                  const ang = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x);
                  const pull = isUlt ? 600 : 300;
                  e.vel.x += Math.cos(ang) * pull * dt;
                  e.vel.y += Math.sin(ang) * pull * dt;
                  
                  this.damageEnemy(e, (w.damage || 10) * dt * (isUlt ? 12 : (isEvo ? 6 : 3)), false, w.type);
                  e.vel.x *= (isUlt ? 0.95 : 0.98); // Slowness
                  e.vel.y *= (isUlt ? 0.95 : 0.98);
              }
          });
      }

      if (w.type === WeaponType.ION_CANNON || w.type === WeaponType.ORBITAL_STRIKE || w.type === WeaponType.DEATH_STAR_BEAM) {
          const isUlt = w.type === WeaponType.DEATH_STAR_BEAM;
          const isEvo = w.type === WeaponType.ORBITAL_STRIKE;
          
          // Orbital rotation for the "barrel" visual - Speed increased for visibility
          const rotationSpeed = (isUlt ? 8 : isEvo ? 6 : 4) * (overdrive ? 1.5 : 1.0);
          w.angle = (w.angle || 0) + rotationSpeed * dt;

          if (isUlt) {
              const angle = w.angle || 0;
              const sweepPos = {
                  x: player.pos.x + Math.cos(angle) * 600,
                  y: player.pos.y + Math.sin(angle) * 600
              };
              this.enemies.forEach(e => {
                  const dist = this.distToSegment(e.pos, player.pos, sweepPos);
                  if (dist < e.radius + 40) {
                      this.damageEnemy(e, w.damage * dt * 8, false, w.type);
                  }
              });
              if (Math.random() < 0.3) {
                this.particles.push({
                    type: 'SPARK',
                    pos: {
                        x: player.pos.x + Math.cos(angle) * (100 + Math.random() * 500),
                        y: player.pos.y + Math.sin(angle) * (100 + Math.random() * 500)
                    },
                    vel: { x: (Math.random()-0.5)*150, y: (Math.random()-0.5)*150 },
                    life: 0.35,
                    color: '#ef4444'
                });
              }
          } else if (now - w.lastUsed > (w.cooldown || 3000) * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              if (target) {
                  const beamRadius = isEvo ? 100 : 60;
                  const beamPos = { ...target.pos };
                  
                  // Visual line from top
                  this.particles.push({
                      type: 'ARC',
                      p1: { x: beamPos.x, y: 0 },
                      p2: beamPos,
                      life: 0.4,
                      color: '#06b6d4'
                  });

                  this.enemies.forEach(e => {
                      const dist = Math.hypot(e.pos.x - beamPos.x, e.pos.y - beamPos.y);
                      if (dist < beamRadius + e.radius) {
                          this.damageEnemy(e, w.damage, false, w.type);
                      }
                  });
                  this.particles.push({
                      type: 'NOVA',
                      pos: beamPos,
                      radius: 0,
                      maxRadius: beamRadius,
                      life: 0.5,
                      color: '#06b6d4'
                  });
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.MINE_LAYER || w.type === WeaponType.SENSOR_CLUSTER || w.type === WeaponType.VOID_MINES) {
          const isUlt = w.type === WeaponType.VOID_MINES;
          const isEvo = w.type === WeaponType.SENSOR_CLUSTER;
          
          // Orbital rotation for the "dispenser" visual - Speed increased for visibility
          const rotationSpeed = (isUlt ? 7 : isEvo ? 5 : 3.5) * (overdrive ? 1.5 : 1.0);
          w.angle = (w.angle || 0) - rotationSpeed * dt;

          if (now - w.lastUsed > (w.cooldown || 2500) * player.stats.cooldownMult * abilityMult) {
              
              this.addBomb({
                  pos: { ...player.pos },
                  vel: { x: -player.vel.x * 0.05, y: -player.vel.y * 0.05 },
                  timer: 10,
                  radius: isUlt ? 180 : (isEvo ? 120 : 80),
                  damage: w.damage,
                  color: isUlt ? '#000' : (isEvo ? '#a855f7' : '#71717a'),
                  isMine: true,
                  isUlt: isUlt,
                  isHoming: isEvo || isUlt
              });
              w.lastUsed = now;
          }
      }

      if (w.type === WeaponType.PHOTON_REPEATER || w.type === WeaponType.LANCE_ARRAY || w.type === WeaponType.HYPER_LIGHT_ARRAY) {
          if (now - w.lastUsed > (w.cooldown || 400) * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              if (target) {
                  const accuracy = player.stats.accuracy || 0.15;
                  const isUlt = w.type === WeaponType.HYPER_LIGHT_ARRAY;
                  const isEvo = w.type === WeaponType.LANCE_ARRAY;
                  const projSpeed = isUlt ? 2600 : 1700;
                  const predPos = this.getPredictiveTargetPos(player.pos, target, projSpeed, accuracy);
                  const baseAngle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
                  const spreadCone = Math.max(0, (1 - accuracy) * 0.08);
                  const angle = baseAngle + (Math.random() - 0.5) * spreadCone;
                  this.applyRecoil(angle, 4); // Greatly softened photonic recoil pulses!
                  
                  this.projectiles.push({
                      pos: { ...player.pos },
                      vel: { x: Math.cos(angle) * projSpeed, y: Math.sin(angle) * projSpeed },
                      radius: isUlt ? 8 : 4,
                      damage: w.damage,
                      ownerId: 'player',
                      color: isUlt ? '#fff' : '#fef08a',
                      piercing: isUlt ? 10 : (isEvo ? 3 : 0),
                      weaponType: w.type
                  });
                  w.lastUsed = now;
              }
          }
      }

      if (w.type === WeaponType.RICOCHET_CANNON || w.type === WeaponType.REFRACTION_LANCE || w.type === WeaponType.ECHO_STRIKE) {
          if (now - w.lastUsed > (w.cooldown || 1000) * player.stats.cooldownMult * abilityMult) {
              const target = this.getNearestEnemy();
              const isUlt = w.type === WeaponType.ECHO_STRIKE;
              const isEvo = w.type === WeaponType.REFRACTION_LANCE;
              const accuracy = player.stats.accuracy || 0.15;
              const projSpeed = isUlt ? 1300 : 1100;
              let angle = Math.random() * Math.PI * 2;
              if (target) {
                  const predPos = this.getPredictiveTargetPos(player.pos, target, projSpeed, accuracy);
                  const baseAngle = Math.atan2(predPos.y - player.pos.y, predPos.x - player.pos.x);
                  const spreadCone = Math.max(0, (1 - accuracy) * 0.1);
                  angle = baseAngle + (Math.random() - 0.5) * spreadCone;
              }
              this.applyRecoil(angle, 5); // Greatly softened recoil from ricochet cannon!
              
              this.projectiles.push({
                  pos: { ...player.pos },
                  vel: { x: Math.cos(angle) * projSpeed, y: Math.sin(angle) * projSpeed },
                  radius: isUlt ? 12 : 8,
                  damage: w.damage,
                  ownerId: 'player',
                  color: isUlt ? '#f472b6' : '#fb923c',
                  bounces: isUlt ? 100 : (isEvo ? 8 : 4),
                  weaponType: w.type
              });
              w.lastUsed = now;
          }
      }
    });
    } finally {
      player.stats.meleeSpeed = originalMeleeSpeed;
      player.stats.weaponSize = originalWeaponSize;
    }
  }

  updateParticles(dt: number) {
    if (this.particles.length > 50) {
      this.particles.splice(0, this.particles.length - 50);
    }
    
    let writeIdx = 0;
    for (let pIdx = 0; pIdx < this.particles.length; pIdx++) {
      const p = this.particles[pIdx];
      p.life -= dt;
      p.tickTimer = (p.tickTimer || 0) + dt;
      
      if (p.pos && p.vel) {
          p.pos.x += p.vel.x * dt;
          p.pos.y += p.vel.y * dt;
      }

      const shouldTickDamage = p.tickTimer >= 0.08;
      const tickDt = p.tickTimer;

      if (p.type === 'FIRE') {
          if (shouldTickDamage) {
              const radius = p.radius || (p.isEvolved ? 25 : 15);
              for (let i = 0; i < this.enemies.length; i++) {
                  const enemy = this.enemies[i];
                  if (enemy.isDead || enemy.hp <= 0) continue;
                  const combinedR = enemy.radius + radius;
                  const dx = enemy.pos.x - p.pos.x;
                  if (Math.abs(dx) > combinedR) continue;
                  const dy = enemy.pos.y - p.pos.y;
                  if (Math.abs(dy) > combinedR) continue;
                  if (dx * dx + dy * dy < combinedR * combinedR) {
                      this.damageEnemy(enemy, p.damage * tickDt * (p.isEvolved ? 1.5 : 1), false, 'fire', undefined, p.pos);
                  }
              }
          }
          
          if (p.isEvolved && p.life > 0 && Math.random() < 0.05) {
              // Secondary explosion for evolved trail
              if (this.onShake) this.onShake(1);
          }
      }
      if (p.type === 'TOXIC') {
          if (shouldTickDamage) {
              const maxR = p.maxRadius || 100;
              for (let i = 0; i < this.enemies.length; i++) {
                  const enemy = this.enemies[i];
                  if (enemy.isDead || enemy.hp <= 0) continue;
                  const dx = enemy.pos.x - p.pos.x;
                  if (Math.abs(dx) > maxR) continue;
                  const dy = enemy.pos.y - p.pos.y;
                  if (Math.abs(dy) > maxR) continue;
                  if (dx * dx + dy * dy < maxR * maxR) {
                      this.damageEnemy(enemy, p.damage * tickDt, false, 'toxic', undefined, p.pos);
                      if ((p as any).isCorrosive) {
                          (enemy as any).isCorroded = true;
                          (enemy as any).corrodedTimer = 5.0; // Corrosive Decay lasts 5 seconds
                      }
                  }
              }
          }
      }

      if (shouldTickDamage) {
          p.tickTimer = 0;
      }

      if (p.life > 0) {
        this.particles[writeIdx++] = p;
      }
    }
    this.particles.length = writeIdx;
  }

  updateFloatingTexts(dt: number) {
    if (this.floatingTexts.length > 25) {
      this.floatingTexts.splice(0, this.floatingTexts.length - 25);
    }
    let writeIdx = 0;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.pos.x += ft.vel.x * dt;
      ft.pos.y += ft.vel.y * dt;
      
      // Gradually damp the flying velocity
      ft.vel.x *= Math.max(0, 1 - dt * 2.5);
      ft.vel.y *= Math.max(0, 1 - dt * 2.5);
      if (ft.life > 0) {
        this.floatingTexts[writeIdx++] = ft;
      }
    }
    this.floatingTexts.length = writeIdx;
  }

  getNearestEnemy(): EnemyBall | null {
    return this.getNearestEnemyTo(this.player.pos);
  }

  getNearestEnemyTo(pos: Vector): EnemyBall | null {
      if (this.enemies.length === 0) return null;
      let nearest: EnemyBall | null = null;
      let minSq = Infinity;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isDead || e.hp <= 0) continue;
        const dx = pos.x - e.pos.x;
        const dy = pos.y - e.pos.y;
        const sq = dx * dx + dy * dy;
        if (sq < minSq) {
          minSq = sq;
          nearest = e;
        }
      }
      return nearest;
  }

  getPredictiveTargetPos(shooterPos: Vector, enemy: EnemyBall, projSpeed: number, accuracy: number = this.player.stats.accuracy || 0.15): Vector {
    const dx = enemy.pos.x - shooterPos.x;
    const dy = enemy.pos.y - shooterPos.y;
    const dist = Math.hypot(dx, dy);
    const timeToTarget = projSpeed > 0 ? (dist / projSpeed) : 0;

    // As accuracy grows (base ~0.15 up to 1.0+):
    // Blend from current enemy pos to projected intercept position based on enemy velocity
    const accFactor = Math.max(0, Math.min(1.2, accuracy));
    const enemyVx = enemy.vel ? enemy.vel.x : 0;
    const enemyVy = enemy.vel ? enemy.vel.y : 0;

    // Limit maximum projection to prevent extreme runaway leads on fast dashers
    const maxLead = dist * 0.85;
    let leadX = enemyVx * timeToTarget * accFactor;
    let leadY = enemyVy * timeToTarget * accFactor;
    const leadDist = Math.hypot(leadX, leadY);
    if (leadDist > maxLead && leadDist > 0) {
      const scale = maxLead / leadDist;
      leadX *= scale;
      leadY *= scale;
    }

    return {
      x: enemy.pos.x + leadX,
      y: enemy.pos.y + leadY
    };
  }

  explodeBomb(bomb: any) {
    const isUlt = bomb.isUlt;
    const radius = isUlt ? 450 : (bomb.radius || 150);
    this.enemies.forEach(e => {
        const d = Math.hypot(e.pos.x - bomb.pos.x, e.pos.y - bomb.pos.y);
        if (d < radius + e.radius) {
            let dmg = bomb.damage * (isUlt ? 2.5 : 1);
            if (bomb.capPerEnemy) {
                dmg = Math.min(dmg, e.maxHp * ABILITY_BURST_HP_CAP);
            }
            this.damageEnemy(e, dmg, false, 'bomb', undefined, bomb.pos);
        }
    });
    
    this.particles.push({
        type: 'NOVA',
        pos: { ...bomb.pos },
        radius: 0,
        maxRadius: radius,
        life: isUlt ? 0.8 : 0.4,
        color: isUlt ? '#ef4444' : (bomb.color || '#f87171')
    });

    if (this.onShake) this.onShake(isUlt ? 35 : 12);

    // Spawn Sub-Munitions for Recursive Bomb (Tier 2) and Supernova Bomb (Tier 3)
    if (bomb.isRecursive && !bomb.isSubMunition) {
        const count = isUlt ? 4 : 5;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
            const burstSpeed = isUlt ? 650 : 520;
            this.addBomb({
                pos: { ...bomb.pos },
                vel: { x: Math.cos(angle) * burstSpeed, y: Math.sin(angle) * burstSpeed },
                timer: isUlt ? 1.8 : 1.4,
                radius: radius * (isUlt ? 0.45 : 0.4),
                damage: bomb.damage * (isUlt ? 0.45 : 0.5),
                color: isUlt ? '#c084fc' : '#fb923c',
                isHoming: true,
                isRecursive: false,
                isSubMunition: true, // Prevents infinite recursion
                isSupernovaCore: isUlt, // Mini Nova Stars have gravity wells
                armTimer: 0.28 // Grace period arming delay so mini-bombs scatter outwards before proximity detonating!
            });
        }
    }
  }

  spawnClone(pos: Vector, level: number, damage: number) {
    const isMirage = this.player.weapons.some(w => w.type === WeaponType.MIRAGE_LEGION);
    const isArmy = this.player.weapons.some(w => w.type === WeaponType.HOLOGRAPHIC_ARMY);
    
    let archetype: 'DECOY' | 'TACTICAL' | 'SHOTGUN' | 'MELEE' | 'SNIPER' = 'DECOY';
    if (isMirage) {
        const shotgunCount = this.clones.filter(c => c.archetype === 'SHOTGUN').length;
        const meleeCount = this.clones.filter(c => c.archetype === 'MELEE').length;
        if (shotgunCount < 2) archetype = 'SHOTGUN';
        else if (meleeCount < 2) archetype = 'MELEE';
        else archetype = 'SNIPER';
    } else if (isArmy) {
        archetype = 'TACTICAL';
    }

    const clone: Clone = {
        id: Math.random().toString(36),
        type: EntityType.PLAYER_BALL,
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400 },
        radius: isMirage ? 16 : (isArmy ? 13 : 14),
        hp: 1,
        maxHp: 1,
        color: isMirage ? 'rgba(239, 68, 68, 0.7)' : (isArmy ? 'rgba(56, 189, 248, 0.6)' : 'rgba(56, 189, 248, 0.5)'),
        isDead: false,
        ownerId: 'player',
        life: (6 + level) * (isMirage ? 3 : (isArmy ? 2 : 1)),
        damage: damage,
        archetype: archetype,
        angle: Math.random() * Math.PI * 2
    };
    this.clones.push(clone);
  }

  shootProjectile(from: Entity, target: Vector, damage: number = 15, weaponType?: string) {
    const angle = Math.atan2(target.y - from.pos.y, target.x - from.pos.x);
    const isPlayerOwned = from.id === 'player' || (from.type === EntityType.PLAYER_BALL) || ((from as any).ownerId === 'player');
    
    let finalDamage = damage;
    let isCrit = false;
    let piercing = 0;
    let velX = Math.cos(angle) * 750;
    let velY = Math.sin(angle) * 750;

    if (isPlayerOwned) {
      gameAudio.playShootSound();
      if (Math.random() < this.player.stats.critChance) {
        finalDamage *= 2;
        isCrit = true;
      }
      piercing = this.player.stats.pierce || 0;
    } else {
      // Scale all boss projectile damage to the player appropriately
      if ((from as any).isBoss) {
        // Boss attacks: considerably bigger projectiles, doing less damage!
        if ((from as any).bossSubtype === 'WARRIOR' || this.currentRoom <= 10) {
          finalDamage *= 0.35;
        } else if ((from as any).bossSubtype === 'TITAN' || this.currentRoom <= 20) {
          finalDamage *= 0.45;
        } else {
          finalDamage *= 0.60;
        }
      } else {
        // Reduced projectile damage for regular enemies in early rooms
        if (this.currentRoom <= 10) {
          finalDamage *= 0.55;
        } else if (this.currentRoom <= 20) {
          finalDamage *= 0.75;
        }
      }
      if ((from as any).damageMult) {
        finalDamage *= (from as any).damageMult;
      }

      // Add enemy movement speed to bullet so enemy cannot outrun its own projectile
      const shooterVelX = (from as any).vel?.x || 0;
      const shooterVelY = (from as any).vel?.y || 0;
      const baseBulletSpeed = 700;
      const forwardMomentum = Math.max(0, shooterVelX * Math.cos(angle) + shooterVelY * Math.sin(angle));
      velX = Math.cos(angle) * (baseBulletSpeed + forwardMomentum) + shooterVelX * 0.4;
      velY = Math.sin(angle) * (baseBulletSpeed + forwardMomentum) + shooterVelY * 0.4;
    }

    const isBoss = !isPlayerOwned && !!(from as any).isBoss;
    const projRadius = isBoss ? 16 : (isCrit ? 6 : 4);

    this.projectiles.push({
      pos: { ...from.pos },
      vel: { x: velX, y: velY },
      radius: projRadius,
      damage: finalDamage,
      ownerId: isPlayerOwned ? 'player' : from.id,
      color: isPlayerOwned ? (isCrit ? '#fca5a5' : '#fbbf24') : (isBoss ? '#ef4444' : '#ef4444'), // Red for enemies
      piercing: piercing > 0 ? piercing : undefined,
      isBossProjectile: isBoss,
      bossSubtype: isBoss ? (from as any).bossSubtype : undefined,
      weaponType: weaponType || (isPlayerOwned ? 'projectile' : undefined)
    });
  }

  applyRecoil(angle: number, force: number) {
    if (this.player.isDead) return;
    this.player.vel.x -= Math.cos(angle) * force;
    this.player.vel.y -= Math.sin(angle) * force;
  }

  shootProjectileFromPlayer(target: Vector, damage: number, color: string = '#fbbf24', speed: number = 950, homing: boolean = false, targetId?: string, weaponType?: string) {
    gameAudio.playShootSound();
    const angle = Math.atan2(target.y - this.player.pos.y, target.x - this.player.pos.x);
    
    let finalDamage = damage;
    let isCrit = false;
    if (Math.random() < this.player.stats.critChance) {
      finalDamage *= 2;
      isCrit = true;
    }

    // Greatly softened recoil kickback to the player for smooth, non-disruptive firing
    let recoilIntensity = 3;
    if (isCrit) recoilIntensity = 5;
    this.applyRecoil(angle, recoilIntensity);

    const isIce = color === '#38bdf8' || color === '#7dd3fc' || color === '#e0f2fe' || weaponType === 'ice_sword';
    const isFire = color === '#f97316' || color === '#ef4444' || color === '#ea580c' || weaponType === 'fire_sword' || weaponType === 'turret_fire';

    this.projectiles.push({
      pos: { ...this.player.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      radius: isCrit ? 7 : 5,
      damage: finalDamage,
      ownerId: 'player',
      color: isCrit ? '#fca5a5' : color,
      isIce,
      isFire,
      homing,
      targetId,
      piercing: this.player.stats.pierce || 0,
      weaponType: weaponType || 'projectile'
    });
  }

  damagePlayer(amt: number) {
    if (this.player.isInvincible) return;
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (this.player.spawnShieldTimer && this.player.spawnShieldTimer > 0) return;

    (this.player as any).tookDamageInCurRoom = true;

    // High-potency structural energy dome absorbs 75% of incoming damage!
    let aegisDmgMult = 1.0;
    const hasAegis = this.player.abilities.some(a => a.type === AbilityType.NANITE_AEGIS && a.isActive);
    if (hasAegis) {
        aegisDmgMult = 0.25; // 75% damage reduction
        if (Math.random() < 0.35) {
            for (let i = 0; i < 4; i++) {
                this.particles.push({
                    type: 'SPARK',
                    pos: { ...this.player.pos },
                    vel: { x: (Math.random()-0.5)*300, y: (Math.random()-0.5)*300 },
                    life: 0.4,
                    color: '#10b981'
                });
            }
        }
    }

    if (this.gameMode === 'OVERDRIVE' || this.gameMode === 'HARDCORE' || this.gameMode === 'OVERDRIVE_SANDBOX') {
      if (this.isTetherActive) {
        this.floatingTexts.push({
          id: Math.random().toString(36),
          pos: { x: this.player.pos.x, y: this.player.pos.y - 30 },
          vel: { x: (Math.random() - 0.5) * 50, y: -70 },
          text: "TETHER BROKEN!",
          color: "#f43f5e",
          life: 1.5,
          maxLife: 1.5,
          isCrit: true
        });
        this.isTetherActive = false;
        const stabilizerCard = this.player.stats.equippedMovementModules?.find(m => m.id === 'stabilizer');
        const stabilizerLevel = stabilizerCard ? stabilizerCard.level : 0;
        const penaltyDuration = Math.max(1.0, 10.0 - stabilizerLevel * 1.5);
        this.tetherDisableTimer = penaltyDuration;
      }
    }

    gameAudio.playPlayerHurtSound();
    this.player.lastDamageTime = Date.now();
    const hasContactWeapon = this.player.weapons.some(w => 
      w.type === WeaponType.SPINNING_BLADE || w.type === WeaponType.VORTEX_SCYTHE || w.type === WeaponType.CHRONO_REAPER ||
      w.type === WeaponType.CHAIN_ARC_SWORD || w.type === WeaponType.ARC_WHIP || w.type === WeaponType.THUNDER_GOD ||
      w.type === WeaponType.PLASMA_RAZOR || w.type === WeaponType.NEUTRINO_SHREDDER || w.type === WeaponType.GOD_SLAYER_WHEEL ||
      w.type === WeaponType.ICE_SWORD || w.type === WeaponType.FIRE_SWORD ||
      w.type === WeaponType.GLACIAL_GREATSWORD || w.type === WeaponType.ABSOLUTE_ZERO_SIPHON ||
      w.type === WeaponType.SOLAR_ECLIPSE_BLADE || w.type === WeaponType.SUPERNOVA_SLAYER
    );
    // 50% damage reduction when wielding contact weapons to reward aggressive play
    const defenseBonus = hasContactWeapon ? 2.0 : 1.0;
    
    // Exponential damage scaling accelerates past room 20
    let scale = 1.0;
    if (this.currentRoom > 20) {
        scale = Math.pow(1.08, this.currentRoom - 20);
    }
    
    let rangeMultiplier = 1.0;
    if (this.currentRoom >= 1 && this.currentRoom <= 10) {
        rangeMultiplier = 0.50; // 50% damage reduction for early levels 1-10
    } else if (this.currentRoom >= 11 && this.currentRoom <= 20) {
        rangeMultiplier = 0.65; // 35% damage reduction for levels 11-20
    }
    
    const dmgReduct = this.player.stats.damageReductionMultiplier ?? 1.0;
    let finalDamage = ((amt * 1.3 * scale * rangeMultiplier) / (this.player.stats.defense * defenseBonus)) * aegisDmgMult * dmgReduct;
    // Balance bot knob: global enemy damage multiplier (default 1.0)
    finalDamage *= balance.enemyDmgMult;
    
    if (this.player.hp - finalDamage <= 0 && this.player.hp > this.player.maxHp * 0.15 && Math.random() < 0.85) {
        // One-Shot Protection: Defy fatal blow and gate the player at 1% to 10% health
        const safeguardHpPct = 0.01 + Math.random() * 0.09;
        this.player.hp = this.player.maxHp * safeguardHpPct;
        
        // Push a visual message so user knows the clutch cheat was activated!
        this.floatingTexts.push({
            id: Math.random().toString(36),
            pos: { x: this.player.pos.x, y: this.player.pos.y - 30 },
            vel: { x: (Math.random() - 0.5) * 50, y: -60 },
            text: "INTEGRITY GATED!",
            color: "#38bdf8",
            life: 1.5,
            maxLife: 1.5,
            isCrit: true
        });
        
        // Spawn protective warning particles
        for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 100;
            this.particles.push({
                type: 'CYAN_EMISSION',
                pos: { ...this.player.pos },
                vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
                life: 0.6 + Math.random() * 0.4,
                color: '#38bdf8',
                size: Math.random() * 4 + 2
            });
        }
        
        gameAudio.playHitSound(true); // punchy feedback
    } else {
        this.player.hp -= finalDamage;
    }
    
    this.player.hurtTimer = 0.2;
    if (this.onShake) this.onShake(amt * 0.8);
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.isDead = true;
      this.clones = [];
      this.turrets = [];
      if (this.onGameOver) this.onGameOver();
    }
  }

  // Global burst abilities deal damage capped to a fraction of each enemy's max HP (see ABILITY_BURST_HP_CAP).
  burstDamageEnemy(enemy: EnemyBall, amt: number, source?: string): boolean {
    const capped = Math.min(amt, enemy.maxHp * ABILITY_BURST_HP_CAP);
    return this.damageEnemy(enemy, capped, false, source);
  }

  damageEnemy(enemy: EnemyBall, amt: number, isMelee: boolean = false, source?: string, isCritOverride?: boolean, hitPosOverride?: { x: number, y: number }): boolean {
    if (!Number.isFinite(amt) || amt <= 0) return false;
    if (enemy.isDead) return false;

    enemy.hurtTimer = 0.5;

    // Helper to normalize angles inside circle space
    const normAng = (val: number) => {
        while (val < -Math.PI) val += Math.PI * 2;
        while (val > Math.PI) val -= Math.PI * 2;
        return val;
    };

    // Calculate hit source position to see where damage came from
    let hitPos = hitPosOverride || { ...this.player.pos };
    if (!hitPosOverride && this.clones && this.clones.length > 0) {
        let minDist = Math.hypot(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y);
        for (const clone of this.clones) {
            const d = Math.hypot(clone.pos.x - enemy.pos.x, clone.pos.y - enemy.pos.y);
            if (d < minDist) {
                minDist = d;
                hitPos = { ...clone.pos };
            }
        }
    }
    const hitAngle = Math.atan2(hitPos.y - enemy.pos.y, hitPos.x - enemy.pos.x);

    // 1. Check Force Fields (spawnImmunity, periodic, directional front, vulnerable ring with holes)
    // Melee weapons completely bypass enemy shield blocks!
    // Gravity beams bypass the full blocks but take 50% damage reduction.
    // Standard projectile bullets are still fully blocked.
    const isGravityBeam = source === 'GRAVITY_BEAM' || source === 'EVENT_HORIZON' || source === 'SINGULARITY_CORE';
    
    if (enemy.forceFieldType && !isMelee) {
        let shieldModifier = 1.0;
        if (isGravityBeam) {
            shieldModifier = 0.5; // Deals 50% damage through enemy shields
        }
        
        if (enemy.forceFieldType === 'SPAWN_IMMUNITY') {
            if (enemy.forceFieldTimer && enemy.forceFieldTimer > 0) {
                if (isGravityBeam) {
                    amt *= shieldModifier;
                } else {
                    // Gold particles bouncing off the invuln shield
                    gameAudio.playHitSound(false, 'kinetic');
                    this.particles.push({
                        type: 'SPARK',
                        pos: { x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius * 2, y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius * 2 },
                        vel: { x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 160 },
                        life: 0.35,
                        color: '#f59e0b'
                    });
                    return false; // Absorb 100% damage
                }
            }
        } else if (enemy.forceFieldType === 'PERIODIC') {
            if (enemy.forceFieldState === true) {
                if (isGravityBeam) {
                    amt *= shieldModifier;
                } else {
                    // Cyan energy shell blocks all incoming damage
                    gameAudio.playHitSound(false, 'kinetic');
                    this.particles.push({
                        type: 'SPARK',
                        pos: { x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius * 2, y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius * 2 },
                        vel: { x: (Math.random() - 0.5) * 180, y: (Math.random() - 0.5) * 180 },
                        life: 0.4,
                        color: '#06b6d4'
                    });
                    return false; // Absorb 100% damage
                }
            }
        } else if (enemy.forceFieldType === 'DIRECTIONAL') {
            const shieldCenter = enemy.forceFieldAngle || 0;
            const diff = Math.abs(normAng(hitAngle - shieldCenter));
            if (diff < 1.0) { // Facing player, 115 degrees front sector protected
                if (isGravityBeam) {
                    amt *= shieldModifier;
                } else {
                    gameAudio.playHitSound(false, 'kinetic');
                    this.particles.push({
                        type: 'SPARK',
                        pos: { 
                            x: enemy.pos.x + Math.cos(shieldCenter) * enemy.radius, 
                            y: enemy.pos.y + Math.sin(shieldCenter) * enemy.radius 
                        },
                        vel: { x: Math.cos(shieldCenter) * 150 + (Math.random() - 0.5) * 60, y: Math.sin(shieldCenter) * 150 + (Math.random() - 0.5) * 60 },
                        life: 0.45,
                        color: '#fb923c'
                    });
                    // Reduce damage. Since earlier it blocked 100%, now we let 20% of the damage bleed through (80% reduction)
                    // so that the directional shields never make some enemies perfectly invincible if targeted head-on.
                    amt *= 0.20;
                }
            }
        } else if (enemy.forceFieldType === 'VULNERABLE') {
            const gapCenter = enemy.forceFieldAngle || 0;
            const diff = Math.abs(normAng(hitAngle - gapCenter));
            if (diff > 0.65) { // Hit landed outside of the 75-degree gap!
                if (isGravityBeam) {
                    amt *= shieldModifier;
                } else {
                    gameAudio.playHitSound(false, 'kinetic');
                    this.particles.push({
                        type: 'SPARK',
                        pos: { x: enemy.pos.x + Math.cos(hitAngle) * enemy.radius, y: enemy.pos.y + Math.sin(hitAngle) * enemy.radius },
                        vel: { x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 160 },
                        life: 0.4,
                        color: '#ec4899'
                    });
                    return false; // Hard magenta energy blocks everything except the hole!
                }
            }
        }
    }

    // Mirage teleportation behavior: 32% chance to blink and leave an optical delay on hurt
    if (enemy.enemyType === 'MIRAGE' && !enemy.isBoss && Math.random() < 0.32) {
        const tpAngle = Math.random() * Math.PI * 2;
        const tpDist = 75 + Math.random() * 85;
        const oldPos = { ...enemy.pos };
        enemy.pos.x = Math.max(50, Math.min(this.width - 50, enemy.pos.x + Math.cos(tpAngle) * tpDist));
        enemy.pos.y = Math.max(50, Math.min(this.height - 50, enemy.pos.y + Math.sin(tpAngle) * tpDist));
        
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                type: 'WARP',
                pos: { x: oldPos.x, y: oldPos.y },
                radius: enemy.radius,
                maxRadius: enemy.radius * 2,
                life: 0.3,
                color: '#fda4af'
            });
        }
        this.particles.push({
            type: 'WARP',
            pos: { ...enemy.pos },
            radius: 0,
            maxRadius: enemy.radius * 2.5,
            life: 0.4,
            color: '#fda4af'
        });
    }

    // Melee weapons deal more damage the faster the player is moving (Momentum Bonus!)
    if (isMelee) {
        const speed = Math.hypot(this.player.vel.x, this.player.vel.y);
        const momentumDmgMultiplier = 1.0 + (speed / 250);
        amt *= momentumDmgMultiplier;
    }

    // Determine critical strike
    let isCrit = isCritOverride;
    if (isCrit === undefined) {
        const hasAbsoluteZeroRipple = this.player.abilities.some(a => a.type === AbilityType.ABSOLUTE_ZERO_RIPPLE && a.isActive);
        if (enemy.isFrozen && hasAbsoluteZeroRipple) {
            isCrit = true;
        } else {
            isCrit = Math.random() < (this.player.stats.critChance || 0.05);
        }
        if (isCrit) {
            amt *= 2.0; // Double the damage for crit
        }
    }
    
    // Play procedurally-randomized, source-appropriate hit sound
    let s = source;
    if (!s) {
      if (enemy.isFrozen || enemy.isSlowed) {
          s = 'ice';
      } else if (enemy.isOnFire) {
          s = 'fire';
      } else if (isMelee) {
          s = 'melee';
      } else {
          s = 'kinetic';
      }
    }
    
    // Play hit sound for every weapon strike, perfectly meeting the request!
    gameAudio.playHitSound(isCrit, s);
    
    // Disable hitstop for continuous tick sources to keep game loops buttery smooth
    const isContinuous = s && (
        s === 'fire' || 
        s === 'toxic' || 
        s === 'laser' || 
        s === 'beam' || 
        s === 'gravity_beam' || 
        s === 'event_horizon' || 
        s === 'singularity_core' || 
        s === 'fire_trail' || 
        s === 'volcanic_plume' || 
        s === 'cosmic_flame' ||
        s.includes('BEAM') ||
        s.includes('TRAIL') ||
        s.includes('FLAME') ||
        s.includes('PLUME') ||
        s === WeaponType.SPINNING_BLADE || 
        s === WeaponType.VORTEX_SCYTHE || 
        s === WeaponType.CHRONO_REAPER ||
        s === WeaponType.PLASMA_RAZOR || 
        s === WeaponType.NEUTRINO_SHREDDER || 
        s === WeaponType.GOD_SLAYER_WHEEL ||
        s === WeaponType.GRAVITY_BEAM || 
        s === WeaponType.EVENT_HORIZON || 
        s === WeaponType.SINGULARITY_CORE
    );

    const isGravityContinuous = s && (
        s === WeaponType.GRAVITY_BEAM || 
        s === WeaponType.EVENT_HORIZON || 
        s === WeaponType.SINGULARITY_CORE || 
        s === 'GRAVITY_BEAM' || 
        s === 'EVENT_HORIZON' || 
        s === 'SINGULARITY_CORE' || 
        s === 'gravity_beam' || 
        s === 'event_horizon' || 
        s === 'singularity_core'
    );

    // Trigger visceral screenshake and crisp freezeframes (hitstop) - disabled for continuous/gravity to prevent photosensitive flashing
    if (!isContinuous) {
        if (isCrit) {
            if (this.onShake) this.onShake(enemy.isBoss ? 45 : 18);
            // Prevent stacking hitstop infinitely when multi-critting multiple enemies in one frame, and NEVER freeze on boss strikes
            if (this.hitstopTimer <= 0 && !enemy.isBoss) {
                this.hitstopTimer = 0.045; // 45ms crisp freeze for normal enemy crits
            }
        } else {
            if (this.onShake) this.onShake(enemy.isBoss ? 20 : 3.5);
        }
    } else if (!isGravityContinuous) {
        // Continuous tick feel for non-gravity sources (subtle punch shake, no freeze-frames to prevent locks)
        if (this.onShake && Math.random() < 0.08) {
            this.onShake(isCrit ? 3 : 1);
        }
    }

    // Spawn Kinetic Floating popups
    // Fire trail and fire ticks must display a minimum of 1 damage on the damage pop up, matching the requested fix!
    let displayAmt = Math.round(amt);
    if ((s === 'fire' || s === 'fire_trail' || s === 'toxic' || source === 'fire_trail') && displayAmt < 1) {
        displayAmt = 1;
    } else {
        displayAmt = Math.max(1, displayAmt);
    }
    const dmgString = displayAmt.toString();
    let textColor = '#f3f4f6'; // Clean silver
    if (isCrit) {
        textColor = '#f59e0b'; // Gold critical surge
    } else if (s === 'ice' || s === 'ice_sword') {
         textColor = '#38bdf8'; // Crystal blue
    } else if (s === 'fire' || s === 'fire_sword') {
         textColor = '#f97316'; // Vivid orange
    } else if (source && (source.includes('ARC') || source.includes('TESLA') || source.includes('WHIP') || source.includes('LIGHTNING'))) {
         textColor = '#c084fc'; // Purple thunder
    } else if (source === 'laser' || source === 'beam') {
         textColor = '#fb7185'; // Pulse pink
    } else if (isMelee) {
         textColor = '#e2e8f0'; // Cold steel
    } else if (source === 'shield') {
         textColor = '#34d399'; // Force field green
    }

    const scatterAngle = Math.random() * Math.PI * 2;
    const verticalForce = isCrit ? 220 : 140;
    const shouldSpawnText = !isContinuous || (this.floatingTexts.length < 12 && Math.random() < 0.35) || isCrit;
    if (shouldSpawnText) {
      if (this.floatingTexts.length >= 20) {
        this.floatingTexts.shift();
      }
      this.floatingTexts.push({
          id: Math.random().toString(36),
          pos: { x: enemy.pos.x, y: enemy.pos.y - enemy.radius - 4 },
          vel: {
              x: Math.cos(scatterAngle) * 55,
              y: -verticalForce,
          },
          text: dmgString + (isCrit ? '!' : ''),
          color: textColor,
          life: isCrit ? 0.75 : 0.55,
          maxLife: isCrit ? 0.75 : 0.55,
          isCrit: isCrit
      });
    }
    
    // Core systems: apply global bonus damage multiplier if present
    amt *= (this.player.stats.damageMult || 1.0);

    // Corrosive Decay: Melted armor causes corroded enemies to take 1.6x (60% bonus) damage from all sources!
    if ((enemy as any).isCorroded) {
        amt *= 1.6;
    }
    // Railgun Armor-Shred: +30% damage taken from all sources while armor is shredded
    if (enemy.armorShred && enemy.armorShred > 0) {
        amt *= 1.3;
    }

    // Apply Fire damage boosts
    if (enemy.isOnFire) {
        if (this.player.stats.fireDmgBoost) {
            amt *= (1 + this.player.stats.fireDmgBoost);
        }
        if (isMelee && this.player.stats.fireMeleeDmgBoost) {
            amt *= (1 + this.player.stats.fireMeleeDmgBoost);
        }
    }

    // Apply Slow / Frozen damage boosts
    if (enemy.isFrozen || enemy.isSlowed) {
        if (this.player.stats.slowDmgBoost) {
            amt *= (1 + this.player.stats.slowDmgBoost);
        }
    }
    
    // Impact particles for every hit
    if (Math.random() < 0.4) {
        this.particles.push({
            type: 'SPARK',
            pos: { 
                x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius, 
                y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius 
            },
            vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
            life: 0.3,
            color: '#fff'
        });
    }

    if (enemy.shieldHp && enemy.shieldHp > 0) {
        const toShield = Math.min(enemy.shieldHp, amt);
        enemy.shieldHp -= toShield;
        
        // Visual shield spark
        this.particles.push({
            type: 'SPARK',
            pos: { 
                x: enemy.pos.x + (Math.random() - 0.5) * enemy.radius, 
                y: enemy.pos.y + (Math.random() - 0.5) * enemy.radius 
            },
            vel: { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
            life: 0.5,
            color: '#38bdf8'
        });
        
        const remaining = amt - toShield;
        if (remaining > 0) {
            enemy.hp -= remaining;
        }
    } else {
        enemy.hp -= amt;
    }

    // WARP_WARLOCK Phase Shift: 22% chance to teleport away when damaged if still alive
    if (!enemy.isDead && enemy.hp > 0 && enemy.enemyType === 'WARP_WARLOCK' && Math.random() < 0.22) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 140 + Math.random() * 140;
        enemy.pos.x = Math.max(60, Math.min(this.width - 60, enemy.pos.x + Math.cos(ang) * dist));
        enemy.pos.y = Math.max(60, Math.min(this.height - 60, enemy.pos.y + Math.sin(ang) * dist));
        this.particles.push({
            type: 'WARP',
            pos: { ...enemy.pos },
            radius: 0,
            maxRadius: 50,
            life: 0.35,
            color: '#a855f7'
        });
    }

    this.damageEvents.push({ time: Date.now(), amount: amt });

    if (enemy.hp <= 0) {
      enemy.isDead = true;
      if ((enemy as any).isCorroded) {
          // Spread Corrosion to up to 4 other nearby enemies within a 200px range!
          let spreadCount = 0;
          for (const other of this.enemies) {
              if (other.id !== enemy.id && !other.isDead && !(other as any).isCorroded) {
                  const d = Math.hypot(other.pos.x - enemy.pos.x, other.pos.y - enemy.pos.y);
                  if (d <= 200) {
                      (other as any).isCorroded = true;
                      (other as any).corrodedTimer = 5.0;
                      // Spawn visual neon green arc particles showing transmission
                      this.particles.push({
                          type: 'ARC',
                          p1: { ...enemy.pos },
                          p2: { ...other.pos },
                          life: 0.35,
                          color: '#a3e635'
                      });
                      spreadCount++;
                      if (spreadCount >= 4) break;
                  }
              }
          }
      }
      if ((enemy as any).explodeOnDeath) {
          const eDmg = (enemy as any).explodeOnDeathDmg || 120;
          this.explodeBomb({
              pos: { ...enemy.pos },
              radius: 130,
              damage: eDmg,
              color: '#f97316'
          });
      }
      if (source && source.startsWith('turret')) {
        try {
          const turretKills = JSON.parse(localStorage.getItem('surv_turret_recent_kills') || '[]');
          const now = Date.now();
          const validKills = turretKills.filter((t: number) => now - t < 5000);
          validKills.push(now);
          localStorage.setItem('surv_turret_recent_kills', JSON.stringify(validKills));
          if (validKills.length >= 15) {
            localStorage.setItem('surv_turret_killed_15_in_5s', 'true');
          }
        } catch (err) {
          console.error(err);
        }
      }
      gameAudio.playExplosionSound();
      if (enemy.enemyType === 'SPLITTER') {
        this.splitEnemy(enemy);
      }
      if (enemy.enemyType === 'BOMBER') {
        this.explodeBomb({
          pos: enemy.pos,
          radius: 180,
          damage: 50,
          color: '#ef4444'
        });
      }
      if (enemy.enemyType === 'PLASMA_STORMER') {
        this.ionZones.push({
          id: Math.random().toString(),
          pos: { ...enemy.pos },
          radius: 110,
          duration: 4.5,
          maxDuration: 4.5
        });
        gameAudio.playExplosionSound();
      }
    }
    return true;
  }

  splitEnemy(enemy: EnemyBall) {
    const splitHp = Math.max(15, Math.floor(enemy.maxHp * 0.4));
    for (let i = 0; i < 2; i++) {
        const mini: EnemyBall = {
            id: Math.random().toString(36),
            type: EntityType.ENEMY_BALL,
            enemyType: 'BASIC',
            pos: { ...enemy.pos },
            vel: { x: (Math.random() - 0.5) * 260, y: (Math.random() - 0.5) * 260 },
            radius: 8,
            hp: splitHp,
            maxHp: splitHp,
            color: '#ec4899',
            isDead: false,
        };
        this.enemies.push(mini);
    }
  }

  explodeShatter(enemy: EnemyBall) {
      gameAudio.playHitSound(false, 'ice');
      
      const tempest = this.player.abilities.find(a => a.type === AbilityType.FROSTBITE_TEMPEST);
      const lvl = tempest?.level || 1;
      // Heavily nerfed Frostbite Tempest shatter damage down to 10 + lvl * 2 (12 to 30 damage)
      const dmg = 10 + lvl * 2;
      const range = 130;
      
      this.particles.push({
          type: 'NOVA',
          pos: { ...enemy.pos },
          radius: 0,
          maxRadius: range,
          life: 0.3,
          color: '#22d3ee'
      });
      
      for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
          const speed = 250 + Math.random() * 120;
          this.particles.push({
              type: 'SNOW',
              pos: { ...enemy.pos },
              vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
              life: 0.3 + Math.random() * 0.2,
              color: '#bae6fd',
              size: 3
          });
      }
      
      this.enemies.forEach(e => {
          if (e.id !== enemy.id && Math.hypot(e.pos.x - enemy.pos.x, e.pos.y - enemy.pos.y) < range) {
              this.damageEnemy(e, dmg, false, 'frostbite_tempest');
              e.isSlowed = true;
              e.slowTimer = Math.max(e.slowTimer || 0, 1.2);
          }
      });
  }

  resolveCollision(b1: Entity, b2: Entity) {
    const dx = b2.pos.x - b1.pos.x;
    const dy = b2.pos.y - b1.pos.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.1) {
        // Nudge to avoid division by zero or super high forces
        b1.pos.x -= 1;
        b2.pos.x += 1;
        return;
    }

    const nx = dx / distance;
    const ny = dy / distance;

    const p = 2 * (b1.vel.x * nx + b1.vel.y * ny - b2.vel.x * nx - b2.vel.y * ny) / 2;

    b1.vel.x -= p * nx;
    b1.vel.y -= p * ny;
    b2.vel.x += p * nx;
    b2.vel.y += p * ny;

    // Separate them so they don't stick
    const overlap = b1.radius + b2.radius - distance;
    b1.pos.x -= nx * overlap / 2;
    b1.pos.y -= ny * overlap / 2;
    b2.pos.x += nx * overlap / 2;
    b2.pos.y += ny * overlap / 2;
  }

  distToSegment(p: Vector, v: Vector, w: Vector) {
    const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }
}
