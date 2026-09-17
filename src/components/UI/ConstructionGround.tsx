import React from 'react';
import { GameEngine } from '../../game/engine';
import { 
  Zap, 
  Flame, 
  Activity, 
  Layers, 
  Wrench, 
  Lock, 
  Shield, 
  X,
  Plus,
  Target,
  Cpu,
  FlaskConical,
  ChevronRight,
  Pocket,
  Info
} from 'lucide-react';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';

interface ConstructionGroundProps {
  engine: GameEngine;
  onUpdate: () => void;
  isSandbox?: boolean;
}

const TURRET_DATA = [
  {
    id: 'turret_tesla',
    name: 'Tesla Sentry',
    description: 'Fires chaining lightning arcs shocking up to 2 closest threats within range.',
    cost: 2000,
    icon: Zap,
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/20 shadow-blue-500/10',
    btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
  },
  {
    id: 'turret_sword',
    name: 'Blade Spinner Sentry',
    description: 'Rapidly spins heavy laser swords slicing adversaries in close contact.',
    cost: 2500,
    icon: Flame,
    color: 'text-orange-400 border-orange-500/30 bg-orange-950/20 shadow-orange-500/10',
    btnColor: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
  },
  {
    id: 'turret_autoshooter',
    name: 'Auto-Gunner Sentry',
    description: 'Equipped with heavy rapid kinetic gun barrels tracking nearest targets.',
    cost: 1800,
    icon: Activity,
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20 shadow-purple-500/10',
    btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
  },
  {
    id: 'turret_ricochet',
    name: 'Ricochet Emplace',
    description: 'Fires high-velocity emerald cells that bounce deflectively up to 3 times.',
    cost: 3600,
    icon: Layers,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/10',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
  },
  {
    id: 'turret_shotgun',
    name: 'Scatter Sentry',
    description: 'Fires a heavy spread of 5 kinetic shotgun pellets at nearby targets.',
    cost: 2200,
    icon: Target,
    color: 'text-rose-400 border-rose-500/30 bg-rose-950/20 shadow-rose-500/10',
    btnColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
  },
  {
    id: 'turret_fire',
    name: 'Volcanic Pyro Sentry',
    description: 'Spews direct bursts of high-temperature fire streams igniting enemies.',
    cost: 2400,
    icon: FlaskConical,
    color: 'text-red-400 border-red-500/30 bg-red-950/20 shadow-red-500/10',
    btnColor: 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
  },
  {
    id: 'turret_shield',
    name: 'Aegis Barrier Sentry',
    description: 'Projects energy force fields that push back and deflect nearby targets.',
    cost: 2800,
    icon: Shield,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-cyan-500/10',
    btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
  },
  {
    id: 'turret_bomb',
    name: 'Supernova Mortar',
    description: 'Launches heavy long-range mortar bombs exploding in high splash zones.',
    cost: 2700,
    icon: Cpu,
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/20 shadow-amber-500/10',
    btnColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
  },
  {
    id: 'turret_plasma',
    name: 'Plasma Razor Sentry',
    description: 'Erects high-intensity pink laser lines that continuously slice intruders.',
    cost: 2600,
    icon: ChevronRight,
    color: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/20 shadow-fuchsia-500/10',
    btnColor: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-500/20'
  }
];

export const getTurretUpgradeCost = (level: number) => {
  return Math.floor(1500 * Math.pow(1.5, level - 1));
};

export const getMaxTurretCapCost = (currentMax: number) => {
  return Math.floor(4000 * Math.pow(2.0, currentMax - 3));
};

export default function ConstructionGround({ engine, onUpdate, isSandbox }: ConstructionGroundProps) {
  const { t } = useLanguage();
  const stats = engine.player.stats;
  const currency = stats.currency || 0;
  const isUnlocked = stats.isTurretsUnlocked || false;

  const maxCap = stats.maxTurrets || 3;
  const activeTurretsCount = engine.turrets ? engine.turrets.filter(t => t.hp > 0).length : 0;
  const maxTurretsUpgradeCost = getMaxTurretCapCost(maxCap);

  // Initialize properties
  if (!stats.turretHpLevels) {
    stats.turretHpLevels = {
      turret_tesla: 1,
      turret_sword: 1,
      turret_autoshooter: 1,
      turret_ricochet: 1,
      turret_shotgun: 1,
      turret_fire: 1,
      turret_shield: 1,
      turret_bomb: 1,
      turret_plasma: 1
    };
  }
  if (!stats.turretDmgLevels) {
    stats.turretDmgLevels = {
      turret_tesla: 1,
      turret_sword: 1,
      turret_autoshooter: 1,
      turret_ricochet: 1,
      turret_shotgun: 1,
      turret_fire: 1,
      turret_shield: 1,
      turret_bomb: 1,
      turret_plasma: 1
    };
  }

  // Unlock Grid
  const handleUnlock = () => {
    const cost = 10000;
    if (currency >= cost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        stats.currency = Math.max(0, currency - cost);
      }
      stats.isTurretsUnlocked = true;
      gameAudio.playUpgradePickSound();
      onUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  // Upgrades
  const handleUpgradeHp = (id: string) => {
    const hpLvl = (stats.turretHpLevels as any)[id] || 1;
    const cost = getTurretUpgradeCost(hpLvl);

    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
      stats.currency = Math.max(0, currency - cost);
    }

    (stats.turretHpLevels as any)[id] = hpLvl + 1;

    // Dynamically update HP level & maxHP on all living turrets in arena!
    if (engine.turrets) {
      engine.turrets.forEach(t => {
        if (t.type === id) {
          t.hpLevel = hpLvl + 1;
          const oldMax = t.maxHp;
          const newMax = engine.getTurretMaxHp(id, hpLvl + 1);
          t.maxHp = newMax;
          t.hp += (newMax - oldMax); // heal matching amount
        }
      });
    }

    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  const handleUpgradeDmg = (id: string) => {
    const dmgLvl = (stats.turretDmgLevels as any)[id] || 1;
    const cost = getTurretUpgradeCost(dmgLvl);

    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
      stats.currency = Math.max(0, currency - cost);
    }

    (stats.turretDmgLevels as any)[id] = dmgLvl + 1;

    // Dynamically update DMG level on all living turrets in arena!
    if (engine.turrets) {
      engine.turrets.forEach(t => {
        if (t.type === id) {
          t.dmgLevel = dmgLvl + 1;
        }
      });
    }

    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  const handleUpgradeMaxTurrets = () => {
    if (maxCap >= 20) return;
    if (currency >= maxTurretsUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        stats.currency = Math.max(0, currency - maxTurretsUpgradeCost);
      }
      stats.maxTurrets = maxCap + 1;
      gameAudio.playUpgradePickSound();
      onUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  const handleImplodeAll = () => {
    engine.implodeAllTurrets();
    onUpdate();
  };

  // Buy Sentry (Enter Placement Mode)
  const handleEnterPlacement = (id: string, cost: number) => {
    if (activeTurretsCount >= maxCap) {
      // Over cap limit
      gameAudio.playHitSound(false, 'laser');
      return;
    }
    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }
    engine.placingTurretType = id;
    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  // Cancel Sentry Placement
  const handleCancelPlacement = () => {
    engine.placingTurretType = null;
    gameAudio.playHitSound(false, 'laser');
    onUpdate();
  };

  const countTurrets = (id: string) => {
    if (!engine.turrets) return 0;
    return engine.turrets.filter(t => t.type === id && t.hp > 0).length;
  };

  return (
    <div className="w-full h-full flex flex-col select-none font-mono">
      {/* Header Info */}
      <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 rounded-xl mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider">{t('construction_title', {}, 'Defensive Sentry Grid')}</h2>
            <p className="text-[10px] text-zinc-400">{t('sentry_bases_subtitle', {}, 'Deploy automated combat sentries on the battlefield')}</p>
          </div>
        </div>
        <div className="relative group/info shrink-0 flex items-center">
          <Info className="w-4 h-4 text-zinc-500 hover:text-amber-400 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl text-xs text-zinc-400 leading-normal hidden group-hover/info:block z-[9999] pointer-events-none normal-case">
            <span className="text-amber-400 font-bold uppercase block text-[10px] tracking-wider mb-1">{t('sentry_mechanic_buffs_heading', {}, 'SENTRY MECHANIC BUFFS')}</span>
            {t('sentry_mechanic_buffs_desc', {}, 'Sentries absorb stats like damage multipliers, scale dynamically, and can be health/damage upgraded when deployed!')}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden shop-scrollbar space-y-4 pr-1">
        {!isUnlocked ? (
          /* LOCKED VIEW */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full inline-block mb-2">
              RECOMMENDED ROUND 10+
            </span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">{t('sentry_grid_offline_title', {}, 'DEFENSE TURRETS')}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-sm">
              {t('sentry_grid_offline_desc', {}, 'Build automated sentry turrets directly on the battlefield to blast enemies with laser swords, electric shock arcs, and heavy kinetic mortars!')}
            </p>

            <div className="w-full max-w-xs space-y-2 mt-5">
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold">COST:</span>
                <span className="text-amber-400 font-black">{isSandbox || engine.gameMode.includes('SANDBOX') ? 'FREE' : '10,000 Cr'}</span>
              </div>
              <button
                onClick={handleUnlock}
                className={`w-full py-2.5 rounded-xl text-xs font-black font-mono transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 ${
                  currency >= 10000 || isSandbox || engine.gameMode.includes('SANDBOX')
                    ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('unlock_station_label', {}, 'UNLOCK DEFENSE')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* UNLOCKED MENU */
          <div className="space-y-4">
            {/* Top Stats & Capacity bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* FIELD CAPACITY MODULE */}
              <div className="bg-zinc-900/85 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold uppercase">{t('sentry_capacity_label', {}, 'SENTRY CAPACITY')}</span>
                  <span className={activeTurretsCount >= maxCap ? "text-rose-400 font-extrabold" : "text-amber-400 font-black"}>
                    {activeTurretsCount} / {maxCap}
                  </span>
                </div>
                {/* Visual meter */}
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${activeTurretsCount >= maxCap ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (activeTurretsCount / maxCap) * 100)}%` }}
                  />
                </div>
                {maxCap < 20 ? (
                  <button
                    onClick={handleUpgradeMaxTurrets}
                    disabled={currency < maxTurretsUpgradeCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                      currency >= maxTurretsUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')
                        ? 'bg-amber-500 border-amber-400 hover:bg-amber-400 text-black shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {t('expand_max_label', {}, 'Expand Max (+1)')} ({isSandbox || engine.gameMode.includes('SANDBOX') ? t('free_label_val', {}, 'FREE') : `${maxTurretsUpgradeCost.toLocaleString()} Cr`})
                  </button>
                ) : (
                  <div className="w-full text-center py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500/60 bg-amber-950/20 border border-amber-950 rounded-lg">
                    {t('max_capacity_reached_shorthand_sentry', {}, 'MAX CAPACITY REACHED (20)')}
                  </div>
                )}
              </div>

              {/* IMPLODE FIELD BUTTON */}
              {activeTurretsCount > 0 ? (
                <div className="bg-zinc-900/85 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div className="text-xs text-zinc-400 font-mono font-bold uppercase">RECYCLE DEPLOYMENTS</div>
                  <button
                    onClick={handleImplodeAll}
                    className="w-full py-2 border border-red-500/40 bg-red-950/20 hover:bg-red-500 text-red-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-red-500" />
                    {t('implode_field_sentry_btn', {}, 'Implode All Field Sentries')}
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex items-center justify-center text-xs text-zinc-500 font-mono">
                  Deploy sentries to activate grid protection
                </div>
              )}
            </div>

            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider font-mono pt-1">{t('deploy_sentries_heading', {}, 'Deploy Sentries')}</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TURRET_DATA.map(turret => {
                const activeCount = countTurrets(turret.id);
                const isPlacingThis = engine.placingTurretType === turret.id;
                const hpLvl = (stats.turretHpLevels as any)?.[turret.id] || 1;
                const dmgLvl = (stats.turretDmgLevels as any)?.[turret.id] || 1;
                const hpUpgCost = getTurretUpgradeCost(hpLvl);
                const dmgUpgCost = getTurretUpgradeCost(dmgLvl);

                return (
                  <div 
                    key={turret.id} 
                    className={`border border-zinc-800 bg-zinc-900/80 hover:border-amber-500/40 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 transition-all relative ${
                      isPlacingThis ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Count number in top right */}
                    {activeCount > 0 && (
                      <div className="absolute top-3 right-3 bg-amber-500 border border-amber-400 text-black font-black text-xs px-2 py-0.5 rounded-lg shadow-md z-10 font-mono">
                        x{activeCount} DEPLOYED
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pr-16">
                      <div className="flex gap-2 items-center">
                        <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-amber-400 shrink-0">
                          <turret.icon className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs font-black uppercase text-white font-mono">{t(turret.id + '_name', {}, turret.name)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{t(turret.id + '_description', {}, turret.description)}</p>
                    </div>
                    
                    <button
                      onClick={() => handleEnterPlacement(turret.id, turret.cost)}
                      disabled={
                        (currency < turret.cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) || 
                        (activeTurretsCount >= maxCap)
                      }
                      className={`w-full py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        (currency >= turret.cost || isSandbox || engine.gameMode.includes('SANDBOX')) && (activeTurretsCount < maxCap)
                          ? `${turret.btnColor} border-transparent shadow-md font-black`
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {activeTurretsCount >= maxCap 
                        ? t('grid_overloaded_btn', {}, 'GRID OVERLOADED') 
                        : `${t('deploy_btn_label', {}, 'Deploy ')} (${isSandbox ? t('free_label_val', {}, 'FREE') : `${turret.cost.toLocaleString()} Cr`})`}
                    </button>

                    {/* Health & Damage upgrade buttons inside card when count > 0 */}
                    {activeCount > 0 && (
                      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-2.5 mt-1">
                        <button
                          onClick={() => handleUpgradeHp(turret.id)}
                          disabled={currency < hpUpgCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                          className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all border text-xs cursor-pointer ${
                            currency >= hpUpgCost || isSandbox || engine.gameMode.includes('SANDBOX')
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-tight text-emerald-400 mb-0.5">HP UP (L{hpLvl})</span>
                          <span className="font-mono text-[10px]">{isSandbox ? 'FREE' : `${hpUpgCost.toLocaleString()} Cr`}</span>
                        </button>

                        <button
                          onClick={() => handleUpgradeDmg(turret.id)}
                          disabled={currency < dmgUpgCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                          className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all border text-xs cursor-pointer ${
                            currency >= dmgUpgCost || isSandbox || engine.gameMode.includes('SANDBOX')
                              ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-400 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-tight text-rose-400 mb-0.5">DMG UP (L{dmgLvl})</span>
                          <span className="font-mono text-[10px]">{isSandbox ? 'FREE' : `${dmgUpgCost.toLocaleString()} Cr`}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
