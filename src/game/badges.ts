import { crazyGames } from './crazygames';

// A badge is earned by defeating the boss at its milestone room (10, 20, ... 100).
export interface Badge {
  id: string;
  room: number;
  name: string;
  requirement: string;
  emblem: 'circle' | 'hex' | 'shield' | 'diamond' | 'star' | 'chevron' | 'ring' | 'cross' | 'tri' | 'blade';
  color: string;
}

export const BADGE_MODES = ['SURVIVAL', 'HARDCORE'] as const;
export type BadgeMode = (typeof BADGE_MODES)[number];

export const SURVIVAL_BADGES: Badge[] = [
  { id: 'surv_b10', room: 10, name: 'First Steel', requirement: 'Defeat the Room 10 boss', emblem: 'circle', color: '#fbbf24' },
  { id: 'surv_b20', room: 20, name: 'Titan Breaker', requirement: 'Defeat the Room 20 boss', emblem: 'hex', color: '#f59e0b' },
  { id: 'surv_b30', room: 30, name: 'Phantom Slayer', requirement: 'Defeat the Room 30 boss', emblem: 'shield', color: '#d97706' },
  { id: 'surv_b40', room: 40, name: 'Storm Rider', requirement: 'Defeat the Room 40 boss', emblem: 'diamond', color: '#eab308' },
  { id: 'surv_b50', room: 50, name: 'Void Watcher', requirement: 'Defeat the Room 50 boss', emblem: 'star', color: '#facc15' },
  { id: 'surv_b60', room: 60, name: 'Hive Cracker', requirement: 'Defeat the Room 60 boss', emblem: 'chevron', color: '#f97316' },
  { id: 'surv_b70', room: 70, name: 'Time Breaker', requirement: 'Defeat the Room 70 boss', emblem: 'ring', color: '#fbbf24' },
  { id: 'surv_b80', room: 80, name: 'Gravity Heart', requirement: 'Defeat the Room 80 boss', emblem: 'cross', color: '#fb923c' },
  { id: 'surv_b90', room: 90, name: 'Plague End', requirement: 'Defeat the Room 90 boss', emblem: 'tri', color: '#e7b10a' },
  { id: 'surv_b100', room: 100, name: 'Absolute Zero', requirement: 'Defeat the Room 100 boss', emblem: 'blade', color: '#fde047' },
];

export const HARDCORE_BADGES: Badge[] = [
  { id: 'hard_b10', room: 10, name: 'No Return', requirement: 'Defeat the Room 10 boss', emblem: 'circle', color: '#f87171' },
  { id: 'hard_b20', room: 20, name: 'Iron Maw', requirement: 'Defeat the Room 20 boss', emblem: 'hex', color: '#ef4444' },
  { id: 'hard_b30', room: 30, name: 'Edge of Ruin', requirement: 'Defeat the Room 30 boss', emblem: 'shield', color: '#dc2626' },
  { id: 'hard_b40', room: 40, name: 'Stormbreaker', requirement: 'Defeat the Room 40 boss', emblem: 'diamond', color: '#f87171' },
  { id: 'hard_b50', room: 50, name: 'Void Impaler', requirement: 'Defeat the Room 50 boss', emblem: 'star', color: '#b91c1c' },
  { id: 'hard_b60', room: 60, name: 'Hive Executioner', requirement: 'Defeat the Room 60 boss', emblem: 'chevron', color: '#ef4444' },
  { id: 'hard_b70', room: 70, name: 'Time Crusher', requirement: 'Defeat the Room 70 boss', emblem: 'ring', color: '#dc2626' },
  { id: 'hard_b80', room: 80, name: 'Devourer of Worlds', requirement: 'Defeat the Room 80 boss', emblem: 'cross', color: '#f87171' },
  { id: 'hard_b90', room: 90, name: 'Pandemic Slayer', requirement: 'Defeat the Room 90 boss', emblem: 'tri', color: '#b91c1c' },
  { id: 'hard_b100', room: 100, name: 'The Last Blade', requirement: 'Defeat the Room 100 boss', emblem: 'blade', color: '#fca5a5' },
];

export const getBadgesForMode = (mode: string): Badge[] =>
  mode === 'HARDCORE' ? HARDCORE_BADGES : SURVIVAL_BADGES;

const storageKey = (mode: string) => (mode === 'HARDCORE' ? 'hard_badges' : 'surv_badges');

export const getEarnedBadges = (mode: string): string[] => {
  try {
    const raw = localStorage.getItem(storageKey(mode));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const earnBadge = (mode: string, room: number): Badge | null => {
  const badge = getBadgesForMode(mode).find(b => b.room === room);
  if (!badge) return null;
  const earned = getEarnedBadges(mode);
  if (earned.includes(badge.id)) return null;
  crazyGames.setItem(storageKey(mode), JSON.stringify([...earned, badge.id]));
  return badge;
};
