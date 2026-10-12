import type { ReactNode } from "react";

/*
 * A small library of bold, flat illustrations drawn in currentColor (white on gradients).
 * All share a 200×200 viewBox. Pure SVG, so they work in server, client and OG-image contexts.
 */

const S = { stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
const DARK = "rgba(0,0,0,.18)";

function gearPath(cx: number, cy: number, r: number, teeth: number, depth: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / (teeth * 4);
  for (let i = 0; i < teeth * 4; i++) {
    const rr = i % 4 < 2 ? r + depth : r;
    const a = i * step;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

export const ILLUSTRATIONS = {
  chip: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} {...S} strokeWidth={8} opacity={0.75}>
          <line x1={66 + i * 23} y1={28} x2={66 + i * 23} y2={48} />
          <line x1={66 + i * 23} y1={152} x2={66 + i * 23} y2={172} />
          <line x1={28} y1={66 + i * 23} x2={48} y2={66 + i * 23} />
          <line x1={152} y1={66 + i * 23} x2={172} y2={66 + i * 23} />
        </g>
      ))}
      <rect x={48} y={48} width={104} height={104} rx={18} fill="currentColor" opacity={0.95} />
      <rect x={72} y={72} width={56} height={56} rx={10} fill={DARK} />
      <path d="M86 100h28M100 86v28" {...S} stroke={DARK} strokeWidth={6} />
    </>
  ),
  brain: (
    <>
      <path
        d="M96 38C80 28 56 34 52 54C34 58 26 80 38 94C26 108 32 130 50 134C52 152 72 164 90 154C93 158 96 160 96 160Z"
        fill="currentColor"
        opacity={0.95}
      />
      <path
        d="M104 38C120 28 144 34 148 54C166 58 174 80 162 94C174 108 168 130 150 134C148 152 128 164 110 154C107 158 104 160 104 160Z"
        fill="currentColor"
        opacity={0.8}
      />
      <g {...S} stroke={DARK} strokeWidth={6}>
        <path d="M60 70c10 2 18 10 18 20M44 104c14-6 28 0 32 10M66 136c4-10 14-14 24-12M84 52c-2 10 4 18 12 20" />
        <path d="M140 70c-10 2-18 10-18 20M156 104c-14-6-28 0-32 10M134 136c-4-10-14-14-24-12M116 52c2 10-4 18-12 20" />
      </g>
      <circle cx={170} cy={36} r={8} fill="currentColor" opacity={0.6} />
      <circle cx={30} cy={166} r={6} fill="currentColor" opacity={0.5} />
    </>
  ),
  network: (
    <>
      <g {...S} strokeWidth={5} opacity={0.55}>
        <path d="M50 60L100 100L150 50M100 100L60 150M100 100L150 140M50 60L60 150M150 50L150 140M60 150L150 140" />
      </g>
      {[
        [50, 60, 14],
        [150, 50, 16],
        [100, 100, 24],
        [60, 150, 16],
        [150, 140, 14],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="currentColor" opacity={i === 2 ? 1 : 0.85} />
      ))}
      <circle cx={100} cy={100} r={10} fill={DARK} />
    </>
  ),
  robot: (
    <>
      <line x1={100} y1={30} x2={100} y2={52} {...S} strokeWidth={6} />
      <circle cx={100} cy={28} r={9} fill="currentColor" />
      <rect x={46} y={52} width={108} height={86} rx={26} fill="currentColor" opacity={0.95} />
      <circle cx={78} cy={92} r={12} fill={DARK} />
      <circle cx={122} cy={92} r={12} fill={DARK} />
      <path d="M80 118q20 12 40 0" {...S} stroke={DARK} strokeWidth={6} />
      <rect x={66} y={144} width={68} height={30} rx={12} fill="currentColor" opacity={0.6} />
      <rect x={30} y={80} width={12} height={34} rx={6} fill="currentColor" opacity={0.7} />
      <rect x={158} y={80} width={12} height={34} rx={6} fill="currentColor" opacity={0.7} />
    </>
  ),
  spark: (
    <>
      <path d="M100 26C107 80 120 93 174 100C120 107 107 120 100 174C93 120 80 107 26 100C80 93 93 80 100 26Z" fill="currentColor" opacity={0.95} />
      <path d="M156 34C158 48 162 52 176 54C162 56 158 60 156 74C154 60 150 56 136 54C150 52 154 48 156 34Z" fill="currentColor" opacity={0.7} />
      <path d="M46 136C47 145 50 148 59 149C50 150 47 153 46 162C45 153 42 150 33 149C42 148 45 145 46 136Z" fill="currentColor" opacity={0.6} />
    </>
  ),
  candles: (
    <>
      {[
        [40, 60, 150, 90, 130, 1],
        [72, 40, 130, 70, 112, 0],
        [104, 70, 160, 92, 146, 1],
        [136, 30, 110, 46, 96, 0],
        [168, 20, 90, 32, 74, 1],
      ].map(([x, top, bottom, bTop, bBot, up], i) => (
        <g key={i}>
          <line x1={x} y1={top} x2={x} y2={bottom} {...S} strokeWidth={4} opacity={0.8} />
          <rect x={x - 11} y={bTop} width={22} height={bBot - bTop} rx={4} fill="currentColor" opacity={up ? 0.95 : 0.45} />
        </g>
      ))}
      <path d="M24 176H180" {...S} strokeWidth={4} opacity={0.5} />
    </>
  ),
  trend: (
    <>
      <path d="M28 160L64 120L96 136L132 86L172 50V172H28Z" fill="currentColor" opacity={0.22} />
      <path d="M28 160L64 120L96 136L132 86L172 50" {...S} strokeWidth={10} />
      <path d="M144 48H174V78" {...S} strokeWidth={10} />
      <circle cx={64} cy={120} r={8} fill="currentColor" />
      <circle cx={96} cy={136} r={8} fill="currentColor" />
      <circle cx={132} cy={86} r={8} fill="currentColor" />
    </>
  ),
  bank: (
    <>
      <path d="M100 26L176 66H24Z" fill="currentColor" opacity={0.95} />
      <circle cx={100} cy={52} r={8} fill={DARK} />
      <rect x={30} y={70} width={140} height={10} rx={3} fill="currentColor" opacity={0.8} />
      {[44, 78, 112, 146].map((x) => (
        <rect key={x} x={x} y={86} width={14} height={62} rx={4} fill="currentColor" opacity={0.85} />
      ))}
      <rect x={24} y={152} width={152} height={12} rx={4} fill="currentColor" opacity={0.95} />
      <rect x={16} y={168} width={168} height={10} rx={4} fill="currentColor" opacity={0.6} />
    </>
  ),
  coins: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={30} y={140 - i * 16} width={70} height={16} rx={2} fill="currentColor" opacity={0.6 + i * 0.1} />
          <ellipse cx={65} cy={140 - i * 16} rx={35} ry={9} fill="currentColor" />
        </g>
      ))}
      <ellipse cx={65} cy={156} rx={35} ry={9} fill="currentColor" opacity={0.6} />
      <circle cx={132} cy={88} r={46} fill="currentColor" opacity={0.95} />
      <circle cx={132} cy={88} r={34} fill="none" stroke={DARK} strokeWidth={5} />
      <text x={132} y={106} textAnchor="middle" fontSize={50} fontWeight={800} fill={DARK} fontFamily="Arial, sans-serif">
        ¥
      </text>
    </>
  ),
  skyline: (
    <>
      <circle cx={150} cy={52} r={22} fill="currentColor" opacity={0.5} />
      {[
        [24, 110, 30],
        [58, 70, 30],
        [92, 40, 26],
        [122, 90, 28],
        [154, 120, 26],
      ].map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={180 - y} rx={3} fill="currentColor" opacity={0.6 + (i % 3) * 0.15} />
          {Array.from({ length: Math.floor((170 - y) / 18) }).map((_, j) => (
            <rect key={j} x={x + 7} y={y + 10 + j * 18} width={w - 14} height={6} rx={2} fill={DARK} />
          ))}
        </g>
      ))}
      <path d="M92 40L105 16L118 40" fill="currentColor" opacity={0.8} />
      <rect x={14} y={176} width={172} height={6} rx={3} fill="currentColor" />
    </>
  ),
  globe: (
    <>
      <circle cx={100} cy={100} r={70} fill="currentColor" opacity={0.95} />
      <g {...S} stroke={DARK} strokeWidth={5}>
        <ellipse cx={100} cy={100} rx={30} ry={70} />
        <path d="M30 100H170M40 64H160M40 136H160M100 30V170" />
      </g>
      <path d="M58 70c10-8 26-6 30 4s-6 18 2 26-4 22-16 18-22-14-20-26 0-16 4-22z" fill={DARK} />
      <path d="M118 120c10-6 24-2 26 8s-10 20-20 16-12-18-6-24z" fill={DARK} />
      <ellipse cx={100} cy={100} rx={90} ry={24} {...S} strokeWidth={4} opacity={0.6} transform="rotate(-18 100 100)" />
    </>
  ),
  ship: (
    <>
      {[
        [44, 92, 0.95],
        [74, 92, 0.65],
        [104, 92, 0.85],
        [134, 92, 0.55],
        [59, 66, 0.75],
        [89, 66, 0.95],
        [119, 66, 0.7],
        [74, 40, 0.6],
      ].map(([x, y, o], i) => (
        <rect key={i} x={x} y={y} width={28} height={24} rx={3} fill="currentColor" opacity={o} />
      ))}
      <path d="M20 118H182L160 152H40Z" fill="currentColor" />
      <path d="M20 168q15-10 30 0t30 0t30 0t30 0t30 0" {...S} strokeWidth={5} opacity={0.7} />
    </>
  ),
  flags: (
    <>
      <line x1={46} y1={30} x2={46} y2={178} {...S} strokeWidth={7} />
      <path d="M50 34c24-10 40 10 64 0v54c-24 10-40-10-64 0z" fill="currentColor" opacity={0.95} />
      <line x1={120} y1={66} x2={120} y2={178} {...S} strokeWidth={7} opacity={0.75} />
      <path d="M124 70c18-8 30 8 48 0v44c-18 8-30-8-48 0z" fill="currentColor" opacity={0.6} />
      <circle cx={82} cy={60} r={10} fill={DARK} />
      <path d="M134 88h28" {...S} stroke={DARK} strokeWidth={6} />
    </>
  ),
  oil: (
    <>
      <path d="M100 24C100 24 154 92 154 126A54 54 0 0 1 46 126C46 92 100 24 100 24Z" fill="currentColor" opacity={0.95} />
      <path d="M74 126a26 26 0 0 0 22 26" {...S} stroke={DARK} strokeWidth={8} />
      <circle cx={158} cy={56} r={10} fill="currentColor" opacity={0.6} />
      <circle cx={40} cy={64} r={7} fill="currentColor" opacity={0.5} />
    </>
  ),
  scales: (
    <>
      <line x1={100} y1={36} x2={100} y2={164} {...S} strokeWidth={8} />
      <circle cx={100} cy={32} r={10} fill="currentColor" />
      <path d="M36 62H164" {...S} strokeWidth={8} />
      <path d="M48 62L28 112M48 62L68 112M152 62L132 112M152 62L172 112" {...S} strokeWidth={3} opacity={0.8} />
      <path d="M22 112H74A26 26 0 0 1 22 112Z" fill="currentColor" opacity={0.95} />
      <path d="M126 112H178A26 26 0 0 1 126 112Z" fill="currentColor" opacity={0.7} />
      <rect x={66} y={164} width={68} height={14} rx={7} fill="currentColor" />
    </>
  ),
  palette: (
    <>
      <path d="M100 28C52 28 24 64 24 102s32 70 70 70c14 0 18-10 14-20-4-10 2-20 14-20h20c22 0 34-16 34-36 0-38-34-68-76-68z" fill="currentColor" opacity={0.95} />
      {[
        [66, 70],
        [102, 56],
        [138, 72],
        [58, 112],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={12} fill={DARK} />
      ))}
      <path d="M176 40L120 128" {...S} strokeWidth={10} opacity={0.75} />
      <path d="M120 128c-8 2-14 10-12 20 8 0 18-4 20-14z" fill="currentColor" opacity={0.75} />
    </>
  ),
  barchart: (
    <>
      {[
        [36, 110],
        [68, 76],
        [100, 128],
        [132, 50],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={24} height={164 - y} rx={6} fill="currentColor" opacity={0.6 + i * 0.12} />
      ))}
      <path d="M24 168H178" {...S} strokeWidth={6} />
      <path d="M40 92L80 62L112 104L150 34" {...S} strokeWidth={5} opacity={0.6} strokeDasharray="2 10" />
      <circle cx={168} cy={44} r={10} fill="currentColor" />
    </>
  ),
  dashboard: (
    <>
      <rect x={20} y={32} width={160} height={136} rx={16} fill="currentColor" opacity={0.95} />
      <rect x={32} y={46} width={60} height={34} rx={8} fill={DARK} />
      <rect x={100} y={46} width={68} height={34} rx={8} fill={DARK} />
      <path d="M38 140L58 118L74 128L94 100" {...S} stroke={DARK} strokeWidth={6} />
      <circle cx={136} cy={124} r={24} fill="none" stroke={DARK} strokeWidth={10} />
      <path d="M136 100a24 24 0 0 1 24 24" {...S} stroke="rgba(0,0,0,.4)" strokeWidth={10} />
    </>
  ),
  pie: (
    <>
      <circle cx={92} cy={108} r={62} fill="currentColor" opacity={0.6} />
      <path d="M92 108V46A62 62 0 0 1 152 124Z" fill="currentColor" opacity={0.95} />
      <path d="M108 92V28A64 64 0 0 1 170 100Z" fill="currentColor" transform="translate(6 -6)" />
    </>
  ),
  fx: (
    <>
      <rect x={24} y={44} width={152} height={112} rx={22} fill="currentColor" opacity={0.95} />
      <text x={100} y={122} textAnchor="middle" fontSize={68} fontWeight={800} fontStyle="italic" fill={DARK} fontFamily="Georgia, serif">
        ƒx
      </text>
      <rect x={40} y={164} width={120} height={10} rx={5} fill="currentColor" opacity={0.6} />
      <rect x={60} y={28} width={80} height={8} rx={4} fill="currentColor" opacity={0.5} />
    </>
  ),
  schema: (
    <>
      <g {...S} strokeWidth={5} opacity={0.7}>
        <path d="M100 100L44 46M100 100L156 46M100 100L44 154M100 100L156 154" />
      </g>
      <rect x={66} y={74} width={68} height={52} rx={10} fill="currentColor" />
      <rect x={66} y={74} width={68} height={14} rx={6} fill={DARK} />
      {[
        [20, 26],
        [134, 26],
        [20, 136],
        [134, 136],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={46} height={36} rx={8} fill="currentColor" opacity={0.75} />
      ))}
    </>
  ),
  table: (
    <>
      <rect x={24} y={40} width={152} height={120} rx={14} fill="currentColor" opacity={0.95} />
      <rect x={24} y={40} width={152} height={28} rx={14} fill={DARK} />
      <g {...S} stroke={DARK} strokeWidth={3}>
        <path d="M24 98H176M24 128H176M74 68V160M126 68V160" />
      </g>
    </>
  ),
  gear: (
    <>
      <path d={gearPath(84, 96, 46, 9, 14)} fill="currentColor" opacity={0.95} />
      <circle cx={84} cy={96} r={18} fill={DARK} />
      <path d={gearPath(150, 150, 22, 7, 9)} fill="currentColor" opacity={0.7} />
      <circle cx={150} cy={150} r={9} fill={DARK} />
    </>
  ),
  branch: (
    <>
      <g {...S} strokeWidth={8}>
        <path d="M60 30V170" />
        <path d="M60 140C60 100 140 110 140 70V50" opacity={0.75} />
      </g>
      <circle cx={60} cy={40} r={16} fill="currentColor" />
      <circle cx={60} cy={100} r={12} fill="currentColor" opacity={0.85} />
      <circle cx={60} cy={164} r={16} fill="currentColor" />
      <circle cx={140} cy={46} r={18} fill="currentColor" opacity={0.85} />
      <circle cx={140} cy={46} r={7} fill={DARK} />
    </>
  ),
  rocket: (
    <>
      <path d="M100 18C130 40 140 80 132 128H68C60 80 70 40 100 18Z" fill="currentColor" opacity={0.95} />
      <circle cx={100} cy={72} r={15} fill={DARK} />
      <path d="M68 102L42 134L70 132ZM132 102L158 134L130 132Z" fill="currentColor" opacity={0.7} />
      <path d="M80 134h40l-8 30-12 18-12-18z" fill="currentColor" opacity={0.55} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

export function Illustration({ name, className, style }: { name: IllustrationName; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      {ILLUSTRATIONS[name] ?? ILLUSTRATIONS.spark}
    </svg>
  );
}
