interface BadgeEmblemProps {
  emblem: 'circle' | 'hex' | 'shield' | 'diamond' | 'star' | 'chevron' | 'ring' | 'cross' | 'tri' | 'blade';
  color: string;
  size: number;
  dimmed?: boolean;
  /** Hardcore variant: jagged outlines, more sides, sharper spikes */
  jagged?: boolean;
}

// Draws each badge's custom emblem shape with a minimal plate look.
// Survival badges are smooth and rounded; hardcore badges are jagged
// with extra sides and sharper spikes.
export default function BadgeEmblem({ emblem, color, size, dimmed, jagged }: BadgeEmblemProps) {
  const s = size;
  const half = s / 2;
  const stroke = dimmed ? '#3f3f46' : color;
  const fill = dimmed ? 'rgba(63, 63, 72, 0.15)' : `${color}26`;
  const lw = s * 0.065;

  const poly = (pts: [number, number][]) =>
    pts.map(([x, y]) => `${x},${y}`).join(' ');

  const starPts = (spikes: number, outer: number, inner: number, offset = -Math.PI / 2): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / spikes + offset;
      pts.push([half + Math.cos(a) * r, half + Math.sin(a) * r]);
    }
    return pts;
  };

  const ngonPts = (sides: number, r: number, offset = -Math.PI / 2): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides + offset;
      pts.push([half + Math.cos(a) * r, half + Math.sin(a) * r]);
    }
    return pts;
  };

  const R = half - lw;

  const shape = () => {
    switch (emblem) {
      case 'circle':
        if (jagged) {
          // Spiked gear with 12 teeth
          return <polygon points={poly(starPts(12, R, R * 0.82))} stroke={stroke} fill={fill} strokeWidth={lw} strokeLinejoin="miter" />;
        }
        return <circle cx={half} cy={half} r={R} stroke={stroke} fill={fill} strokeWidth={lw} />;
      case 'hex':
        if (jagged) {
          // Ten-sided jagged ring
          return <polygon points={poly(starPts(10, R, R * 0.85))} stroke={stroke} fill={fill} strokeWidth={lw} strokeLinejoin="miter" />;
        }
        return <polygon points={poly(ngonPts(6, R))} stroke={stroke} fill={fill} strokeWidth={lw} strokeLinejoin="round" />;
      case 'shield':
        if (jagged) {
          // War shield: notched sides and a sawtooth bottom edge
          const n = 4;
          let d = `M ${half} ${lw} L ${s - lw * 1.5} ${s * 0.28}`;
          for (let i = 0; i <= n; i++) {
            const y = s * 0.28 + ((s * 0.62 - s * 0.28) * i) / n;
            const x = i % 2 === 0 ? s - lw * 2.4 : s - lw * 1.4;
            d += ` L ${x} ${y}`;
          }
          d += ` L ${half} ${s - lw}`;
          for (let i = n; i >= 0; i--) {
            const y = s * 0.28 + ((s * 0.62 - s * 0.28) * i) / n;
            const x = i % 2 === 0 ? lw * 2.4 : lw * 1.4;
            d += ` L ${x} ${y}`;
          }
          d += ` L ${lw * 1.5} ${s * 0.28} Z`;
          return <path d={d} stroke={stroke} fill={fill} strokeWidth={lw} strokeLinejoin="miter" />;
        }
        return (
          <path
            d={`M ${half} ${lw} L ${s - lw * 1.5} ${s * 0.28} L ${s - lw * 2.2} ${s * 0.62} Q ${s - lw * 2.2} ${s - lw} ${half} ${s - lw} Q ${lw * 2.2} ${s - lw} ${lw * 2.2} ${s * 0.62} L ${lw * 1.5} ${s * 0.28} Z`}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        );
      case 'diamond':
        if (jagged) {
          // Eight-point razored star
          return <polygon points={poly(starPts(8, R, R * 0.3))} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />;
        }
        return (
          <polygon
            points={poly([
              [half, lw],
              [s - lw, half],
              [half, s - lw],
              [lw, half],
            ])}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        );
      case 'star':
        if (jagged) {
          // Seven spikes, much sharper inner waist
          return <polygon points={poly(starPts(7, R, R * 0.3))} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />;
        }
        return <polygon points={poly(starPts(5, R, R * 0.45))} stroke={stroke} fill={fill} strokeWidth={lw} strokeLinejoin="round" />;
      case 'chevron':
        if (jagged) {
          // Double stacked jagged chevrons
          const chev = (top: number, bottom: number) =>
            `M ${lw} ${bottom} L ${half} ${top} L ${s - lw} ${bottom} L ${s - lw} ${bottom - s * 0.1} L ${half} ${top + s * 0.16} L ${lw} ${bottom - s * 0.1} Z`;
          return (
            <>
              <path d={chev(s * 0.08, s * 0.42)} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />
              <path d={chev(s * 0.46, s * 0.86)} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />
            </>
          );
        }
        return (
          <path
            d={`M ${lw} ${s * 0.72} L ${half} ${lw * 1.6} L ${s - lw} ${s * 0.72} L ${s - lw} ${s * 0.5} L ${half} ${s * 0.34} L ${lw} ${s * 0.5} Z`}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw * 0.8}
            strokeLinejoin="round"
          />
        );
      case 'ring':
        if (jagged) {
          // Thorned ring: spiky outer band + inner core
          return (
            <>
              <polygon points={poly(starPts(16, R, R * 0.88))} stroke={stroke} fill="none" strokeWidth={lw * 0.8} strokeLinejoin="miter" />
              <circle cx={half} cy={half} r={R * 0.45} stroke={stroke} fill={fill} strokeWidth={lw} />
            </>
          );
        }
        return (
          <>
            <circle cx={half} cy={half} r={R} stroke={stroke} fill="none" strokeWidth={lw} />
            <circle cx={half} cy={half} r={R * 0.45} stroke={stroke} fill={fill} strokeWidth={lw} />
          </>
        );
      case 'cross':
        if (jagged) {
          // Angled X cross with sharpened tips
          const arm = s * 0.11;
          const c = half;
          const o = R * 0.92;
          const pts: [number, number][] = [];
          for (const [dx, dy] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
            pts.push([c + dx * o, c + dy * o]);
            pts.push([c + dx * o - dx * arm - dy * arm * 0, c + dy * o - dy * arm - dx * arm * 0]);
            pts.push([c + dx * arm * 0.35, c + dy * arm * 0.35]);
          }
          return <polygon points={poly(pts)} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />;
        }
        return (
          <path
            d={`M ${half - s * 0.14} ${lw} H ${half + s * 0.14} V ${half - s * 0.14} H ${s - lw} V ${half + s * 0.14} H ${half + s * 0.14} V ${s - lw} H ${half - s * 0.14} V ${half + s * 0.14} H ${lw} V ${half - s * 0.14} H ${half - s * 0.14} Z`}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw * 0.8}
            strokeLinejoin="round"
          />
        );
      case 'tri':
        if (jagged) {
          // Inverted hexagram: two interlocked triangles, point down
          const down = ngonPts(3, R, Math.PI / 2);
          const up = ngonPts(3, R, -Math.PI / 2);
          return (
            <>
              <polygon points={poly(down)} stroke={stroke} fill={fill} strokeWidth={lw * 0.8} strokeLinejoin="miter" />
              <polygon points={poly(up)} stroke={stroke} fill="none" strokeWidth={lw * 0.8} strokeLinejoin="miter" />
            </>
          );
        }
        return (
          <polygon
            points={poly([
              [half, lw],
              [s - lw, s - lw],
              [lw, s - lw],
            ])}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        );
      case 'blade':
        if (jagged) {
          // Jagged blade with sawtooth edges
          return (
            <path
              d={`M ${half} ${lw} L ${s * 0.55} ${s * 0.28} L ${s * 0.68} ${s * 0.38} L ${s * 0.55} ${s * 0.48} L ${half + s * 0.09} ${s - lw} L ${half - s * 0.09} ${s - lw} L ${s * 0.45} ${s * 0.48} L ${s * 0.32} ${s * 0.38} L ${s * 0.45} ${s * 0.28} Z`}
              stroke={stroke}
              fill={fill}
              strokeWidth={lw}
              strokeLinejoin="miter"
            />
          );
        }
        return (
          <path
            d={`M ${half} ${lw} L ${s * 0.68} ${s * 0.45} L ${half + s * 0.09} ${s - lw} L ${half - s * 0.09} ${s - lw} L ${s * 0.32} ${s * 0.45} Z`}
            stroke={stroke}
            fill={fill}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      {shape()}
    </svg>
  );
}
