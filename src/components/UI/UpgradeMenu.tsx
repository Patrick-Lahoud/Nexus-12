import { motion } from 'motion/react';
import { type Upgrade, EVOLVED_UPGRADES, EVOLVED_ABILITIES, ULTIMATE_UPGRADES, getAbilityMaxLevel } from '../../game/upgrades.ts';
import { Weapon, ActiveAbility } from '../../game/types.ts';
import { useLanguage } from '../../game/localization';
import { Sparkles, Zap } from 'lucide-react';

interface UpgradeMenuProps {
  upgrades: Upgrade[];
  onSelect: (upgrade: Upgrade) => void;
  playerWeapons: Weapon[];
  playerAbilities: ActiveAbility[];
  playerStats: any;
  onClose?: () => void;
}

export default function UpgradeMenu({ upgrades, onSelect, playerWeapons, playerAbilities, playerStats, onClose }: UpgradeMenuProps) {
  const { t } = useLanguage();
  const isBossWeaponReward = playerWeapons.length > 0 && upgrades.length > 0 && upgrades.every(u => u.type === 'WEAPON' && !playerWeapons.some(w => w.type === u.weaponType));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-end justify-center p-3 sm:p-4 pointer-events-none overflow-hidden"
    >
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="w-[98%] max-w-[1440px] space-ui-bg border border-cyan-500/50 rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.95)] select-none pointer-events-auto max-h-[85vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex justify-between items-center w-full mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className={isBossWeaponReward ? "text-amber-400" : "text-cyan-400"} size={20} />
            <h1 className="text-sm md:text-base font-black tracking-widest text-white font-mono uppercase">
              {isBossWeaponReward 
                ? t('boss_reward_title', {}, 'SECTOR BOSS DEFEATED — CHOOSE A NEW WEAPON')
                : t('choose_upgrade', {}, 'CHOOSE YOUR UPGRADE')}
            </h1>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-3 py-1 font-mono text-xs font-bold uppercase rounded-lg transition-colors"
            >
              {t('close_menu_btn', {}, 'Close')}
            </button>
          )}
        </div>

      <div className={`grid grid-cols-1 ${
        upgrades.length === 4 
          ? 'xs:grid-cols-2 md:grid-cols-4' 
          : upgrades.length === 5 
            ? 'xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' 
            : upgrades.length >= 6 
              ? 'xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' 
              : 'sm:grid-cols-2 lg:grid-cols-3'
      } gap-4`}>
        {upgrades.map((upgrade, index) => {
          let ownedItem: any = null;
          let levelLabel = t('new_label', {}, 'NEW');
          let isLevelUp = false;
          let nextMutationLevel: number | null = null;

          if (upgrade.type === 'WEAPON') {
            const exactOwned = playerWeapons.find(w => w.type === upgrade.weaponType);
            const baseOwned = upgrade.evolutionOf ? playerWeapons.find(w => w.type === upgrade.evolutionOf) : null;
            
            ownedItem = exactOwned || baseOwned;
            isLevelUp = !!ownedItem;
            levelLabel = exactOwned 
              ? `${t('level_label', {}, 'LEVEL')} ${exactOwned.level + 1}` 
              : (baseOwned ? `${t('evolve', {}, 'EVOLVE')}` : t('new_label', {}, 'NEW'));

            // Target weapon type to check for upcoming mutations
            const targetWeaponType = exactOwned ? exactOwned.type : (upgrade.weaponType || (baseOwned ? baseOwned.type : undefined));
            if (targetWeaponType) {
              const evo = EVOLVED_UPGRADES.find(e => e.evolutionOf === targetWeaponType);
              if (evo) {
                nextMutationLevel = evo.evolutionLevel || 7;
              } else {
                const ult = ULTIMATE_UPGRADES.find(u => u.evolutionOf === targetWeaponType);
                if (ult) {
                  nextMutationLevel = ult.evolutionLevel || 15;
                }
              }
            }
          } else if (upgrade.type === 'ABILITY') {
            const exactOwned = playerAbilities.find(a => a.type === upgrade.abilityType);
            const baseOwned = upgrade.evolutionOf ? playerAbilities.find(a => a.type === (upgrade.evolutionOf as any)) : null;

            ownedItem = exactOwned || baseOwned;
            isLevelUp = !!ownedItem;
            const maxLvl = exactOwned ? getAbilityMaxLevel(exactOwned.type) : 15;
            levelLabel = exactOwned 
              ? (exactOwned.level + 1 > maxLvl ? `${t('level_label', {}, 'LEVEL')} ${exactOwned.level} (MAX)` : `${t('level_label', {}, 'LEVEL')} ${exactOwned.level + 1}`) 
              : (baseOwned ? `${t('evolve', {}, 'EVOLVE')}` : t('new_label', {}, 'NEW'));

            const targetAbilityType = exactOwned ? exactOwned.type : (upgrade.abilityType || (baseOwned ? baseOwned.type : undefined));
            if (targetAbilityType) {
              const evo = EVOLVED_ABILITIES.find(e => (e.evolutionOf as unknown as string) === targetAbilityType);
              if (evo) {
                nextMutationLevel = evo.evolutionLevel || 15;
              }
            }
          } else if (upgrade.type === 'STAT') {
            const baseStats: any = { speed: 1.2, bounceDmg: 10, maxHp: 300, regen: 0.6, lifesteal: 0, defense: 1.0, critChance: 0.05, cooldownMult: 1.0, weaponSynergy: 0.1 };
            const currentVal = playerStats[upgrade.statKey!];
            const baseVal = baseStats[upgrade.statKey!];
            isLevelUp = upgrade.statKey ? (currentVal !== undefined && Math.abs(currentVal - baseVal) > 0.001) : false;
            levelLabel = isLevelUp ? t('evolve', {}, 'UPGRADE') : t('new_label', {}, 'NEW');
          }

          // A card is an actual mutation unlock choice IF it is an evolution/ultimate of an owned item that the player DOES NOT YET OWN as the evolved form:
          const isWeaponMutationUnlock = upgrade.type === 'WEAPON' && Boolean(upgrade.evolutionOf) && !playerWeapons.some(w => w.type === upgrade.weaponType);
          const isAbilityMutationUnlock = upgrade.type === 'ABILITY' && Boolean(upgrade.evolutionOf) && !playerAbilities.some(a => a.type === upgrade.abilityType);
          const isStatMutationUnlock = upgrade.type === 'STAT' && upgrade.id.startsWith('stat_god_');

          const isActualMutation = isWeaponMutationUnlock || isAbilityMutationUnlock || isStatMutationUnlock;
          const showProgressMutationBanner = !isActualMutation && Boolean(ownedItem) && (upgrade.type === 'WEAPON' || upgrade.type === 'ABILITY') && nextMutationLevel !== null && ((ownedItem.level + 1) <= nextMutationLevel);

          const isLegendary = (upgrade.tier && upgrade.tier >= 3) || (upgrade.type === 'WEAPON' && index === 2);
          const isRare = (upgrade.tier && upgrade.tier === 2) || (upgrade.type === 'WEAPON' && index === 1);
          
          let cardBorder = 'border-cyan-500/60 hover:border-cyan-400 bg-zinc-900/90 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]';
          let badgeBg = 'bg-cyan-500 text-black';
          let rarityLabel = t('common_rarity', {}, 'COMMON');

          if (isLegendary) {
            rarityLabel = t('legendary_rarity', {}, 'LEGENDARY');
            cardBorder = 'border-amber-500/80 hover:border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]';
            badgeBg = 'bg-amber-500 text-black';
          } else if (isRare) {
            rarityLabel = t('rare_rarity', {}, 'RARE');
            cardBorder = 'border-purple-500/80 hover:border-purple-400 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]';
            badgeBg = 'bg-purple-600 text-white';
          }

          let typeLabel = t('stat_label', {}, 'STAT');
          if (upgrade.type === 'WEAPON') {
            typeLabel = t('weapon', {}, 'WEAPON');
          } else if (upgrade.type === 'ABILITY') {
            typeLabel = t('ability_label', {}, 'ABILITY');
          }

          return (
            <motion.div
              key={`${upgrade.id}-${index}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(upgrade)}
              className={`relative overflow-hidden rounded-xl border transition-all duration-150 group cursor-pointer flex flex-col justify-between min-h-[160px] md:min-h-[175px] ${cardBorder}`}
            >
              {isActualMutation && (
                <div className="w-full bg-amber-400 text-zinc-950 text-[10.5px] sm:text-xs font-mono font-black py-1.5 px-3 text-center uppercase tracking-wider flex items-center justify-center gap-1.5 border-b border-amber-500 shadow-sm shrink-0">
                  <Zap size={13} className="fill-zinc-950 text-zinc-950 shrink-0" />
                  <span>{t('unlock_mutation_banner', {}, 'Unlock Mutation')}</span>
                </div>
              )}

              {showProgressMutationBanner && (
                <div className="w-full bg-white text-zinc-950 text-[10.5px] sm:text-xs font-mono font-black py-1.5 px-3 text-center uppercase tracking-wider flex items-center justify-center gap-1.5 border-b border-zinc-300 shadow-sm shrink-0">
                  <Zap size={13} className="fill-zinc-950 text-zinc-950 shrink-0" />
                  <span>{t('upgrade_for_mutation_banner', { level: nextMutationLevel }, `Next mutation unlocked at level ${nextMutationLevel}`)}</span>
                </div>
              )}

              <div className="p-5 flex flex-col justify-between flex-1 gap-3">
                <div className="flex justify-between items-center w-full gap-2">
                  <span className={`text-xs font-mono uppercase tracking-wider font-black px-2.5 py-1 rounded-md ${badgeBg}`}>
                    {rarityLabel} {typeLabel}
                  </span>
                  
                  <span className={`text-xs font-mono uppercase font-black tracking-wider text-amber-300 bg-black/50 px-2.5 py-1 rounded-md border border-zinc-700`}>
                    {levelLabel}
                  </span>
                </div>

                <div>
                  <h3 className="font-sans text-lg md:text-xl font-black uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    {t('up_name_' + upgrade.id, {}, upgrade.name)}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed line-clamp-3 font-medium">
                  {t('up_desc_' + upgrade.id, {}, upgrade.description)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  </motion.div>
);
}
