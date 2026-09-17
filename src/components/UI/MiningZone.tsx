import React, { useState } from 'react';
import { GameEngine } from '../../game/engine';
import { 
  Pickaxe, 
  TrendingUp, 
  Heart, 
  Lock, 
  Zap,
  Check,
  Flame,
  AlertTriangle,
  Info,
  X,
  Plus
} from 'lucide-react';
import { gameAudio } from '../../game/audio';
import { useLanguage } from '../../game/localization';

interface MiningZoneProps {
  engine: GameEngine;
  onUpdate: () => void;
  isSandbox?: boolean;
}

export const getMineUpgradeCost = (level: number) => {
  return Math.floor(6000 * Math.pow(1.65, level - 1));
};

export const getMineCapUpgradeCost = (currentMax: number) => {
  if (currentMax === 2) return 15000;
  if (currentMax === 3) return 30000;
  if (currentMax === 4) return 60000;
  return 999999;
};

const MINE_DATA = [
  {
    id: 'mine_basic',
    name: 'Kinetic Excavator',
    description: 'Standard seismic harvester extracting core minerals. Stable and cheap.',
    cost: 24000,
    income: 150,
    baseHp: 100,
    colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/10 hover:shadow-emerald-500/25',
    colorHex: '#10b981'
  },
  {
    id: 'mine_heavy',
    name: 'Deep-Core Drill',
    description: 'Heavy thermal drill designed to pierce dense geological mantles. High yield.',
    cost: 48000,
    income: 350,
    baseHp: 160,
    colorClass: 'text-amber-400 border-amber-500/30 bg-amber-950/20 shadow-amber-500/10 hover:shadow-amber-500/25',
    colorHex: '#f59e0b'
  },
  {
    id: 'mine_quantum',
    name: 'Quantum Extractor',
    description: 'Siphons rifts for high dense energy particles. Massive late-game profits.',
    cost: 95000,
    income: 720,
    baseHp: 250,
    colorClass: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/20 shadow-fuchsia-500/10 hover:shadow-fuchsia-500/25',
    colorHex: '#c084fc'
  }
];

export default function MiningZone({ engine, onUpdate, isSandbox }: MiningZoneProps) {
  const { t } = useLanguage();
  const stats = engine.player.stats;
  const currency = stats.currency || 0;
  const isUnlocked = stats.isMinesUnlocked || false;

  const maxCap = stats.maxMines || 2;
  const activeMinesCount = engine.mines ? engine.mines.filter(m => m.hp > 0).length : 0;
  const capUpgradeCost = getMineCapUpgradeCost(maxCap);

  const [confirmDetonate, setConfirmDetonate] = useState(false);

  // Initialize properties
  if (!stats.mineHpLevels) {
    stats.mineHpLevels = {
      mine_basic: 1,
      mine_heavy: 1,
      mine_quantum: 1
    };
  }
  if (!stats.mineProdLevels) {
    stats.mineProdLevels = {
      mine_basic: 1,
      mine_heavy: 1,
      mine_quantum: 1
    };
  }

  // Unlock Mining Operations
  const handleUnlock = () => {
    const cost = 50000;
    if (currency >= cost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        stats.currency = Math.max(0, currency - cost);
      }
      stats.isMinesUnlocked = true;
      gameAudio.playUpgradePickSound();
      onUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  // Cap upgrade
  const handleUpgradeCap = () => {
    if (currency >= capUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')) {
      if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
        stats.currency = Math.max(0, currency - capUpgradeCost);
      }
      stats.maxMines = maxCap + 1;
      gameAudio.playUpgradePickSound();
      onUpdate();
    } else {
      gameAudio.playHitSound(false, 'laser');
    }
  };

  // Upgrades
  const handleUpgradeHp = (id: string) => {
    const hpLvl = (stats.mineHpLevels as any)[id] || 1;
    const cost = getMineUpgradeCost(hpLvl);

    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
      stats.currency = Math.max(0, currency - cost);
    }

    (stats.mineHpLevels as any)[id] = hpLvl + 1;

    // Dynamically update HP level & maxHP on all living mines on field!
    if (engine.mines) {
      engine.mines.forEach(m => {
        if (m.type === id) {
          m.levelHp = hpLvl + 1;
          const oldMax = m.maxHp;
          const originalBase = id === 'mine_basic' ? 100 : id === 'mine_heavy' ? 160 : 250;
          const newMax = originalBase + hpLvl * 120;
          m.maxHp = newMax;
          m.hp += (newMax - oldMax); // heal matching amount
        }
      });
    }

    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  const handleUpgradeProd = (id: string) => {
    const prodLvl = (stats.mineProdLevels as any)[id] || 1;
    const cost = getMineUpgradeCost(prodLvl);

    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }

    if (!isSandbox && !engine.gameMode.includes('SANDBOX')) {
      stats.currency = Math.max(0, currency - cost);
    }

    (stats.mineProdLevels as any)[id] = prodLvl + 1;

    // Dynamically update drill level on living mines!
    if (engine.mines) {
      engine.mines.forEach(m => {
        if (m.type === id) {
          m.levelProd = prodLvl + 1;
        }
      });
    }

    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  // Detonation trigger
  const triggerDetonation = () => {
    engine.explodeAllMines();
    setConfirmDetonate(false);
    onUpdate();
  };

  // Placement mode
  const handleEnterPlacement = (id: string, cost: number) => {
    if (activeMinesCount >= maxCap) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }
    if (currency < cost && !isSandbox && !engine.gameMode.includes('SANDBOX')) {
      gameAudio.playHitSound(false, 'laser');
      return;
    }
    engine.placingMineType = id;
    gameAudio.playUpgradePickSound();
    onUpdate();
  };

  const handleCancelPlacement = () => {
    engine.placingMineType = null;
    gameAudio.playHitSound(false, 'laser');
    onUpdate();
  };

  const countActiveMines = (id: string) => {
    if (!engine.mines) return 0;
    return engine.mines.filter(m => m.type === id && m.hp > 0).length;
  };

  return (
    <div className="w-full h-full flex flex-col select-none font-mono">
      {/* Header Info */}
      <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 rounded-xl mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <Pickaxe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-emerald-400 tracking-wider">{t('mining_ground_title', {}, 'Automated Mining Operations')}</h2>
            <p className="text-[10px] text-zinc-400">{t('late_game_economy_desc', {}, 'Extract valuable ore for passive credit income')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase font-bold">{t('total_harvested_label', {}, 'Total Harvested')}</div>
            <div className="text-xs font-black text-emerald-400 font-mono">
              {(stats.totalMiningEarnings || 0).toLocaleString()} Cr
            </div>
          </div>
          <div className="relative group/info shrink-0 flex items-center">
            <Info className="w-4 h-4 text-zinc-500 hover:text-emerald-400 cursor-help transition-colors" />
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl text-xs text-zinc-400 leading-normal hidden group-hover/info:block z-[9999] pointer-events-none normal-case">
              <span className="text-emerald-400 font-bold uppercase block text-[10px] tracking-wider mb-1">{t('automated_mineral_harvest_hover', {}, 'AUTOMATED MINERAL HARVEST')}</span>
              {t('automated_mineral_harvest_hover_desc', {}, 'Extracts rich resources straight to your credits balance every 2.0s! Mines are vulnerable and draw enemy fire. Defend them!')}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Content Pane */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden shop-scrollbar space-y-4 pr-1">
        {!isUnlocked ? (
          /* LOCKED VIEW */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] mb-3">
              <Pickaxe className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block mb-2">
              RECOMMENDED ROUND 20+
            </span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">{t('mining_ground_title', {}, 'MINING ZONE')}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-sm">
              {t('automated_mineral_harvest_hover_desc', {}, 'Deploy automated subterranean drills that continuously extract minerals and generate passive Credits every second!')}
            </p>

            <div className="w-full max-w-xs space-y-2 mt-5">
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold">COST:</span>
                <span className="text-emerald-400 font-black">{isSandbox || engine.gameMode.includes('SANDBOX') ? 'FREE' : '50,000 Cr'}</span>
              </div>
              <button
                onClick={handleUnlock}
                className={`w-full py-2.5 rounded-xl text-xs font-black font-mono transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 ${
                  currency >= 50000 || isSandbox || engine.gameMode.includes('SANDBOX')
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('unlock_mining_btn', {}, 'UNLOCK MINING')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DRILL CAPACITY MODULE */}
            <div className="bg-zinc-900/85 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold uppercase">{t('drill_capacity_label', {}, 'DRILL CAPACITY')}</span>
                <span className={activeMinesCount >= maxCap ? "text-rose-400 font-extrabold" : "text-emerald-400 font-black"}>
                  {activeMinesCount} / {maxCap}
                </span>
              </div>
              {/* Visual meter */}
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${activeMinesCount >= maxCap ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
                  style={{ width: `${Math.min(100, (activeMinesCount / maxCap) * 100)}%` }}
                />
              </div>
              {maxCap < 5 ? (
                <button
                  onClick={handleUpgradeCap}
                  disabled={currency < capUpgradeCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                    currency >= capUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')
                      ? 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400 text-black shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {t('expand_max_label', {}, 'Expand Max (+1)')} ({isSandbox || engine.gameMode.includes('SANDBOX') ? t('free_label_val', {}, 'FREE') : `${capUpgradeCost.toLocaleString()} Cr`})
                </button>
              ) : (
                <div className="w-full text-center py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 bg-emerald-950/20 border border-emerald-950 rounded-lg">
                  {t('max_capacity_reached_shorthand', {}, 'MAX CAPACITY REACHED')}
                </div>
              )}
            </div>

            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider font-mono pt-1">{t('core_units_heading', {}, 'Deploy Mining Drills')}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MINE_DATA.map((mine) => {
                const activeCount = countActiveMines(mine.id);
                const hpLvl = (stats.mineHpLevels as any)[mine.id] || 1;
                const prodLvl = (stats.mineProdLevels as any)[mine.id] || 1;
                const hpUpgradeCost = getMineUpgradeCost(hpLvl);
                const prodUpgradeCost = getMineUpgradeCost(prodLvl);

                const canAffordDeploy = (currency >= mine.cost) || isSandbox || engine.gameMode.includes('SANDBOX');
                const canDeployMore = activeMinesCount < maxCap;

                return (
                  <div key={mine.id} className="bg-zinc-900/80 p-3.5 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl flex flex-col justify-between gap-2.5 transition-all relative">
                    {/* Count indicator */}
                    {activeCount > 0 && (
                      <div className="absolute top-3 right-3 bg-emerald-500 border border-emerald-400 text-black font-black text-xs px-2 py-0.5 rounded-lg shadow-md z-10 font-mono">
                        x{activeCount} DEPLOYED
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pr-16">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-400 shrink-0">
                          <Pickaxe className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-xs font-black uppercase text-white font-mono">{t(mine.id + '_name', {}, mine.name)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{t(mine.id + '_description', {}, mine.description)}</p>
                    </div>

                    <div className="flex gap-2 font-mono text-xs font-bold justify-between bg-black/60 p-2.5 rounded-xl border border-zinc-800/80 items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">YIELD:</span>
                        <span className="text-emerald-400 font-black text-base">+${Math.round(mine.income * (1 + (prodLvl - 1) * 0.25))}/s</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">HP:</span>
                        <span className="text-zinc-200 font-black text-base">{mine.baseHp + (hpLvl - 1) * 120}</span>
                      </div>
                    </div>

                    {/* Deploy & Upgrades section */}
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => handleEnterPlacement(mine.id, mine.cost)}
                        disabled={!canDeployMore || (!canAffordDeploy && !engine.placingMineType)}
                        className={`w-full py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all border cursor-pointer ${
                          canDeployMore && canAffordDeploy
                            ? mine.id === 'mine_quantum'
                              ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white border-fuchsia-400 shadow-md shadow-fuchsia-500/30'
                              : mine.id === 'mine_heavy'
                              ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-md shadow-amber-500/30'
                              : 'bg-emerald-400 hover:bg-emerald-300 text-black border-emerald-300 shadow-md shadow-emerald-500/30'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {!canDeployMore 
                          ? 'MAX DRILLS DEPLOYED' 
                          : `Deploy (${isSandbox ? 'FREE' : `${mine.cost.toLocaleString()} Cr`})`}
                      </button>

                      {/* Health & Yield Upgrade Buttons */}
                      {activeCount > 0 && (
                        <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-2.5">
                          <button
                            onClick={() => handleUpgradeHp(mine.id)}
                            disabled={currency < hpUpgradeCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                            className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all border text-xs cursor-pointer ${
                              currency >= hpUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight text-emerald-400 mb-0.5">HP UP (L{hpLvl})</span>
                            <span className="font-mono text-[10px]">{isSandbox ? 'FREE' : `${hpUpgradeCost.toLocaleString()} Cr`}</span>
                          </button>

                          <button
                            onClick={() => handleUpgradeProd(mine.id)}
                            disabled={currency < prodUpgradeCost && !isSandbox && !engine.gameMode.includes('SANDBOX')}
                            className={`py-1.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all border text-xs cursor-pointer ${
                              currency >= prodUpgradeCost || isSandbox || engine.gameMode.includes('SANDBOX')
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-400 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight text-amber-400 mb-0.5">YIELD UP (L{prodLvl})</span>
                            <span className="font-mono text-[10px]">{isSandbox ? 'FREE' : `${prodUpgradeCost.toLocaleString()} Cr`}</span>
                          </button>
                        </div>
                      )}
                    </div>
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
