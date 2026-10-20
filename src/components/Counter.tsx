import type { Game, Rect } from '../game/engine';
import { L, ingRect, cupPos, machineBtn, heatZone, compZone, ingDisabled, COUNTER_Y } from '../game/engine';
import { INGREDIENTS, ING, isUnlocked, MACHINE_DAY } from '../game/data';
import { PlanetIcon, CupView, Mallet } from './Art';

export interface Api {
  startDrag: (type: 'ing' | 'cup' | 'hammer', id: string | number, e: React.PointerEvent) => void;
  takeCup: () => void;
  hold: (m: 'heater' | 'comp') => void;
  repair: (id: number) => void;
  meteor: () => void;
}

const tile = (r: Rect): React.CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h });

export function Counter({ g, api }: { g: Game; api: Api }) {
  const dragging = g.drag;
  const holderCount = g.cups.reduce((count, cup) => count + (cup.loc === 0 || cup.loc === 1 ? 1 : 0), 0);
  const gravity = g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT);
  const driftStyle = (seed: number): React.CSSProperties => {
    const speed = 1.15 + (seed % 5) * 0.19;
    const x = 12 + (seed * 7 % 15), y = 10 + (seed * 11 % 16), rot = 1 + (seed % 4) * 0.45;
    return { transform: `translate(${Math.sin(g.time * speed + seed) * x * gravity}px, ${Math.sin(g.time * (speed * 0.83) + seed * 1.7) * y * gravity}px) rotate(${Math.sin(g.time * (speed * 0.61) + seed * 0.7) * rot * gravity}deg)`, transformOrigin: 'center center' };
  };
  const blackoutShape: React.CSSProperties = g.blackoutT > 0 ? { filter: 'brightness(0) drop-shadow(1px 0 #e2e8f0) drop-shadow(-1px 0 #e2e8f0) drop-shadow(0 1px #e2e8f0) drop-shadow(0 -1px #e2e8f0)' } : {};
  return (
    <>
      {/* bottom sheet */}
      <div className="absolute no-pe" style={{ left: 8, top: COUNTER_Y, width: 1584, height: 900 - COUNTER_Y + 20, borderRadius: '36px 36px 0 0', background: g.blackoutT > 0 ? '#000' : 'linear-gradient(180deg,#fdf4ff 0%,#e9d5ff 18%,#c4b5fd 100%)', boxShadow: g.blackoutT > 0 ? 'none' : '0 -10px 30px #0008, inset 0 6px 0 #fff', ...driftStyle(4) }}>
        <div className="absolute left-1/2 top-2 h-2 w-24 -translate-x-1/2 rounded-full bg-violet-400/60" />
      </div>

      {/* dispenser */}
      <div className="absolute pointer-events-auto btn3d cursor-pointer rounded-3xl bg-white/70 shadow-[0_5px_0_#a78bfa]" style={{ ...tile(L.dispenser), ...driftStyle(1), ...blackoutShape }} onPointerDown={(e) => { e.stopPropagation(); api.takeCup(); }}>
        <svg width="126" height="136" viewBox="0 0 126 136">
          {[0, 1, 2].map((k) => <path key={k} d={`M33,${34 + k * 14} L93,${34 + k * 14} L86,${104 + k * 6} L40,${104 + k * 6}z`} fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="3" />)}
          <text x="63" y="30" textAnchor="middle" fontSize="18" fontWeight="900" fill="#6d28d9">+ 컵</text>
          <text x="63" y="128" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7c3aed">{holderCount}/2</text>
        </svg>
      </div>
      {/* trash */}
      <div className="absolute rounded-3xl bg-slate-800/80 shadow-[0_5px_0_#1e1b4b] flex flex-col items-center justify-center" style={{ ...tile(L.trash), ...driftStyle(2), ...blackoutShape, outline: dragging?.type === 'cup' ? '4px dashed #f87171' : undefined }}>
        <svg width="80" height="90" viewBox="0 0 80 90"><path d="M12,24 H68 L62,84 H18z" fill="#475569" stroke="#94a3b8" strokeWidth="4" /><rect x="6" y="14" width="68" height="10" rx="4" fill="#94a3b8" /><text x="40" y="66" textAnchor="middle" fontSize="28">🕳️</text></svg>
        <span className="text-sm font-black text-slate-300">블랙홀 쓰레기통</span>
      </div>

      {/* cup slots */}
      {L.slots.map((r, i) => (
        <div key={i} className="absolute no-pe rounded-3xl" style={{ ...tile(r), ...driftStyle(10 + i), ...blackoutShape, background: g.blackoutT > 0 ? '#000' : '#ffffff55', border: g.blackoutT > 0 ? '2px solid #64748b' : dragging?.type === 'cup' ? '4px dashed #8b5cf6' : '3px dashed #a78bfa88' }}>
          <div className="absolute bottom-3 left-1/2 h-4 w-28 -translate-x-1/2 rounded-full bg-violet-300/70" />
        </div>
      ))}

      {/* ingredients */}
      {INGREDIENTS.map((ing) => {
        const r = ingRect(ing.id);
        const unlocked = isUnlocked(ing.id, g.day);
        const st = g.stock[ing.id] ?? 0;
        const dis = ingDisabled(g, ing.id);
        const can = unlocked && st > 0 && !dis;
        const beingDragged = dragging?.type === 'ing' && dragging.id === ing.id;
        return (
          <div key={ing.id} className={`absolute rounded-3xl flex flex-col items-center justify-center ${can ? 'pointer-events-auto cursor-grab btn3d' : ''}`}
            style={{ ...tile(r), ...driftStyle(20 + r.x), ...blackoutShape, background: g.blackoutT > 0 ? '#000' : ing.kind === 'base' ? 'linear-gradient(180deg,#fff,#ede9fe)' : 'linear-gradient(180deg,#fff,#fce7f5)', boxShadow: g.blackoutT > 0 ? 'none' : `0 5px 0 ${ing.kind === 'base' ? '#a78bfa' : '#f9a8d4'}`, outline: g.blackoutT > 0 ? undefined : undefined, opacity: beingDragged ? 0.5 : 1 }}
            onPointerDown={(e) => { if (can) { e.stopPropagation(); api.startDrag('ing', ing.id, e); } }}>
            {unlocked ? (<>
              <div className="anim-floaty" style={{ animationDelay: `${r.x / 300}s`, filter: st <= 0 ? 'grayscale(1) opacity(.4)' : undefined }}><PlanetIcon id={ing.id} size={72} /></div>
              <div className="mt-1 text-[15px] font-black text-violet-900 leading-none">{ing.name}</div>
              <div className={`absolute right-1.5 top-1.5 min-w-[30px] rounded-full px-1.5 text-center text-[16px] font-black ${st <= 2 ? 'bg-red-500 text-white anim-pulse' : 'bg-violet-600 text-white'}`}>{st}</div>
              {ing.temp !== 0 && <div className="absolute left-1.5 top-1 text-lg">{ing.temp > 0 ? '🔥' : '❄️'}</div>}
              {dis && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-orange-500/70 text-4xl anim-pulse">🫠<span className="text-sm font-black text-white">녹는 중</span></div>}
            </>) : (
              <div className="flex flex-col items-center opacity-60"><div style={{ filter: 'brightness(0) opacity(.3)' }}><PlanetIcon id={ing.id} size={64} /></div><span className="text-2xl">🔒</span><span className="text-xs font-black text-violet-800">DAY {ing.day}</span></div>
            )}
          </div>
        );
      })}
      <div className="absolute no-pe text-[13px] font-black text-violet-700/80" style={{ left: 500, top: 580, ...driftStyle(31), ...blackoutShape }}>🪐 원액</div>
      <div className="absolute no-pe text-[13px] font-black text-pink-700/80" style={{ left: 500, top: 736, ...driftStyle(32), ...blackoutShape }}>✨ 토핑</div>

      <Machine g={g} api={api} m="heater" />
      <Machine g={g} api={api} m="comp" />

      {/* hammer */}
      <div className="absolute pointer-events-auto cursor-grab rounded-3xl flex flex-col items-center justify-end pb-3 btn3d" style={{ ...tile(L.hammer), ...driftStyle(40), background: g.blackoutT > 0 ? '#000' : 'linear-gradient(180deg,#fff1f2,#fecdd3)', boxShadow: g.blackoutT > 0 ? 'none' : '0 5px 0 #fb7185', border: g.blackoutT > 0 ? '1px solid #e2e8f0' : undefined }}
        onPointerDown={(e) => { e.stopPropagation(); api.startDrag('hammer', 'h', e); }}>
        <div className="absolute top-6" style={{ opacity: dragging?.type === 'hammer' ? 0.25 : 1, filter: g.blackoutT > 0 ? 'brightness(0) drop-shadow(1px 0 #e2e8f0) drop-shadow(-1px 0 #e2e8f0) drop-shadow(0 1px #e2e8f0) drop-shadow(0 -1px #e2e8f0)' : undefined }}><Mallet size={86} rot={-20 + Math.sin(g.time * 3) * 6} /></div>
        <span className="text-[15px] font-black text-rose-700 leading-tight text-center" style={{ color: g.blackoutT > 0 ? '#000' : undefined }}>대형<br />뿅망치</span>
      </div>

      {/* cups */}
      {g.cups.map((c) => {
        const p = cupPos(c.loc);
        const inM = c.loc === 'heater' || c.loc === 'comp';
        const w = inM ? 96 : 120;
        const h = w * 1.42;
        const drag = dragging?.type === 'cup' && dragging.id === c.id;
        const hot = dragging?.type === 'ing';
        return (
          <div key={c.id} className="absolute pointer-events-auto cursor-grab" style={{ left: p.x - w / 2, top: p.y - h * 0.72, width: w, height: h, opacity: drag ? 0.3 : 1, ...driftStyle(50 + c.id), ...(g.blackoutT > 0 ? blackoutShape : { filter: hot ? 'drop-shadow(0 0 12px #fde047)' : 'drop-shadow(0 4px 4px #0004)' }) }}
            onPointerDown={(e) => { e.stopPropagation(); api.startDrag('cup', c.id, e); }}>
            <CupView cup={c} w={w} t={g.time} />
          </div>
        );
      })}

      {/* thieves */}
      {g.thieves.map((t) => {
        const r = ingRect(t.ing);
        const x = r.x + r.w / 2, y = r.y - 30;
        let dy = Math.sin(g.time * 5) * 6, rot = 0, op = 1;
        if (t.state === 'bonked') { dy = t.anim * t.anim * 600; rot = t.anim * 720; op = 1 - t.anim / 1.2; }
        if (t.state === 'fled') { dy = -t.anim * 500; op = 1 - t.anim / 1.2; }
        const p = t.t / t.max;
        return (
          <div key={t.id} className="absolute no-pe" style={{ left: x - 80, top: y - 90 + dy, width: 160, height: 240, opacity: op, transform: `${driftStyle(70 + t.id).transform} rotate(${rot}deg)`, filter: g.blackoutT > 0 ? 'brightness(0) drop-shadow(1px 0 #e2e8f0) drop-shadow(-1px 0 #e2e8f0) drop-shadow(0 1px #e2e8f0) drop-shadow(0 -1px #e2e8f0)' : undefined }}>
            <svg width="160" height="240" viewBox="0 0 160 240" style={{ overflow: 'visible' }}>
              {t.state === 'steal' && <path d="M55,90 L20,230 L140,230 L105,90z" fill="#bef264" opacity={0.25 + 0.15 * Math.sin(g.time * 12)} />}
              <ellipse cx="80" cy="80" rx="70" ry="22" fill="#64748b" stroke="#1e293b" strokeWidth="4" />
              <ellipse cx="80" cy="55" rx="36" ry="32" fill="#bae6fd" opacity=".7" stroke="#1e293b" strokeWidth="3" />
              <circle cx="80" cy="56" r="20" fill="#84cc16" />
              <rect x="62" y="48" width="36" height="10" rx="4" fill="#111" />
              <path d="M68,66 q12,8 24,0" stroke="#111" strokeWidth="3" fill="none" />
              {[30, 60, 100, 130].map((cx, k) => <circle key={k} cx={cx} cy="84" r="5" fill={Math.floor(g.time * 6 + k) % 2 ? '#fde047' : '#f87171'} />)}
              {t.state === 'steal' && (<>
                <circle cx="80" cy="-10" r="22" fill="#0009" />
                <circle cx="80" cy="-10" r="22" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray={`${p * 138} 138`} transform="rotate(-90 80 -10)" />
                <text x="80" y="-2" fontSize="22" textAnchor="middle">🔨</text>
              </>)}
              {t.state === 'bonked' && <text x="80" y="20" fontSize="40" textAnchor="middle">💫</text>}
            </svg>
          </div>
        );
      })}
    </>
  );
}

function Machine({ g, api, m }: { g: Game; api: Api; m: 'heater' | 'comp' }) {
  const r = m === 'heater' ? L.heater : L.comp;
  const locked = m === 'comp' && g.day < MACHINE_DAY.comp;
  const btn = machineBtn(m);
  const [a, b] = m === 'heater' ? heatZone(g) : compZone(g);
  const v = g.gauge[m];
  const hasCup = g.cups.some((c) => c.loc === m);
  const holding = g.holding === m;
  const inZone = v >= a && v <= b;
  const theme = m === 'heater' ? { bg: 'linear-gradient(180deg,#fff7ed,#fed7aa)', sh: '#fb923c', btn: '#f97316', name: '태양 가열기', icon: '☀️' } : { bg: 'linear-gradient(180deg,#faf5ff,#ddd6fe)', sh: '#8b5cf6', btn: '#7c3aed', name: '중력 압축기', icon: '🌀' };
  const drop = g.drag?.type === 'cup' && !hasCup && !locked;
  return (
    <div className="absolute rounded-3xl" style={{ left: r.x, top: r.y, width: r.w, height: r.h, transform: `translate(${Math.sin(g.time * 1.4 + r.x) * 14 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}px, ${Math.sin(g.time * 1.1 + r.y) * 13 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}px) rotate(${Math.sin(g.time * 0.9 + r.x) * 1.4 * (g.gravityT > 0 ? 1 : Math.max(0, -g.gravityT))}deg)`, background: g.blackoutT > 0 ? '#000' : theme.bg, boxShadow: g.blackoutT > 0 ? 'none' : `0 5px 0 ${theme.sh}`, border: g.blackoutT > 0 ? '1px solid #e2e8f0' : undefined, outline: drop ? `4px dashed ${theme.sh}` : undefined }}>
      <div className="absolute inset-0 rounded-3xl" style={{ filter: g.blackoutT > 0 ? 'brightness(0)' : undefined }}>
      {locked ? (
        <div className="flex h-full flex-col items-center justify-center opacity-60"><span className="text-5xl">{theme.icon}</span><span className="text-3xl">🔒</span><span className="text-xs font-black">DAY {MACHINE_DAY.comp}</span></div>
      ) : (<>
        <div className="absolute left-0 right-0 top-1.5 text-center text-[15px] font-black" style={{ color: theme.btn }}>{theme.icon} {theme.name}</div>
        {/* machine art */}
        <svg className="absolute no-pe" style={{ left: 0, top: 24 }} width={r.w} height="170" viewBox="0 0 164 170">
          {m === 'heater' ? (<>
            <g transform="translate(82 26)"><circle r={16 + (holding ? v / 10 : 0)} fill="#fde047" style={{ filter: `drop-shadow(0 0 ${6 + (holding ? v / 4 : 0)}px #f97316)` }} />
              {Array.from({ length: 8 }, (_, k) => <rect key={k} x="-3" y={-30 - (holding ? v / 8 : 0)} width="6" height="10" rx="3" fill="#f97316" transform={`rotate(${k * 45 + g.time * (holding ? 300 : 30)})`} />)}</g>
            <rect x="22" y="150" width="120" height="14" rx="6" fill={holding ? '#ef4444' : '#78350f'} />
          </>) : (<>
            <rect x="18" y={10 + (holding ? v * 0.5 : 0)} width="128" height="18" rx="6" fill="#4c1d95" />
            <rect x="74" y="0" width="16" height={12 + (holding ? v * 0.5 : 0)} fill="#6d28d9" />
            <rect x="22" y="150" width="120" height="14" rx="6" fill="#4c1d95" />
            {holding && v > b && <circle cx="82" cy="100" r={(v - b) * 2} fill="#000" opacity=".8" />}
          </>)}
          {!hasCup && <text x="82" y="112" textAnchor="middle" fontSize="15" fontWeight="900" fill={theme.btn} opacity=".6">컵을 여기로</text>}
        </svg>
        {/* gauge */}
        <div className="absolute no-pe overflow-hidden rounded-full border-[3px] border-slate-800 bg-slate-700" style={{ left: 14, top: 192, width: r.w - 28, height: 18 }}>
          <div className="absolute top-0 h-full bg-green-400/80" style={{ left: `${a}%`, width: `${b - a}%` }} />
          <div className="absolute top-0 h-full" style={{ left: 0, width: `${Math.min(100, v)}%`, background: inZone ? '#fde047' : v > b ? '#ef4444' : theme.btn, opacity: 0.85 }} />
        </div>
        <div className={`absolute pointer-events-auto flex items-center justify-center rounded-2xl text-[20px] font-black text-white select-none ${hasCup ? 'cursor-pointer' : 'opacity-40'}`}
          style={{ left: btn.x - r.x, top: btn.y - r.y, width: btn.w, height: btn.h, background: theme.btn, boxShadow: holding ? `0 1px 0 #0006` : `0 6px 0 #0006`, transform: holding ? 'translateY(5px)' : undefined }}
          onPointerDown={(e) => { e.stopPropagation(); if (hasCup) api.hold(m); }}>
          {holding ? (inZone ? '지금 떼!' : v > b ? '💀💀' : '꾹...') : '꾹 누르기'}
        </div>
      </>)}
      </div>
      {g.blackoutT > 0 && <div className="absolute pointer-events-none rounded-2xl border-[3px] border-dashed border-slate-100" style={{ left: btn.x - r.x, top: btn.y - r.y, width: btn.w, height: btn.h }} />}
    </div>
  );
}

export { ING };
