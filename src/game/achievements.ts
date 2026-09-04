import { crazyGames } from './crazygames';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'campaign' | 'survival';
  reward: {
    type: 'skin' | 'aura';
    id: string;
    name: string;
    previewColor: string;
  };
  conditionText: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // CAMPAIGN ACHIEVEMENTS
  {
    id: 'camp_room1',
    title: 'Initiate Core',
    description: 'Establish combat operations by completing Room 1 of the Campaign.',
    type: 'campaign',
    reward: { type: 'skin', id: 'vibrant_cyan', name: 'Vibrant Cyan Skin', previewColor: '#22d3ee' },
    conditionText: 'Complete Campaign Room 1'
  },
  {
    id: 'camp_boss1',
    title: 'Guardian Demolisher I',
    description: 'Override Sector 1 security systems by defeating the Sentinel Boss in Room 10.',
    type: 'campaign',
    reward: { type: 'skin', id: 'gilded_gold', name: 'Gilded Gold Skin', previewColor: '#eab308' },
    conditionText: 'Defeat Sector 1 Boss (Room 10)'
  },
  {
    id: 'camp_boss2',
    title: 'Sector Sovereign II',
    description: 'Annihilate Sector 2 security arrays by destroying the Dual Heavy Guardians in Room 20.',
    type: 'campaign',
    reward: { type: 'skin', id: 'neon_magenta', name: 'Neon Magenta Skin', previewColor: '#ec4899' },
    conditionText: 'Defeat Sector 2 Boss (Room 20)'
  },
  {
    id: 'camp_boss3',
    title: 'Void Conqueror',
    description: 'Purge Sector 3 subroutines by banishing the Void Singularity in Room 30.',
    type: 'campaign',
    reward: { type: 'aura', id: 'void_particle', name: 'Void Particle Trail', previewColor: '#a855f7' },
    conditionText: 'Defeat Sector 3 Boss (Room 30)'
  },
  {
    id: 'camp_omega',
    title: 'Omega Override',
    description: 'Achieve ultimate mastery and unlock final systems by conquering Room 100.',
    type: 'campaign',
    reward: { type: 'skin', id: 'omega_god', name: 'Omega God Skin', previewColor: '#dc2626' },
    conditionText: 'Conquer Campaign Room 100'
  },
  {
    id: 'camp_nodmg',
    title: 'Immortal Core',
    description: 'Maintain absolute defense by completing 5 consecutive Campaign rooms without taking any damage.',
    type: 'campaign',
    reward: { type: 'aura', id: 'amethyst_aura', name: 'Amethyst Energy Aura', previewColor: '#c084fc' },
    conditionText: 'Clear 5 consecutive Rooms with 0 damage taken'
  },
  {
    id: 'camp_synergy',
    title: 'Perfect Synergy',
    description: 'Overload weapon capacities by having 5 or more active weapons equipped at the same time in Campaign.',
    type: 'campaign',
    reward: { type: 'aura', id: 'overcharged_sparks', name: 'Overcharged Sparks', previewColor: '#fb923c' },
    conditionText: 'Equip 5+ weapons simultaneously'
  },
  {
    id: 'camp_fusion',
    title: 'Nuclear Fusion',
    description: 'Equip both the heavy Bomb Launcher and the high-frequency Plasma Razor inside the Campaign.',
    type: 'campaign',
    reward: { type: 'skin', id: 'inferno_orange', name: 'Inferno Orange Skin', previewColor: '#f97316' },
    conditionText: 'Have Bomb Launcher & Plasma Razor active'
  },
  {
    id: 'camp_chrono',
    title: 'Time Lock Sovereign',
    description: 'Freeze 10 or more dangerous hostiles simultaneously using the Time Warp active ability context.',
    type: 'campaign',
    reward: { type: 'skin', id: 'chrono_glow', name: 'Chrono Glow Skin', previewColor: '#60a5fa' },
    conditionText: 'Freeze 10+ enemies with Time Warp'
  },

  // SURVIVAL ACHIEVEMENTS
  {
    id: 'surv_room15',
    title: 'Survivalist Begin',
    description: 'Prove your tactical stamina by surviving until Room 15 in infinite Survival mode.',
    type: 'survival',
    reward: { type: 'skin', id: 'emerald_green', name: 'Emerald Green Skin', previewColor: '#10b981' },
    conditionText: 'Reach Room 15 in Survival'
  },
  {
    id: 'surv_room35',
    title: 'Infinite Warrior',
    description: 'Push beyond limits by reaching Room 35 in infinite Survival mode as an ultimate combatant.',
    type: 'survival',
    reward: { type: 'aura', id: 'solar_flare', name: 'Solar Flare Aura', previewColor: '#f59e0b' },
    conditionText: 'Reach Room 35 in Survival'
  },
  {
    id: 'surv_room60',
    title: 'Sector Legend',
    description: 'Ascend to absolute legend by enduring until Room 60 of infinite manual Survival.',
    type: 'survival',
    reward: { type: 'skin', id: 'crimson_death', name: 'Crimson Death Skin', previewColor: '#b91c1c' },
    conditionText: 'Reach Room 60 in Survival'
  },
  {
    id: 'surv_matrix',
    title: 'Glitch in the Matrix',
    description: 'Unleash absolute automated firepower by having your turrets annihilate 15 enemies within 5 seconds.',
    type: 'survival',
    reward: { type: 'skin', id: 'matrix_hologram', name: 'Matrix Hologram Skin', previewColor: '#84cc16' },
    conditionText: 'Get 15 turret kills in 5 seconds in Survival'
  },
  {
    id: 'surv_untouchable',
    title: 'Untouchable Slick',
    description: 'Survive and clear a room starting with 30 or more swarming enemies without a single scratch.',
    type: 'survival',
    reward: { type: 'skin', id: 'snow_white', name: 'Snow White Skin', previewColor: '#ffffff' },
    conditionText: 'Clear 30+ enemy Room with 0 damage taken'
  },
  {
    id: 'surv_bladestorm',
    title: 'Bladestorm Enthusiast',
    description: 'Unleash a flurry of steel and blade particles by equipping Spinning Blade, Plasma Razor, and Arc Whip together.',
    type: 'survival',
    reward: { type: 'aura', id: 'vortex_trail', name: 'Vortex Wind Trail', previewColor: '#a855f7' },
    conditionText: 'Equip Spinning Blade, Plasma Razor & Arc Whip'
  },
  {
    id: 'surv_wealth',
    title: 'Billionaire Sector',
    description: 'Collect and hoard 5,000 or more hardware credits in a single continuous SurvivalSector attempt.',
    type: 'survival',
    reward: { type: 'skin', id: 'rich_platinum', name: 'Rich Platinum Skin', previewColor: '#e2e8f0' },
    conditionText: 'Collect 5,000+ Credits in one Survival run'
  },
  {
    id: 'surv_overloaded',
    title: 'Overloaded Strike',
    description: 'Force systems into absolute overdrive by hitting 25 enemies within a brief overload cycle.',
    type: 'survival',
    reward: { type: 'skin', id: 'deep_obsidian', name: 'Deep Purple Obsidian Skin', previewColor: '#4f46e5' },
    conditionText: 'Hit 25+ enemies in one Overdrive cycle'
  }
];

export const getUnlockedAchievements = (): string[] => {
  try {
    const data = localStorage.getItem('game_unlocked_achievements');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const saveUnlockedAchievements = (unlockedIds: string[]) => {
  crazyGames.setItem('game_unlocked_achievements', JSON.stringify(unlockedIds));
};

export const unlockAchievement = (id: string): boolean => {
  const unlocked = getUnlockedAchievements();
  if (unlocked.includes(id)) return false;
  
  const updated = [...unlocked, id];
  saveUnlockedAchievements(updated);
  return true;
};

export const getEquippedSkin = (): string => {
  return localStorage.getItem('game_equipped_skin') || 'classic';
};

export const setEquippedSkin = (skinId: string) => {
  crazyGames.setItem('game_equipped_skin', skinId);
};

export const getEquippedAura = (): string => {
  return localStorage.getItem('game_equipped_aura') || 'none';
};

export const setEquippedAura = (auraId: string) => {
  crazyGames.setItem('game_equipped_aura', auraId);
};
