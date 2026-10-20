import { memo } from 'react';
import type { Game, Customer, Flyby } from '../game/engine';
import { L, COUNTER_Y, W } from '../game/engine';
import { PlanetIcon } from './Art';
import { ING, isUnlocked } from '../game/data';

const STARS = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * 560, r: Math.random() * 2.2 + 0.5, d: Math.random() * 3 }));

export const SpaceBg = memo(function SpaceBg() {
  return (
    <svg width={1600} height={900} className="absolute inset-0 no-pe">
      <defs>
        <radialGradient id="neb1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c026d3" stopOpacity=".55" /><stop offset="100%" stopColor="#c026d3" stopOpacity="0" /></radialGradient>
        <radialGradient id="neb2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2563eb" stopOpacity=".5" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></radialGradient>
        <radialGradient id="neb3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#14b8a6" stopOpacity=".35" /><stop offset="100%" stopColor="#14b8a6" stopOpacity="0" /></radialGradient>
        <linearGradient id="spacebg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b0520" /><stop offset="100%" stopColor="#1e0b3a" /></linearGradient>
        <radialGradient id="bigplanet" cx="30%" cy="30%" r="80%"><stop offset="0%" stopColor="#fda4af" /><stop offset="60%" stopColor="#be185d" /><stop offset="100%" stopColor="#3b0764" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#spacebg)" />
      <g style={{ animation: 'nebula 18s ease-in-out infinite' }}>
        <ellipse cx="1250" cy="160" rx="420" ry="220" fill="url(#neb1)" />
        <ellipse cx="420" cy="280" rx="480" ry="240" fill="url(#neb2)" />
        <ellipse cx="850" cy="420" rx="380" ry="160" fill="url(#neb3)" />
      </g>
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" className="anim-twinkle" style={{ animationDelay: `${s.d}s` }} />)}
      <g transform="translate(1420 470)">
        <circle r="150" fill="url(#bigplanet)" />
        <ellipse rx="240" ry="36" fill="none" stroke="#fbcfe8" strokeWidth="10" opacity=".5" transform="rotate(-12)" />
      </g>
      <g transform="translate(300 130)" className="anim-floaty"><circle r="34" fill="#e5e7eb" /><circle cx="-10" cy="-6" r="8" fill="#9ca3af" /><circle cx="12" cy="10" r="6" fill="#9ca3af" /></g>
    </svg>
  );
});

export function FlybyView({ f }: { f: Flyby }) {
  const flip = f.vx < 0 ? -1 : 1;
  let el: React.ReactNode;
  switch (f.kind) {
    case 'comet': el = (<g><path d="M0,0 L-220,-14 L-220,14z" fill="#a5f3fc" opacity=".45" /><circle r="16" fill="#e0f2fe" /><circle r="26" fill="#a5f3fc" opacity=".3" /></g>); break;
    case 'rocket': el = (<g><path d="M-60,0 L-100,-10 L-110,0 L-100,10z" fill="#f97316" className="anim-spark" /><rect x="-60" y="-14" width="90" height="28" rx="6" fill="#e5e7eb" /><path d="M30,-14 Q60,0 30,14z" fill="#94a3b8" /><circle cx="10" cy="0" r="6" fill="#38bdf8" /><text x="-50" y="5" fontSize="12" fontWeight="900" fill="#111">SPACEX</text></g>); break;
    case 'tesla': el = (<g transform={`rotate(${Math.sin(f.rot / 20) * 15})`}><path d="M-60,6 L-50,-10 L-10,-22 L30,-20 L60,-4 L60,10 L-60,10z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" /><path d="M-8,-20 L24,-18 L40,-6 L-20,-8z" fill="#93c5fd" /><circle cx="-36" cy="12" r="10" fill="#111" /><circle cx="36" cy="12" r="10" fill="#111" /><circle cx="6" cy="-26" r="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" /><rect x="0" y="-30" width="12" height="7" rx="3" fill="#1e293b" /><text x="-20" y="46" fontSize="16" fill="#fff" opacity=".7">DON'T PANIC</text></g>); break;
    case 'ufo': el = (<g><ellipse rx="54" ry="16" fill="#a3e635" stroke="#3f6212" strokeWidth="3" /><ellipse cy="-10" rx="24" ry="18" fill="#bae6fd" opacity=".85" /><circle cx="-30" cy="4" r="4" fill="#fde047" className="anim-spark" /><circle cx="0" cy="8" r="4" fill="#fde047" /><circle cx="30" cy="4" r="4" fill="#fde047" className="anim-spark" /></g>); break;
    case 'satellite': el = (<g transform={`rotate(${f.rot})`}><rect x="-12" y="-12" width="24" height="24" fill="#fbbf24" /><rect x="-60" y="-8" width="44" height="16" fill="#1d4ed8" stroke="#93c5fd" /><rect x="16" y="-8" width="44" height="16" fill="#1d4ed8" stroke="#93c5fd" /></g>); break;
    case 'doge': el = (<g transform={`rotate(${f.rot})`}><circle r="30" fill="#fbbf24" stroke="#b45309" strokeWidth="4" /><text y="12" fontSize="34" textAnchor="middle" fontWeight="900" fill="#92400e">Ð</text></g>); break;
  }
  return <g transform={`translate(${f.x} ${f.y}) scale(${f.s * flip} ${f.s})`}>{el}</g>;
}

export function CafeRoom({ g }: { g: Game }) {
  return (
    <svg width={1600} height={900} className="absolute inset-0 no-pe" style={{ filter: g.blackoutT > 0 ? 'brightness(.24)' : undefined }}>
      <defs>
        <clipPath id="win"><rect x="270" y="78" width="1310" height="470" rx="60" /></clipPath>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#312e81" /><stop offset="100%" stopColor="#1e1b4b" /></linearGradient>
      </defs>
      {/* flybys visible through window */}
      <g clipPath="url(#win)">{g.flybys.map((f, i) => <FlybyView key={i} f={f} />)}</g>
      {g.rainT > 0 && <g clipPath="url(#win)">{Array.from({ length: 8 }, (_, k) => {
        const tt = (g.time * 0.8 + k * 0.37) % 1;
        const x = 300 + ((k * 197) % 1200) + tt * 200, y = 60 + tt * 480;
        return <g key={k} opacity={1 - tt} transform={`translate(${x} ${y}) rotate(-30)`}><path d="M-18,-10 L-85,-25 L-85,25z" fill="#fb923c" opacity=".75" /><text textAnchor="middle" y="14" fontSize="42">☄️</text></g>;
      })}</g>}
      {/* wall with window cut */}
      <path fillRule="evenodd" d="M0,0 H1600 V900 H0z M330,78 H1520 Q1580,78 1580,138 V488 Q1580,548 1520,548 H330 Q270,548 270,488 V138 Q270,78 330,78z" fill="url(#wall)" />
      <rect x="270" y="78" width="1310" height="470" rx="60" fill="none" stroke="#a5b4fc" strokeWidth="10" />
      <rect x="270" y="78" width="1310" height="470" rx="60" fill="none" stroke="#e0e7ff" strokeWidth="3" opacity=".6" />
      {[520, 925, 1330].map((x) => <rect key={x} x={x - 5} y="78" width="10" height="470" fill="#a5b4fc" opacity=".6" />)}
      <path d="M300,120 L420,100 M1480,500 L1540,470" stroke="#fff" strokeWidth="6" opacity=".15" strokeLinecap="round" />
      {/* neon sign */}
      <g transform="translate(140 150)">
        <rect x="-110" y="-50" width="220" height="110" rx="24" fill="#0f0a2e" stroke="#f0abfc" strokeWidth="4" style={{ filter: 'drop-shadow(0 0 10px #f0abfc)' }} />
        <text x="0" y="-8" textAnchor="middle" fontSize="30" fontWeight="900" fill="#f9a8d4" style={{ filter: 'drop-shadow(0 0 6px #ec4899)' }}>STARSHIP</text>
        <text x="0" y="36" textAnchor="middle" fontSize="30" fontWeight="900" fill="#67e8f9" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }}>CAFE ☕🚀</text>
      </g>
      {/* rivets & pipes */}
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={30 + i * 22} cy="250" r="4" fill="#6366f1" />)}
      <rect x="0" y="555" width="1600" height="20" fill="#4338ca" />
      {g.halfBroken && (
        <g>
          <path d="M800,78 L760,200 L840,260 L780,380 L860,548 M760,200 L650,230 M840,260 L980,240 L1050,300 M780,380 L660,420" stroke="#fff" strokeWidth="5" fill="none" opacity=".85" />
          <path d="M1150,78 L1120,180 L1220,250 L1180,400" stroke="#fff" strokeWidth="4" fill="none" opacity=".7" />
          <path d="M1400,90 l40,30 -50,20 60,40 -40,30 60,60" stroke="#fde047" strokeWidth="3" fill="none" className="anim-spark" />
          <rect x="1280" y="78" width="300" height="470" fill="#000" opacity=".35" />
        </g>
      )}
    </svg>
  );
}

export function Musk({ g }: { g: Game }) {
  const hit = g.musk.hitT > 0;
  const talking = !!g.musk.say;
  const mouth = talking ? 4 + Math.abs(Math.sin(g.time * 14)) * 8 : 3;
  const gravity = g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT);
  const gx = Math.sin(g.time * 2.1) * 20 * gravity, gy = Math.sin(g.time * 1.7 + 1.3) * 13 * gravity, gr = Math.sin(g.time * 1.2 + 0.5) * 2.5 * gravity;
  return (
    <>
      <div className="absolute no-pe" style={{ left: L.musk.x, top: L.musk.y, width: L.musk.w, height: L.musk.h, transform: `translate(${gx}px,${gy}px) rotate(${gr}deg)` }}>
        <svg width="230" height="245" viewBox="0 0 230 245" className={hit ? 'anim-wobble' : 'anim-bob'} style={{ overflow: 'visible' }}>
          <g style={{ filter: g.blackoutT > 0 ? 'brightness(0)' : undefined }}>
          <path d="M20,245 Q20,170 115,165 Q210,170 210,245z" fill="#111827" />
          <text x="115" y="228" textAnchor="middle" fontSize="44" fontWeight="900" fill="#fff">𝕏</text>
          <rect x="98" y="140" width="34" height="34" fill="#f5c9a8" />
          <ellipse cx="115" cy="100" rx="62" ry="70" fill="#f8d3b5" />
          <ellipse cx="52" cy="104" rx="10" ry="16" fill="#f0bf9c" /><ellipse cx="178" cy="104" rx="10" ry="16" fill="#f0bf9c" />
          <path d="M52,86 Q44,24 110,22 Q180,18 182,80 Q170,48 130,50 Q90,40 70,60 Q60,70 52,86z" fill="#3f2a1d" />
          <path d="M70,58 Q110,20 170,56" stroke="#57402f" strokeWidth="8" fill="none" strokeLinecap="round" />
          {hit ? (<>
            <path d="M78,92 l18,10 -18,10 M152,92 l-18,10 18,10" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
            <ellipse cx="115" cy="140" rx="14" ry="10" fill="#7f1d1d" />
          </>) : (<>
            <path d="M76,80 q14,-8 28,-2 M128,78 q14,-6 28,2" stroke="#3f2a1d" strokeWidth="6" fill="none" strokeLinecap="round" />
            <g className="anim-blink"><ellipse cx="92" cy="100" rx="8" ry="9" fill="#1f2937" /><ellipse cx="140" cy="100" rx="8" ry="9" fill="#1f2937" /></g>
            <circle cx="95" cy="97" r="3" fill="#fff" /><circle cx="143" cy="97" r="3" fill="#fff" />
            <path d={`M92,${136} Q115,${136 + mouth} 142,${130}`} stroke="#7c2d12" strokeWidth="5" fill={talking ? '#7f1d1d' : 'none'} strokeLinecap="round" />
          </>)}
          <ellipse cx="78" cy="122" rx="10" ry="6" fill="#fca5a5" opacity=".5" /><ellipse cx="152" cy="122" rx="10" ry="6" fill="#fca5a5" opacity=".5" />
          {hit && [0, 1, 2].map((k) => { const a = g.time * 6 + k * 2.1; return <text key={k} x={115 + Math.cos(a) * 70} y={30 + Math.sin(a) * 16} fontSize="28" textAnchor="middle">⭐</text>; })}
          </g>
          {g.blackoutT > 0 && <g pointerEvents="none"><ellipse cx="92" cy="100" rx="8" ry="9" fill="#fff" /><ellipse cx="140" cy="100" rx="8" ry="9" fill="#fff" /></g>}
        </svg>
      </div>
      {g.musk.say && (
        <div className="absolute no-pe anim-pop" style={{ left: 16 + gx * 0.6, bottom: 900 - L.musk.y + 4 - gy * 0.6, width: 300, rotate: `${gr * 0.5}deg` }}>
          <div className="relative rounded-3xl bg-white px-4 py-3 text-[19px] font-bold leading-snug text-slate-800 shadow-[0_6px_0_#c7d2fe]" style={{ border: '3px solid #312e81' }}>
            <span className="mr-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[13px] text-white">일론</span>
            {g.musk.say}
            <div className="absolute -bottom-[14px] left-24 h-0 w-0" style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '14px solid #312e81' }} />
          </div>
        </div>
      )}
    </>
  );
}

function HintIcons({ c, day }: { c: Customer; day: number }) {
  const o = c.order;
  const items: React.ReactNode[] = [];
  if (o.bases !== 'any') o.bases.forEach((b, i) => items.push(<PlanetIcon key={'b' + i} id={b} size={34} />));
  else items.push(<span key="any" className="text-2xl">❓</span>);
  (o.tops ?? []).forEach((t, i) => items.push(<PlanetIcon key={'t' + i} id={t} size={34} />));
  if (o.hot) items.push(<span key="h" className="text-2xl">🔥</span>);
  if (o.superHot) items.push(<span key="sh" className="text-2xl">🔥</span>);
  if (o.cold) items.push(<span key="c" className="text-2xl">❄️</span>);
  if (o.freezing) items.push(<span key="f" className="text-2xl">❄️</span>);
  if (o.dense) items.push(<span key="d" className="text-2xl">🌀</span>);
  if (c.special === 'thief') return null;
  void day;
  return <div className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-50 px-2 py-0.5">{items}</div>;
}

export function CustomerView({ c, g }: { c: Customer; g: Game }) {
  const cx = L.custX[c.slot];
  const ratio = c.patience / c.max;
  let dx = 0, dy = 0, rot = 0, op = 1;
  if (c.state === 'enter') dy = (1 - easeOut(c.anim)) * 320;
  if (c.state === 'leave') {
    const a = Math.min(1, c.anim / 1.2);
    if (c.mood === 'ko') { rot = a * 80 * (c.slot ? 1 : -1); dy = a * a * 400; }
    else if (c.mood === 'angry' || c.mood === 'bad') { dx = Math.sin(c.anim * 40) * 8 * (1 - a); dy = a * a * 380; }
    else { dy = -Math.sin(a * Math.PI) * 60 + a * a * 350; rot = Math.sin(c.anim * 20) * 6; }
    op = 1 - Math.max(0, a - 0.7) / 0.3;
  }
  if (c.hitT > 0) { dx += Math.sin(c.hitT * 80) * 10; }
  if (c.special === 'sway' && c.state === 'wait') {
    dx += Math.sin(g.time * 13 + c.sway) * 34;
    dy += Math.cos(g.time * 10 + c.sway) * 20;
    rot += Math.sin(g.time * 12 + c.sway) * 9;
  }
  const gravity = g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT);
  dx += Math.sin(g.time * (1.8 + c.slot * 0.3) + c.sway) * 25 * gravity;
  dy += Math.sin(g.time * (2.1 + c.slot * 0.2) + c.sway * 1.7) * 20 * gravity;
  rot += Math.sin(g.time * (1.3 + c.slot * 0.2) + c.sway * 0.6) * 4 * gravity;
  const face = c.mood ?? (ratio > 0.6 ? 'neutral' : ratio > 0.3 ? 'worried' : 'mad');
  const angryShake = c.state === 'wait' && ratio < 0.25 ? Math.sin(g.time * 50) * 3 : 0;
  const swayBubbleX = (c.special === 'sway' ? Math.sin(g.time * 12 + c.sway) * 48 : 0) + Math.sin(g.time * (1.4 + c.slot * 0.3) + c.sway * 2) * 19 * gravity;
  const swayBubbleY = (c.special === 'sway' ? Math.cos(g.time * 10 + c.sway) * 26 : 0) + Math.sin(g.time * (1.9 + c.slot * 0.2) + c.sway) * 15 * gravity;
  const col = c.special === 'doge' ? '#fbbf24' : c.color;
  const showHint = c.state === 'wait' && (ratio < 0.65 || c.tut);
  return (
    <>
      <div className="absolute no-pe" style={{ left: cx - 160, top: 180, width: 320, height: COUNTER_Y - 180 + 30, transform: `translate(${dx + angryShake}px, ${dy}px) rotate(${rot}deg)`, transformOrigin: '50% 100%', opacity: op }}>
        <svg width="320" height={COUNTER_Y - 150} viewBox="0 0 320 425" style={{ overflow: 'visible' }}>
          <g className={c.state === 'wait' ? 'anim-bob' : ''} style={{ transformOrigin: '160px 400px' }}>
            <g style={{ filter: g.blackoutT > 0 ? 'brightness(0)' : undefined }}>
            {/* body */}
            <path d="M40,425 Q40,280 160,272 Q280,280 280,425z" fill={c.special === 'thief' ? '#1f2937' : col} stroke="#0003" strokeWidth="4" />
            {c.special === 'thief' && [300, 330, 360, 390].map((y) => <rect key={y} x="50" y={y} width="220" height="12" fill="#f8fafc" opacity=".8" />)}
            {c.special === 'vip' && <path d="M110,290 Q160,350 210,290" stroke="#facc15" strokeWidth="10" fill="none" />}
            {c.special === 'vip' && <circle cx="160" cy="330" r="16" fill="#facc15" stroke="#a16207" strokeWidth="3" />}
            <ellipse cx="160" cy="300" rx="50" ry="12" fill="#fff" opacity=".2" />
            {c.special === 'doge' ? (
              <g>
                <path d="M78,120 L96,40 L140,100z M242,120 L224,40 L180,100z" fill="#f59e0b" stroke="#92400e" strokeWidth="4" />
                <path d="M92,100 L100,62 L124,96z M228,100 L220,62 L196,96z" fill="#fde68a" />
                <ellipse cx="160" cy="170" rx="100" ry="92" fill="#f59e0b" stroke="#92400e" strokeWidth="4" />
                <ellipse cx="160" cy="205" rx="66" ry="52" fill="#fef3c7" />
                <ellipse cx="120" cy="150" rx="10" ry="12" fill="#1f2937" className="anim-blink" /><ellipse cx="200" cy="150" rx="10" ry="12" fill="#1f2937" className="anim-blink" />
                <path d="M110,132 q10,-6 20,0 M190,132 q10,-6 20,0" stroke="#92400e" strokeWidth="5" fill="none" />
                <ellipse cx="160" cy="185" rx="16" ry="11" fill="#1f2937" />
                <path d="M140,210 Q160,225 180,210" stroke="#1f2937" strokeWidth="5" fill="none" />
              </g>
            ) : (
              <g>
                {c.antenna > 0 && c.special !== 'thanos' && [0, 1].slice(0, c.antenna === 2 ? 2 : 1).map((k) => {
                  const sx = c.antenna === 2 ? (k ? 205 : 115) : 160;
                  const sw = Math.sin(g.time * 3 + k) * 10;
                  return <g key={k}><path d={`M${sx},100 Q${sx + sw},55 ${sx + sw * 1.5},30`} stroke={col} strokeWidth="7" fill="none" strokeLinecap="round" /><circle cx={sx + sw * 1.5} cy="26" r="13" fill="#fde047" stroke="#0003" strokeWidth="3" /></g>;
                })}
                <ellipse cx="160" cy="175" rx="112" ry="100" fill={col} stroke="#0003" strokeWidth="4" />
                <ellipse cx="125" cy="115" rx="40" ry="18" fill="#fff" opacity=".25" />
                {c.special === 'thanos' && <g><path d="M47,125 Q44,42 160,38 Q276,42 273,125 L244,107 L222,126 L200,104 L180,124 L160,101 L140,124 L120,104 L97,126 L76,106z" fill="#d6a51e" stroke="#713f12" strokeWidth="7" /><path d="M65,111 Q160,77 255,111" fill="none" stroke="#fef3c7" strokeWidth="8" /><path d="M111,238 l10,10 M139,244 l8,12 M168,244 l8,12 M196,238 l10,10" stroke="#4c1d95" strokeWidth="7" strokeLinecap="round" /></g>}
                {/* eyes */}
                {Array.from({ length: c.eyes }, (_, k) => {
                  const ex = c.eyes === 1 ? 160 : c.eyes === 2 ? 115 + k * 90 : 100 + k * 60;
                  const r = c.eyes === 1 ? 38 : c.eyes === 2 ? 28 : 22;
                  const ey = c.eyes === 3 && k === 1 ? 140 : 160;
                  const lookX = Math.max(-1, Math.min(1, (g.px - (cx - 160 + ex)) / 400)) * r * 0.35;
                  const lookY = Math.max(-1, Math.min(1, (g.py - (180 + ey)) / 400)) * r * 0.35;
                  if (face === 'ko') return <text key={k} x={ex} y={ey + 12} fontSize={r * 1.3} textAnchor="middle" fontWeight="900" fill="#111">X</text>;
                  if (face === 'happy') return <path key={k} d={`M${ex - r * 0.7},${ey + 5} Q${ex},${ey - r} ${ex + r * 0.7},${ey + 5}`} stroke="#111" strokeWidth="7" fill="none" strokeLinecap="round" />;
                  return (
                    <g key={k}>
                      <circle cx={ex} cy={ey} r={r} fill="#fff" stroke="#0004" strokeWidth="3" />
                      <g className="anim-blink"><circle cx={ex + lookX} cy={ey + lookY} r={r * 0.5} fill="#111" /><circle cx={ex + lookX + r * 0.18} cy={ey + lookY - r * 0.2} r={r * 0.16} fill="#fff" /></g>
                      {(face === 'mad' || face === 'angry') && <path d={`M${ex - r},${ey - r - 4} L${ex + r},${ey - r * 0.5}`} stroke="#111" strokeWidth="7" strokeLinecap="round" transform={k % 2 && c.eyes === 2 ? `scale(-1 1) translate(${-2 * ex} 0)` : ''} />}
                    </g>
                  );
                })}
                {c.special === 'thief' && (<g><rect x="70" y="135" width="180" height="46" rx="18" fill="#111" /><path d="M110,215 Q135,195 160,212 Q185,195 210,215 Q185,228 160,220 Q135,228 110,215z" fill="#3f2a1d" /></g>)}
                {c.special === 'vip' && <path d="M100,85 L110,40 L135,70 L160,30 L185,70 L210,40 L220,85z" fill="#facc15" stroke="#a16207" strokeWidth="4" />}
            {c.special === 'cosplay' && <g><path d="M82,108 Q96,58 160,58 Q224,58 238,108 L264,118 Q250,136 210,128 H82 Q48,132 42,117z" fill="#111827" stroke="#020617" strokeWidth="6" /><path d="M94,109 Q160,78 226,109" fill="none" stroke="#374151" strokeWidth="5" /><text x="160" y="105" textAnchor="middle" fontSize="35" fontWeight="900" fill="#fff">𝕏</text></g>}
                {c.special === 'thanos' && c.snapT <= 2 && <g className="anim-floaty"><path d="M230,225 L253,206 L289,218 L300,254 L283,289 L247,281 L230,255z" fill="#eab308" stroke="#854d0e" strokeWidth="5" />{['#ef4444', '#22d3ee', '#a855f7', '#4ade80', '#f97316', '#f8fafc'].map((color, i) => <circle key={i} cx={250 + (i % 2) * 22} cy={222 + Math.floor(i / 2) * 17} r="7" fill={color} style={{ filter: `drop-shadow(0 0 7px ${color})` }} />)}</g>}
                {/* mouth */}
                {face === 'happy' ? <path d="M120,220 Q160,265 200,220z" fill="#7f1d1d" stroke="#111" strokeWidth="4" />
                  : face === 'ok' || face === 'neutral' ? <path d="M130,228 Q160,240 190,228" stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" />
                    : face === 'worried' ? <path d="M135,235 Q160,225 185,235" stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" />
                      : face === 'ko' ? <ellipse cx="160" cy="235" rx="16" ry="10" fill="#7f1d1d" />
                        : <path d="M125,245 Q160,210 195,245z" fill="#7f1d1d" stroke="#111" strokeWidth="4" />}
                <ellipse cx="90" cy="210" rx="16" ry="9" fill="#f472b6" opacity=".45" /><ellipse cx="230" cy="210" rx="16" ry="9" fill="#f472b6" opacity=".45" />
                {(face === 'mad' || face === 'angry') && <text x="250" y="90" fontSize="42">💢</text>}
              </g>
            )}
            </g>
            {g.blackoutT > 0 && <g pointerEvents="none">{Array.from({ length: c.special === 'doge' ? 2 : c.eyes }, (_, k) => {
              const ex = c.special === 'doge' ? 120 + k * 80 : c.eyes === 1 ? 160 : c.eyes === 2 ? 115 + k * 90 : 100 + k * 60;
              const ey = c.special === 'doge' ? 150 : c.eyes === 3 && k === 1 ? 140 : 160;
              const r = c.special === 'doge' ? 10 : c.eyes === 1 ? 38 : c.eyes === 2 ? 28 : 22;
              return <ellipse key={k} cx={ex} cy={ey} rx={r} ry={r} fill="#fff" />;
            })}</g>}
          </g>
        </svg>
      </div>
      {/* patience + bubble */}
      {c.state !== 'leave' || c.say ? (
        <div className="absolute no-pe flex flex-col items-center" style={{ left: cx - 200 + swayBubbleX, top: 76 + swayBubbleY, width: 400, opacity: op }}>
          <div className="relative rounded-3xl bg-white px-4 py-2 text-center text-[22px] font-extrabold leading-tight text-slate-800 shadow-[0_6px_0_#a5b4fc] anim-pop" style={{ border: '3px solid #312e81', maxWidth: 400 }}>
            {c.state === 'leave' ? c.say : c.say ?? c.order.text}
            {c.state !== 'leave' && showHint && <HintIcons c={c} day={g.day} />}
          </div>
          {c.state === 'wait' && (
            <div className="mt-2 h-4 w-44 overflow-hidden rounded-full border-[3px] border-slate-900 bg-slate-700">
              <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444', transition: 'background .3s' }} />
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function Spots({ g, onRepair }: { g: Game; onRepair: (id: number) => void }) {
  return (
    <>
      {g.spots.map((s) => (
        <div key={s.id} className="absolute cursor-pointer" style={{ left: s.x - 60, top: s.y - 60, width: 120, height: 120, transform: `translate(${Math.sin(g.time * 1.8 + s.r) * 22 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}px,${Math.sin(g.time * 2.2 + s.r) * 17 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}px) rotate(${Math.sin(g.time * 1.4 + s.r) * 3 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}deg)` }} onPointerDown={(e) => { e.stopPropagation(); onRepair(s.id); }}>
          <svg width="120" height="120" viewBox="-60 -60 120 120" style={{ overflow: 'visible' }}>
            <circle r="56" fill="#fde047" opacity={0.15 + 0.1 * Math.sin(g.time * 8)} />
            <path transform={`rotate(${s.r})`} d="M-40,-10 L-25,-38 L0,-30 L20,-44 L38,-18 L46,8 L28,30 L6,44 L-18,34 L-42,20z" fill="#0f172a" stroke="#475569" strokeWidth="5" />
            <path transform={`rotate(${s.r})`} d="M-20,-10 L0,-20 L15,0 L0,15z" fill="#f97316" opacity={0.6 + 0.4 * Math.sin(g.time * 20)} />
            <text x={Math.sin(g.time * 13) * 20} y={-30 + Math.cos(g.time * 17) * 10} fontSize="30" textAnchor="middle">⚡</text>
            <text x="30" y="-40" fontSize="26" opacity=".8" style={{ transform: `translateY(${-(g.time * 30) % 30}px)` }}>💨</text>
            {s.prog > 0 && (<>
              <circle r="50" fill="none" stroke="#0006" strokeWidth="10" />
              <circle r="50" fill="none" stroke="#4ade80" strokeWidth="10" strokeDasharray={`${s.prog * 314} 314`} transform="rotate(-90)" strokeLinecap="round" />
            </>)}
            <text y="52" fontSize="22" textAnchor="middle" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="1">🔧 꾹!</text>
          </svg>
        </div>
      ))}
      {g.breach && <div className="absolute cursor-pointer" style={{ left: g.breach.x - 60, top: g.breach.y - 60, width: 120, height: 120 }} onPointerDown={(e) => { e.stopPropagation(); onRepair(-1); }}>
        <svg width="120" height="120" viewBox="-60 -60 120 120" style={{ overflow: 'visible' }}>
          <circle r="56" fill="#fde047" opacity={0.15 + 0.1 * Math.sin(g.time * 8)} />
          <path d="M-40,-10 L-25,-38 L0,-30 L20,-44 L38,-18 L46,8 L28,30 L6,44 L-18,34 L-42,20z" fill="#020617" stroke="#bfdbfe" strokeWidth="6" />
          <circle r="25" fill="#000" stroke="#64748b" strokeWidth="5" />
          <text x={Math.sin(g.time * 13) * 20} y="-30" fontSize="30" textAnchor="middle">⚡</text>
          <text y="52" fontSize="22" textAnchor="middle" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="1">🔧 꾹!</text>
          <circle r="50" fill="none" stroke="#0006" strokeWidth="10" />
          {g.breach.progress > 0 && <circle r="50" fill="none" stroke="#4ade80" strokeWidth="10" strokeDasharray={`${g.breach.progress * 314} 314`} transform="rotate(-90)" strokeLinecap="round" />}
        </svg>
      </div>}
    </>
  );
}

export function MeteorView({ g, onHit }: { g: Game; onHit: (x: number, y: number) => void }) {
  if (!g.meteor.length) return null;
  return <>{g.meteor.map((m, index) => {
  const p = m.t / m.max;
  const r = 60 + 140 * p;
  const s = m.hitT > 0 ? 0.9 : 1;
  return (
    <div key={index} className="absolute cursor-crosshair" style={{ left: m.x - r, top: m.y - r, width: r * 2, height: r * 2, transform: `scale(${s})` }} onPointerDown={(e) => { e.stopPropagation(); onHit(m.x, m.y); }}>
      <svg width={r * 2} height={r * 2} viewBox="-100 -100 200 200" style={{ overflow: 'visible' }}>
        <defs><radialGradient id="mfire"><stop offset="50%" stopColor="#f97316" stopOpacity=".9" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></radialGradient></defs>
        <circle r={100 + Math.sin(g.time * 30) * 5} fill="url(#mfire)" />
        <path d="M-70,-20 q10,-60 70,-66 q64,0 76,50 q12,60 -40,84 q-60,20 -96,-20 q-20,-24 -10,-48z" fill="#57534e" stroke="#292524" strokeWidth="6" />
        <circle cx="-20" cy="-20" r="16" fill="#44403c" /><circle cx="30" cy="20" r="22" fill="#44403c" /><circle cx="-30" cy="36" r="10" fill="#44403c" />
        <text y="10" fontSize="40" textAnchor="middle">😈</text>
        <rect x="-70" y="-120" width="140" height="16" rx="8" fill="#0008" />
        <rect x="-70" y="-120" width={140 * (m.hp / m.maxHp)} height="16" rx="8" fill="#ef4444" />
      </svg>
      <div className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-red-600 px-3 py-1 text-xl font-black text-white anim-pulse">클릭 연타! {Math.ceil(m.max - m.t)}</div>
    </div>
  ); })}</>;
}

export function IngLocked(id: string, day: number) { return !isUnlocked(id, day) || !ING[id]; }
