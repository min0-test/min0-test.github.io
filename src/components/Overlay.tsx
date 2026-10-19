import { useLayoutEffect, useRef, useState } from 'react';
import type { Game, Special } from '../game/engine';
import type { ParticleShape } from '../game/engine';
import { TUT_STEPS, ingRect, L, machineBtn, tutActive, W, H, debugAddMoney, debugRestock, debugSpawnCustomer, debugTriggerDisaster } from '../game/engine';
import { PlanetIcon, CupView, Mallet } from './Art';
import { type DisasterType } from '../game/data';
import { isMuted, setMuted } from '../game/audio';

function TutorialSkipButton({ onSkip }: { onSkip: () => void }) {
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const cancel = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; setHolding(false); };
  useLayoutEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  return <button className="relative pointer-events-auto overflow-hidden rounded-xl border-[3px] border-white bg-gradient-to-b from-amber-300 to-amber-500 px-3 py-1 text-[15px] font-black text-amber-950 shadow-[0_4px_0_#92400e] select-none touch-none whitespace-nowrap" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setHolding(true); e.currentTarget.setPointerCapture(e.pointerId); timer.current = window.setTimeout(() => { timer.current = null; setHolding(false); onSkip(); }, 1000); }} onPointerUp={(e) => { e.stopPropagation(); cancel(); }} onPointerCancel={cancel} onLostPointerCapture={cancel}><span className="relative z-10">스킵 · 꾹 누르기</span>{holding && <span className="absolute inset-y-0 left-0 bg-amber-200/90" style={{ width: '100%', transformOrigin: 'left', animation: 'tutorial-skip-fill 1s linear forwards' }} />}</button>;
}

export function HUD({ g, onMute, onSkipTutorial }: { g: Game; onMute: () => void; onSkipTutorial: () => void }) {
  const left = Math.max(0, g.dayLen - g.dayTime);
  const p = Math.min(1, g.dayTime / g.dayLen);
  const warn = left < 10 && !tutActive(g);
  return (
    <>
      <div className="absolute no-pe flex items-center gap-3" style={{ left: 20, top: 12 }}>
        <div className="rounded-2xl bg-gradient-to-b from-fuchsia-400 to-violet-600 px-4 py-1.5 text-[26px] font-black text-white shadow-[0_5px_0_#4c1d95]" style={{ border: '3px solid #fff' }}>DAY {g.day}</div>
        <div className="relative h-9 w-[320px] rounded-full bg-slate-900/80" style={{ border: '3px solid #fff' }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(1 - p) * 100}%`, background: warn ? '#ef4444' : 'linear-gradient(90deg,#22d3ee,#a78bfa)' }} />
          <div className="absolute -top-2 text-3xl" style={{ left: `calc(${(1 - p) * 100}% - 20px)`, transform: 'rotate(45deg)' }}>🚀</div>
          <div className={`absolute inset-0 flex items-center justify-center text-[20px] font-black text-white ${warn ? 'anim-pulse' : ''}`} style={{ textShadow: '0 2px 0 #000' }}>{tutActive(g) ? '⏸ 튜토리얼' : `⏱ ${Math.ceil(left)}`}</div>
        </div>
        {tutActive(g) && <TutorialSkipButton onSkip={onSkipTutorial} />}
      </div>
      <div className="absolute flex items-center gap-2" style={{ right: 20, top: 12 }}>
        <div className="no-pe flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-1.5 text-[28px] font-black text-amber-950 shadow-[0_5px_0_#92400e]" style={{ border: '3px solid #fff' }}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 text-lg text-amber-700" style={{ border: '3px solid #b45309' }}>Ð</span>
          <span className={g.money < 0 ? 'text-red-700' : ''}>{Math.round(g.money)}</span>
        </div>
        <button className="btn3d rounded-2xl bg-slate-800/80 px-3 py-1.5 text-2xl" style={{ border: '3px solid #fff' }} onPointerDown={(e) => { e.stopPropagation(); setMuted(!isMuted()); onMute(); }}>{isMuted() ? '🔇' : '🔊'}</button>
      </div>
    </>
  );
}

function drawParticle(ctx: CanvasRenderingContext2D, shape: ParticleShape | undefined, x: number, y: number, size: number, rot: number, color: string) {
  const r = size / 2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, size * 0.1); ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (shape) {
    case 'coin': ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff9'; ctx.lineWidth = Math.max(1, size * 0.07); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2); ctx.stroke(); break;
    case 'star': case 'spark': case 'anger': {
      const points = shape === 'star' ? 5 : 4;
      for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / points, rr = i % 2 ? r * 0.42 : r; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill(); break;
    }
    case 'heart': ctx.moveTo(0, r * 0.82); ctx.bezierCurveTo(-r * 1.3, 0, -r * 0.85, -r * 0.9, 0, -r * 0.28); ctx.bezierCurveTo(r * 0.85, -r * 0.9, r * 1.3, 0, 0, r * 0.82); ctx.fill(); break;
    case 'smoke': ctx.arc(-r * 0.32, r * 0.12, r * 0.5, 0, Math.PI * 2); ctx.arc(r * 0.28, 0, r * 0.58, 0, Math.PI * 2); ctx.arc(0, -r * 0.4, r * 0.42, 0, Math.PI * 2); ctx.fill(); break;
    case 'shard': case 'ice': ctx.moveTo(0, -r); ctx.lineTo(r * 0.72, r * 0.25); ctx.lineTo(r * 0.18, r); ctx.lineTo(-r * 0.78, r * 0.42); ctx.closePath(); ctx.fill(); break;
    case 'trash': ctx.moveTo(-r * 0.65, -r * 0.55); ctx.lineTo(r * 0.65, -r * 0.55); ctx.lineTo(r * 0.48, r * 0.8); ctx.lineTo(-r * 0.48, r * 0.8); ctx.closePath(); ctx.fill(); ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, Math.max(1.5, size * 0.12)); break;
    case 'gear': ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2, true); ctx.fill('evenodd'); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-r * 0.18, -r, r * 0.36, r * 0.45); } break;
    case 'flame': ctx.moveTo(0, r); ctx.bezierCurveTo(-r * 1.1, r * 0.1, -r * 0.25, -r * 0.15, 0, -r); ctx.bezierCurveTo(r * 0.25, -r * 0.15, r * 1.1, r * 0.1, 0, r); ctx.fill(); break;
    case 'drop': ctx.moveTo(0, -r); ctx.bezierCurveTo(-r * 0.2, -r * 0.2, -r, r * 0.35, 0, r); ctx.bezierCurveTo(r, r * 0.35, r * 0.2, -r * 0.2, 0, -r); ctx.fill(); break;
    default: ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function FX({ g }: { g: Game }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawnRef = useRef(false);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current ?? canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) return;
    contextRef.current = ctx;
    if (!g.particles.length && !g.texts.length) {
      if (drawnRef.current) ctx.clearRect(0, 0, W, H);
      drawnRef.current = false;
      return;
    }
    drawnRef.current = true;
    ctx.clearRect(0, 0, W, H);
    for (const p of g.particles) {
      if (p.ingredient) continue;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      drawParticle(ctx, p.shape, p.x, p.y, p.size, p.rot, p.color ?? '#fff');
    }
    ctx.globalAlpha = 1;
    for (const t of g.texts) {
      const age = 1.4 - t.life;
      const scale = age < 0.15 ? age / 0.15 * 1.2 : age < 0.25 ? 1.2 - (age - 0.15) * 2 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.translate(t.x, t.y); ctx.scale(scale, scale);
      ctx.font = `900 ${t.size}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1e1b4b';
      ctx.shadowColor = '#1e1b4b'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 4;
      ctx.strokeText(t.text, 0, 0); ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }, [g, g.time]);
  return (
    <div className="absolute inset-0 no-pe">
      <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
      {g.particles.map((p, i) => p.ingredient && <div key={p.flyId ?? i} className="absolute no-pe" style={{ left: p.x - 36, top: p.y - 36, opacity: Math.min(1, p.life / p.max * 1.5), transform: `scale(${0.85 + 0.15 * p.life / p.max})` }}><PlanetIcon id={p.ingredient} size={72} /></div>)}
      {g.hammerSwing && (
        <div className="absolute" style={{ left: g.hammerSwing.x - 55, top: g.hammerSwing.y - 160 }}>
          <Mallet size={110} rot={-70 + (1 - g.hammerSwing.t / 0.35) * 110} />
        </div>
      )}
    </div>
  );
}

export function Weather({ g }: { g: Game }) {
  return (
    <div className="absolute inset-0 no-pe">
      {g.flareT > 0 && (
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 0% 0%, #fde047cc 0%, #f9731666 30%, #ef444422 60%, transparent 80%)`, opacity: 0.7 + 0.3 * Math.sin(g.time * 10), mixBlendMode: 'screen' }} />
      )}
      {g.supernova > 0 && <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 60% 30%, #ffffff 0%, #fefce8 35%, #fde68aee 60%, #fff 100%)', opacity: Math.min(1, g.supernova * 1.15) }} />}
      {g.flash > 0 && <div className="absolute inset-0 bg-white" style={{ opacity: g.flash }} />}
      {g.blackoutT > 7.1 && <div className="absolute inset-0 bg-white" style={{ opacity: Math.min(0.65, (g.blackoutT - 7.1) * 8) }} />}
    </div>
  );
}

export function Banner({ g }: { g: Game }) {
  if (!g.banner) return null;
  return (
    <div key={g.banner.text} className="absolute no-pe left-1/2 top-[70px] whitespace-nowrap rounded-full px-8 py-3 text-[44px] font-black text-white" style={{ animation: 'banner 2.6s ease-out both', background: g.banner.color, border: '5px solid #fff', boxShadow: '0 8px 0 #0006' }}>
      {g.banner.icon} {g.banner.text}
    </div>
  );
}

export function DisasterAlerts({ g }: { g: Game }) {
  const unique = g.alerts.filter((alert, index, all) => all.findIndex((other) => other.type === alert.type) === index);
  if (!unique.length) return null;
  return <div className="absolute right-5 top-[156px] flex max-w-[330px] flex-col items-end gap-2">
    {unique.map((a) => <div key={a.type} className="rounded-xl border-2 border-white/80 bg-rose-600/90 px-3 py-1.5 text-[18px] font-black text-white shadow-[0_3px_0_#7f1d1d]">{a.icon} {a.text}</div>)}
  </div>;
}

const DEBUG_DISASTERS: Array<[DisasterType, string]> = [
  ['breakdown', '고장'], ['thief', '도둑'], ['flare', '태양 흑점'], ['supernova', '초신성'],
  ['rain', '소행성 비'], ['meteor', '거대 운석'], ['gravity', '중력장'], ['blackout', '정전'],
];
const DEBUG_CUSTOMERS: Array<[Exclude<Special, null>, string]> = [
  ['thanos', '타노스'], ['topping', '토핑 손님'], ['empty', '빈 컵'], ['burnt', '탄 음료'],
  ['cosplay', 'X 모자'], ['jerk', '진상'], ['sway', '흔들림'], ['doge', '도지'], ['vip', 'VIP'], ['thief', '도둑 손님'],
];

export function DebugPanel({ g }: { g: Game }) {
  if (!g.debug) return null;
  const trigger = (e: React.PointerEvent, action: () => void) => { e.stopPropagation(); action(); };
  const button = 'rounded-lg border border-white/20 bg-slate-700 px-2 py-1 text-left text-[14px] font-bold text-white hover:bg-violet-600';
  return <div className="absolute left-5 top-[62px] z-[100] max-h-[810px] w-[350px] overflow-y-auto rounded-2xl border-2 border-cyan-300 bg-slate-950/95 p-3 text-white shadow-xl" onPointerDown={(e) => e.stopPropagation()}>
    <div className="mb-2 flex items-center justify-between"><strong className="text-lg text-cyan-200">디버그 · F3</strong><button className={button} onPointerDown={(e) => trigger(e, () => { g.debug = false; })}>닫기</button></div>
    <div className="mb-1 text-sm font-bold text-slate-300">재난</div>
    <div className="mb-3 grid grid-cols-2 gap-1">{DEBUG_DISASTERS.map(([type, label]) => <button key={type} className={button} onPointerDown={(e) => trigger(e, () => debugTriggerDisaster(g, type))}>{label}</button>)}</div>
    <div className="mb-1 text-sm font-bold text-slate-300">특수 손님</div>
    <div className="mb-3 grid grid-cols-2 gap-1">{DEBUG_CUSTOMERS.map(([special, label]) => <button key={special} className={button} onPointerDown={(e) => trigger(e, () => debugSpawnCustomer(g, special))}>{label}</button>)}</div>
    <div className="mb-1 text-sm font-bold text-slate-300">도구</div>
    <div className="grid grid-cols-2 gap-1">
      {[1, 2, 3, 4, 5].map((day) => <button key={day} className={button} onPointerDown={(e) => trigger(e, () => { g.day = day; })}>DAY {day}</button>)}
      <button className={button} onPointerDown={(e) => trigger(e, () => debugRestock(g))}>해금 재료 +10</button>
      <button className={button} onPointerDown={(e) => trigger(e, () => { g.timerPaused = !g.timerPaused; })}>{g.timerPaused ? '타이머 재개' : '타이머 정지'}</button>
      <button className={button} onPointerDown={(e) => trigger(e, () => debugAddMoney(g))}>돈 +$1,000</button>
    </div>
  </div>;
}

export function Tutorial({ g, onNext }: { g: Game; onNext: () => void }) {
  if (!tutActive(g)) return null;
  const s = TUT_STEPS[g.tut];
  let target: { x: number; y: number } | null = null;
  if (s.target === 'dispenser') target = { x: L.dispenser.x + 63, y: L.dispenser.y + 60 };
  else if (s.target === 'earth' || s.target === 'mars') { const r = ingRect(s.target); target = { x: r.x + 59, y: r.y + 60 }; }
  else if (s.target === 'customer') target = { x: L.custX[0], y: 380 };
  else if (s.target === 'customer2') target = { x: L.custX[1], y: 380 };
  else if (s.target === 'heater') target = { x: L.heater.x + 82, y: L.heater.y + 240 };
  else if (s.target === 'heaterButton') { const r = machineBtn('heater'); target = { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
  else if (s.target === 'hammer') target = { x: L.hammer.x + 54, y: L.hammer.y + 120 };
  else if (s.target === 'repair') target = { x: 940, y: 450 };
  return (
    <>
      <div className="absolute no-pe anim-pop" key={g.tut} style={{ left: 840, top: 190, width: 720 }}>
        <div className="relative flex items-center gap-4 rounded-[32px] bg-white p-5 shadow-[0_10px_0_#6d28d9]" style={{ border: '5px solid #312e81' }}>
          <div className="text-6xl">🧑‍🚀</div>
          <div className="flex-1">
            <div className="mb-1 text-sm font-black text-violet-500">일론 사장님의 튜토리얼 {g.tut + 1}/{TUT_STEPS.length}</div>
            <div className="text-[25px] font-extrabold leading-snug text-slate-800">{s.text}</div>
          </div>
          {s.next && (
            <button className="pointer-events-auto btn3d shrink-0 rounded-2xl bg-violet-600 px-5 py-3 text-2xl font-black text-white shadow-[0_6px_0_#3b0764]" onPointerDown={(e) => { e.stopPropagation(); onNext(); }}>
              {g.tut === TUT_STEPS.length - 1 ? '출근! 🚀' : '다음 ▶'}
            </button>
          )}
        </div>
      </div>
      {target && (
        <div className="absolute no-pe" style={{ left: target.x - 10, top: target.y - 10 }}>
          <div className="absolute -left-12 -top-12 h-24 w-24 rounded-full border-[6px] border-yellow-300 anim-pulse" style={{ boxShadow: '0 0 30px #fde047' }} />
          <div className="anim-pointer text-6xl" style={{ filter: 'drop-shadow(0 4px 0 #0008)' }}>👆</div>
        </div>
      )}
    </>
  );
}

export function DragGhost({ g }: { g: Game }) {
  const d = g.drag; if (!d) return null;
  let el: React.ReactNode = null;
  if (d.type === 'ing') el = <div style={{ transform: 'translate(-50%,-50%) scale(1.2)' }}><PlanetIcon id={d.id as string} size={80} /></div>;
  else if (d.type === 'cup') { const c = g.cups.find((q) => q.id === d.id); if (c) el = <div style={{ transform: 'translate(-50%,-75%)' }}><CupView cup={c} w={120} t={g.time} /></div>; }
  else el = <div style={{ transform: 'translate(-50%,-80%)' }}><Mallet size={110} rot={-35 + Math.sin(g.time * 12) * 8} /></div>;
  return <div className="absolute no-pe" style={{ left: d.x, top: d.y, filter: 'drop-shadow(0 12px 10px #0008)' }}>{el}</div>;
}
