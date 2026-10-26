import { useState } from 'react';
import type { Game } from '../game/engine';
import { restock, buyUpgrade } from '../game/engine';
import { INGREDIENTS, UPGRADES } from '../game/data';
import { PlanetIcon } from './Art';

const ORBIT = ['earth', 'mars', 'venus', 'jupiter', 'neptune', 'moondust'];
// force tutorial
export function Title({ g, onStart }: { g: Game; onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 45%, #7c3aed55, #0b052000 60%)' }}>
      <div className="relative mb-2 h-[300px] w-[300px]">
        {ORBIT.map((id, i) => {
          const a = g.time * 0.6 + (i / ORBIT.length) * Math.PI * 2;
          return <div key={id} className="absolute" style={{ left: 150 + Math.cos(a) * 250 - 35, top: 150 + Math.sin(a) * 90 - 35, zIndex: Math.sin(a) > 0 ? 2 : 0, transform: `scale(${0.8 + Math.sin(a) * 0.25})` }}><PlanetIcon id={id} size={70} /></div>;
        })}
        <div className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 text-[150px] anim-bob">☕</div>
      </div>
      <h1 className="text-center text-[96px] font-black leading-none" style={{ background: 'linear-gradient(90deg,#f0abfc,#67e8f9,#fde047,#f0abfc)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 8px 0 #3b0764)', backgroundPosition: `${(g.time * 30) % 200}% 0` }}>
        좋은 행성 위대한 행성
      </h1>
      <p className="mt-4 text-[28px] font-extrabold text-violet-200">🚀 우주 한입 · 우주 카페 타이쿤 🚀</p>
      <button className="btn3d mt-10 rounded-[28px] bg-gradient-to-b from-lime-300 to-emerald-500 px-14 py-5 text-[40px] font-black text-emerald-950 shadow-[0_10px_0_#065f46] anim-pulse" style={{ border: '5px solid #fff' }} onPointerDown={(e) => { e.stopPropagation(); onStart(); }}>
        출근하기 🧑‍🚀
      </button>
      <p className="mt-6 text-lg font-bold text-violet-300/70">드래그 앤 드롭으로 행성을 컵에 · 완성된 음료를 손님에게</p>
    </div>
  );
}

export function DayEnd({ g, onNext }: { g: Game; onNext: () => void }) {
  const [, force] = useState(0);
  const r = g.report!;
  const rows: [string, string, number][] = [
    ['🪙', '매출', r.earned],
    ['💸', '벌금·손해', -r.penalties],
    ['🔧', '미수리 고장', -r.repair],
    ['🏠', '스타십 임대료', -r.rent],
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-8 bg-[#0b0520cc] backdrop-blur-sm">
      <div className="anim-pop w-[520px] rounded-[36px] bg-white p-8 shadow-[0_12px_0_#6d28d9]" style={{ border: '6px solid #312e81' }}>
        <div className="text-center text-[44px] font-black text-violet-700">DAY {r.day} 정산표 🧾</div>
        <div className="mt-2 flex justify-center gap-6 text-xl font-black text-slate-600">
          <span>☕ {r.served}</span><span>⭐ {r.perfect}</span><span>😡 {r.lost}</span>
        </div>
        <div className="mt-5 space-y-2">
          {rows.map(([ic, n, v]) => (
            <div key={n} className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-2 text-[24px] font-extrabold">
              <span>{ic} {n}</span><span className={v >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{v >= 0 ? '+' : ''}{Math.round(v)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-300 px-4 py-3 text-[30px] font-black text-amber-950">
          <span>Ð 잔고</span><span>{Math.round(r.end)}</span>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-900 p-3 text-center text-lg font-bold text-white">
          🧑‍🚀 "{r.perfect >= 3 ? '좋아, 넌 화성 1호점 점장감이야. 월급은 그대로.' : r.lost >= 3 ? '손님이 화성으로 이민 갔어. 너 때문에.' : '그럭저럭. 내일은 하드코어 모드야.'}"
        </div>
      </div>

      <div className="anim-pop w-[760px] rounded-[36px] bg-white p-7 shadow-[0_12px_0_#be185d]" style={{ border: '6px solid #831843' }}>
        <div className="flex items-center justify-between">
          <div className="text-[36px] font-black text-pink-600">🛒 우주 코스트코</div>
          <div className="rounded-2xl bg-amber-300 px-4 py-1 text-[28px] font-black text-amber-950">Ð {Math.round(g.money)}</div>
        </div>
        <div className="mt-3 text-lg font-black text-slate-500">재고 충전 (+5)</div>
        <div className="mt-1 grid grid-cols-5 gap-2">
          {INGREDIENTS.filter((i) => i.day <= g.day + 1).map((i) => {
            const locked = i.day > g.day;
            const can = !locked && g.money >= i.price;
            return (
              <button key={i.id} disabled={!can} className={`relative flex flex-col items-center rounded-2xl p-2 ${can ? 'btn3d bg-violet-100 shadow-[0_4px_0_#a78bfa]' : 'bg-slate-100 opacity-50'}`}
                onPointerDown={(e) => { e.stopPropagation(); if (can && restock(g, i.id)) force((x) => x + 1); }}>
                <PlanetIcon id={i.id} size={52} />
                <span className="text-sm font-black text-slate-700">{i.name}</span>
                <span className={`text-xs font-bold ${!locked && g.stock[i.id] <= 3 ? 'text-rose-600' : 'text-slate-500'}`}>{locked ? '🔒 내일' : `재고 ${g.stock[i.id]}`}</span>
                {!locked && <span className="mt-1 rounded-full bg-amber-300 px-2 text-sm font-black">Ð{i.price}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-lg font-black text-slate-500">업그레이드</div>
        <div className="mt-1 grid grid-cols-4 gap-2">
          {UPGRADES.map((u) => {
            const lv = g.upgrades[u.id];
            const cost = u.cost[lv];
            const max = cost === undefined;
            const can = !max && g.money >= cost;
            return (
              <button key={u.id} disabled={!can} className={`flex flex-col items-center rounded-2xl p-2 ${can ? 'btn3d bg-pink-100 shadow-[0_4px_0_#f9a8d4]' : 'bg-slate-100 opacity-60'}`}
                onPointerDown={(e) => { e.stopPropagation(); if (can && buyUpgrade(g, u.id, cost)) force((x) => x + 1); }}>
                <span className="text-4xl">{u.icon}</span>
                <span className="text-base font-black text-slate-800">{u.name}</span>
                <span className="text-xs font-bold text-slate-500">{u.desc}</span>
                <span className="my-1 flex gap-1">{u.cost.map((_, k) => <span key={k} className={`h-2.5 w-5 rounded-full ${k < lv ? 'bg-pink-500' : 'bg-slate-300'}`} />)}</span>
                <span className="rounded-full bg-amber-300 px-2 text-sm font-black">{max ? 'MAX' : `Ð${cost}`}</span>
              </button>
            );
          })}
        </div>
        <button className="btn3d mt-5 w-full rounded-3xl bg-gradient-to-b from-lime-300 to-emerald-500 py-4 text-[34px] font-black text-emerald-950 shadow-[0_8px_0_#065f46]" style={{ border: '4px solid #fff' }} onPointerDown={(e) => { e.stopPropagation(); onNext(); }}>
          DAY {g.day + 1} 출근 ▶
        </button>
      </div>
    </div>
  );
}

export function ManufacturingComplete({ g, deviceNo, ready, hasOrder, onAcknowledge }: { g: Game; deviceNo: number; ready: boolean; hasOrder: boolean; onAcknowledge: () => void }) {
  return <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09051ceF] px-8 text-center text-white">
    <div className="text-[110px]">{ready ? '🥤' : '✅'}</div>
    <div className="text-[58px] font-black">{ready ? '음료가 준비됐어요!' : '제조 완료!'}</div>
    {ready
      ? <><div className="mt-4 rounded-3xl border-4 border-white/80 bg-violet-950/70 px-10 py-6 text-[30px] font-black">기기 번호 <span className="text-yellow-300">{deviceNo}</span>번에서 수령해 주세요</div><div className="mt-5 text-[20px] font-bold text-violet-200">직원에게 이름을 확인하고 음료를 받아 주세요</div><div className="mt-3 text-[15px] text-violet-300/80">수령이 확인되면 새 주문 화면으로 돌아갑니다</div></>
      : <><div className="mt-4 rounded-3xl border-4 border-white/70 bg-emerald-950/70 px-10 py-5 text-[28px] font-black">DAY {g.day} 제조를 마쳤습니다</div><div className="mt-4 text-[18px] font-bold text-violet-200">{hasOrder ? '직원이 음료를 준비하고 있어요. 완료 안내가 오면 기기 번호를 확인해 주세요.' : '게임이 일시 정지되었습니다.'}</div>{!hasOrder && <button className="btn3d mt-8 rounded-[24px] border-[4px] border-white bg-gradient-to-b from-lime-300 to-emerald-500 px-10 py-4 text-[28px] font-black text-emerald-950 shadow-[0_8px_0_#065f46]" onPointerDown={(e) => { e.stopPropagation(); onAcknowledge(); }}>확인</button>}</>}
  </div>;
}

export function GameOver({ g, onRetry, message = '' }: { g: Game; onRetry: () => void; message?: string }) {
  const r = g.report;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a0310dd] backdrop-blur-sm">
      <div className="text-[150px] anim-wobble">💸</div>
      <div className="text-[100px] font-black text-rose-400" style={{ filter: 'drop-shadow(0 8px 0 #4c0519)' }}>파산!!</div>
      <div className="mt-3 rounded-3xl bg-white px-8 py-4 text-center text-[28px] font-extrabold text-slate-800 shadow-[0_8px_0_#881337]" style={{ border: '5px solid #4c0519' }}>
        🧑‍🚀 "넌 해고야. 방금 X에 올렸어. 좋아요 42만 개."
      </div>
      <div className="mt-6 text-[26px] font-black text-rose-200">DAY {g.day} 에서 파산 · 잔고 Ð{Math.round(r?.end ?? g.money)}</div>
      {message && <div className="mt-3 rounded-xl bg-white px-5 py-3 text-lg font-bold text-rose-700">{message}</div>}
      <button className="btn3d mt-8 rounded-[28px] bg-gradient-to-b from-lime-300 to-emerald-500 px-12 py-4 text-[36px] font-black text-emerald-950 shadow-[0_10px_0_#065f46]" style={{ border: '5px solid #fff' }} onPointerDown={(e) => { e.stopPropagation(); onRetry(); }}>
        다시 출근 (강제) 🔁
      </button>
    </div>
  );
}
