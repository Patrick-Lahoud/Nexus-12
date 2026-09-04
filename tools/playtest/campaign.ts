/**
 * Headless endurance driver
 * -------------------------
 * Replicates App.tsx's run sequencing against the real engine (mode is now
 * HARDCORE-style, no checkpoints): rooms 1..100, boss room every 10 (ultra boss
 * at 100), upgrade pick after every clear, death ends the attempt.
 *
 * NOTE: engine module must be imported DYNAMICALLY after installShims()
 * (audio.ts touches localStorage at import). This file only type-imports it.
 */
import type { GameEngine } from '../../src/game/engine.ts';
import { getRandomUpgrades } from '../../src/game/upgrades.ts';
import { applyCampaignUpgrade } from './campaignUpgrade.ts';
import { advanceSimClock } from './shims.ts';
import type { Policy } from './policies.ts';

export type AttemptOutcome = 'victory' | 'death' | 'stall' | 'cleared_100';

export interface RoomSnapshot {
  room: number;
  isBoss: boolean;
  simSeconds: number;
  enemiesKilled: number;
  damageTaken: number;
  hpEnd: number;
  weapons: string[];
  abilities: string[];
}

export interface AttemptResult {
  attempt: number;
  policy: string;
  outcome: AttemptOutcome;
  roomsCleared: number; // number of rooms fully cleared (0..100)
  diedAtRoom: number | null; // currentRoom when death/stall occurred
  clearedBoss50: boolean;
  clearedBoss100: boolean;
  simSeconds: number;
  damageTaken: number;
  hpLeft: number;
  credits: number;
  kills: number;
  maxHp: number;
  rooms: RoomSnapshot[];
  build: { weapons: string[]; abilities: string[]; stats: Record<string, number> };
}

export interface AttemptOptions {
  attempt: number;
  policy: Policy;
  createEngine: () => GameEngine;
  /** Simulated seconds allowed per room before declaring a stall. */
  roomTimeCapSec?: number;
  /** Simulated seconds allowed for the whole attempt. */
  totalTimeCapSec?: number;
  /** Fake random source shared per attempt (optional determinism). */
  onRoom?: (room: number, snapshot: RoomSnapshot) => void;
}

const DT = 1 / 60;

function roomPlan(room: number): { kind: 'boss'; ultra: boolean } | { kind: 'wave'; enemies: number; waves: number } {
  if (room % 10 === 0) {
    return { kind: 'boss', ultra: room % 100 === 0 };
  }
  // mirrors App.tsx startRoom() enemy-count formula
  let enemyCount = 2 + Math.floor(room / 1.5) + Math.floor(Math.pow(room / 10, 1.8) * 3);
  if (room > 20 && room <= 40) {
    enemyCount = Math.floor(enemyCount * (1 + (room - 20) * 0.08) + Math.pow(room - 20, 1.3));
  } else if (room > 40) {
    enemyCount = Math.min(25, Math.max(12, 14 + Math.floor((room - 40) * 0.25)));
  }
  if (room >= 1 && room <= 10) {
    enemyCount = Math.max(2, Math.floor(enemyCount * 0.55));
  } else if (room >= 11 && room <= 20) {
    enemyCount = Math.max(4, Math.floor(enemyCount * 0.65));
  }
  const waves = room < 20 ? 1 : room <= 40 ? Math.floor(room / 8) + 1 : Math.min(3, Math.floor((room - 40) / 15) + 2);
  return { kind: 'wave', enemies: enemyCount, waves };
}

export function runAttempt(opts: AttemptOptions): AttemptResult {
  const { policy, createEngine, attempt } = opts;
  const roomTimeCap = opts.roomTimeCapSec ?? 300;
  const totalTimeCap = opts.totalTimeCapSec ?? 3600;

  const engine = createEngine();
  engine.gameMode = 'HARDCORE';

  const result: AttemptResult = {
    attempt,
    policy: policy.name,
    outcome: 'death',
    roomsCleared: 0,
    diedAtRoom: null,
    clearedBoss50: false,
    clearedBoss100: false,
    simSeconds: 0,
    damageTaken: 0,
    hpLeft: 0,
    credits: 0,
    kills: 0,
    maxHp: engine.player.maxHp,
    rooms: [],
    build: { weapons: [], abilities: [], stats: {} },
  };

  let room = 1;
  let roomStartTime = 0; // sim seconds at room start (whole-run timeline)
  let lastHp = engine.player.hp;
  let lastKills = 0;
  let pendingClear = false;
  let over = false;
  let roomDamageTaken = 0;

  const rearmClear = () => {
    engine.onRoomClear = () => {
      pendingClear = true;
    };
  };
  engine.onGameOver = () => {
    over = true;
  };

  const startRoomInternal = (n: number) => {
    room = n;
    roomStartTime = result.simSeconds;
    roomDamageTaken = 0;
    lastKills = engine.enemiesKilled;
    lastHp = engine.player.hp;
    pendingClear = false;
    const plan = roomPlan(n);
    if (plan.kind === 'boss') {
      engine.spawnBoss(n, plan.ultra);
    } else {
      engine.startRoom(n, plan.enemies, plan.waves);
    }
    rearmClear();
  };

  /** Between-room upgrade pick, mirroring the campaign picker. */
  const handleClear = () => {
    const snapshot: RoomSnapshot = {
      room,
      isBoss: room % 10 === 0,
      simSeconds: Math.round(result.simSeconds - roomStartTime),
      enemiesKilled: engine.enemiesKilled - lastKills,
      damageTaken: Math.round(roomDamageTaken),
      hpEnd: Math.round(engine.player.hp),
      weapons: engine.player.weapons.map(w => `${w.type}@${w.level}`),
      abilities: engine.player.abilities.map(a => `${a.type}@${a.level}`),
    };
    result.rooms.push(snapshot);
    result.roomsCleared = room;
    if (room % 10 === 0) {
      if (room === 50) result.clearedBoss50 = true;
      if (room === 100) {
        result.clearedBoss100 = true;
        result.outcome = 'victory';
        result.hpLeft = Math.round(engine.player.hp);
        result.credits = engine.player.stats.currency || 0;
        result.kills = engine.enemiesKilled;
        result.build = snapshotBuild(engine);
        over = true;
        return;
      }
    }
    opts.onRoom?.(room, snapshot);

    // --- upgrade pick (mirrors App picker pool + application) ---
    const pool = getRandomUpgrades(
      3,
      engine.player.weapons,
      engine.player.abilities,
      engine.player.stats as any,
      room === 1,
      {},
      false,
      false,
      room % 10 === 0,
      room,
    );
    if (pool.length > 0) {
      const chosen = policy.pick({ engine, now: Date.now() }, pool);
      applyCampaignUpgrade(engine, chosen);
    }

    startRoomInternal(room + 1);
  };

  startRoomInternal(1);

  while (!over && result.simSeconds < totalTimeCap) {
    advanceSimClock(DT);
    engine.update(DT);
    policy.onFrame({ engine, now: Date.now() }, DT);
    result.simSeconds += DT;

    // track damage taken (any negative hp delta outside regen heal bursts is ~ damage)
    const hpNow = engine.player.hp;
    if (hpNow < lastHp - 0.001) {
      roomDamageTaken += lastHp - hpNow;
    }
    lastHp = hpNow;

    if (pendingClear) {
      pendingClear = false;
      handleClear();
      if (over) break;
      continue;
    }

    // room stall guard
    if (result.simSeconds - roomStartTime > roomTimeCap) {
      result.outcome = 'stall';
      break;
    }
  }

  if (!over && result.outcome !== 'stall') {
    result.outcome = 'death';
  }
  if (result.outcome === 'death') {
    result.diedAtRoom = engine.currentRoom;
    result.hpLeft = Math.round(engine.player.hp);
  }
  if (result.outcome === 'stall') {
    result.diedAtRoom = engine.currentRoom;
    result.hpLeft = Math.round(engine.player.hp);
  }
  result.credits = engine.player.stats.currency || 0;
  result.kills = engine.enemiesKilled;
  result.maxHp = engine.player.maxHp;
  result.damageTaken = Math.round(result.rooms.reduce((a, r) => a + r.damageTaken, 0) + (result.outcome === 'death' ? roomDamageTaken : 0));
  result.build = snapshotBuild(engine);
  return result;
}

function snapshotBuild(engine: GameEngine): AttemptResult['build'] {
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(engine.player.stats as Record<string, unknown>)) {
    if (typeof v === 'number') stats[k] = Math.round(v * 100) / 100;
  }
  return {
    weapons: engine.player.weapons.map(w => `${w.type}@${w.level}`),
    abilities: engine.player.abilities.map(a => `${a.type}@${a.level}`),
    stats,
  };
}
