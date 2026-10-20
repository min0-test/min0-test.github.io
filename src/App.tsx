import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { newGame, update, startGame, startDay, dropDrag, releaseMachine, takeCup, hitMeteor, TUT_STEPS, W, H, muskSay } from './game/engine';
import type { Game } from './game/engine';
import { sfx } from './game/audio';
import { SpaceBg, CafeRoom, Musk, CustomerView, Spots, MeteorView } from './components/Scene';
import { Counter, type Api } from './components/Counter';
import { HUD, FX, Weather, Banner, Tutorial, DragGhost, DisasterAlerts, DebugPanel } from './components/Overlay';
import { DayEnd, GameOver } from './components/Screens';
import { supabase, fetchMenu, getDeviceOrder, getGuestOrderStatus, createGuestOrder, getSupabaseErrorMessage, subscribeOrders, type MenuItem, type GuestOrder } from './orders/client';
import { OrderEntry } from './components/OrderEntry';

function readDeviceNumber() {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('space-cafe-device-number='))?.split('=')[1];
  const value = Number(cookie ?? localStorage.getItem('space-cafe-device-number') ?? 1);
  return Number.isSafeInteger(value) && value >= 1 && value <= 9999 ? value : 1;
}

export default function App() {
  const gRef = useRef<Game>(newGame());
  const g = gRef.current;
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(1);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [deviceNo] = useState(readDeviceNumber);
  const [deviceOrder, setDeviceOrder] = useState<GuestOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [retryError, setRetryError] = useState('');
  const [menuError, setMenuError] = useState('');
  const [orderSyncError, setOrderSyncError] = useState('');
  const scaleRef = useRef(1);
  const stageRef = useRef<HTMLDivElement>(null);

  const refreshOrders = useCallback(async () => {
    const menuTask = fetchMenu().then((items) => {
      setMenu(items);
      setMenuError('');
    }).catch((e: unknown) => {
      console.error('Menu load failed', e);
      setMenuError(getSupabaseErrorMessage(e));
    });
    const orderTask = supabase ? getDeviceOrder(deviceNo).then((next) => {
      setOrderSyncError('');
      const resumed = g.phase === 'title' && (next?.status === 'queued' || next?.status === 'ready');
      if (g.phase === 'title' && next?.status === 'queued') startGame(g);
      else if (g.phase === 'title' && next?.status === 'ready') g.phase = 'over';
      setDeviceOrder(next);
      if (resumed) setFrame((f) => f + 1);
    }).catch((e: unknown) => {
      console.error('Device order sync failed', e);
      setOrderSyncError(getSupabaseErrorMessage(e));
    }) : Promise.resolve();
    await Promise.all([menuTask, orderTask]);
    setOrderLoading(false);
  }, [deviceNo, g]);

  useEffect(() => {
    if (deviceOrder?.status === 'picked_up' && g.phase === 'over') {
      Object.assign(g, newGame());
      setFrame((f) => f + 1);
    }
  }, [deviceOrder?.status, g, g.phase, frame]);

  useEffect(() => {
    void refreshOrders();
    const unsubscribe = subscribeOrders(() => void refreshOrders());
    const poll = window.setInterval(() => void refreshOrders(), 15000);
    return () => { unsubscribe(); window.clearInterval(poll); };
  }, [refreshOrders]);

  // fit stage to window
  useEffect(() => {
    const fit = () => { const s = Math.min(window.innerWidth / W, window.innerHeight / H); scaleRef.current = s; setScale(s); };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'F3') return;
      e.preventDefault();
      g.debug = !g.debug;
      setFrame((f) => f + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [g]);

  const toStage = useCallback((cx: number, cy: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (cx - r.left) / scaleRef.current, y: (cy - r.top) / scaleRef.current };
  }, []);

  // loop
  useEffect(() => {
    let last = performance.now(), raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const gg = gRef.current;
      update(gg, dt);
      // tutorial progression checks
      if (gg.phase === 'play') {
        if (gg.tut === 1 && gg.cups.length > 0) gg.tut = 2;
        if (gg.tut >= 2 && gg.tut <= 4) {
          const hasBoth = gg.cups.some((cup) => cup.bases.includes('earth') && cup.bases.includes('mars'));
          const hasEarth = gg.cups.some((cup) => cup.bases.includes('earth'));
          const hasMars = gg.cups.some((cup) => cup.bases.includes('mars'));
          if (hasBoth) gg.tut = 4;
          else if (hasEarth) gg.tut = 3;
          else if (hasMars) gg.tut = 2;
          else if (gg.cups.length === 0) gg.tut = 1;
        }
        if (gg.tut === 5 && gg.cups.length > 0) gg.tut = 6;
        if (gg.tut === 6 && gg.cups.some((cup) => cup.bases.includes('earth'))) gg.tut = 7;
        if (gg.tut === 7 && gg.cups.some((cup) => cup.loc === 'heater' && cup.bases.includes('earth'))) gg.tut = 8;
        if (gg.tut === 8 && gg.cups.some((cup) => cup.heated)) gg.tut = 9;
      }
      setFrame((f) => (f + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // global pointer
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const gg = gRef.current;
      const p = toStage(e.clientX, e.clientY);
      gg.px = p.x; gg.py = p.y;
      if (gg.drag) { gg.drag.x = p.x; gg.drag.y = p.y; }
    };
    const up = () => {
      const gg = gRef.current;
      if (gg.drag) dropDrag(gg);
      if (gg.holding) releaseMachine(gg);
      gg.repairing = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [toStage]);

  const api: Api = {
    startDrag: (type, id, e) => {
      if (g.phase !== 'play') return;
      const p = toStage(e.clientX, e.clientY);
      g.drag = { type, id, x: p.x, y: p.y }; g.px = p.x; g.py = p.y;
      sfx.pick();
    },
    takeCup: () => g.phase === 'play' && takeCup(g),
    hold: (m) => { if (g.phase === 'play') { g.holding = m; g.gauge[m] = 0; } },
    repair: (id) => { g.repairing = id; },
    meteor: () => hitMeteor(g, 1),
  };

  const finishTutorial = () => {
    g.tut = -1;
    g.dayTime = 0; g.spawnT = 1.5; g.disasterT = 30;
    g.customers = []; g.cups = []; g.thieves = []; g.spots = []; g.halfBroken = false;
    g.drag = null; g.holding = null; g.repairing = null;
    g.stats = { earned: 0, penalties: 0, served: 0, perfect: 0, lost: 0, start: g.money };
    muskSay(g, '가자! 화성 갈끄니까! 🚀');
    sfx.day();
  };
  const nextTut = () => { if (g.tut >= TUT_STEPS.length - 1) finishTutorial(); else g.tut++; };
  const skipTut = finishTutorial;
  const replayIfStillQueued = async () => {
    if (!supabase || !deviceOrder) { setRetryError(''); startGame(g, { tutorial: false }); return; }
    const status = await getGuestOrderStatus(deviceOrder.id);
    if (!status) { setRetryError('주문 상태를 확인할 수 없습니다. 잠시 후 다시 눌러 주세요.'); return; }
    setRetryError('');
    setDeviceOrder({ ...deviceOrder, status });
    if (status === 'queued') startGame(g, { tutorial: false });
    else if (status === 'picked_up') { Object.assign(g, newGame()); setFrame((f) => f + 1); }
  };

  const shakeX = g.shake ? Math.sin(g.time * 41) * g.shake * 0.6 + Math.sin(g.time * 23) * g.shake * 0.4 : 0;
  const shakeY = g.shake ? Math.cos(g.time * 37) * g.shake * 0.5 + Math.sin(g.time * 29) * g.shake * 0.3 : 0;
  const shakeR = g.shake ? Math.sin(g.time * 17) * g.shake * 0.02 : 0;
  const gravityActive = g.gravityT !== 0;
  const sceneStyle = { transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeR}deg)`, willChange: 'transform' } as CSSProperties;
  const playing = g.phase === 'play';

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#05030f]" style={{ cursor: g.drag ? 'grabbing' : 'default' }}>
      <div ref={stageRef} className="absolute overflow-hidden" style={{ width: W, height: H, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center' }}>
        <div className="absolute inset-0" style={sceneStyle}>
          <SpaceBg />
          <CafeRoom g={g} />
          {playing && (<>
            <Musk g={g} />
            {g.customers.map((c) => <CustomerView key={c.id} c={c} g={g} />)}
            <Spots g={g} onRepair={api.repair} />
            <MeteorView g={g} onHit={(x, y) => hitMeteor(g, 1, x, y)} />
          </>)}
          {g.phase !== 'title' && <div className="absolute inset-0 pointer-events-none"><Counter g={g} api={api} /></div>}
          <FX g={g} />
          {playing && <Weather g={g} />}
        </div>
          {playing && <div className={`absolute inset-0 pointer-events-none gravity-ui ${gravityActive ? 'gravity-ui-active' : ''} [&>*]:pointer-events-auto`}>
          <HUD g={g} onMute={() => setFrame((f) => f + 1)} onSkipTutorial={skipTut} />
          <Banner g={g} />
          <DisasterAlerts g={g} />
          <Tutorial g={g} onNext={nextTut} />
          <DragGhost g={g} />
          <DebugPanel g={g} />
        </div>}
        {g.phase === 'dayEnd' && <DayEnd g={g} onNext={() => startDay(g)} />}
        {g.phase === 'over' && (deviceOrder?.status === 'ready'
          ? <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09051ceF] text-center text-white"><div className="text-[100px]">🥤</div><div className="text-[54px] font-black">음료가 준비됐어요!</div><div className="mt-4 rounded-3xl border-4 border-white/80 bg-violet-950/70 px-10 py-6 text-[30px] font-black">기기 번호 <span className="text-yellow-300">{deviceNo}</span>번에서 수령해 주세요</div><div className="mt-5 text-[20px] font-bold text-violet-200">직원에게 이름을 확인하고 음료를 받아 주세요</div><div className="mt-3 text-[15px] text-violet-300/80">수령이 확인되면 새 주문 화면으로 돌아갑니다</div></div>
          : <GameOver g={g} message={retryError} onRetry={() => { void replayIfStillQueued(); }} />)}
      </div>
      {g.phase === 'title' && createPortal(<OrderEntry deviceNo={deviceNo} menu={menu} loading={orderLoading} connected={!!supabase} menuError={menuError} backendError={orderSyncError} onPlayWithoutOrder={() => { setDeviceOrder(null); setRetryError(''); startGame(g); }} onSubmit={async (customerName, birthdate, menuId) => {
        if (!supabase) return 'Supabase 연결을 확인해 주세요.';
        try {
          const data = await createGuestOrder({ customerName: customerName.trim(), birthdate, menuId, deviceNo });
          setRetryError(''); setDeviceOrder(data); startGame(g); return '';
        } catch (error) { return getSupabaseErrorMessage(error); }
      }} />, document.body)}
    </div>
  );
}
