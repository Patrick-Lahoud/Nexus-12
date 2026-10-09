import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { GameEngine } from '../../game/engine';
import { ALL_UPGRADES, EVOLVED_ABILITIES } from '../../game/upgrades';
import { getControlCooldown } from './ControlShop';
import { useLanguage } from '../../game/localization';

interface TouchControlsProps {
  engine: GameEngine;
  /** Bumped whenever the loadout changes so buttons re-read the engine */
  tick: number;
}

/**
 * MOBILE touch control overlay. Sits above the game canvas (pointer-events on
 * the widgets only). All touches are multi-touch safe: each active pointer is
 * tracked by pointerId so the joystick and buttons work simultaneously.
 *
 * Layout: joystick bottom-left, action cluster bottom-right — thumb zones.
 */
export default function TouchControls({ engine, tick }: TouchControlsProps) {
  const { t } = useLanguage();
  const [, forceRender] = useState(0);

  // Re-read loadout when it changes (abilities purchased, controls equipped)
  useEffect(() => { forceRender(v => v + 1); }, [tick]);

  // ------------------------------------------------------------------
  // Joystick (bottom-left) — steers the player via engine.joystickX/Y
  // ------------------------------------------------------------------
  const joyRef = useRef<HTMLDivElement>(null);
  const joyPointerId = useRef<number | null>(null);
  const [joyState, setJoyState] = useState({ active: false, cx: 0, cy: 0, kx: 0, ky: 0 });

  const joyCenter = useCallback(() => {
    const el = joyRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const onJoyDown = (e: React.PointerEvent) => {
    if (joyPointerId.current !== null) return;
    joyPointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const c = joyCenter();
    setJoyState({ active: true, cx: c.x, cy: c.y, kx: 0, ky: 0 });
    e.preventDefault();
  };

  const onJoyMove = (e: React.PointerEvent) => {
    if (joyPointerId.current !== e.pointerId) return;
    const c = joyState;
    const dx = e.clientX - c.cx;
    const dy = e.clientY - c.cy;
    const max = 52; // px of deflection before the knob clamps
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, max);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    const mag = clamped / max; // 0..1 deflection strength
    engine.joystickX = nx * mag;
    engine.joystickY = ny * mag;
    setJoyState(s => ({ ...s, kx: nx * clamped, ky: ny * clamped }));
    e.preventDefault();
  };

  const onJoyUp = (e: React.PointerEvent) => {
    if (joyPointerId.current !== e.pointerId) return;
    joyPointerId.current = null;
    engine.joystickX = 0;
    engine.joystickY = 0;
    setJoyState(s => ({ ...s, active: false, kx: 0, ky: 0 }));
  };

  // ------------------------------------------------------------------
  // Action buttons: left-slot + right-slot controls
  // ------------------------------------------------------------------
  const leftId = engine.player.stats.leftClickSlot;
  const rightId = engine.player.stats.rightClickSlot;
  const leftOwned = (engine.player.stats.ownedControls || []).find(c => c.id === leftId);
  const rightOwned = (engine.player.stats.ownedControls || []).find(c => c.id === rightId);
  const leftCd = leftId ? (engine.player.stats.controlCooldowns?.[leftId] || 0) : 0;
  const rightCd = rightId ? (engine.player.stats.controlCooldowns?.[rightId] || 0) : 0;
  const leftCdMax = leftId ? getControlCooldown(leftId, leftOwned?.level || 1) : 1;
  const rightCdMax = rightId ? getControlCooldown(rightId, rightOwned?.level || 1) : 1;
  const leftReady = leftCd <= 0;
  const rightReady = rightCd <= 0;

  // Fire (left slot) — tap = execute once; hold = repeat for rapid-fire controls
  const firePointerId = useRef<number | null>(null);
  const fireRepeat = useRef<number | null>(null);
  const fireAt = (x: number, y: number) => engine.onLeftClick(x, y);

  const onFireDown = (e: React.PointerEvent) => {
    firePointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = engine.player.pos;
    fireAt(p.x, p.y);
    // Hold-to-repeat at ~6 Hz for sustained fire controls
    fireRepeat.current = window.setInterval(() => {
      const pp = engine.player.pos;
      fireAt(pp.x, pp.y);
    }, 160);
    e.preventDefault();
  };
  const onFireUp = (e: React.PointerEvent) => {
    if (firePointerId.current !== e.pointerId) return;
    firePointerId.current = null;
    if (fireRepeat.current !== null) {
      clearInterval(fireRepeat.current);
      fireRepeat.current = null;
    }
  };
  useEffect(() => () => { if (fireRepeat.current !== null) clearInterval(fireRepeat.current); }, []);

  // Right slot — tap to execute at the player's position
  const onRightTap = (e: React.PointerEvent) => {
    e.stopPropagation();
    const p = engine.player.pos;
    engine.onRightClickChange(true, p.x, p.y);
  };

  // ------------------------------------------------------------------
  // Ability buttons (vertical arc above the action cluster)
  // ------------------------------------------------------------------
  const abilities = engine.player.abilities;
  const triggerAbility = (index: number) => engine.triggerAbility(index);
  const now = Date.now();

  const joyKnobStyle: React.CSSProperties = {
    transform: `translate(${joyState.kx}px, ${joyState.ky}px)`,
    touchAction: 'none',
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none" aria-hidden={false}>
      {/* Joystick — bottom-left thumb zone */}
      <div
        ref={joyRef}
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
        className="absolute bottom-6 left-6 w-[128px] h-[128px] rounded-full pointer-events-auto touch-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(0,0,0,0.35) 70%)',
          border: '2px solid rgba(34,211,238,0.35)',
          boxShadow: '0 0 18px rgba(34,211,238,0.15)',
        }}
      >
        {/* Directional cross marks */}
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <div className="w-full h-px bg-cyan-400/60 absolute" />
          <div className="h-full w-px bg-cyan-400/60 absolute" />
        </div>
        {/* Knob */}
        <div
          className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full -ml-7 -mt-7 flex items-center justify-center"
          style={{
            ...joyKnobStyle,
            background: joyState.active ? 'rgba(34,211,238,0.35)' : 'rgba(34,211,238,0.18)',
            border: '2px solid rgba(34,211,238,0.7)',
            boxShadow: '0 0 14px rgba(34,211,238,0.4)',
            transition: joyState.active ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-cyan-200/90" />
        </div>
      </div>

      {/* Action cluster — bottom-right thumb zone */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 pointer-events-auto">
        {/* Abilities row (up to 5 compact buttons) */}
        {abilities.length > 0 && (
          <div className="flex gap-2 justify-end w-full flex-wrap-reverse">
            {abilities.map((a, i) => {
              const cd = Math.max(0, a.cooldown - (now - a.lastUsed));
              const ready = cd <= 0;
              const up = [...ALL_UPGRADES, ...EVOLVED_ABILITIES].find(u => u.abilityType === a.type);
              const label = up ? t('up_name_' + up.id, {}, up.name) : a.name;
              return (
                <button
                  key={i}
                  onPointerDown={(e) => { e.stopPropagation(); triggerAbility(i); }}
                  className={`relative w-12 h-12 rounded-xl font-black text-[10px] flex items-center justify-center border-2 touch-none transition-all ${
                    ready
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-500'
                  }`}
                  style={{ touchAction: 'none' }}
                  aria-label={label}
                >
                  <Zap size={16} />
                  {!ready && (
                    <span
                      className="absolute inset-0 rounded-lg bg-black/55 pointer-events-none"
                      style={{ clipPath: `inset(${100 - (cd / a.cooldown) * 100}% 0 0 0)` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Fire + secondary side by side */}
        <div className="flex items-end gap-3">
          {/* Right-slot control button */}
          {rightId && (
            <button
              onPointerDown={onRightTap}
              className={`w-16 h-16 rounded-full font-black text-xs flex items-center justify-center border-2 touch-none ${
                rightReady
                  ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(192,132,252,0.35)]'
                  : 'bg-zinc-900/80 border-zinc-700 text-zinc-500'
              }`}
              style={{ touchAction: 'none' }}
              aria-label="Secondary control"
            >
              R
              {!rightReady && (
                <span
                  className="absolute rounded-full bg-black/55 pointer-events-none"
                  style={{ clipPath: `inset(${100 - (rightCd / rightCdMax) * 100}% 0 0 0)` }}
                />
              )}
            </button>
          )}

          {/* Fire (left-slot) button */}
          <button
            onPointerDown={onFireDown}
            onPointerUp={onFireUp}
            onPointerCancel={onFireUp}
            className={`relative w-20 h-20 rounded-full font-black text-sm uppercase tracking-wider flex items-center justify-center border-2 touch-none ${
              leftReady
                ? 'bg-cyan-500/30 border-cyan-300 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                : 'bg-zinc-900/80 border-zinc-700 text-zinc-400'
            }`}
            style={{ touchAction: 'none' }}
            aria-label="Fire"
          >
            FIRE
            {!leftReady && (
              <span
                className="absolute inset-0 rounded-full bg-black/55 pointer-events-none"
                style={{ clipPath: `inset(${100 - (leftCd / leftCdMax) * 100}% 0 0 0)` }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
