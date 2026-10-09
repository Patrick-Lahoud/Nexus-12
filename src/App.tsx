/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GameEngine } from './game/engine.ts';
import GameCanvas from './components/GameCanvas.tsx';
import HUD, { SidebarStats } from './components/UI/HUD.tsx';
import TouchControls from './components/UI/TouchControls.tsx';
import { isTouchDevice } from './game/touch.ts';
import UpgradeMenu from './components/UI/UpgradeMenu.tsx';
import TitleScreen from './components/UI/TitleScreen.tsx';
import { Compendium } from './components/UI/Compendium.tsx';
import { ALL_UPGRADES, EVOLVED_UPGRADES, ULTIMATE_UPGRADES, EVOLVED_ABILITIES, getRandomUpgrades, getAbilityMaxLevel, type Upgrade } from './game/upgrades.ts';
import { WeaponType, AbilityType } from './game/types.ts';
import { ShopPanel } from './components/UI/ShopPanel.tsx';
import { UnlockRecommendationModal, type UnlockType } from './components/UI/UnlockRecommendationModal.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Trophy, Skull, TriangleAlert } from 'lucide-react';
import { gameAudio } from './game/audio.ts';
import SettingsModal from './components/UI/SettingsModal.tsx';
import Guidebook from './components/UI/Guidebook.tsx';
import SiteBackgroundGrid from './components/UI/SiteBackgroundGrid.tsx';
import { SandboxCompendiumModal } from './components/UI/SandboxCompendiumModal.tsx';
import { unlockAchievement } from './game/achievements';
import { earnBadge, type Badge } from './game/badges';
import BadgeEmblem from './components/UI/BadgeEmblem';
import { useLanguage } from './game/localization';
import { crazyGames } from './game/crazygames';

const ENGINE_WIDTH = 800; // Adjusted for sidebar room
const ENGINE_HEIGHT = 500;

// Snapshot of the player's full build used by Survival rebuild checkpoints (exact loadout restored).
interface SurvivalSnapshot {
  room: number;
  maxHp: number;
  hp: number;
  stats: any;
  statPickCounts: Record<string, number>;
  weapons: any[];
  abilities: any[];
  turrets: any[];
  mines: any[];
}

// Persisted quit-to-menu resume point for Survival runs.
interface ResumeSave {
  mode: 'OVERDRIVE';
  snapshot: SurvivalSnapshot;
  rebuildsLeft: number;
  savedAt: number;
  // The upgrade offers waiting on screen when the player quit (level-clear picker
  // or the run's opening pick). Restored verbatim on resume so quitting can
  // never swallow the choice.
  pendingUpgrades?: Upgrade[];
}

const RESUME_SAVE_KEY = 'survival_resume_save';

export default function App() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{ title: string; reward: string } | null>(null);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [gameMode, setGameMode] = useState<'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX'>('SURVIVAL');
  const [isGameOver, setIsGameOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const retroTheme = false;
  const [room, setRoom] = useState(1);
  const [showShop, setShowShop] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [showGuidebook, setShowGuidebook] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [unlockModalType, setUnlockModalType] = useState<UnlockType | null>(null);
  const [shopDefaultTab, setShopDefaultTab] = useState<'STATS' | 'DEFENSE' | 'MINING'>('STATS');
  const seenSkillsUnlockRef = useRef(false);
  const seenDefenseUnlockRef = useRef(false);
  const seenMiningUnlockRef = useRef(false);
  const [availableUpgrades, setAvailableUpgrades] = useState<Upgrade[]>([]);
  const [statPickCounts, setStatPickCounts] = useState<Record<string, number>>({});
  const [sandboxStatCounts, setSandboxStatCounts] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  // MOBILE: touch device detection (cached). Touch devices get the on-screen
  // joystick + action buttons instead of keyboard/mouse-only affordances.
  const isTouch = useMemo(() => isTouchDevice(), []);
  const tickRef = useRef(0);
  const [highestRoom, setHighestRoom] = useState<number>(() => {
    const saved = localStorage.getItem('highest_room');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [hasRevivedThisRun, setHasRevivedThisRun] = useState(false);
  // Survival (OVERDRIVE) rebuild economy: 3 rebuilds per run, each restoring the last boss-clear checkpoint.
  const [rebuildsLeft, setRebuildsLeft] = useState(0);
  const survivalCheckpointRef = useRef<SurvivalSnapshot | null>(null);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  // Hull value recorded the moment each level starts (used for the quit-to-menu resume save).
  const roomStartHpRef = useRef(300);
  const [resumeSave, setResumeSave] = useState<ResumeSave | null>(() => {
    try {
      const raw = localStorage.getItem(RESUME_SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ResumeSave;
      return parsed && parsed.snapshot && parsed.snapshot.room ? parsed : null;
    } catch {
      return null;
    }
  });

  // Initialize CrazyGames SDK on mount and sync cloud save data
  useEffect(() => {
    crazyGames.init().then(() => {
      const savedHighest = localStorage.getItem('highest_room');
      if (savedHighest) {
        setHighestRoom(parseInt(savedHighest, 10));
      }
    });
  }, []);

  // Sync gameplay state with CrazyGames SDK
  useEffect(() => {
    const isActivelyPlaying = isPlaying && !showUpgrade && !isGameOver && !showShop && !showCompendium && !showSettings && !showGuidebook && !showSandboxModal;
    if (isActivelyPlaying) {
      crazyGames.gameplayStart();
    } else {
      crazyGames.gameplayStop();
    }
  }, [isPlaying, showUpgrade, isGameOver, showShop, showCompendium, showSettings, showGuidebook, showSandboxModal]);

  // Engine is stable across renders
  const engine = useMemo(() => new GameEngine(ENGINE_WIDTH, ENGINE_HEIGHT), []);
  // TEMP-PROBE: expose engine for dev verification (remove before ship)

  const score = isSandbox ? 0 : engine.enemiesKilled * 100;

  const isPlayingRef = useRef(false);
  const showUpgradeRef = useRef(false);
  const isGameOverRef = useRef(false);
  const showShopRef = useRef(false);
  const showCompendiumRef = useRef(false);
  const showSettingsRef = useRef(false);
  const showGuidebookRef = useRef(false);
  const unlockModalTypeRef = useRef<UnlockType | null>(null);
  const isSandboxRef = useRef(false);
  const statPickCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    showUpgradeRef.current = showUpgrade;
    isGameOverRef.current = isGameOver;
    showShopRef.current = showShop;
    showCompendiumRef.current = showCompendium;
    showSettingsRef.current = showSettings;
    showGuidebookRef.current = showGuidebook;
    unlockModalTypeRef.current = unlockModalType;
    isSandboxRef.current = isSandbox;
    statPickCountsRef.current = statPickCounts;

    engine.isPaused = !isPlaying || showUpgrade || isGameOver || showShop || showCompendium || showSettings || showGuidebook || Boolean(unlockModalType) || showSandboxModal || quitConfirmOpenRef.current;
  }, [engine, isPlaying, showUpgrade, isGameOver, showShop, showCompendium, showSettings, showGuidebook, unlockModalType, isSandbox, statPickCounts, showSandboxModal]);

  // The HUD's quit confirmation pauses the game through this flag + event while open.
  const quitConfirmOpenRef = useRef(false);
  useEffect(() => {
    const handlePauseRequest = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.paused === 'boolean') {
        quitConfirmOpenRef.current = detail.paused;
        engine.isPaused = detail.paused || !isPlayingRef.current;
      }
    };
    window.addEventListener('game_pause_request', handlePauseRequest);
    return () => window.removeEventListener('game_pause_request', handlePauseRequest);
  }, [engine]);

  const lastHp = useRef(300);

  // Throttled HUD update timer (6 Hz) - completely decoupled from the 60+ FPS physics & canvas render loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
      if (engine.player) {
        lastHp.current = engine.player.hp;
      }
    }, 160);
    return () => clearInterval(timer);
  }, [engine]);

  const startRoom = useCallback((roomNum: number) => {
    // Record the hull value as the level begins: the quit-to-menu resume point restores this exact state.
    roomStartHpRef.current = engine.player.hp;
    // Full plane clear: leaving a room removes EVERYTHING from the previous level
    // (enemies, projectiles, hazards, leftover boss, etc.) before the new one spawns.
    engine.enemies = [];
    engine.spawnQueue = [];
    engine.waveQueue = [];
    engine.bombs = [];
    engine.pendingBombs = [];
    engine.clones = [];
    engine.warpZones = [];
    engine.ionZones = [];
    engine.floatingTexts = [];
    engine.activeControlFields = [];
    engine.projectiles = [];
    engine.particles = [];

    // Ensure Skills / Defense / Mining are all unlocked for Sandbox
    if (engine.gameMode?.includes('SANDBOX')) {
      engine.player.stats.isControlUnlocked = true;
      engine.player.stats.isTurretsUnlocked = true;
      engine.player.stats.isMinesUnlocked = true;
      // Grant the free pull and auto-equip it to left click
      if (!engine.player.stats.ownedControls) engine.player.stats.ownedControls = [];
      if (!engine.player.stats.ownedControls.some(c => c.id === 'redirection_pull')) {
        engine.player.stats.ownedControls.push({ id: 'redirection_pull', level: 1 });
      }
      if (!engine.player.stats.leftClickSlot) {
        engine.player.stats.leftClickSlot = 'redirection_pull';
      }
    }
    
    if (roomNum > 0 && roomNum % 10 === 0) {
        // Boss Room
        const isUltra = roomNum % 100 === 0;
        engine.spawnBoss(roomNum, isUltra);
    } else {
        // Scaling to enemies with steeper curve past level 20
        let enemyCount = 2 + Math.floor(roomNum / 1.5) + Math.floor(Math.pow(roomNum / 10, 1.8) * 3);
        if (roomNum > 20 && roomNum <= 40) {
            // Sector 31-40 eased: gentler per-room ramp and an overall ~15% trim so this band isn't a wall
            enemyCount = Math.floor((enemyCount * (1 + (roomNum - 20) * 0.06) + Math.pow(roomNum - 20, 1.2)) * 0.85);
        } else if (roomNum > 40) {
            // Past room 40: dramatically lower enemy quantity as requested
            // Spawn fewer, formidable high-health enemies (12-25 enemies across 2-3 focused waves)
            enemyCount = Math.min(25, Math.max(12, 14 + Math.floor((roomNum - 40) * 0.25)));
        }
        if (roomNum >= 1 && roomNum <= 10) {
            enemyCount = Math.max(2, Math.floor(enemyCount * 0.55)); // 45% fewer enemies in early sector 1 (1-10)
        } else if (roomNum >= 11 && roomNum <= 20) {
            enemyCount = Math.max(4, Math.floor(enemyCount * 0.65)); // 35% fewer enemies in early sector 2 (11-20)
        }
        
        const wavesCount = roomNum < 20 ? 1 : (roomNum <= 40 ? Math.floor(roomNum / 8) + 1 : Math.min(3, Math.floor((roomNum - 40) / 15) + 2));
        engine.startRoom(roomNum, enemyCount, wavesCount);
    }
  }, [engine]);

  const handleStart = (mode: 'SURVIVAL' | 'HARDCORE' | 'SANDBOX' | 'OVERDRIVE' | 'OVERDRIVE_SANDBOX' = 'SURVIVAL', startLevelNum: number = 1) => {
    // A fresh run clears any saved resume point.
    localStorage.removeItem(RESUME_SAVE_KEY);
    setResumeSave(null);
    gameAudio.playMusic('gameplay');
    const isSandboxMode = mode === 'SANDBOX' || mode === 'OVERDRIVE_SANDBOX';
    setIsPlaying(true);
    setGameMode(mode);
    setIsSandbox(isSandboxMode);
    setIsGameOver(false);
    setHasRevivedThisRun(false);

    // Survival runs begin with 3 rebuilds and no checkpoint yet (one is captured at the run's opening sector).
    if (mode === 'OVERDRIVE') {
      setRebuildsLeft(3);
      survivalCheckpointRef.current = null;
    }

    setRoom(startLevelNum);
    setStatPickCounts({});
    setSandboxStatCounts({});

    // Reset engine
    engine.player = engine.createPlayer();
    engine.turrets = [];
    engine.gameMode = mode;
    engine.isTetherActive = false;
    engine.deflectPulseCooldownRemaining = 0;
    engine.superKillsCharged = 0;
    engine.superAttackActiveRemaining = 0;

    // Survival & Hardcore share the same tactical ruleset (Survival adds boss-clear checkpoints on top).
    if (mode === 'OVERDRIVE' || mode === 'HARDCORE' || mode === 'OVERDRIVE_SANDBOX') {
        engine.player.stats.currency = 350;
        engine.player.stats.equippedMovementModules = [];
        engine.player.stats.isTetherUnlocked = false;
        engine.player.stats.deflectCooldownReduction = 1;
    }

    engine.enemies = [];
    engine.spawnQueue = [];
    engine.waveQueue = [];
    engine.projectiles = [];
    engine.particles = [];
    engine.bombs = [];
    engine.clones = [];
    engine.enemiesKilled = 0;
    engine.currentRoom = startLevelNum;

    if (isSandboxMode) {
        engine.player.stats.currency = 999999;
    }

    // Sandbox bypasses starting upgrade picker and directly begins
    if (isSandboxMode) {
        startRoom(startLevelNum);
        setShowSandboxModal(true);
    } else {
        const upgradeCount = engine.player.stats.upgradeChoicesCount ?? 3;
        setAvailableUpgrades(getRandomUpgrades(upgradeCount, engine.player.weapons, engine.player.abilities, engine.player.stats, startLevelNum === 1, {}, false, startLevelNum === 2, false, startLevelNum));
        setShowUpgrade(true);
    }
  };

  // ---- Survival (OVERDRIVE) rebuild checkpoints ----
  // Serializers mirror the loadout so a rebuild restores the exact build carried into a sector.
  const serializeTurrets = (list: any[]) =>
    (list || []).filter(t => t.hp > 0).map(t => ({
      id: t.id || Math.random().toString(36).substring(2, 9),
      type: t.type,
      pos: { x: t.pos?.x ?? 200, y: t.pos?.y ?? 200 },
      radius: t.radius || 16,
      hp: t.maxHp || t.hp || 200,
      maxHp: t.maxHp || 200,
      lastShot: 0,
      angle: t.angle || 0,
      color: t.color || '#38bdf8',
      level: t.level || 1,
      dmgLevel: t.dmgLevel,
      fireRateLevel: t.fireRateLevel
    }));

  const serializeMines = (list: any[]) =>
    (list || []).filter(m => m.hp > 0).map(m => ({
      id: m.id || Math.random().toString(36).substring(2, 9),
      type: m.type,
      pos: { x: m.pos?.x ?? 200, y: m.pos?.y ?? 200 },
      radius: m.radius || 15,
      hp: m.maxHp || m.hp || 150,
      maxHp: m.maxHp || 150,
      income: m.income || 25,
      levelProd: m.levelProd || 1,
      levelHp: m.levelHp || 1,
      pulseTimer: 0,
      angle: m.angle || 0
    }));

  const buildSurvivalSnapshot = (roomNum: number, hpOverride?: number): SurvivalSnapshot => ({
    room: roomNum,
    maxHp: engine.player.maxHp,
    hp: hpOverride ?? engine.player.maxHp, // Checkpoints restore a full hull; the quit-resume uses the actual level-start hull
    stats: JSON.parse(JSON.stringify(engine.player.stats)),
    statPickCounts: { ...statPickCounts },
    weapons: engine.player.weapons.map(w => ({ ...w })),
    abilities: engine.player.abilities.map(a => ({ ...a })),
    turrets: serializeTurrets(engine.turrets),
    mines: serializeMines(engine.mines)
  });

  // Restores a checkpoint snapshot exactly (loadout, turrets, mines) and drops the player into that room.
  const applySurvivalSnapshot = (snap: SurvivalSnapshot) => {
    setRoom(snap.room);
    setStatPickCounts(snap.statPickCounts || {});
    setShowUpgrade(false);
    setIsGameOver(false);
    setIsPlaying(true);
    gameAudio.playMusic('gameplay');

    engine.enemies = [];
    engine.spawnQueue = [];
    engine.waveQueue = [];
    engine.projectiles = [];
    engine.particles = [];
    engine.bombs = [];
    engine.clones = [];
    engine.enemiesKilled = 0;
    engine.currentRoom = snap.room;

    engine.turrets = (snap.turrets || []).map((t: any) => ({
      id: t.id || Math.random().toString(36).substring(2, 9),
      type: t.type,
      pos: { x: t.pos?.x ?? 200, y: t.pos?.y ?? 200 },
      radius: t.radius || 16,
      hp: t.maxHp || t.hp || 200,
      maxHp: t.maxHp || 200,
      lastShot: 0,
      angle: t.angle || 0,
      color: t.color || '#38bdf8',
      level: t.level || 1,
      dmgLevel: t.dmgLevel,
      fireRateLevel: t.fireRateLevel
    }));
    engine.mines = (snap.mines || []).map((m: any) => ({
      id: m.id || Math.random().toString(36).substring(2, 9),
      type: m.type,
      pos: { x: m.pos?.x ?? 200, y: m.pos?.y ?? 200 },
      radius: m.radius || 15,
      hp: m.maxHp || m.hp || 150,
      maxHp: m.maxHp || 150,
      income: m.income || 25,
      levelProd: m.levelProd || 1,
      levelHp: m.levelHp || 1,
      pulseTimer: 0,
      angle: m.angle || 0
    }));

    engine.player = engine.createPlayer();
    engine.player.maxHp = snap.maxHp || 300;
    engine.player.hp = snap.hp || snap.maxHp || 300;
    if (snap.stats) {
      engine.player.stats = { ...engine.player.stats, ...snap.stats };
    }
    // Unlock gates are boss-clear level milestones: SKILLS @20, DEFENSE @30, MINING @40.
    if (snap.room >= 20 || snap.stats?.isControlUnlocked) {
      engine.player.stats.isControlUnlocked = true;
    }
    if (snap.room >= 30 || snap.stats?.isTurretsUnlocked) {
      engine.player.stats.isTurretsUnlocked = true;
    }
    if (snap.room >= 40 || snap.stats?.isMinesUnlocked) {
      engine.player.stats.isMinesUnlocked = true;
    }
    // Re-arm the unlock gates to match the restored stats. A rebuild to a checkpoint
    // that predates a milestone (e.g. room 11) reverts the unlocks, so the "seen"
    // flags must clear too or the milestone boss on the way back up never re-unlocks.
    seenSkillsUnlockRef.current = Boolean(engine.player.stats.isControlUnlocked || (engine.player.stats.ownedControls && engine.player.stats.ownedControls.length > 0));
    seenDefenseUnlockRef.current = Boolean(engine.player.stats.isTurretsUnlocked);
    seenMiningUnlockRef.current = Boolean(engine.player.stats.isMinesUnlocked);
    if (snap.weapons && Array.isArray(snap.weapons)) {
      engine.player.weapons = snap.weapons.map((w: any) => ({ ...w }));
    }
    if (snap.abilities && Array.isArray(snap.abilities)) {
      engine.player.abilities = snap.abilities.map((a: any) => ({ ...a }));
    }

    startRoom(snap.room);
    setTick(t => t + 1);
  };

  // Spends one rebuild to restore the run from its latest boss-clear checkpoint.
  const handleRebuild = () => {
    const snap = survivalCheckpointRef.current;
    if (!snap || rebuildsLeft <= 0) return;
    setRebuildsLeft(prev => Math.max(0, prev - 1));
    applySurvivalSnapshot(snap);
  };

  // Resumes a persisted Survival run from its saved resume point (the start of the level you quit from).
  const handleResume = useCallback(() => {
    const raw = localStorage.getItem(RESUME_SAVE_KEY);
    if (!raw) return;
    try {
      const save = JSON.parse(raw) as ResumeSave;
      if (!save || !save.snapshot || !save.snapshot.room) return;
      setResumeSave(save);
      setGameMode('OVERDRIVE');
      setIsSandbox(false);
      setHasRevivedThisRun(false);
      setShowGiveUpConfirm(false);
      setRebuildsLeft(typeof save.rebuildsLeft === 'number' ? save.rebuildsLeft : 3);
      // The resume save IS the level-start restart point: respawning from it must restore it exactly.
      survivalCheckpointRef.current = save.snapshot;
      engine.gameMode = 'OVERDRIVE';
      applySurvivalSnapshot(save.snapshot);
      // The player quit with the upgrade picker open (level-clear pick or the
      // run's opening pick): restore the exact same offers instead of losing them.
      if (Array.isArray(save.pendingUpgrades) && save.pendingUpgrades.length > 0) {
        setAvailableUpgrades(save.pendingUpgrades);
        setShowUpgrade(true);
      }
    } catch (e) {
      console.error('Failed to resume run:', e);
      localStorage.removeItem(RESUME_SAVE_KEY);
      setResumeSave(null);
    }
  }, [engine, applySurvivalSnapshot]);

  const checkAndUnlockAchievements = useCallback((currentRoom: number) => {
    if (isSandbox) return;
    
    const triggerUnlock = (id: string, title: string, rewardName: string) => {
      if (unlockAchievement(id)) {
        gameAudio.playUpgradePickSound();
        crazyGames.happytime();
        setAchievementToast({ title, reward: rewardName });
        setTimeout(() => setAchievementToast(null), 4000);
      }
    };

    const activeWeapons = engine.player.weapons.map(w => w.type);
    
    if (gameMode === 'HARDCORE') {
      // 1. Clear Room 1 of Hardcore
      if (currentRoom >= 1) {
        triggerUnlock('camp_room1', 'Initiate Core', 'Vibrant Cyan Skin');
      }
      // 2. Beat Sector 1 Boss
      if (currentRoom >= 10) {
        triggerUnlock('camp_boss1', 'Guardian Demolisher I', 'Gilded Gold Skin');
      }
      // 3. Beat Sector 2 Boss
      if (currentRoom >= 20) {
        triggerUnlock('camp_boss2', 'Sector Sovereign II', 'Neon Magenta Skin');
      }
      // 4. Beat Sector 3 Boss
      if (currentRoom >= 30) {
        triggerUnlock('camp_boss3', 'Void Conqueror', 'Void Particle Trail');
      }
      // 5. Beat Room 100 Boss
      if (currentRoom >= 100) {
        triggerUnlock('camp_omega', 'Omega Override', 'Omega God Skin');
      }
      
      // 6. Clear 5 consecutive Campaign rooms without taking any damage
      const noDmgRooms = parseInt(localStorage.getItem('consecutive_no_damage_campaign') || '0', 10);
      const tookDmgCurRoom = (engine.player as any).tookDamageInCurRoom;
      if (!tookDmgCurRoom) {
        const nextNoDmg = noDmgRooms + 1;
        crazyGames.setItem('consecutive_no_damage_campaign', nextNoDmg.toString());
        if (nextNoDmg >= 5) {
          triggerUnlock('camp_nodmg', 'Immortal Core', 'Amethyst Crystal Skin');
        }
      } else {
        crazyGames.setItem('consecutive_no_damage_campaign', '0');
      }

      // 7. Have 5 or more active weapons equipped in Campaign
      if (engine.player.weapons.length >= 5) {
        triggerUnlock('camp_synergy', 'Perfect Synergy', 'Overcharged Core Skin');
      }

      // 8. Have both Bomb Launcher and Plasma Razor active
      if (activeWeapons.includes(WeaponType.BOMB_LAUNCHER) && activeWeapons.includes(WeaponType.PLASMA_RAZOR)) {
        triggerUnlock('camp_fusion', 'Nuclear Fusion', 'Inferno Orange Skin');
      }

      // 9. Freeze 10+ enemies simultaneously with Temporal Shift/Freeze
      const frozenEnemies = engine.enemies.filter(e => e.isSlowed || e.isFrozen).length;
      if (frozenEnemies >= 10) {
        triggerUnlock('camp_chrono', 'Chronoshift Overload', 'Chrono Glow Skin');
      }

      // 10. Defeat Room 50 boss in Hardcore
      if (currentRoom >= 50) {
        triggerUnlock('hard_sentinel', 'Void Sentinel Slayer', 'Void Eclipse Skin');
      }
    } else if (gameMode === 'SURVIVAL' || gameMode === 'OVERDRIVE') {
      // Survival achievements
      // 1. Reach Room 15
      if (currentRoom >= 15) {
        triggerUnlock('surv_room15', 'Survivalist Begin', 'Emerald Green Skin');
      }
      // 2. Reach Room 35
      if (currentRoom >= 35) {
        triggerUnlock('surv_room35', 'Infinite Warrior', 'Solar Flare Skin');
      }
      // 3. Reach Room 60
      if (currentRoom >= 60) {
        triggerUnlock('surv_room60', 'Sector Legend', 'Crimson Death Skin');
      }

      // 4. Clear a room of 30+ starting enemies without damage
      const tookDmgCurRoom = (engine.player as any).tookDamageInCurRoom;
      const initialEnemies = (engine as any).startingEnemiesInPlay || 0;
      if (initialEnemies >= 30 && !tookDmgCurRoom) {
        triggerUnlock('surv_untouchable', 'Untouchable Slick', 'Snow White Skin');
      }

      // 5. Equip Spinning Blade, Plasma Razor, and Arc Whip at the same time
      const hasSp = activeWeapons.some(w => w === WeaponType.SPINNING_BLADE || w === WeaponType.CHRONO_REAPER || w === WeaponType.VORTEX_SCYTHE);
      const hasPl = activeWeapons.some(w => w === WeaponType.PLASMA_RAZOR || w === WeaponType.NEUTRINO_SHREDDER || w === WeaponType.GOD_SLAYER_WHEEL);
      const hasArc = activeWeapons.some(w => w === WeaponType.CHAIN_ARC_SWORD || w === WeaponType.ARC_WHIP || w === WeaponType.THUNDER_GOD);
      if (hasSp && hasPl && hasArc) {
        triggerUnlock('surv_bladestorm', 'Bladestorm Enthusiast', 'Vortex Wind Trail');
      }

      // 6. Collect 5000+ Credits
      if ((engine.player.stats.currency || 0) >= 5000) {
        triggerUnlock('surv_wealth', 'Billionaire Sector', 'Rich Platinum Skin');
      }

      // 7. 15 turret kills in 5 seconds
      const glitchUnlock = localStorage.getItem('surv_turret_killed_15_in_5s') === 'true';
      if (glitchUnlock) {
        triggerUnlock('surv_matrix', 'Glitch in the Matrix', 'Matrix Hologram Skin');
      }

      // 8. Hit 25+ enemies in one Overdrive/Apex Overdrive cycle
      const hasOverdrive = engine.player.abilities.some(a => a.type === AbilityType.OVERDRIVE || a.type === AbilityType.APEX_OVERDRIVE);
      if (hasOverdrive && engine.enemiesKilled >= 25) {
        triggerUnlock('surv_overdrive', 'Absolute Overload', 'Deep Purple Obsidian Skin');
      }

      // 9. Clear Room 30 (Phantom Ace) in Survival
      if (currentRoom >= 30) {
        triggerUnlock('surv_phantom', 'Phantom Slayer', 'Phantom Split Skin');
      }

      // 10. Kill 1,500 enemies in one Survival run
      if (engine.enemiesKilled >= 1500) {
        triggerUnlock('surv_exterminator', 'Exterminator', 'Toxic Green Skin');
      }

      // 11. Reach Room 100 in Survival
      if (currentRoom >= 100) {
        triggerUnlock('surv_cryo', 'Cryo Conqueror', 'Frostbite Skin');
      }
    }
  }, [gameMode, isSandbox, engine]);

  const onRoomClear = useCallback(() => {
    gameAudio.playLevelClearSound();
    
    // Trigger happytime celebrations on sector/boss room clears
    const isBossRoom = room > 0 && room % 10 === 0;
    if (isBossRoom) {
      crazyGames.happytime();
      // Milestone badges: one per boss (10..100), tracked per mode
      if (!isSandbox && (gameMode === 'OVERDRIVE' || gameMode === 'HARDCORE')) {
        const earned = earnBadge(gameMode, room);
        if (earned) {
          setBadgeToast(earned);
          setTimeout(() => setBadgeToast(null), 4000);
        }
      }
    }

    // Evaluate achievements on room clear
    checkAndUnlockAchievements(room);

    if (isSandbox) {
        setRoom(prev => prev + 1);
        startRoom(room + 1);
        return;
    }
    
    setShowUpgrade(true);
    const upgradeCount = isBossRoom ? 3 : (engine.player.stats.upgradeChoicesCount ?? 3);
    setAvailableUpgrades(getRandomUpgrades(
      upgradeCount, 
      engine.player.weapons, 
      engine.player.abilities, 
      engine.player.stats, 
      room <= 0, 
      statPickCounts, 
      isSandbox, 
      room === 1 || room === 2,
      isBossRoom,
      room
    ));
  }, [engine.player.weapons, engine.player.abilities, engine.player.stats, room, statPickCounts, isSandbox, startRoom, checkAndUnlockAchievements]);

  useEffect(() => {
    if (!isSandbox && isPlaying && (gameMode === 'SURVIVAL' || gameMode === 'OVERDRIVE' || gameMode === 'HARDCORE')) {
      setHighestRoom(prev => {
        if (room > prev) {
          crazyGames.setItem('highest_room', room.toString());
          return room;
        }
        return prev;
      });
    }
  }, [room, isSandbox, isPlaying, gameMode]);

  // Unlock gates are boss-clear level milestones, not money:
  //   SKILLS  -> level 20 (boss room 20)
  //   DEFENSE -> level 30 (boss room 30)
  //   MINING  -> level 40 (boss room 40)
  // The popup fires once, right after the boss clear that reaches the milestone.
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    if (unlockModalType) return;

    const isTurretsUnlocked = engine.player.stats.isTurretsUnlocked;
    const isMinesUnlocked = engine.player.stats.isMinesUnlocked;
    const hasBoughtSkills = Boolean(engine.player.stats.isControlUnlocked || (engine.player.stats.ownedControls && engine.player.stats.ownedControls.length > 0));

    if (!hasBoughtSkills && room >= 20 && !seenSkillsUnlockRef.current) {
      seenSkillsUnlockRef.current = true;
      // Auto-unlock: reaching the milestone level IS the unlock (no manual button)
      engine.player.stats.isControlUnlocked = true;
      if (!engine.player.stats.ownedControls) engine.player.stats.ownedControls = [];
      if (!engine.player.stats.ownedControls.some(c => c.id === 'redirection_pull')) {
        engine.player.stats.ownedControls.push({ id: 'redirection_pull', level: 1 });
      }
      // The free pull is auto-equipped to left click
      if (!engine.player.stats.leftClickSlot) {
        engine.player.stats.leftClickSlot = 'redirection_pull';
      }
      setUnlockModalType('SKILLS');
    } else if (!isTurretsUnlocked && room >= 30 && !seenDefenseUnlockRef.current) {
      seenDefenseUnlockRef.current = true;
      engine.player.stats.isTurretsUnlocked = true;
      setUnlockModalType('DEFENSE');
    } else if (!isMinesUnlocked && room >= 40 && !seenMiningUnlockRef.current) {
      seenMiningUnlockRef.current = true;
      engine.player.stats.isMinesUnlocked = true;
      setUnlockModalType('MINING');
    }
  }, [room, engine.player.stats.isTurretsUnlocked, engine.player.stats.isMinesUnlocked, engine.player.stats.isControlUnlocked, engine.player.stats.ownedControls, isPlaying, isGameOver, isSandbox, unlockModalType]);

  const handleQuitToMenu = useCallback(() => {
    // Persist a resume point for Survival runs before tearing down:
    //  - alive: the exact state from the start of the current level (loadout + level-start hull)
    //  - dead (game over): the latest checkpoint restart, so quitting returns you to a restart
    let saved: ResumeSave | null = null;
    if (gameMode === 'OVERDRIVE') {
      if (!isGameOver) {
        saved = {
          mode: 'OVERDRIVE',
          snapshot: buildSurvivalSnapshot(room, roomStartHpRef.current),
          rebuildsLeft,
          savedAt: Date.now(),
          // Keep the exact offers that were on screen so resume can re-show them.
          // Only while the picker is actually open; a stale roll must never leak
          // into a save made from mid-room.
          pendingUpgrades: showUpgrade && availableUpgrades.length > 0 ? availableUpgrades : undefined
        };
      } else if (survivalCheckpointRef.current) {
        saved = {
          mode: 'OVERDRIVE',
          snapshot: survivalCheckpointRef.current,
          rebuildsLeft,
          savedAt: Date.now()
        };
      }
    }
    if (saved) {
      localStorage.setItem(RESUME_SAVE_KEY, JSON.stringify(saved));
      setResumeSave(saved);
    } else {
      localStorage.removeItem(RESUME_SAVE_KEY);
      setResumeSave(null);
    }

    gameAudio.playMusic('menu');
    setIsPlaying(false);
    setIsGameOver(false);
    setRebuildsLeft(0);
    survivalCheckpointRef.current = null;
    setShowUpgrade(false);
    setShowShop(false);
    setShopDefaultTab('STATS');
    setShowCompendium(false);
    setRoom(1);
    seenSkillsUnlockRef.current = false;
    seenDefenseUnlockRef.current = false;
    seenMiningUnlockRef.current = false;
    setUnlockModalType(null);
    
    // Clear engine states
    engine.enemies = [];
    engine.projectiles = [];
    engine.particles = [];
    engine.bombs = [];
    engine.clones = [];
    (engine as any).turrets = [];
    (engine as any).mines = [];
    engine.spawnQueue = [];
    engine.waveQueue = [];
  }, [engine, gameMode, isGameOver, room, rebuildsLeft, buildSurvivalSnapshot, showUpgrade, availableUpgrades]);

  const onGameOver = useCallback(() => {
    gameAudio.stopMusic();
    gameAudio.playGameOverSound();
    setIsGameOver(true);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    engine.onRoomClear = () => {
        setTimeout(() => onRoomClear(), 0);
    };
    engine.onGameOver = () => {
        setTimeout(() => onGameOver(), 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ability triggers based on assigned keys - only if the game is active
      if (isPlayingRef.current && !showUpgradeRef.current && !isGameOverRef.current && !showShopRef.current && !showCompendiumRef.current) {
        engine.player.abilities.forEach((ability, index) => {
          let shouldTrigger = (ability.key === e.code || ability.key === e.key);
          
          // Support 'T' (as well as 'R') for the 4th ability slot, and 'Y' (as well as 'F') for the 5th ability slot
          if (index === 3 && (e.code === 'KeyR' || e.code === 'KeyT' || e.key === 'r' || e.key === 'R' || e.key === 't' || e.key === 'T')) {
            shouldTrigger = true;
          }
          if (index === 4 && (e.code === 'KeyF' || e.code === 'KeyY' || e.key === 'f' || e.key === 'F' || e.key === 'y' || e.key === 'Y')) {
            shouldTrigger = true;
          }
          
          if (shouldTrigger) {
            engine.triggerAbility(index);
          }
        });
      }

      if (e.key === 'b' || e.key === 'B') {
        setShowShop(prev => {
          if (!prev) setShopDefaultTab('STATS');
          return !prev;
        });
      }
      if (e.key === 'p' || e.key === 'P') {
        setShowShop(true);
        setShopDefaultTab('SKILLS');
      }
      if (e.key === 'c' || e.key === 'C') setShowCompendium(prev => !prev);
      if (e.key === 'g' || e.key === 'G' || e.key === 'h' || e.key === 'H') setShowGuidebook(prev => !prev);
      if (isSandboxRef.current && (e.key === 'u' || e.key === 'U')) {
        const upgradeCount = engine.player.stats.upgradeChoicesCount ?? 3;
        setAvailableUpgrades(getRandomUpgrades(upgradeCount, engine.player.weapons, engine.player.abilities, engine.player.stats, false, statPickCountsRef.current, true));
        setShowUpgrade(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, onRoomClear, onGameOver]);

  const applyStatUpgrade = (upgrade: Upgrade, isRemoving: boolean = false) => {
    if (!upgrade.statKey || upgrade.value === undefined) return;

    const mult = isRemoving ? (1 / upgrade.value) : upgrade.value;
    const add = isRemoving ? -upgrade.value : upgrade.value;

    if (upgrade.statKey) {
      setStatPickCounts(prev => ({ 
        ...prev, 
        [upgrade.statKey!]: Math.max(0, (prev[upgrade.statKey!] || 0) + (isRemoving ? -1 : 1)) 
      }));
    }

    if (upgrade.statKey === 'speed') {
      engine.player.vel.x *= mult;
      engine.player.vel.y *= mult;
      engine.player.stats.speed *= mult;
    } else if (upgrade.statKey === 'bounceDmg') {
      engine.player.stats.bounceDmg += add;
    } else if (upgrade.statKey === 'maxHp') {
      engine.player.maxHp += add;
      if (!isRemoving) engine.player.hp = engine.player.maxHp;
      else engine.player.hp = Math.min(engine.player.hp, engine.player.maxHp);
    } else if (upgrade.statKey === 'critChance') {
      engine.player.stats.critChance = Math.min(0.95, engine.player.stats.critChance + add);
    } else if (upgrade.statKey === 'regen') {
      engine.player.stats.regen += add;
      engine.player.lastDamageTime = 0; // Trigger regen immediately off the bat when obtained
      if (!isRemoving) {
        engine.player.hp = Math.min(engine.player.maxHp, engine.player.hp + 25);
      }
    } else if (upgrade.statKey === 'lifesteal') {
      engine.player.stats.lifesteal += add;
    } else if (upgrade.statKey === 'defense') {
      engine.player.stats.defense = Math.min(30.0, engine.player.stats.defense + add);
      if (!engine.player.stats.damageReductionMultiplier) {
        engine.player.stats.damageReductionMultiplier = 1.0;
      }
      if (isRemoving) {
        engine.player.stats.damageReductionMultiplier /= (1 - upgrade.value);
      } else {
        engine.player.stats.damageReductionMultiplier *= (1 - upgrade.value);
      }
    } else if (upgrade.statKey === 'cooldownMult') {
      engine.player.stats.cooldownMult *= mult;
    } else if (upgrade.statKey === 'accuracy') {
      engine.player.stats.accuracy = Math.min(1.0, Math.max(0.15, (engine.player.stats.accuracy || 0.15) + add));
    } else if (upgrade.statKey === 'weaponSynergy') {
      engine.player.stats.weaponSynergy = Math.min(0.95, engine.player.stats.weaponSynergy + add);
    } else if (upgrade.statKey === 'meleeSpeed') {
      engine.player.stats.meleeSpeed = Math.max(0.1, (engine.player.stats.meleeSpeed || 1.0) * mult);
    } else if (upgrade.statKey === 'weaponSize') {
      engine.player.stats.weaponSize = Math.max(0.1, (engine.player.stats.weaponSize || 1.0) * mult);
    } else if (upgrade.statKey === 'projectileSlow') {
      engine.player.stats.projectileSlow = Math.max(0, (engine.player.stats.projectileSlow || 0) + add);
    } else if (upgrade.statKey === 'slowDmgBoost') {
      engine.player.stats.slowDmgBoost = Math.max(0, (engine.player.stats.slowDmgBoost || 0) + add);
    } else if (upgrade.statKey === 'fireDmgBoost') {
      engine.player.stats.fireDmgBoost = Math.max(0, (engine.player.stats.fireDmgBoost || 0) + add);
    } else if (upgrade.statKey === 'fireMeleeDmgBoost') {
      engine.player.stats.fireMeleeDmgBoost = Math.max(0, (engine.player.stats.fireMeleeDmgBoost || 0) + add);
    }
  };

  const advanceRoom = (nextRoom: number) => {
    setRoom(nextRoom);
    startRoom(nextRoom);
    if (gameMode?.includes('SANDBOX')) {
      engine.player.stats.isControlUnlocked = true;
    }

    // Survival (OVERDRIVE) checkpoints: captured at each sector start: the run's opening room (2) and
    // every room right after a boss clear (11, 21, 31…). A rebuild drops you back here with the exact
    // loadout you carried into the sector (post-boss-clear upgrade pick included), at full hull.
    const isSectorStart = nextRoom === 2 || (nextRoom > 1 && (nextRoom - 1) % 10 === 0);
    if (gameMode === 'OVERDRIVE' && isSectorStart) {
      survivalCheckpointRef.current = buildSurvivalSnapshot(nextRoom);
    }
  };

  const handleMaxAllWeapons = useCallback(() => {
    engine.player.weapons.forEach(w => {
      w.level = 10;
      w.damage = Math.max(w.damage * 2.5, 200);
      if (w.cooldown > 0) w.cooldown = Math.max(80, w.cooldown * 0.4);
      if (w.length) {
        if (w.type === WeaponType.CHRONO_REAPER || w.type === WeaponType.THUNDER_GOD) w.length = 150;
        else if (w.type === WeaponType.VORTEX_SCYTHE || w.type === WeaponType.ARC_WHIP) w.length = 115;
        else if (w.type === WeaponType.CHAIN_ARC_SWORD) w.length = 85;
        else w.length = 80;
      }
    });
    setTick(t => t + 1);
  }, [engine]);

  const handleClearWeapons = useCallback(() => {
    engine.player.weapons = [];
    setTick(t => t + 1);
  }, [engine]);

  const applyUpgrade = (upgrade: Upgrade) => {
    gameAudio.playUpgradePickSound();
    if (isSandbox) {
        if (upgrade.type === 'WEAPON') {
            const isLevelUp = upgrade.id.endsWith('_LEVEL_UP');
            const isLevelDown = upgrade.id.endsWith('_LEVEL_DOWN');
            const isLevelMax = upgrade.id.endsWith('_LEVEL_MAX');
            const isUnequip = upgrade.id.endsWith('_UNEQUIP');
            const cleanId = upgrade.id.replace('_LEVEL_UP', '').replace('_LEVEL_DOWN', '').replace('_LEVEL_MAX', '').replace('_UNEQUIP', '');
            const cleanUpgrade = { ...upgrade, id: cleanId };

            const existingIndex = engine.player.weapons.findIndex(w => w.type === upgrade.weaponType);

            if (isUnequip) {
                if (existingIndex !== -1) {
                    engine.player.weapons.splice(existingIndex, 1);
                    setTick(t => t + 1);
                }
                return;
            }

            if (isLevelMax) {
                if (existingIndex !== -1) {
                    const weapon = engine.player.weapons[existingIndex];
                    weapon.level = 10;
                    weapon.damage = Math.max(weapon.damage * 2.5, 200);
                    if (weapon.cooldown > 0) weapon.cooldown = Math.max(80, weapon.cooldown * 0.4);
                    if (weapon.type === WeaponType.SPINNING_BLADE || weapon.type === WeaponType.CHAIN_ARC_SWORD || weapon.type === WeaponType.VORTEX_SCYTHE) {
                        weapon.length = weapon.type === WeaponType.VORTEX_SCYTHE ? 115 : (weapon.type === WeaponType.CHAIN_ARC_SWORD ? 85 : 80);
                    }
                    setTick(t => t + 1);
                }
                return;
            }

            if (isLevelUp || isLevelDown) {
                if (existingIndex !== -1) {
                    const weapon = engine.player.weapons[existingIndex];
                    if (isLevelUp) {
                        weapon.level++;
                        weapon.damage *= 1.6;
                        if (weapon.cooldown > 0) weapon.cooldown *= 0.8;
                    } else { // LEVEL DOWN
                        if (weapon.level > 1) {
                            weapon.level--;
                            weapon.damage /= 1.6;
                            if (weapon.cooldown > 0) weapon.cooldown /= 0.8;
                        } else {
                            // below level 1, unequip
                            engine.player.weapons.splice(existingIndex, 1);
                        }
                    }
                    setTick(t => t + 1);
                }
                return;
            }

            if (existingIndex !== -1) {
                // Toggle Off
                engine.player.weapons.splice(existingIndex, 1);
                setTick(t => t + 1);
                return;
            }

            // Path Logic: find root/ancestor/descendant and unequip others in the same chain
            const getWeaponChain = (type: WeaponType): WeaponType[] => {
                const chain: WeaponType[] = [type];
                const visited = new Set<WeaponType>([type]);
                let current: WeaponType | undefined = type;
                let depth = 0;
                while (current && depth < 20) {
                    depth++;
                    const evo = [...EVOLVED_UPGRADES, ...ULTIMATE_UPGRADES].find(u => u.evolutionOf === current);
                    if (evo && evo.weaponType && !visited.has(evo.weaponType)) {
                        chain.push(evo.weaponType);
                        visited.add(evo.weaponType);
                        current = evo.weaponType;
                    } else { current = undefined; }
                }
                current = type;
                depth = 0;
                while (current && depth < 20) {
                    depth++;
                    const base = [...EVOLVED_UPGRADES, ...ULTIMATE_UPGRADES].find(u => u.weaponType === current);
                    if (base && base.evolutionOf && !visited.has(base.evolutionOf)) {
                        chain.unshift(base.evolutionOf);
                        visited.add(base.evolutionOf);
                        current = base.evolutionOf;
                    } else { current = undefined; }
                }
                return Array.from(new Set(chain));
            };

            const chain = getWeaponChain(upgrade.weaponType!);
            // Ensure only one weapon per PATH is equipped
            engine.player.weapons = engine.player.weapons.filter(w => !chain.includes(w.type));
            
            // Re-use logic for adding weapon
            const baseConfigs: Record<string, { dmg: number, cd: number, len?: number }> = {
                [WeaponType.SPINNING_BLADE]: { dmg: 40, cd: 0, len: 80 },
                [WeaponType.AUTO_TURRET]: { dmg: 30, cd: 600 },
                [WeaponType.FIRE_TRAIL]: { dmg: 25, cd: 0 },
                [WeaponType.ORBITAL_SHIELD]: { dmg: 20, cd: 0 },
                [WeaponType.MAGIC_BURST]: { dmg: 140, cd: 3000 },
                [WeaponType.CHAIN_ARC_SWORD]: { dmg: 35, cd: 0, len: 85 },
                [WeaponType.SHOTGUN]: { dmg: 22, cd: 2100 },
                [WeaponType.MAGIC_BLASTER]: { dmg: 25, cd: 1200 },
                [WeaponType.BOMB_LAUNCHER]: { dmg: 15, cd: 1800 },
                [WeaponType.CLONE_PROJECTION]: { dmg: 10, cd: 5000 },
                [WeaponType.PLASMA_RAZOR]: { dmg: 12, cd: 0 },
                [WeaponType.TESLA_COIL]: { dmg: 8, cd: 2000 },
                [WeaponType.GRAVITY_BEAM]: { dmg: 4, cd: 0 },
                [WeaponType.ION_CANNON]: { dmg: 60, cd: 3000 },
                [WeaponType.MINE_LAYER]: { dmg: 150, cd: 2500 },
                [WeaponType.PHOTON_REPEATER]: { dmg: 15, cd: 400 },
                [WeaponType.RICOCHET_CANNON]: { dmg: 40, cd: 1200 },
                [WeaponType.VORTEX_SCYTHE]: { dmg: 100, cd: 0, len: 115 },
                [WeaponType.ARC_WHIP]: { dmg: 60, cd: 0, len: 120 },
                [WeaponType.THUNDER_GOD]: { dmg: 80, cd: 0, len: 155 },
                [WeaponType.RAIL_GUN]: { dmg: 75, cd: 1000 },
                [WeaponType.OMEGA_BEAM]: { dmg: 95, cd: 2800 },
                [WeaponType.VOLCANIC_PLUME]: { dmg: 35, cd: 0 },
                [WeaponType.COSMIC_FLAME]: { dmg: 45, cd: 0 },
                [WeaponType.SENTINEL_DRONES]: { dmg: 50, cd: 0 },
                [WeaponType.CELESTIAL_GUARD]: { dmg: 60, cd: 0 },
                [WeaponType.SINGULARITY]: { dmg: 200, cd: 4200 },
                [WeaponType.VOID_EATER]: { dmg: 280, cd: 11000 },
                [WeaponType.FLAK_CANNON]: { dmg: 65, cd: 2800 },
                [WeaponType.OBLITERATOR_CANNON]: { dmg: 75, cd: 4800 },
                [WeaponType.SPELL_WEAVER]: { dmg: 60, cd: 1800 },
                [WeaponType.RECURSIVE_BOMB]: { dmg: 100, cd: 2500 },
                [WeaponType.SUPERNOVA_BOMB]: { dmg: 130, cd: 4800 },
                [WeaponType.HOLOGRAPHIC_ARMY]: { dmg: 30, cd: 6500 },
                [WeaponType.MIRAGE_LEGION]: { dmg: 25, cd: 12000 },
                [WeaponType.NEUTRINO_SHREDDER]: { dmg: 35, cd: 0 },
                [WeaponType.GOD_SLAYER_WHEEL]: { dmg: 50, cd: 0 },
                [WeaponType.STATIC_STORM]: { dmg: 40, cd: 2600 },
                [WeaponType.EMP_HARVESTER]: { dmg: 60, cd: 4800 },
                [WeaponType.EVENT_HORIZON]: { dmg: 25, cd: 0 },
                [WeaponType.SINGULARITY_CORE]: { dmg: 40, cd: 0 },
                [WeaponType.ORBITAL_STRIKE]: { dmg: 180, cd: 4000 },
                [WeaponType.DEATH_STAR_BEAM]: { dmg: 240, cd: 7500 },
                [WeaponType.SENSOR_CLUSTER]: { dmg: 300, cd: 3400 },
                [WeaponType.VOID_MINES]: { dmg: 380, cd: 6000 },
                [WeaponType.LANCE_ARRAY]: { dmg: 40, cd: 650 },
                [WeaponType.HYPER_LIGHT_ARRAY]: { dmg: 50, cd: 1400 },
                [WeaponType.REFRACTION_LANCE]: { dmg: 90, cd: 1600 },
                [WeaponType.ECHO_STRIKE]: { dmg: 120, cd: 3200 },
                [WeaponType.CHRONO_REAPER]: { dmg: 160, cd: 0, len: 150 },
                [WeaponType.ICE_SWORD]: { dmg: 35, cd: 0 },
                [WeaponType.GLACIAL_GREATSWORD]: { dmg: 75, cd: 0 },
                [WeaponType.ABSOLUTE_ZERO_SIPHON]: { dmg: 85, cd: 0 },
                [WeaponType.FIRE_SWORD]: { dmg: 15, cd: 0 },
                [WeaponType.SOLAR_ECLIPSE_BLADE]: { dmg: 55, cd: 0 },
                [WeaponType.SUPERNOVA_SLAYER]: { dmg: 70, cd: 0 }
            };
            const config = baseConfigs[upgrade.weaponType!] || { dmg: 20, cd: 1500 };
            engine.player.weapons.push({
                type: upgrade.weaponType!,
                level: 1,
                damage: config.dmg,
                cooldown: config.cd,
                lastUsed: 0,
                angle: 0,
                length: config.len || 0,
                isEvolved: upgrade.tier && upgrade.tier > 1
            });
            setTick(t => t + 1);
            return;
        }

        if (upgrade.type === 'ABILITY') {
            const existingIndex = engine.player.abilities.findIndex(a => a.type === upgrade.abilityType);
            if (existingIndex !== -1) {
                // If already equipped, unequip it
                engine.player.abilities.splice(existingIndex, 1);
                setTick(t => t + 1);
                return;
            }

            // Un-equip other abilities in the same evolution line
            const getAbilityChain = (type: AbilityType): AbilityType[] => {
                const chain: AbilityType[] = [type];
                const visited = new Set<AbilityType>([type]);
                let current: AbilityType | undefined = type;
                let depth = 0;
                while (current && depth < 20) {
                    depth++;
                    const evo = EVOLVED_ABILITIES.find(u => (u.evolutionOf as unknown as AbilityType) === current);
                    if (evo && evo.abilityType && !visited.has(evo.abilityType)) {
                        chain.push(evo.abilityType);
                        visited.add(evo.abilityType);
                        current = evo.abilityType;
                    } else { current = undefined; }
                }
                current = type;
                depth = 0;
                while (current && depth < 20) {
                    depth++;
                    const base = EVOLVED_ABILITIES.find(u => u.abilityType === current);
                    if (base && base.evolutionOf && !visited.has(base.evolutionOf as unknown as AbilityType)) {
                        chain.unshift(base.evolutionOf as unknown as AbilityType);
                        visited.add(base.evolutionOf as unknown as AbilityType);
                        current = base.evolutionOf as unknown as AbilityType;
                    } else { current = undefined; }
                }
                return Array.from(new Set(chain));
            };

            const chain = getAbilityChain(upgrade.abilityType!);
            engine.player.abilities = engine.player.abilities.filter(a => !chain.includes(a.type));

            // Enforce 5 ability limit even in sandbox
            if (engine.player.abilities.length >= 5) {
                engine.player.abilities.shift();
            }

            const indexMap: Record<AbilityType, number> = {
                [AbilityType.DASH]: 0,
                [AbilityType.SHIELD_BURST]: 1,
                [AbilityType.SHOCKWAVE]: 2,
                [AbilityType.TOXIC_CLOUD]: 3,
                [AbilityType.CHAIN_LIGHTNING]: 4,
                [AbilityType.FROST_NOVA]: 5,
                [AbilityType.HEALING_AURA]: 6,
                [AbilityType.METEOR_STRIKE]: 7,
                [AbilityType.BLOOD_LUST]: 8,
                [AbilityType.TIME_WARP]: 9,
                [AbilityType.OVERDRIVE]: 10,
                [AbilityType.BOUNCE_SHOTS]: 11,
                [AbilityType.BLIZZARD]: 12,
                [AbilityType.INFERNO]: 13,
                [AbilityType.DIMENSIONAL_DASH]: 0,
                [AbilityType.PLASMA_NOVA]: 1,
                [AbilityType.TEMPORAL_COLLAPSE]: 9,
                [AbilityType.APEX_OVERDRIVE]: 10,
                [AbilityType.SEISMIC_CRUSHER]: 2,
                [AbilityType.CORROSIVE_DECAY]: 3,
                [AbilityType.THUNDERBOLT_STORM]: 4,
                [AbilityType.ABSOLUTE_ZERO_RIPPLE]: 5,
                [AbilityType.NANITE_AEGIS]: 6,
                [AbilityType.SUPERNOVA_RAIN]: 7,
                [AbilityType.SANGUINE_FRENZY]: 8,
                [AbilityType.KINETIC_BOUNCE_STORM]: 11,
                [AbilityType.FROSTBITE_TEMPEST]: 12,
                [AbilityType.HELLFIRE_STORM]: 13
            };
            const keys = ['KeyQ', 'KeyE', 'KeyT', 'KeyY', 'KeyV', 'KeyX', 'KeyR', 'KeyF', 'KeyG', 'KeyH'];
            const abilityKey = keys[indexMap[upgrade.abilityType!] % keys.length];

            engine.player.abilities.push({
                type: upgrade.abilityType!,
                level: 1,
                cooldown: 5000,
                lastUsed: 0,
                isActive: false,
                key: abilityKey,
                duration: 5000,
                name: upgrade.name
            });
            setTick(t => t + 1);
            return;
        }

        if (upgrade.type === 'STAT') {
            const isRemoving = upgrade.id.endsWith('_REMOVE');
            const cleanId = isRemoving ? upgrade.id.replace('_REMOVE', '') : upgrade.id;
            const cleanUpgrade = { ...upgrade, id: cleanId };

            if (isRemoving && (!sandboxStatCounts[cleanId] || sandboxStatCounts[cleanId] <= 0)) return;

            applyStatUpgrade(cleanUpgrade, isRemoving);
            setSandboxStatCounts(prev => ({
                ...prev,
                [cleanId]: Math.max(0, (prev[cleanId] || 0) + (isRemoving ? -1 : 1))
            }));
            setTick(t => t + 1);
            return;
        }
    }

    if (upgrade.type === 'WEAPON') {
      const evolutionTarget = upgrade.evolutionOf;
      if (evolutionTarget) {
        const index = engine.player.weapons.findIndex(w => w.type === evolutionTarget);
        if (index !== -1) {
          const old = engine.player.weapons[index];
          const isTier3 = upgrade.tier === 3 || (upgrade as any).isUltimate;
          engine.player.weapons[index] = {
            type: upgrade.weaponType!,
            level: 1,
            damage: old.damage * (isTier3 ? 1.15 : 2.0),
            cooldown: old.cooldown * (isTier3 ? 1.35 : 0.85),
            lastUsed: old.lastUsed,
            angle: old.angle || 0,
            length: (upgrade.weaponType === WeaponType.CHRONO_REAPER || upgrade.weaponType === WeaponType.THUNDER_GOD) 
              ? 150 
              : ((upgrade.weaponType === WeaponType.VORTEX_SCYTHE || upgrade.weaponType === WeaponType.ARC_WHIP) ? 115 : 80),
            isEvolved: true
          };
          
          setShowUpgrade(false);
          if (!isSandbox) {
            advanceRoom(room + 1);
          }
          return;
        }
      }

      const existing = engine.player.weapons.find(w => w.type === upgrade.weaponType);
      if (existing) {
        existing.level++;
        existing.damage *= 1.6;
        if (existing.cooldown > 0) existing.cooldown *= 0.95;
        
        if (existing.type === WeaponType.PLASMA_RAZOR || existing.type === WeaponType.TESLA_COIL) {
            existing.damage *= 1.4; // High frequency weapons scale slightly differently
        }
      } else {
        const baseConfigs: Record<string, { dmg: number, cd: number, len?: number }> = {
            [WeaponType.SPINNING_BLADE]: { dmg: 40, cd: 0, len: 80 },
            [WeaponType.AUTO_TURRET]: { dmg: 30, cd: 600 },
            [WeaponType.FIRE_TRAIL]: { dmg: 25, cd: 0 },
            [WeaponType.ORBITAL_SHIELD]: { dmg: 20, cd: 0 },
            [WeaponType.MAGIC_BURST]: { dmg: 140, cd: 3000 },
            [WeaponType.CHAIN_ARC_SWORD]: { dmg: 35, cd: 0, len: 85 },
            [WeaponType.SHOTGUN]: { dmg: 22, cd: 2100 },
            [WeaponType.MAGIC_BLASTER]: { dmg: 25, cd: 1200 },
            [WeaponType.BOMB_LAUNCHER]: { dmg: 15, cd: 1800 },
            [WeaponType.CLONE_PROJECTION]: { dmg: 10, cd: 5000 },
            [WeaponType.PLASMA_RAZOR]: { dmg: 12, cd: 0 },
            [WeaponType.TESLA_COIL]: { dmg: 8, cd: 2000 },
            [WeaponType.GRAVITY_BEAM]: { dmg: 4, cd: 0 },
            [WeaponType.ION_CANNON]: { dmg: 60, cd: 3000 },
            [WeaponType.MINE_LAYER]: { dmg: 150, cd: 2500 },
            [WeaponType.PHOTON_REPEATER]: { dmg: 15, cd: 400 },
            [WeaponType.RICOCHET_CANNON]: { dmg: 40, cd: 1200 },
            [WeaponType.RAIL_GUN]: { dmg: 75, cd: 1000 },
            [WeaponType.OMEGA_BEAM]: { dmg: 95, cd: 2800 },
            [WeaponType.FLAK_CANNON]: { dmg: 65, cd: 2800 },
            [WeaponType.OBLITERATOR_CANNON]: { dmg: 75, cd: 4800 },
            [WeaponType.SPELL_WEAVER]: { dmg: 60, cd: 1800 },
            [WeaponType.RECURSIVE_BOMB]: { dmg: 100, cd: 2500 },
            [WeaponType.SUPERNOVA_BOMB]: { dmg: 130, cd: 4800 },
            [WeaponType.LANCE_ARRAY]: { dmg: 40, cd: 650 },
            [WeaponType.HYPER_LIGHT_ARRAY]: { dmg: 50, cd: 1400 },
            [WeaponType.REFRACTION_LANCE]: { dmg: 90, cd: 1600 },
            [WeaponType.ECHO_STRIKE]: { dmg: 120, cd: 3200 },
            [WeaponType.ICE_SWORD]: { dmg: 35, cd: 0 },
            [WeaponType.GLACIAL_GREATSWORD]: { dmg: 75, cd: 0 },
            [WeaponType.ABSOLUTE_ZERO_SIPHON]: { dmg: 85, cd: 0 },
            [WeaponType.FIRE_SWORD]: { dmg: 15, cd: 0 },
            [WeaponType.SOLAR_ECLIPSE_BLADE]: { dmg: 55, cd: 0 },
            [WeaponType.SUPERNOVA_SLAYER]: { dmg: 70, cd: 0 }
        };

        const config = baseConfigs[upgrade.weaponType!] || { dmg: 20, cd: 1500 };
        engine.player.weapons.push({
          type: upgrade.weaponType!,
          level: 1,
          damage: config.dmg,
          cooldown: config.cd,
          lastUsed: 0,
          angle: 0,
          length: config.len || 0
        });
      }
    } else if (upgrade.type === 'STAT') {
      applyStatUpgrade(upgrade);
    } else if (upgrade.type === 'ABILITY') {
      const evolutionTarget = upgrade.evolutionOf as unknown as AbilityType;
      if (evolutionTarget) {
        const index = engine.player.abilities.findIndex(a => a.type === evolutionTarget);
        if (index !== -1) {
          const old = engine.player.abilities[index];
          const evolvedConfigs: Record<string, any> = {
            [AbilityType.DIMENSIONAL_DASH]: { name: 'Dimensional Dash', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.TEMPORAL_COLLAPSE]: { name: 'Temporal Collapse', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.PLASMA_NOVA]: { name: 'Plasma Nova', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.05, 8000) },
            [AbilityType.APEX_OVERDRIVE]: { name: 'Apex Overdrive', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.SEISMIC_CRUSHER]: { name: 'Seismic Crusher', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.CORROSIVE_DECAY]: { name: 'Corrosive Decay', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.THUNDERBOLT_STORM]: { name: 'Thunderbolt Storm', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.ABSOLUTE_ZERO_RIPPLE]: { name: 'Absolute Zero Ripple', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.NANITE_AEGIS]: { name: 'Nanite Aegis', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.SUPERNOVA_RAIN]: { name: 'Supernova Rain', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.SANGUINE_FRENZY]: { name: 'Sanguine Frenzy', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.KINETIC_BOUNCE_STORM]: { name: 'Kinetic Bounce Storm', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.FROSTBITE_TEMPEST]: { name: 'Frostbite Tempest', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
            [AbilityType.HELLFIRE_STORM]: { name: 'Hellfire Storm', cd: Math.max(old.cooldown * 0.90, 2000), dur: Math.min(old.duration * 1.10, 8000) },
          };
          const conf = evolvedConfigs[upgrade.abilityType!];
          if (conf) {
            engine.player.abilities[index] = {
              ...old,
              type: upgrade.abilityType!,
              name: upgrade.name || conf.name,
              cooldown: conf.cd,
              duration: conf.dur,
              level: 1
            };
            
            setShowUpgrade(false);
            if (!isSandbox) {
                advanceRoom(room + 1);
            }
            return;
          }
        }
      }

      const existing = engine.player.abilities.find(a => a.type === upgrade.abilityType);
      if (existing) {
        const maxLevel = getAbilityMaxLevel(existing.type);
        if (existing.level < maxLevel) {
          existing.level = Math.min(maxLevel, existing.level + 1);
          // Nerf: only 1.5% cooldown reduction per level instead of 5%
          existing.cooldown = Math.max(existing.cooldown * 0.985, 2000);
          if (existing.duration > 0) {
            // Nerf: only 1% duration increase per level
            existing.duration = Math.min(existing.duration * 1.01, 8000);
          }
        }
      } else {
          const abilityConfigs: Record<string, any> = {
              [AbilityType.SHIELD_BURST]: { name: 'Shield Nova', cd: 8000, dur: 500 },
              [AbilityType.DASH]: { name: 'Overdrive Dash', cd: 3000, dur: 200 },
              [AbilityType.SHOCKWAVE]: { name: 'Shockwave Blast', cd: 10000, dur: 300 },
              [AbilityType.TOXIC_CLOUD]: { name: 'Toxic Cloud', cd: 15000, dur: 5000 },
              [AbilityType.CHAIN_LIGHTNING]: { name: 'Volt Cascade', cd: 10000, dur: 500 },
              [AbilityType.FROST_NOVA]: { name: 'Glacier Pulse', cd: 12000, dur: 1000 },
              [AbilityType.HEALING_AURA]: { name: 'Repair Nanites', cd: 20000, dur: 3000 },
              [AbilityType.METEOR_STRIKE]: { name: 'Orbital Strike', cd: 18000, dur: 2000 },
              [AbilityType.BLOOD_LUST]: { name: 'Berserker Engine', cd: 25000, dur: 5000 },
              [AbilityType.TIME_WARP]: { name: 'Temporal Shift', cd: 15000, dur: 3000 },
              [AbilityType.OVERDRIVE]: { name: 'Combat Overdrive', cd: 20000, dur: 5000 },
              [AbilityType.BOUNCE_SHOTS]: { name: 'Bouncing Rounds', cd: 18000, dur: 5000 },
              [AbilityType.BLIZZARD]: { name: 'Glacial Blizzard', cd: 16000, dur: 4000 },
              [AbilityType.INFERNO]: { name: 'Inferno Flames', cd: 16000, dur: 4500 },
              [AbilityType.DIMENSIONAL_DASH]: { name: 'Dimensional Dash', cd: 5000, dur: 250 },
              [AbilityType.TEMPORAL_COLLAPSE]: { name: 'Temporal Collapse', cd: 15000, dur: 3000 },
              [AbilityType.PLASMA_NOVA]: { name: 'Plasma Nova', cd: 8050, dur: 500 },
              [AbilityType.APEX_OVERDRIVE]: { name: 'Apex Overdrive', cd: 15000, dur: 5000 },
              [AbilityType.SEISMIC_CRUSHER]: { name: 'Seismic Crusher', cd: 8000, dur: 500 },
              [AbilityType.CORROSIVE_DECAY]: { name: 'Corrosive Decay', cd: 11000, dur: 5000 },
              [AbilityType.THUNDERBOLT_STORM]: { name: 'Thunderbolt Storm', cd: 8000, dur: 500 },
              [AbilityType.ABSOLUTE_ZERO_RIPPLE]: { name: 'Absolute Zero Ripple', cd: 9000, dur: 1000 },
              [AbilityType.NANITE_AEGIS]: { name: 'Nanite Aegis', cd: 15000, dur: 3000 },
              [AbilityType.SUPERNOVA_RAIN]: { name: 'Supernova Rain', cd: 14000, dur: 2000 },
              [AbilityType.SANGUINE_FRENZY]: { name: 'Sanguine Frenzy', cd: 18000, dur: 5000 },
              [AbilityType.KINETIC_BOUNCE_STORM]: { name: 'Kinetic Bounce Storm', cd: 13000, dur: 5000 },
              [AbilityType.FROSTBITE_TEMPEST]: { name: 'Frostbite Tempest', cd: 12000, dur: 4000 },
              [AbilityType.HELLFIRE_STORM]: { name: 'Hellfire Storm', cd: 12000, dur: 4500 },
          };
          const conf = abilityConfigs[upgrade.abilityType!];
          if (conf) {
            const ABILITY_KEYS = ['Space', 'KeyQ', 'KeyE', 'KeyT', 'KeyY'];
            const usedKeys = engine.player.abilities.map(a => a.key);
            const nextKey = ABILITY_KEYS.find(k => !usedKeys.includes(k)) || 'KeyG';

            engine.player.abilities.push({
                type: upgrade.abilityType!,
                name: upgrade.name || conf.name,
                cooldown: conf.cd,
                duration: conf.dur,
                lastUsed: 0,
                isActive: false,
                level: 1,
                key: nextKey
            });
          }
      }
    }

    setShowUpgrade(false);
    if (!isSandbox) {
      advanceRoom(room + 1);
    }
  };

  return (
    <div className={`w-full h-screen text-white flex items-center justify-center p-2 sm:p-4 transition-colors duration-500 relative overflow-hidden bg-black safe-area-padding`} >
      <SiteBackgroundGrid />
      <div className={`relative z-10 w-full max-w-[1360px] h-full max-h-[820px] flex flex-col overflow-hidden transition-all duration-300 ${
        retroTheme 
          ? 'retro-theme-active font-retro bg-[#060608]'
          : 'game-font-jbmono font-sans bg-black' /* EXPERIMENT: JetBrains Mono across in-game UI (revert = remove game-font-jbmono) */
      }`}>
        
        
        <AnimatePresence>
          {!isPlaying && !isGameOver && (
            <TitleScreen onStart={handleStart} highestRoom={highestRoom} onShowSettings={() => setShowSettings(true)} resumeRoom={resumeSave?.snapshot.room ?? null} onResume={handleResume} />
          )}
        </AnimatePresence>

        {(isPlaying || isGameOver) && (
          <>
            <HUD 
              engine={engine} 
              room={room} 
              score={score} 
              highestRoom={highestRoom}
              isSandbox={isSandbox}
              gameMode={gameMode}
              rebuildsLeft={gameMode === 'OVERDRIVE' ? rebuildsLeft : undefined}
              onShowShop={() => {
                setShopDefaultTab('STATS');
                setShowShop(true);
              }} 
              onShowCompendium={() => setShowCompendium(true)} 
              onShowSettings={() => setShowSettings(true)}
              onShowGuidebook={() => setShowGuidebook(true)}
              onRoomChange={(r) => {
                setRoom(r);
                startRoom(r);
              }}
              onQuitToMenu={handleQuitToMenu}
            />
            
            <div className="flex-1 flex gap-2 sm:gap-6 min-h-0 overflow-hidden relative">
              {/* Arena column: boss bar sits above the game frame so it never covers gameplay */}
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Boss Health Bar (above the arena frame) */}
                {(() => {
                  const activeBoss = engine.enemies.find(e => e.isBoss && !e.isDead);
                  if (!activeBoss) return null;
                  const hpPct = activeBoss.maxHp > 0 ? (activeBoss.hp / activeBoss.maxHp) * 100 : 0;
                  const shieldPct = (activeBoss.shieldHp && activeBoss.shieldHp > 0 && activeBoss.maxShieldHp) 
                    ? (activeBoss.shieldHp / activeBoss.maxShieldHp) * 100 : 0;
                  return (
                    <div id="boss-health-bar-container" className="max-w-xl w-[92%] mx-auto mb-2 z-30 bg-zinc-950/90 border border-red-500/40 p-2.5 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.25)] flex flex-col gap-1.5 select-none pointer-events-none backdrop-blur-md animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                        <span className="text-white flex items-center gap-1.5 font-sans">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          SECTOR BOSS: {activeBoss.bossSubtype || 'HOSTILE'}
                          {activeBoss.bossStage && activeBoss.bossStage > 1 && (
                            <span className="ml-2 text-[9px] bg-red-600/30 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded font-black tracking-wide animate-pulse">
                              PHASE {activeBoss.bossStage}
                            </span>
                          )}
                        </span>
                        <span className="text-zinc-400 font-mono text-[10px]">
                          {Math.ceil(activeBoss.hp)} / {Math.ceil(activeBoss.maxHp)} ({Math.max(0, Math.round(hpPct))}%)
                        </span>
                      </div>
                      
                      {/* Gauge */}
                      <div className="w-full h-3 bg-zinc-900 rounded border border-zinc-800 overflow-hidden relative">
                        {/* Boss Health Fill */}
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all duration-75 animate-pulse"
                          style={{ width: `${Math.max(0, hpPct)}%` }}
                        />
                        
                        {/* Shield Overlay */}
                        {shieldPct > 0 && (
                          <div 
                            className="absolute bottom-0 left-0 h-1 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-75"
                            style={{ width: `${Math.max(0, shieldPct)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Arena Container */}
                <div id="arena-container" className={`relative flex-1 overflow-hidden transition-colors duration-1000 ${retroTheme ? 'bg-[#030306]' : 'bg-black'} ${room % 10 === 0 ? 'shadow-[0_0_25px_rgba(220,38,38,0.25)]' : ''}`}>
                  <GameCanvas engine={engine} isPaused={showUpgrade || isGameOver || showShop || showCompendium || showSettings || showGuidebook || Boolean(unlockModalType) || showSandboxModal} room={room} />
                  
                  {/* MOBILE: on-screen joystick + action buttons (touch devices only, hidden while paused/menus open) */}
                  {isTouch && !showUpgrade && !isGameOver && !showShop && !showCompendium && !showSettings && !showGuidebook && !showSandboxModal && (
                    <TouchControls engine={engine} tick={tick} />
                  )}
                  
                  {/* Real-time Rate Indicators: DPS & Mining CPS */}
                  <div className="absolute bottom-4 left-4 z-20 flex flex-row gap-2 select-none">
                  {/* DPS Counter Overlay */}
                  <div id="dps-counter" className="bg-zinc-950/80 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 text-cyan-400 border-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <span>DPS: {engine.getDPS()}</span>
                  </div>

                  {/* Credits Per Second Overlay */}
                  {engine.player.stats.isMinesUnlocked && (
                    <div id="credits-sec-counter" className="bg-zinc-950/80 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 text-emerald-400 border-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span>CPS: +{engine.getMinersCPS()} Cr/s</span>
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Sidebar */}
              <SidebarStats engine={engine} room={room} />
            </div>

            <ShopPanel 
                engine={engine} 
                isOpen={showShop} 
                onClose={() => {
                  setShowShop(false);
                  setShopDefaultTab('STATS');
                }} 
                isSandbox={isSandbox} 
                onUpdate={() => setTick(t => t + 1)}
                defaultTab={shopDefaultTab}
                room={room}
            />

            <UnlockRecommendationModal
                isOpen={Boolean(unlockModalType)}
                type={unlockModalType}
                isSandbox={isSandbox}
                onOpenShopTab={(tab) => {
                  setShopDefaultTab(tab);
                  setShowShop(true);
                }}
                onClose={() => setUnlockModalType(null)}
            />

            <SandboxCompendiumModal
                isOpen={showSandboxModal}
                onOpenCompendium={() => {
                  setShowSandboxModal(false);
                  setShowCompendium(true);
                }}
                onClose={() => setShowSandboxModal(false)}
            />

            <AnimatePresence>
              {showCompendium && (
                <Compendium 
                  onClose={() => setShowCompendium(false)} 
                  isSandbox={isSandbox} 
                  ownedWeapons={engine.player.weapons.map(w => w.type)}
                  weaponLevels={engine.player.weapons.reduce((acc, w) => {
                    acc[w.type] = w.level;
                    return acc;
                  }, {} as Record<string, number>)}
                  playerWeapons={engine.player.weapons}
                  playerAbilities={engine.player.abilities}
                  playerStats={engine.player.stats}
                  playerMaxHp={engine.player.maxHp}
                  onClearWeapons={handleClearWeapons}
                  onMaxAllWeapons={handleMaxAllWeapons}
                  ownedAbilities={engine.player.abilities.map(a => a.type)}
                  statPickCounts={statPickCounts}
                  sandboxStatCounts={sandboxStatCounts}
                  onSelect={(u) => {
                    applyUpgrade(u);
                    // Keep compendium open after applying
                  }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showUpgrade && (
                <UpgradeMenu 
                  upgrades={availableUpgrades} 
                  onSelect={applyUpgrade} 
                  playerWeapons={engine.player.weapons}
                  playerAbilities={engine.player.abilities}
                  playerStats={engine.player.stats}
                  onClose={isSandbox ? () => setShowUpgrade(false) : undefined}
                />
              )}
            </AnimatePresence>
          </>
        )}

        <AnimatePresence>
          {isGameOver && (() => {
            const isFinalDeath = gameMode !== 'OVERDRIVE' || rebuildsLeft <= 0;
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
              >
                {/* Red death flash */}
                <motion.div
                  initial={{ opacity: isFinalDeath ? 0.7 : 0.45 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute inset-0 pointer-events-none bg-red-600/25"
                />
                {/* Shockwave rings */}
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={`ring-${i}`}
                    initial={{ scale: 0.1, opacity: 0.8 }}
                    animate={{ scale: 3.2, opacity: 0 }}
                    transition={{ duration: 0.9, delay, ease: 'easeOut' }}
                    className={`absolute left-1/2 top-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full pointer-events-none border-2 ${
                      isFinalDeath ? 'border-red-500' : 'border-red-500/70'
                    }`}
                  />
                ))}
                {/* Vignette for final death */}
                {isFinalDeath && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0.35] }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(127,29,29,0.5) 100%)' }}
                  />
                )}
                <motion.div
                  initial={{ opacity: 0, scale: isFinalDeath ? 0.6 : 1.15, y: isFinalDeath ? 0 : 24 }}
                  animate={{
                    opacity: 1,
                    scale: isFinalDeath ? [0.6, 1.08, 1] : 1,
                    y: 0,
                    x: isFinalDeath ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
                  }}
                  transition={isFinalDeath
                    ? { duration: 0.45, ease: 'easeOut' }
                    : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-md space-ui-bg border-2 border-red-500/40 rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.3)] flex flex-col overflow-hidden"
                >

                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <Skull size={24} />
                      </div>
                      <motion.h2
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: [0, 1, 0.3, 1, 0.5, 1], x: [-6, 3, -2, 0] }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-3xl sm:text-4xl font-black italic uppercase leading-none tracking-tight text-white"
                      >
                        {t('game_over', {}, 'Hull Destroyed')}
                      </motion.h2>
                      {isFinalDeath && (
                        <span className="px-2 py-0.5 text-xs bg-red-950/80 text-red-300 border border-red-500/40 rounded font-mono font-black uppercase tracking-wider">
                          {t('final_death_tag', {}, 'No Rebuilds Left')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative z-10 p-6 flex flex-col items-center gap-5">
                    <div className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono mb-2">{t('final_performance', {}, 'Final Performance')}</div>
                      <div className="text-3xl sm:text-4xl font-black italic uppercase leading-none tracking-tight text-white">{t('room_label')} {room}</div>
                      <div className="text-xs text-zinc-400 font-mono uppercase mt-2">
                        {t('highest_room_record', {}, 'Highest Room')}: {Math.max(highestRoom || 1, room)}
                      </div>
                      {gameMode === 'OVERDRIVE' && rebuildsLeft > 0 && (
                        <div className="text-sm font-black uppercase tracking-wide text-emerald-400 mt-2">
                          {t('rebuilds_left', {}, 'Rebuilds Left')}: {rebuildsLeft}
                          {survivalCheckpointRef.current && <> &middot; {t('checkpoint_room', {}, 'Checkpoint')}: {t('room_label')} {survivalCheckpointRef.current.room}</>}
                        </div>
                      )}
                      {gameMode === 'HARDCORE' && (
                        <div className="text-sm font-black uppercase tracking-wide text-red-400 mt-2">
                          {t('hardcore_no_mercy', {}, 'Hardcore Protocol · No Checkpoints · No Rebuilds')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {(() => {
                        const snap = survivalCheckpointRef.current;
                        const canRebuild = gameMode === 'OVERDRIVE' && rebuildsLeft > 0 && !!snap;
                        return (
                          <>
                            {canRebuild && (
                              <motion.button 
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleRebuild}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 text-white font-mono font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                              >
                                {t('rebuild_label', {}, 'REBUILD')}
                              </motion.button>
                            )}
                            {canRebuild ? (
                              <motion.button 
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { gameAudio.playButtonClickSound(); setShowGiveUpConfirm(true); }}
                                className="px-8 py-3 bg-zinc-900 hover:bg-red-600 border-2 border-zinc-700 hover:border-red-400 text-zinc-300 hover:text-white font-mono font-black uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer"
                              >
                                {t('give_up_label', {}, 'GIVE UP')}
                              </motion.button>
                            ) : (
                              <motion.button 
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { gameAudio.playButtonClickSound(); handleQuitToMenu(); }}
                                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono font-black uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer"
                              >
                                {t('retry_label', {}, 'RETRY')}
                              </motion.button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        <AnimatePresence>
          {showGiveUpConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="relative w-full max-w-sm space-ui-bg border-2 border-red-500/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col overflow-hidden pointer-events-auto"
              >
                <div className="relative z-10 p-6 flex flex-col gap-4 text-center">
                  <div className="mx-auto p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <TriangleAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-black italic uppercase text-lg tracking-tight">{t('give_up_confirm_title', {}, 'Give Up?')}</h3>
                    <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                      {t('give_up_confirm_desc', {}, 'You will not use your rebuild and all progress in this run will be lost.')}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={() => { gameAudio.playButtonClickSound(); setShowGiveUpConfirm(false); }}
                      className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all border-2 border-zinc-700 cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => { gameAudio.playButtonClickSound(); setShowGiveUpConfirm(false); handleQuitToMenu(); }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                    >
                      {t('give_up_confirm_btn', {}, 'GIVE UP')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <SettingsModal onClose={() => setShowSettings(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGuidebook && (
            <Guidebook isOpen={showGuidebook} onClose={() => setShowGuidebook(false)} isSandbox={isSandbox} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {badgeToast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-6 right-6 z-[1000] bg-[#0a0a14] border-2 rounded-xl p-4 shadow-lg flex items-center gap-4"
              style={{ borderColor: badgeToast.color, boxShadow: `0 0 30px ${badgeToast.color}55` }}
            >
              <BadgeEmblem emblem={badgeToast.emblem} color={badgeToast.color} size={30} jagged={gameMode === 'HARDCORE'} />
              <div className="flex-1">
                <h4 className="text-sm font-black text-white uppercase tracking-wide">
                  {badgeToast.name} <span style={{ color: badgeToast.color }}>{t('unlocked', {}, 'Unlocked')}</span>
                </h4>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {achievementToast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-6 right-6 z-[1000] max-w-sm bg-[#0a0a14] border-2 border-amber-500 rounded-xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-start gap-4"
            >
              <div className="p-2 bg-amber-500 text-black rounded-lg shrink-0">
                <Trophy size={20} className="stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white uppercase tracking-wide">
                  {achievementToast.title} <span className="text-amber-400">{t('unlocked', {}, 'Unlocked')}</span>
                </h4>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

