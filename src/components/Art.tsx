import { ING } from '../game/data';
import type { Cup } from '../game/engine';
import { tempClass } from '../game/engine';

export function PlanetIcon({ id, size = 70 }: { id: string; size?: number }) {
  const i = ING[id];
  const gid = `pg-${id}`;
  const grad = (
    <defs>
      <radialGradient id={gid} cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="25%" stopColor={i.color} />
        <stop offset="100%" stopColor={i.color2} />
      </radialGradient>
      <radialGradient id="shade" cx="30%" cy="30%" r="80%">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
      </radialGradient>
    </defs>
  );
  let body: React.ReactNode;
  switch (id) {
    case 'earth':
      body = (<>
        <circle r="40" fill="#2563eb" />
        <path d="M-25,-20 q10,-15 25,-8 q8,10 -5,18 q-15,4 -20,-10z M5,10 q15,-5 25,5 q-2,15 -18,18 q-12,-8 -7,-23z M-30,15 q8,-2 10,8 q-6,6 -12,0z" fill="#22c55e" />
        <path d="M-20,-34 q20,-6 38,2" stroke="#fff" strokeWidth="5" fill="none" opacity=".8" strokeLinecap="round" />
        <circle r="40" fill="url(#shade)" />
      </>);
      break;
    case 'mars':
      body = (<>
        <circle r="40" fill={`url(#${gid})`} />
        <circle cx="-12" cy="-8" r="7" fill="#7f1d1d" opacity=".5" /><circle cx="14" cy="12" r="10" fill="#7f1d1d" opacity=".4" /><circle cx="10" cy="-20" r="4" fill="#7f1d1d" opacity=".5" />
        <ellipse cx="0" cy="-36" rx="14" ry="4" fill="#fff" opacity=".85" />
      </>);
      break;
    case 'venus':
      body = (<>
        <circle r="40" fill={`url(#${gid})`} />
        <path d="M-35,-10 q20,-10 40,0 t30,0 M-38,8 q20,-8 40,2 t35,-2 M-28,24 q18,-6 36,0" stroke="#fff7" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>);
      break;
    case 'neptune':
      body = (<>
        <circle r="40" fill={`url(#${gid})`} />
        <path d="M-38,-8 h76 M-36,12 h72" stroke="#93c5fd" strokeWidth="6" opacity=".5" />
        <ellipse cx="12" cy="0" rx="8" ry="5" fill="#1e3a8a" />
      </>);
      break;
    case 'jupiter':
      body = (<>
        <circle r="40" fill="#fde68a" />
        <clipPath id="jc"><circle r="40" /></clipPath>
        <g clipPath="url(#jc)">
          {[-30, -14, 4, 20, 34].map((y, k) => <rect key={k} x="-45" y={y} width="90" height="8" fill={k % 2 ? '#b45309' : '#d97706'} />)}
          <ellipse cx="14" cy="12" rx="11" ry="7" fill="#dc2626" />
        </g>
        <circle r="40" fill="url(#shade)" />
      </>);
      break;
    case 'ring':
      body = (<>
        <ellipse rx="44" ry="15" fill="none" stroke="#a16207" strokeWidth="10" transform="rotate(-18)" />
        <ellipse rx="44" ry="15" fill="none" stroke="#fcd34d" strokeWidth="6" transform="rotate(-18)" />
        <ellipse rx="34" ry="10" fill="none" stroke="#fef3c7" strokeWidth="2" transform="rotate(-18)" />
        <text x="0" y="8" fontSize="22" textAnchor="middle">✨</text>
      </>);
      break;
    case 'moondust':
      body = (<>
        <circle r="34" fill={`url(#${gid})`} />
        <circle cx="-10" cy="-6" r="7" fill="#9ca3af" /><circle cx="12" cy="10" r="9" fill="#9ca3af" /><circle cx="10" cy="-16" r="4" fill="#9ca3af" />
        {[[-36, -30], [34, -28], [-30, 34], [38, 30]].map(([x, y], k) => <path key={k} d={`M${x},${y - 6} L${x + 2},${y - 2} L${x + 6},${y} L${x + 2},${y + 2} L${x},${y + 6} L${x - 2},${y + 2} L${x - 6},${y} L${x - 2},${y - 2}z`} fill="#fff" />)}
      </>);
      break;
    case 'comet':
      body = (<>
        <path d="M10,-10 L-44,30 L-36,40 z" fill="#e0f2fe" opacity=".5" />
        <path d="M14,-4 L-40,40 L-30,44 z" fill="#a5f3fc" opacity=".5" />
        <rect x="-8" y="-30" width="44" height="44" rx="10" fill="#a5f3fc" stroke="#67e8f9" strokeWidth="3" transform="rotate(12 14 -8)" />
        <rect x="0" y="-24" width="12" height="8" rx="3" fill="#fff" opacity=".8" transform="rotate(12 14 -8)" />
      </>);
      break;
    case 'asteroid':
      body = (<>
        <path d="M-34,-10 q4,-26 30,-28 q30,-2 36,20 q8,24 -14,38 q-26,14 -44,-4 q-14,-12 -8,-26z" fill="#78716c" stroke="#44403c" strokeWidth="3" />
        <circle cx="-8" cy="-10" r="6" fill="#57534e" /><circle cx="12" cy="10" r="8" fill="#57534e" /><circle cx="-14" cy="14" r="4" fill="#57534e" />
      </>);
      break;
  }
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: 'visible' }}>
      {grad}
      {body}
    </svg>
  );
}

export function CupView({ cup, w = 120, t = 0 }: { cup: Cup; w?: number; t?: number }) {
  const h = w * 1.42;
  const temp = tempClass(cup);
  const layers = cup.bases.length;
  const liquidTop = 60;
  const liquidBottom = 186;
  const lh = layers ? (liquidBottom - liquidTop) / layers : 0;
  const clipId = `cupclip-${cup.id}`;
  const squish = cup.dense ? 0.82 : 1;
  const pop = 1 + cup.pop * 0.6;
  return (
    <svg width={w} height={h} viewBox="0 0 140 200" style={{ overflow: 'visible', transform: `scale(${pop}, ${pop * squish})`, transformOrigin: '50% 100%' }}>
      <defs>
        <clipPath id={clipId}><path d="M22,44 L118,44 L106,188 Q70,196 34,188 Z" /></clipPath>
      </defs>
      {cup.dense && <circle cx="70" cy="120" r="85" fill="#7c3aed" opacity={0.25 + 0.1 * Math.sin(t * 6)} />}
      {cup.tops.includes('ring') && <ellipse cx="70" cy="120" rx="80" ry="20" fill="none" stroke="#a16207" strokeWidth="9" />}
      <ellipse cx="70" cy="192" rx="52" ry="8" fill="#0003" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="140" height="200" fill="#e0f2fe" opacity=".35" />
        {cup.bases.map((b, k) => {
          const ing = ING[b];
          const y = liquidBottom - (k + 1) * lh;
          return (
            <g key={k}>
              <rect x="0" y={y} width="140" height={lh + 2} fill={ing.color} />
              <path d={`M0,${y + 6} Q35,${y - 4 + Math.sin(t * 3 + k) * 3} 70,${y + 6} T140,${y + 6} V${y + lh} H0z`} fill={ing.color2} opacity=".45" />
            </g>
          );
        })}
        {layers > 0 && <path d={`M0,${liquidTop} Q35,${liquidTop - 6 + Math.sin(t * 4) * 3} 70,${liquidTop} T140,${liquidTop} V${liquidTop + 6} H0z`} fill="#fff" opacity=".35" />}
        {cup.dense && <path d="M70,120 m-30,0 a30,30 0 1,1 60,0 a20,20 0 1,1 -40,0 a10,10 0 1,1 20,0" stroke="#e9d5ff" strokeWidth="4" fill="none" opacity=".7" transform={`rotate(${t * 200} 70 120)`} />}
        {cup.burnt && <rect x="0" y="0" width="140" height="200" fill="#1c1917" opacity=".7" />}
        {temp === 'cold' && <rect x="0" y="0" width="140" height="200" fill="#e0f2fe" opacity=".38" />}
      </g>
      <path d="M22,44 L118,44 L106,188 Q70,196 34,188 Z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32,56 L40,176" stroke="#fff" strokeWidth="6" opacity=".6" strokeLinecap="round" />
      {temp === 'cold' && <text x="104" y="178" fontSize="22">❄️</text>}
      {cup.tops.includes('ring') && <path d="M-10,120 A80,20 0 0,0 150,120" fill="none" stroke="#fcd34d" strokeWidth="7" />}
      {cup.tops.includes('comet') && (<g>
        <rect x="36" y="30" width="30" height="30" rx="7" fill="#a5f3fc" stroke="#fff" strokeWidth="3" transform="rotate(-12 51 45)" />
        <rect x="72" y="34" width="26" height="26" rx="6" fill="#cffafe" stroke="#fff" strokeWidth="3" transform="rotate(15 85 47)" />
      </g>)}
      {cup.tops.includes('asteroid') && (<g>
        <path d="M44,40 q6,-12 18,-6 q8,10 -2,16 q-14,4 -16,-10z" fill="#78716c" stroke="#44403c" strokeWidth="2" />
        <path d="M82,38 q10,-8 16,2 q2,12 -10,12 q-10,-4 -6,-14z" fill="#57534e" stroke="#292524" strokeWidth="2" />
      </g>)}
      {cup.tops.includes('moondust') && [[40, 30], [60, 20], [80, 28], [100, 22], [70, 36], [52, 40], [90, 40]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y + Math.sin(t * 5 + k) * 3} r="4" fill="#fff" stroke="#d1d5db" />
      ))}
      {temp === 'hot' && [0, 1, 2].map((k) => (
        <path key={k} d={`M${50 + k * 20},${20 - ((t * 40 + k * 15) % 30)} q-8,-10 0,-20 q8,-10 0,-20`} stroke="#f97316" strokeWidth="5" fill="none" opacity={0.8 - ((t * 40 + k * 15) % 30) / 40} strokeLinecap="round" />
      ))}
      {temp === 'hot' && <text x="104" y="178" fontSize="22">🔥</text>}
      {cup.burnt && <text x="50" y="30" fontSize="36" opacity=".9">💨</text>}
    </svg>
  );
}

export function Mallet({ size = 110, rot = -30 }: { size?: number; rot?: number }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160" style={{ overflow: 'visible', transform: `rotate(${rot}deg)`, transformOrigin: '50% 85%' }}>
      <rect x="44" y="50" width="12" height="104" rx="6" fill="#d97706" stroke="#92400e" strokeWidth="3" />
      <rect x="44" y="130" width="12" height="24" rx="5" fill="#fbbf24" />
      <rect x="4" y="8" width="92" height="52" rx="22" fill="#f43f5e" stroke="#9f1239" strokeWidth="4" />
      <rect x="0" y="12" width="14" height="44" rx="7" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />
      <rect x="86" y="12" width="14" height="44" rx="7" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />
      <rect x="22" y="16" width="44" height="10" rx="5" fill="#fff" opacity=".5" />
    </svg>
  );
}
