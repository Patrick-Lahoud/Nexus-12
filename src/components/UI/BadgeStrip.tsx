import { getBadgesForMode, getEarnedBadges } from '../../game/badges';
import BadgeEmblem from './BadgeEmblem';

interface BadgeStripProps {
  mode: 'SURVIVAL' | 'HARDCORE';
}

// Minimal badge rail: shows every earned badge, then the next badge to earn
// with its requirement. One badge per boss milestone (10..100).
export default function BadgeStrip({ mode }: BadgeStripProps) {
  const badges = getBadgesForMode(mode);
  const earned = getEarnedBadges(mode);
  const nextBadge = badges.find(b => !earned.includes(b.id));

  return (
    <div className="mt-4">
      <p className="text-xs text-white uppercase tracking-widest font-bold text-center mb-2">
        Badges
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {badges.map(b => {
          const has = earned.includes(b.id);
          // Show all earned badges; for the first locked one show the outline
          // (next target); skip the rest to keep the rail minimal.
          if (!has && b.id !== nextBadge?.id) return null;
          return (
            <div
              key={b.id}
              className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-colors ${
                has
                  ? 'border-zinc-800 bg-zinc-900/60'
                  : 'border-zinc-900 bg-transparent'
              }`}
              title={has ? b.name : b.requirement}
            >
              <BadgeEmblem emblem={b.emblem} color={b.color} size={26} dimmed={!has} jagged={mode === 'HARDCORE'} />
            </div>
          );
        })}
      </div>
      {nextBadge && (
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-2 text-center">
          Next {nextBadge.requirement}
        </p>
      )}
      {badges.every(b => earned.includes(b.id)) && (
        <p className="text-xs text-amber-400 uppercase tracking-widest font-bold mt-2 text-center">
          All badges earned
        </p>
      )}
    </div>
  );
}
