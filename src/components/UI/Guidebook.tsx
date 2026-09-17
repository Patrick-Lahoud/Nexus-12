import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, X, Shield, Zap, RefreshCw, EyeOff, Lock } from 'lucide-react';
import { useLanguage } from '../../game/localization';

interface GuidebookProps {
  isOpen: boolean;
  onClose: () => void;
  isSandbox?: boolean;
}

// Highly stylized SVG representations for each enemy to serve as visual images
const RunnerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">
    <circle cx="24" cy="24" r="13" fill="#f87171" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

const ShooterSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]">
    {/* Barrel pointing right */}
    <rect x="23" y="19" width="13" height="10" fill="#4b5563" stroke="#ffffff" strokeWidth="1" />
    <circle cx="20" cy="24" r="11" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const SplitterSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-pink-500/20 shadow-[0_0_8px_rgba(244,114,182,0.15)]">
    <circle cx="24" cy="24" r="11" fill="#f472b6" stroke="#ffffff" strokeWidth="1.5" />
    {/* Fracturing fracture crosshair lines */}
    <line x1="16" y1="24" x2="32" y2="24" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="24" y1="16" x2="24" y2="32" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

const TankSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
    <g transform="translate(24, 24)">
      {/* Physical heavy spikes sticking out */}
      <polygon points="0,-16 -4,-10 4,-10" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
      <polygon points="0,16 -4,10 4,10" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
      <polygon points="-16,0 -10,-4 -10,4" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
      <polygon points="16,0 10,-4 10,4" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="0" cy="0" r="10" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const ShieldedSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-cyan-400/20 shadow-[0_0_8px_rgba(56,189,248,0.15)]">
    <g transform="translate(24, 24)">
      {/* Dynamic shielding outer shell ring */}
      <circle cx="0" cy="0" r="15" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
      <circle cx="0" cy="0" r="10" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const TeslaCoilSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
    <g transform="translate(24, 24)">
      <circle cx="0" cy="0" r="12" fill="#c084fc" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="5" fill="#a855f7" />
      {/* 4 Peripheral electrodes */}
      <g transform="rotate(0)"><rect x="9" y="-2" width="4" height="4" fill="#ffffff" /></g>
      <g transform="rotate(90)"><rect x="9" y="-2" width="4" height="4" fill="#ffffff" /></g>
      <g transform="rotate(180)"><rect x="9" y="-2" width="4" height="4" fill="#ffffff" /></g>
      <g transform="rotate(270)"><rect x="9" y="-2" width="4" height="4" fill="#ffffff" /></g>
    </g>
  </svg>
);

const HealerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.15)]">
    <g transform="translate(24, 24)">
      {/* Green healing field ring */}
      <circle cx="0" cy="0" r="15" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="3 3" />
      {/* Heal Core */}
      <circle cx="0" cy="0" r="10" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
      {/* Cross symbol */}
      <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="2.5" />
    </g>
  </svg>
);

const GunnerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-amber-600/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
    <g transform="translate(24, 24)">
      {/* Double heavy kinetic firing barrels */}
      <rect x="5" y="-5" width="9" height="3.5" fill="#4b5563" stroke="#ffffff" strokeWidth="0.8" />
      <rect x="5" y="1.5" width="9" height="3.5" fill="#4b5563" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="0" cy="0" r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const MirageSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-rose-400/20 shadow-[0_0_8px_rgba(253,164,189,0.15)]">
    <g transform="translate(24, 24)">
      {/* Holographic echo rings */}
      <circle cx="-3" cy="-1" r="12" fill="none" stroke="#f43f5e" strokeWidth="1.2" opacity="0.6" />
      <circle cx="3" cy="1" r="9" fill="none" stroke="#14b8a6" strokeWidth="1.2" opacity="0.6" />
      {/* Mirage core */}
      <circle cx="0" cy="0" r="10" fill="#fda4af" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    </g>
  </svg>
);

const BomberSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-red-500/20 shadow-[0_0_8px_rgba(185,28,28,0.15)]">
    {/* Rear rocket thruster with plasma flame */}
    <g transform="translate(14, 24)">
      <polygon points="-8,-5 0,-3 0,3 -8,5" fill="#f97316" />
      <polygon points="-12,-3 -4,-1.5 -4,1.5 -12,3" fill="#fef08a" />
      <rect x="-1" y="-4" width="4" height="8" fill="#475569" stroke="#ffffff" strokeWidth="0.8" />
    </g>
    {/* Hot pulsing background halo */}
    <circle cx="27" cy="24" r="14" fill="none" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1.5" />
    {/* Primary bomb core */}
    <circle cx="27" cy="24" r="10" fill="#b91c1c" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

const WarpWarlockSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
    <g transform="translate(24, 24)">
      {/* Chrono distortion orbital ring */}
      <ellipse cx="0" cy="0" rx="15" ry="6" fill="none" stroke="#a855f7" strokeWidth="1.2" transform="rotate(25)" strokeDasharray="3 2" />
      {/* 4-pointed cosmic chrono star */}
      <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="#9333ea" stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="0" cy="0" r="4" fill="#c084fc" />
    </g>
  </svg>
);

const PlasmaStormerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
    <g transform="translate(24, 24)">
      {/* Orbital plasma node satellites */}
      <circle cx="-13" cy="-7" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="13" cy="7" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
      <line x1="-10" y1="-5" x2="10" y2="5" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
      {/* Ion dynamo core */}
      <circle cx="0" cy="0" r="9" fill="#0284c7" stroke="#facc15" strokeWidth="2" />
      <circle cx="0" cy="0" r="4" fill="#facc15" />
    </g>
  </svg>
);

const BioLeechSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
    <g transform="translate(24, 24)">
      {/* Writhing parasitic nano-tendrils */}
      <path d="M-8,-8 Q-14,-2 -10,6" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8,-8 Q14,-2 10,6" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0,8 Q2,15 -3,17" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bio nucleus */}
      <circle cx="0" cy="0" r="9" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="4" fill="#f43f5e" />
    </g>
  </svg>
);

const GravityDrainSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-indigo-400/20 shadow-[0_0_8px_rgba(79,70,229,0.15)]">
    <g transform="translate(24, 24)">
      <circle cx="0" cy="0" r="12" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
      {/* Siphoning gravity swirls */}
      <path d="M 0 0 Q 3 -3 6 0 T 9 3" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      <path d="M 0 0 Q -3 3 -6 0 T -9 -3" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

const SwarmerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-red-400/20 shadow-[0_0_8px_rgba(248,113,113,0.15)]">
    <g transform="translate(24, 24)">
      {/* Wing antennas */}
      <line x1="-9" y1="0" x2="-16" y2="-5" stroke="#ffffff" strokeWidth="1.2" />
      <line x1="9" y1="0" x2="16" y2="-5" stroke="#ffffff" strokeWidth="1.2" />
      {/* Ellipse swarm body */}
      <ellipse cx="0" cy="0" rx="9" ry="6" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const CryomancerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
    <g transform="translate(24, 24)">
      {/* 6 Ice spikes */}
      <g transform="rotate(0)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      <g transform="rotate(60)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      <g transform="rotate(120)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      <g transform="rotate(180)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      <g transform="rotate(240)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      <g transform="rotate(300)"><path d="M 8 -3 L 15 0 L 8 3 Z" fill="#22d3ee" stroke="#ffffff" strokeWidth="0.8" /></g>
      {/* Central ice body */}
      <circle cx="0" cy="0" r="9" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const PhantomSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-indigo-500/20 shadow-[0_0_8px_rgba(129,140,248,0.15)]">
    <circle cx="24" cy="24" r="11" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

const StalkerSVG = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 bg-zinc-950/50 p-1 rounded border border-zinc-650/20 shadow-[0_0_8px_rgba(63,63,70,0.15)]">
    <g transform="translate(24, 24)">
      {/* Low-opacity stealth hull */}
      <circle cx="0" cy="0" r="10" fill="#3f3f46" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
      {/* Sensor dot */}
      <circle cx="0" cy="0" r="1.5" fill="#ef4444" opacity="0.8" />
    </g>
  </svg>
);


// Boss Icons (Heavy detailed visuals)
const WarriorSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.35)]">
    <g transform="translate(28, 28)">
      {/* Twin Cannon attachments */}
      <rect x="8" y="-19" width="16" height="8" fill="#4b5563" stroke="#ffffff" strokeWidth="1.2" />
      <rect x="8" y="11" width="16" height="8" fill="#4b5563" stroke="#ffffff" strokeWidth="1.2" />
      {/* Base core body */}
      <circle cx="0" cy="0" r="18" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
      {/* Boss Double Eyes */}
      <circle cx="-5.3" cy="-4" r="2.7" fill="#000" />
      <circle cx="5.3" cy="-4" r="2.7" fill="#000" />
      <circle cx="-5.3" cy="-4" r="1.3" fill="#ef4444" />
      <circle cx="5.3" cy="-4" r="1.3" fill="#ef4444" />
    </g>
  </svg>
);

const TitanSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(56,189,248,0.35)]">
    <g transform="translate(28, 28)">
      {/* 6 Fortified heavy armor rectangular plates */}
      <g transform="rotate(0)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" /></g>
      <g transform="rotate(60)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" /></g>
      <g transform="rotate(120)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" /></g>
      <g transform="rotate(180)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" /></g>
      <g transform="rotate(240)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.1" /></g>
      <g transform="rotate(300)"><rect x="11" y="-6" width="9" height="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.1" /></g>
      {/* Base armored body */}
      <circle cx="0" cy="0" r="16" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
      {/* Boss Double Eyes */}
      <circle cx="-5.3" cy="-4" r="2.7" fill="#000" />
      <circle cx="5.3" cy="-4" r="2.7" fill="#000" />
    </g>
  </svg>
);

const PhantomAceSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.35)]">
    <g transform="translate(28, 28)">
      {/* Spinning holographic outer shards */}
      <g transform="rotate(0)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      <g transform="rotate(60)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      <g transform="rotate(120)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      <g transform="rotate(180)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      <g transform="rotate(240)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      <g transform="rotate(300)"><polygon points="17,0 11,3 11,-3" fill="#ec4899" opacity="0.65" /></g>
      {/* Base Boss Core */}
      <circle cx="0" cy="0" r="14" fill="#ec4899" stroke="#ffffff" strokeWidth="2.5" />
      {/* Boss Double Eyes */}
      <circle cx="-4.7" cy="-3.5" r="2.3" fill="#000" />
      <circle cx="4.7" cy="-3.5" r="2.3" fill="#000" />
    </g>
  </svg>
);

const StormBringerSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.35)]">
    <g transform="translate(28, 28)">
      {/* Crackling storm sparks */}
      <line x1="0" y1="0" x2="-16" y2="-12" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="18" y2="-8" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="12" y2="18" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="-14" y2="14" stroke="#ffffff" strokeWidth="1.5" />
      {/* Gold Core */}
      <circle cx="0" cy="0" r="14" fill="#fbbf24" stroke="#ffffff" strokeWidth="2.5" />
      {/* Boss Double Eyes */}
      <circle cx="-4.7" cy="-3.5" r="2.3" fill="#000" />
      <circle cx="4.7" cy="-3.5" r="2.3" fill="#000" />
    </g>
  </svg>
);

const VoidSentinelSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
    <defs>
      <radialGradient id="voidSentinelGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000000" />
        <stop offset="85%" stopColor="#000000" />
        <stop offset="100%" stopColor="#ffffff" />
      </radialGradient>
    </defs>
    <g transform="translate(28, 28)">
      {/* Gradient gravitational event horizon */}
      <circle cx="0" cy="0" r="18" fill="url(#voidSentinelGrad)" stroke="#a855f7" strokeWidth="1.5" />
      {/* Boss Double Eyes */}
      <circle cx="-5.3" cy="-4" r="2.7" fill="#ffffff" />
      <circle cx="5.3" cy="-4" r="2.7" fill="#ffffff" />
    </g>
  </svg>
);

const SwarmQueenSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-green-500/40 shadow-[0_0_15px_rgba(74,222,128,0.35)]">
    <g transform="translate(28, 28)">
      <circle cx="0" cy="0" r="16" fill="#166534" stroke="#4ade80" strokeWidth="2" />
      {/* Antennae */}
      <path d="M-8,-15 C-12,-22 -4,-25 -2,-25" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      <path d="M8,-15 C12,-22 4,-25 2,-25" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      <circle cx="-4" cy="-3" r="2.5" fill="#000" />
      <circle cx="4" cy="-3" r="2.5" fill="#000" />
    </g>
  </svg>
);

const ArchitectSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
    <g transform="translate(28, 28)">
      <polygon points="0,-18 5,-8 15,-8 8,0 12,10 0,5 -12,10 -8,0 -15,-8 -5,-8" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="-3" cy="-2" r="2" fill="#000" />
      <circle cx="3" cy="-2" r="2" fill="#000" />
    </g>
  </svg>
);

const ReaperSVG = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 bg-zinc-950 p-1.5 rounded-xl border border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.35)]">
    <g transform="translate(28, 28)">
      <circle cx="0" cy="0" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      <path d="M 0 0 C 15 5 25 20 15 30 L 5 10 Z" fill="#b91c1c" stroke="#ffffff" strokeWidth="1.2" />
      <path d="M 0 0 C -15 5 -25 20 -15 30 L -5 10 Z" fill="#b91c1c" stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="-3" cy="-2" r="2" fill="#000" />
      <circle cx="3" cy="-2" r="2" fill="#000" />
    </g>
  </svg>
);

export default function Guidebook({ isOpen, onClose, isSandbox }: GuidebookProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const highestRoom = React.useMemo(() => {
    const saved = localStorage.getItem('highest_room');
    return saved ? parseInt(saved, 10) : 0;
  }, [isOpen]);

  const [isDevMode, setIsDevMode] = React.useState<boolean>(() => {
    return localStorage.getItem('guidebook_dev_mode') === 'true';
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt + ` (backtick)
      if (e.altKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        setIsDevMode(prev => {
          const next = !prev;
          localStorage.setItem('guidebook_dev_mode', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isSectorUnlocked = (id: string): boolean => {
    if (isDevMode) return true;
    if (isSandbox) return true; // Sandbox: entire guidebook unlocked
    switch (id) {
      case 'sector1': return true;
      case 'sector2': return highestRoom >= 11;
      case 'sector3': return highestRoom >= 21;
      case 'sector4': return highestRoom >= 31;
      case 'sector5': return highestRoom >= 41;
      case 'sector6': return highestRoom >= 51;
      case 'sector7': return highestRoom >= 61;
      case 'sector8': return highestRoom >= 71;
      case 'sector9': return highestRoom >= 81;
      case 'sector10': return highestRoom >= 91;
      case 'sector11': return highestRoom >= 101;
      default: return true;
    }
  };

  const getRequiredRoom = (id: string): number => {
    switch (id) {
      case 'sector2': return 11;
      case 'sector3': return 21;
      case 'sector4': return 31;
      case 'sector5': return 41;
      case 'sector6': return 51;
      case 'sector7': return 61;
      case 'sector8': return 71;
      case 'sector9': return 81;
      case 'sector10': return 91;
      case 'sector11': return 101;
      default: return 0;
    }
  };

  const journeySectors = [
    {
      id: 'sector1',
      title: t('sector_title_1', {}, 'Sectors 1-10: Crimson Alpha'),
      color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
      enemies: [
        { name: t('enemy_runner', {}, 'Runner'), description: t('enemy_runner_desc', {}, 'Basic fast chaser. Aggressively follows and crashes into target targets.'), svg: <RunnerSVG /> },
        { name: t('enemy_shooter', {}, 'Shooter'), description: t('enemy_shooter_desc', {}, 'Ranged turret. Periodically launches slow-moving, direct kinetic target balls.'), svg: <ShooterSVG /> },
        { name: t('enemy_splitter', {}, 'Splitter'), description: t('enemy_splitter_desc', {}, 'Fracturing matrix. Spawns starting at round 6. Upon defeat, divides into smaller tracking chasers.'), svg: <SplitterSVG /> },
        { name: t('enemy_tank', {}, 'Tank'), description: t('enemy_tank_desc', {}, 'Armored titanium spiker. Spawns starting at round 9. Boasts massive HP and slow movement.'), svg: <TankSVG /> },
      ],
      boss: {
        name: t('boss_warrior', {}, 'WARRIOR'),
        description: t('boss_warrior_desc', {}, 'Elite Sector 1 sovereign. Deploys twin cannons firing synchronized bursts alongside rotating double fire orbs.'),
        svg: <WarriorSVG />,
      },
    },
    {
      id: 'sector2',
      title: t('sector_title_2', {}, 'Sectors 11-20: Frozen Caverns'),
      color: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
      enemies: [
        { name: t('enemy_shielded', {}, 'Force Field Chaser'), description: t('enemy_shielded_desc', {}, 'Shielded node. Protected by a rotating force-field shell that deflects straightforward kinetic strikes.'), svg: <ShieldedSVG /> },
        { name: t('enemy_tesla_coil', {}, 'Tesla Coil'), description: t('enemy_tesla_coil_desc', {}, 'Static discharges. Anchored beacon that fires periodic electric lightning arcs within visual proximity.'), svg: <TeslaCoilSVG /> },
        { name: t('enemy_healer', {}, 'Healer'), description: t('enemy_healer_desc', {}, 'System support. Pulses therapeutic healing ripples that restore health values of standard nearby allies.'), svg: <HealerSVG /> },
      ],
      boss: {
        name: t('boss_titan', {}, 'TITAN'),
        description: t('boss_titan_desc', {}, 'Heavy plated bulk machine. Restores protective shielding, fires rapid machine gun streams, and drag siphons player locations.'),
        svg: <TitanSVG />,
      },
    },
    {
      id: 'sector3',
      title: t('sector_title_3', {}, 'Sectors 21-30: Magnetic Ruins'),
      color: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      enemies: [
        { name: t('enemy_gunner', {}, 'Gunner'), description: t('enemy_gunner_desc', {}, 'Heavy machine Gun. Rapidly unloads bursts of projectiles with high density.'), svg: <GunnerSVG /> },
        { name: t('enemy_mirage', {}, 'Mirage'), description: t('enemy_mirage_desc', {}, 'Phase projector. Blinks away and spawns a lingering decoy illusion core upon taking damage.'), svg: <MirageSVG /> },
        { name: t('enemy_bomber', {}, 'Bomber'), description: t('enemy_bomber_desc', {}, 'Volatile kamikaze. Rushes forward to self-detonate, depositing pools of intense lava fire.'), svg: <BomberSVG /> },
        { name: t('enemy_gravity_drain', {}, 'Gravity Drain'), description: t('enemy_gravity_drain_desc', {}, 'Siphon vortex. Radiates a heavy gravitational pulling force that draws players inward.'), svg: <GravityDrainSVG /> },
      ],
      boss: {
        name: t('boss_phantom_ace', {}, 'PHANTOM ACE'),
        description: t('boss_phantom_ace_desc', {}, 'Speed predator. Teleports, creates multiple optical clone copies, and unleashes complex circular needle grids.'),
        svg: <PhantomAceSVG />,
      },
    },
    {
      id: 'sector4',
      title: t('sector_title_4', {}, 'Sectors 31-40: Ionized Clouds'),
      color: 'bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
      enemies: [
        { name: t('enemy_swarmer', {}, 'Swarmer'), description: t('enemy_swarmer_desc', {}, 'Insectoid swarm. Extremely tiny, very fast, and swarms the player in tightly packed tactical groups.'), svg: <SwarmerSVG /> },
        { name: t('enemy_warp_warlock', {}, 'Warp Warlock'), description: t('enemy_warp_warlock_desc', {}, 'Chrono distortion entity. Generates temporal rift zones that reduce player movement and fire rates, phase-shifting on damage.'), svg: <WarpWarlockSVG /> },
        { name: t('enemy_plasma_stormer', {}, 'Plasma Stormer'), description: t('enemy_plasma_stormer_desc', {}, 'Ion dynamo. Fires chaining plasma lightning bolts and leaves an electrified Ion Storm hazard zone upon destruction.'), svg: <PlasmaStormerSVG /> },
        { name: t('enemy_bio_leech', {}, 'Bio Leech'), description: t('enemy_bio_leech_desc', {}, 'Siphon specialist. Links a parasitic tether beam to the player while protecting nearby enemies with an impenetrable bio-armor shield.'), svg: <BioLeechSVG /> },
        { name: t('enemy_cryomancer', {}, 'Cryomancer'), description: t('enemy_cryomancer_desc', {}, 'Glacial freeze mage. Launches frost shards that heavily reduce player speed and agility on contact.'), svg: <CryomancerSVG /> },
        { name: t('enemy_phantom', {}, 'Phantom'), description: t('enemy_phantom_desc', {}, 'Phase shifter. Randomly flickers visibility values, becoming invulnerable when out-of-phase.'), svg: <PhantomSVG /> },
        { name: t('enemy_stalker', {}, 'Stalker'), description: t('enemy_stalker_desc', {}, 'Cloaked hunter. Cloaked with low opacity in the arena, tracking the player with twin stealth thrusters.'), svg: <StalkerSVG /> },
      ],
      boss: {
        name: t('boss_storm_bringer', {}, 'STORM BRINGER'),
        description: t('boss_storm_bringer_desc', {}, 'Thunder core. Launches massive 4-way lightning cross waves and bursts 5-spread dynamic shockwaves.'),
        svg: <StormBringerSVG />,
      },
    },
    {
      id: 'sector5',
      title: t('sector_title_5', {}, 'Sectors 41-50: The Void Abyss'),
      color: 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      enemies: [
        { name: t('enemy_void_marauder', {}, 'Void Marauder'), description: t('enemy_void_marauder_desc', {}, 'Blink predator. Short-range teleports toward the player, then lunges with a burst of speed.'), svg: <RunnerSVG /> },
      ],
      boss: {
        name: t('boss_void_sentinel', {}, 'VOID SENTINEL'),
        description: t('boss_void_sentinel_desc', {}, 'Black hole master. Anchors at the arena center as a singularity, unleashing 8-fold and 16-fold devastating void waves.'),
        svg: <VoidSentinelSVG />,
      },
    },
    {
      id: 'sector6',
      title: t('sector_title_6', {}, 'Sectors 51-60: The Fractured Timeline'),
      color: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
      enemies: [
        { name: t('enemy_time_eater', {}, 'Time Eater'), description: t('enemy_time_eater_desc', {}, 'Temporal parasite. Pulses a slowing aura and fires chrono bolts that chill your engines.'), svg: <RunnerSVG /> },
      ],
      boss: {
        name: t('boss_swarm_queen', {}, 'SWARM QUEEN'),
        description: t('boss_swarm_queen_desc', {}, 'Organic sovereign on a figure-8 brood flight. Rapidly spawns SWARMER defenders and unloads toxic spread volleys.'),
        svg: <SwarmQueenSVG />,
      },
    },
    {
      id: 'sector7',
      title: t('sector_title_7', {}, 'Sectors 61-70: The Collapsing Rift'),
      color: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
      enemies: [
        { name: t('enemy_singularity_seed', {}, 'Singularity Seed'), description: t('enemy_singularity_seed_desc', {}, 'Collapsing core. Pulls you inward constantly and implodes into a damaging gravity well if left alone.'), svg: <RunnerSVG /> },
      ],
      boss: {
        name: t('boss_chrono_warden', {}, 'CHRONO WARDEN'),
        description: t('boss_chrono_warden_desc', {}, 'Clockwork timekeeper. Phases in drifting arcs, fires time-lock bolts and triple echo volleys, and detonates temporal rifts.'),
        svg: <VoidSentinelSVG />,
      },
    },
    {
      id: 'sector8',
      title: t('sector_title_8', {}, 'Sectors 71-80: The Pendulum Expanse'),
      color: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
      enemies: [],
      boss: {
        name: t('boss_graviton_core', {}, 'GRAVITON CORE'),
        description: t('boss_graviton_core_desc', {}, 'Living singularity. Swings across the arena in pendulum sweeps, drags you inward constantly, and detonates 20-way gravity shockwaves.'),
        svg: <VoidSentinelSVG />,
      },
    },
    {
      id: 'sector9',
      title: t('sector_title_9', {}, 'Sectors 81-90: The Blighted Wastes'),
      color: 'bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]',
      enemies: [
        { name: t('enemy_plague_spreader', {}, 'Plague Spreader'), description: t('enemy_plague_spreader_desc', {}, 'Contagion carrier. Pulses lingering plague clouds that corrode anything inside them.'), svg: <RunnerSVG /> },
      ],
      boss: {
        name: t('boss_plague_lord', {}, 'PLAGUE LORD'),
        description: t('boss_plague_lord_desc', {}, 'Bile titan. Drifts forward spewing contagion, summons BIO_LEECH thralls, and detonates pandemic spore rings.'),
        svg: <ReaperSVG />,
      },
    },
    {
      id: 'sector10',
      title: t('sector_title_10', {}, 'Sectors 91-100: The Frozen Crown'),
      color: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.5)]',
      enemies: [
        { name: t('enemy_frost_tyrant', {}, 'Frost Tyrant'), description: t('enemy_frost_tyrant_desc', {}, 'Blizzard tyrant. Bursts radial ice shard storms that chill whatever they touch.'), svg: <RunnerSVG /> },
      ],
      boss: {
        name: t('boss_cryo_sovereign', {}, 'CRYO SOVEREIGN'),
        description: t('boss_cryo_sovereign_desc', {}, 'FINAL BOSS. A glacial crystal fortress that descends relentlessly, unleashing counter-rotating ice spirals and the screen-wide Absolute Zero blizzard.'),
        svg: <VoidSentinelSVG />,
      },
    },
    {
      id: 'sector11',
      title: t('sector_title_11', {}, 'Sectors 101+: The Endless Loop'),
      color: 'bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.5)]',
      enemies: [],
      boss: {
        name: t('boss_endless', {}, 'THE ENDLESS ROTATION'),
        description: t('boss_endless_desc', {}, 'Beyond Room 100, every enemy ever catalogued returns in rotating waves, and the three exclusive sovereigns (ARCHITECT, SWARM QUEEN, REAPER) cycle at random.'),
        svg: <ArchitectSVG />,
      },
    }
  ];

  const voidSovereigns = [
    { name: t('boss_architect', {}, 'ARCHITECT'), desc: t('boss_architect_desc', {}, 'Spikier geometric crystal boss. Deploys complex cross patterns during combat rounds past Room 30.'), svg: <ArchitectSVG /> },
    { name: t('boss_swarm_queen', {}, 'SWARM QUEEN'), desc: t('boss_swarm_queen_desc', {}, 'Organic sovereign. Rapidly spawns fast SWARMER drones to protect itself and targets.'), svg: <SwarmQueenSVG /> },
    { name: t('boss_reaper', {}, 'REAPER'), desc: t('boss_reaper_desc', {}, 'Scythe manipulator. Spawns soul-harvester draining fields and unloads giant scythe strikes.'), svg: <ReaperSVG /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-5xl h-[94vh] sm:h-[92vh] bg-[#040404] border-[6px] border-zinc-800 rounded-xl shadow-[0_0_90px_rgba(0,0,0,0.95),inset_0_0_80px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-emerald-500/15 bg-black/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
            <div className="flex items-center gap-2">
              <h2 className="not-italic font-mono font-black text-emerald-400 uppercase tracking-[0.25em] text-lg">
                {t('handbook', {}, 'Handbook')}
              </h2>
              {isDevMode && (
                <span className="px-2 py-0.5 text-xs bg-red-950/80 text-red-400 border border-red-500/30 rounded font-mono font-black uppercase tracking-wider">
                  // DEV MODE ACTIVE
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar space-y-6 bg-zinc-950/20">
          {/* Timeline Grid */}
          <div className="space-y-6">
            {journeySectors.map((sector) => {
              const unlocked = isSectorUnlocked(sector.id);
              const requiredRoom = getRequiredRoom(sector.id);

              return (
                <React.Fragment key={sector.id}>
                  <div className="bg-zinc-900/10 border border-zinc-850/60 rounded-xl p-4 space-y-4">
                    {/* Sector Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${sector.color}`} />
                        <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
                          {sector.title}
                        </span>
                      </div>
                      {!unlocked && (
                        <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock size={12} /> {t('encrypted', {}, 'ENCRYPTED')}
                        </span>
                      )}
                    </div>

                    {!unlocked ? (
                      <div className="relative overflow-hidden bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
                        {/* Retro grid pattern inside locked screen */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,36,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,36,0.3)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-20" />
                        
                        <div className="relative p-3 bg-zinc-900/60 border border-red-500/20 rounded-full text-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                          <Lock size={22} className="animate-pulse" />
                        </div>
                        
                        <div className="relative space-y-1">
                          <h4 className="text-sm font-black text-red-400 uppercase tracking-wider font-mono">
                            {t('tactical_threat_logs_classified', {}, 'TACTICAL THREAT LOGS: CLASSIFIED')}
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono tracking-wider">
                            {t('access_denied_reach_room', { room: requiredRoom }, `ACCESS DENIED // REACH ROOM ${requiredRoom} TO AUTHORIZE INCOMING TELEMETRY`)}
                          </p>
                        </div>

                        <div className="relative text-xs bg-red-950/20 border border-red-900/40 text-red-300 font-mono px-4 py-2 rounded-lg max-w-md leading-relaxed">
                          {t('defeat_phase_boss_desc_subtext', { requiredPrev: requiredRoom - 10, requiredNext: requiredRoom }, `Defeat Phase ${requiredRoom - 10} Fortress Boss to secure decrypted data from Sector ${requiredRoom} onwards.`)}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Enemy Log */}
                        <div className="md:col-span-7 space-y-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                          <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider font-mono">
                            {t('active_threat_species', {}, 'Active Threat Species')}
                          </div>
                          <div className="grid grid-cols-1 gap-2.5">
                            {sector.enemies.map((enemy) => (
                              <div key={enemy.name} className="flex gap-3 bg-[#08080f]/95 border border-zinc-800 p-2.5 rounded-xl items-center shadow-inner">
                                {enemy.svg}
                                <div>
                                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 uppercase">
                                    {enemy.name}
                                  </h4>
                                  <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{enemy.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sector Boss */}
                        <div className="md:col-span-5 bg-zinc-950/90 border border-red-950/40 p-4 rounded-xl flex flex-col justify-between shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]">
                          <div>
                            <div className="text-xs uppercase font-bold text-red-400 tracking-wider font-mono mb-2.5 flex items-center gap-2">
                              <Shield size={12} className="text-red-400" /> {t('sector_fortress_boss', {}, 'Sector Fortress Boss')}
                            </div>
                            <div className="flex gap-3.5 items-center">
                              {sector.boss.svg}
                              <div>
                                <h4 className="text-sm font-black text-red-400 uppercase tracking-wider font-mono">
                                  {sector.boss.name}
                                </h4>
                                <p className="text-xs text-zinc-200 leading-relaxed mt-1">
                                  {sector.boss.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTIVE DEFENSIVE FORCE FIELDS SECTION */}
                  {sector.id === 'sector3' && (
                    <div className="mt-2 space-y-3">
                      {(highestRoom >= 30 || isDevMode) ? (
                        <div className="bg-zinc-950/90 border border-cyan-500/30 p-4 rounded-xl space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                            <Shield className="text-cyan-400 shrink-0" size={18} />
                            <div className="text-xs sm:text-sm font-black text-cyan-400 uppercase tracking-wider font-mono">
                              {t('active_defense_fields_title', {}, 'TACTICAL DATA: ENEMY ACTIVE DEFENSE FIELDS (ROOMS 30+)')}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 font-mono leading-relaxed font-bold">
                            {t('active_defense_fields_desc', {}, 'At deep milestone sectors, elite combat units can activate energy barrier configurations that nullify deflective collisions:')}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            <div className="p-3 bg-[#0a0a14] border border-amber-600/35 rounded-xl flex items-start gap-3 text-xs">
                              <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 shrink-0 mt-0.5">
                                <Shield size={14} />
                              </div>
                              <div>
                                <h4 className="font-bold text-amber-300 uppercase font-mono mb-0.5">{t('spawn_immunity', {}, 'SPAWN IMMUNITY')}</h4>
                                <p className="text-zinc-300 leading-relaxed">{t('spawn_immunity_desc', {}, 'Gold Matrix: Invulnerable for exactly 1.0 second upon arena manifestation.')}</p>
                              </div>
                            </div>

                            <div className="p-3 bg-[#0a0a14] border border-cyan-600/35 rounded-xl flex items-start gap-3 text-xs">
                              <div className="p-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400 shrink-0 mt-0.5">
                                <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                              </div>
                              <div>
                                <h4 className="font-bold text-cyan-300 uppercase font-mono mb-0.5">{t('periodic_ridge', {}, 'PERIODIC RIDGE')}</h4>
                                <p className="text-zinc-300 leading-relaxed">{t('periodic_ridge_desc', {}, 'Cyan Barrier: Swaps between active and vulnerable states every 3.0 seconds.')}</p>
                              </div>
                            </div>

                            <div className="p-3 bg-[#0a0a14] border border-orange-600/35 rounded-xl flex items-start gap-3 text-xs">
                              <div className="p-1.5 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 shrink-0 mt-0.5">
                                <Zap size={14} />
                              </div>
                              <div>
                                <h4 className="font-bold text-orange-300 uppercase font-mono mb-0.5">{t('directional_shield', {}, 'DIRECTIONAL SHIELD')}</h4>
                                <p className="text-zinc-300 leading-relaxed">{t('directional_shield_desc', {}, 'Orange Arc: Blocks a 115° front sector facing the player. Maneuver to strike from behind!')}</p>
                              </div>
                            </div>

                            <div className="p-3 bg-[#0a0a14] border border-pink-600/35 rounded-xl flex items-start gap-3 text-xs">
                              <div className="p-1.5 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-400 shrink-0 mt-0.5">
                                <EyeOff size={14} />
                              </div>
                              <div>
                                <h4 className="font-bold text-pink-300 uppercase font-mono mb-0.5">{t('gap_weakness', {}, 'GAP WEAKNESS (VULNERABLE)')}</h4>
                                <p className="text-zinc-300 leading-relaxed">{t('gap_weakness_desc', {}, 'Pink Orbit: Full defensive ring with a moving / spinning 75° weakness gap. Strike the open channel.')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-950/30 border border-red-950/20 border-dashed p-6 rounded-xl flex flex-col items-center justify-center text-center py-8 space-y-3">
                          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                            <Lock size={18} />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-zinc-300 uppercase tracking-wider font-mono">{t('defense_pillars_intel_encrypted', {}, 'DEFENSE PILLARS INTEL ENCRYPTED')}</h4>
                          <p className="text-xs text-zinc-400 font-mono font-bold">{t('unlocked_at_room_30', { highestRoom }, `UNLOCKED AT ROOM 30+ // CURRENT HIGHEST: ROOM ${highestRoom}`)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
                {/* OTHER SOVEREIGNS INTEL */}
          {(highestRoom >= 30 || isDevMode) ? (
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="text-xs sm:text-sm font-black text-red-400 uppercase tracking-wider font-mono border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Zap size={16} className="text-red-400" /> {t('alternating_sovereign_archetypes', {}, 'ALTERNATING SOVEREIGN ARCHETYPES (Sectors 30+)')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {voidSovereigns.map((sov) => (
                  <div key={sov.name} className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex flex-col items-center text-center">
                    <div className="mb-2">{sov.svg}</div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">{sov.name}</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed mt-1">{sov.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center py-8 space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                <Lock size={18} />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-zinc-300 uppercase tracking-wider font-mono">{t('sovereign_archetypes_blocked', {}, 'SOVEREIGN ARCHETYPES COMPENDIUM BLOCKED')}</h4>
              <p className="text-xs text-zinc-400 font-mono font-bold">{t('reach_room_30_to_decrypt', { highestRoom }, `REACH ROOM 30+ TO DECRYPT REMAINING SIGNATURES // HIGHEST: ROOM ${highestRoom}`)}</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="relative z-10 px-6 py-4 border-t border-emerald-500/15 bg-black/70 flex justify-end items-center">
          <button 
            onClick={onClose}
            className="bg-emerald-600 border border-emerald-400 text-black text-xs font-black uppercase px-6 py-2.5 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all cursor-pointer rounded-xl font-mono"
          >
            {t('dismiss_report', {}, 'DISMISS REPORT')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
