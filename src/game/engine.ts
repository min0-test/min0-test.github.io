import {
  ING, INGREDIENTS, ORDERS, OrderSpec, orderNeeds, isUnlocked, DisasterType, DISASTER_DAY, DISASTER_INFO,
  MUSK_IDLE, MUSK_HIT, MUSK_PERFECT, CUSTOMER_COLORS, HAPPY_LINES, OK_LINES, BAD_LINES, LEAVE_LINES, MACHINE_DAY, SPECIAL_ORDERS,
} from './data';
import { sfx } from './audio';

export const W = 1600, H = 900;
export const COUNTER_Y = 575;

// ---------- Layout ----------
export type Rect = { x: number; y: number; w: number; h: number };
export const inR = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
export const L = {
  dispenser: { x: 22, y: 598, w: 126, h: 136 } as Rect,
  trash: { x: 22, y: 744, w: 126, h: 136 } as Rect,
  slots: [{ x: 160, y: 598, w: 158, h: 282 }, { x: 326, y: 598, w: 158, h: 282 }] as Rect[],
  heater: { x: 1128, y: 598, w: 164, h: 282 } as Rect,
  comp: { x: 1300, y: 598, w: 164, h: 282 } as Rect,
  hammer: { x: 1474, y: 598, w: 108, h: 282 } as Rect,
  musk: { x: 20, y: 330, w: 230, h: 240 } as Rect,
  custX: [640, 1090],
};
export function ingRect(id: string): Rect {
  const ing = ING[id];
  const list = INGREDIENTS.filter((i) => i.kind === ing.kind);
  const idx = list.indexOf(ing);
  return { x: 496 + idx * 125, y: ing.kind === 'base' ? 598 : 744, w: 118, h: 136 };
}
export const custRect = (slot: number): Rect => ({ x: L.custX[slot] - 150, y: 170, w: 300, h: 400 });
export function cupPos(loc: CupLoc): { x: number; y: number } {
  if (loc === 0 || loc === 1) { const r = L.slots[loc]; return { x: r.x + r.w / 2, y: r.y + 150 }; }
  const r = loc === 'heater' ? L.heater : L.comp;
  return { x: r.x + r.w / 2, y: r.y + 118 };
}
export const machineBtn = (m: 'heater' | 'comp'): Rect => { const r = m === 'heater' ? L.heater : L.comp; return { x: r.x + 14, y: r.y + 214, w: r.w - 28, h: 56 }; };

// ---------- Types ----------
export type CupLoc = 0 | 1 | 'heater' | 'comp';
export interface Cup { id: number; loc: CupLoc; bases: string[]; tops: string[]; heated: boolean; dense: boolean; burnt: boolean; pop: number }
export type Special = null | 'doge' | 'thief' | 'vip' | 'topping' | 'empty' | 'burnt' | 'cosplay' | 'jerk' | 'thanos' | 'sway';
export interface Customer {
  id: number; slot: number; order: OrderSpec; patience: number; max: number;
  state: 'enter' | 'wait' | 'leave'; anim: number; mood: 'happy' | 'ok' | 'bad' | 'angry' | 'ko' | null;
  say: string | null; sayT: number; color: string; eyes: number; antenna: number; special: Special; hitT: number; snapT: number; sway: number; tut?: boolean;
}
export interface Thief { id: number; ing: string; t: number; max: number; state: 'steal' | 'bonked' | 'fled'; anim: number }
export interface Spot { id: number; x: number; y: number; prog: number; r: number }
export type ParticleShape = 'star' | 'spark' | 'coin' | 'heart' | 'anger' | 'smoke' | 'shard' | 'trash' | 'ice' | 'gear' | 'flame' | 'drop';
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; shape?: ParticleShape; color?: string; size: number; g: number; rot: number; vr: number; targetX?: number; targetY?: number; ingredient?: string; flyId?: number }
export interface FText { x: number; y: number; text: string; color: string; life: number; size: number }
export interface Flyby { kind: 'comet' | 'rocket' | 'tesla' | 'ufo' | 'satellite' | 'doge'; x: number; y: number; vx: number; vy: number; s: number; rot: number }
export interface Meteor { t: number; max: number; hp: number; maxHp: number; x: number; y: number; hitT: number }
export interface Alert { id: number; type: DisasterType; text: string; icon: string }
export interface Breach { x: number; y: number; progress: number; escapeT: number }
export type Drag = { type: 'ing' | 'cup' | 'hammer'; id: string | number; x: number; y: number } | null;

export interface Report { day: number; earned: number; penalties: number; repair: number; rent: number; served: number; perfect: number; lost: number; start: number; end: number }

export const TUT_STEPS = [
  { text: '어서와 알바생! 난 일론. 우주 한입 사장이야. 화성 갈끄니까 🚀', target: null as null | string, next: true },
  { text: '손님 주문은 수수께끼야. 일단 ☕컵부터 꺼내! (클릭)', target: 'dispenser', next: false },
  { text: '테라포밍은 행성 환경을 인간이 살 수 있게 바꾸는 거야. 이 주문은 지구와 화성을 섞어!', target: 'earth', next: false },
  { text: '이제 🔴화성도 컵에 넣어!', target: 'mars', next: false },
  { text: '완성! 컵을 손님한테 끌어다 줘.', target: 'customer', next: false },
  { text: '새 손님이 따뜻한 지구 음료를 주문했어. 먼저 빈 컵을 꺼내자!', target: 'dispenser', next: false },
  { text: '지구 원액을 컵에 넣어. 이 손님의 주문은 지구를 따뜻하게 데우는 거야.', target: 'earth', next: false },
  { text: '컵을 태양 가열기에 넣어 줘.', target: 'heater', next: false },
  { text: '버튼을 꾹 누르고 게이지가 초록 구간일 때 놓아. 너무 오래 누르면 타!', target: 'heaterButton', next: false },
  { text: '따뜻한 음료를 주문한 손님에게 건네 줘.', target: 'customer2', next: false },
  { text: '도둑이 왔어! 뿅망치를 직접 끌어다 맞혀 쓰러뜨려 봐.', target: 'hammer', next: false },
  { text: '고장난 곳을 꾹 눌러 직접 수리해 봐. 수리가 끝나면 출근이야!', target: 'repair', next: false },
  { text: '준비 끝! 이제 진짜 영업을 시작하자. 화성 갈끄니까 🚀', target: null, next: true },
];

export interface Game {
  phase: 'title' | 'play' | 'dayEnd' | 'over';
  time: number; day: number; money: number; dayTime: number; dayLen: number; timerPaused: boolean;
  stock: Record<string, number>; upgrades: Record<string, number>;
  cups: Cup[]; customers: Customer[]; spawnT: number; disasterT: number;
  flareT: number; supernova: number; spots: Spot[]; thieves: Thief[]; rainT: number; rainTick: number; rainSpot: number;
  meteor: Meteor[]; halfBroken: boolean; breach: Breach | null; shake: number; gravityT: number; blackoutT: number; alerts: Alert[];
  particles: Particle[]; texts: FText[]; flybys: Flyby[]; flybyT: number;
  musk: { say: string | null; sayT: number; hitT: number; idleT: number };
  drag: Drag; px: number; py: number;
  holding: 'heater' | 'comp' | null; gauge: { heater: number; comp: number };
  repairing: number | null; tut: number; seen: Record<string, boolean>; debug: boolean;
  stats: { earned: number; penalties: number; served: number; perfect: number; lost: number; start: number };
  banner: { text: string; icon: string; t: number; color: string } | null;
  report: Report | null; hammerSwing: { x: number; y: number; t: number } | null;
  flash: number; nextId: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
let nextFlyId = 1;

export function newGame(): Game {
  const stock: Record<string, number> = {};
  INGREDIENTS.forEach((i) => (stock[i.id] = i.day <= 1 ? 8 : 0));
  return {
    phase: 'title', time: 0, day: 1, money: 60, dayTime: 0, dayLen: 45, timerPaused: false,
    stock, upgrades: { chair: 0, tip: 0, heat: 0, shield: 0 },
    cups: [], customers: [], spawnT: 1, disasterT: 35,
    flareT: 0, supernova: 0, spots: [], thieves: [], rainT: 0, rainTick: 0, rainSpot: 0,
    meteor: [], halfBroken: false, breach: null, shake: 0, gravityT: 0, blackoutT: 0, alerts: [],
    particles: [], texts: [], flybys: [], flybyT: 2,
    musk: { say: null, sayT: 0, hitT: 0, idleT: 8 },
    drag: null, px: 0, py: 0, holding: null, gauge: { heater: 0, comp: 0 },
    repairing: null, tut: 0, seen: {}, debug: false,
    stats: { earned: 0, penalties: 0, served: 0, perfect: 0, lost: 0, start: 60 },
    banner: null, report: null, hammerSwing: null, flash: 0, nextId: 1,
  };
}

// ---------- helpers ----------
export const tutActive = (g: Game) => g.tut >= 0 && g.tut < TUT_STEPS.length;
export const heatZone = (g: Game) => [55 - g.upgrades.heat * 5, 78 + g.upgrades.heat * 5];
export const compZone = (g: Game) => [62 - g.upgrades.heat * 5, 86 + g.upgrades.heat * 4];
export const cupTemp = (c: Cup) => [...c.bases, ...c.tops].reduce((s, id) => s + ING[id].temp, 0) + (c.heated ? 2 : 0);
export const tempClass = (c: Cup): 'hot' | 'normal' | 'cold' => cupTemp(c) > 0 ? 'hot' : cupTemp(c) < 0 ? 'cold' : 'normal';
export const ingDisabled = (g: Game, id: string) => g.flareT > 0 && !!ING[id].cold;

export function muskSay(g: Game, text: string, dur = 4) { g.musk.say = text; g.musk.sayT = dur; g.musk.idleT = rnd(10, 16); }
function addMoney(g: Game, amt: number, x: number, y: number) {
  g.money += amt;
  if (amt >= 0) g.stats.earned += amt; else g.stats.penalties += -amt;
  text(g, x, y, (amt >= 0 ? '+$' : '-$') + Math.abs(Math.round(amt)), amt >= 0 ? '#fde047' : '#f87171', 42);
}
export function text(g: Game, x: number, y: number, t: string, color = '#fff', size = 36) { g.texts.push({ x, y, text: t, color, life: 1.4, size }); }
export function burst(g: Game, x: number, y: number, n: number, opts: { shapes?: ParticleShape[]; colors?: string[]; speed?: number; size?: number; g?: number; life?: number } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (opts.speed ?? 300) * rnd(0.3, 1);
    const life = (opts.life ?? 0.9) * rnd(0.6, 1.2);
    g.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.g ? 150 : 0), life, max: life,
      shape: opts.shapes ? pick(opts.shapes) : undefined, color: opts.colors ? pick(opts.colors) : '#fff',
      size: (opts.size ?? 14) * rnd(0.6, 1.3), g: opts.g ?? 0, rot: rnd(0, 360), vr: rnd(-400, 400),
    });
  }
  if (g.particles.length > 180) g.particles.splice(0, g.particles.length - 180);
}
function pullStockToBreach(g: Game, ing: string) {
  const source = ingRect(ing), targetX = g.breach?.x ?? 800, targetY = g.breach?.y ?? 310;
  const life = 0.58;
  g.particles.push({ x: source.x + 60, y: source.y + 60, vx: 0, vy: 0, life, max: life, color: ING[ing].color, size: 72, g: 0, rot: 0, vr: 0, targetX, targetY, ingredient: ing, flyId: nextFlyId++ });
  if (g.particles.length > 180) g.particles.splice(0, g.particles.length - 180);
}
function banner(g: Game, icon: string, t: string, color = '#f43f5e') { g.banner = { icon, text: t, t: 2.6, color }; }

// ---------- day flow ----------
export function startGame(g: Game, { tutorial = true }: { tutorial?: boolean } = {}) {
  Object.assign(g, newGame(), { phase: 'play', flybys: g.flybys, time: g.time });
  g.tut = tutorial ? 0 : -1;
  if (tutorial) spawnCustomer(g, 0, ORDERS[0], true);
  else spawnCustomer(g, 0);
  sfx.day();
}
export function startDay(g: Game) {
  g.phase = 'play';
  g.day += 1;
  g.dayTime = 0; g.dayLen = 45; g.timerPaused = false;
  g.cups = []; g.customers = []; g.thieves = []; g.spots = []; g.meteor = []; g.breach = null; g.flareT = 0; g.supernova = 0; g.rainT = 0; g.gravityT = 0; g.blackoutT = 0; g.alerts = [];
  g.halfBroken = false; g.spawnT = 1.5; g.disasterT = Math.max(9, 22 - g.day * 2);
  g.stats = { earned: 0, penalties: 0, served: 0, perfect: 0, lost: 0, start: g.money };
  const newIngs = INGREDIENTS.filter((i) => i.day === g.day);
  newIngs.forEach((i) => (g.stock[i.id] = Math.max(g.stock[i.id], 8)));
  const news: string[] = newIngs.map((i) => i.name);
  if (MACHINE_DAY.comp === g.day) news.push('중력 압축기');
  if (news.length) {
    banner(g, '✨', 'NEW! ' + news.join(', '), '#8b5cf6');
    muskSay(g, MACHINE_DAY.comp === g.day ? '새 장비 중력 압축기! 너무 오래 누르면 블랙홀 됨ㅋ 초록존에서 떼.' : `신메뉴 재료 들어왔어: ${news.join(', ')}. 일해.`, 6);
  } else muskSay(g, `DAY ${g.day}. 오늘은 더 하드코어하게.`);
  sfx.day();
}
function endDay(g: Game) {
  const repair = g.spots.length * 15;
  const rent = 20 + g.day * 15;
  g.money -= repair + rent;
  g.report = { day: g.day, earned: g.stats.earned, penalties: g.stats.penalties, repair, rent, served: g.stats.served, perfect: g.stats.perfect, lost: g.stats.lost, start: g.stats.start, end: g.money };
  g.drag = null; g.holding = null; g.repairing = null;
  g.phase = g.money < 0 ? 'over' : 'dayEnd';
  if (g.phase === 'over') sfx.boom(); else sfx.day();
}

// ---------- customers ----------
function spawnCustomer(g: Game, slot: number, order?: OrderSpec, tut = false, forcedSpecial?: Special) {
  let special: Special = forcedSpecial ?? null;
  if (!tut && !forcedSpecial) {
    const r = Math.random();
    if (g.day >= 3 && r < 0.08) special = 'thanos';
    else if (g.day >= 2 && r < 0.13) special = 'doge';
    else if (g.day >= 2 && r < 0.18) special = 'thief';
    else if (g.day >= 3 && r < 0.23) special = 'vip';
    else if (g.day >= 2 && r < 0.28) special = 'topping';
    else if (g.day >= 2 && r < 0.33) special = 'empty';
    else if (g.day >= 2 && r < 0.38) special = 'burnt';
    else if (g.day >= 3 && r < 0.43) special = 'cosplay';
    else if (g.day >= 3 && r < 0.48) special = 'jerk';
    else if (g.day >= 2 && r < 0.53) special = 'sway';
  }
  if (!order) {
    const other = g.customers.find((c) => c.slot !== slot)?.order;
    const pool = ORDERS.filter((o) => o !== other && orderNeeds(o).every((n) => isUnlocked(n, g.day)));
    const specialOrder = special === 'topping'
      ? { ...SPECIAL_ORDERS.topping, tops: INGREDIENTS.filter((i) => i.kind === 'top' && i.day <= g.day).map((i) => i.id) }
      : special === 'cosplay'
        ? { ...SPECIAL_ORDERS.cosplay, tops: g.day >= 4 ? ['asteroid'] : [] }
        : special ? SPECIAL_ORDERS[special] : undefined;
    order = special === 'thief' ? { text: '평범한 손님임. 진짜임. 아무거나 줘.', bases: 'any' } : specialOrder ?? pick(pool);
  }
  const base = special === 'thanos' ? 9 : Math.max(24, 58 - g.day * 6) * (1 + 0.2 * g.upgrades.chair) * (special === 'vip' || special === 'jerk' ? 0.6 : special === 'doge' ? 1.4 : 1);
  g.customers.push({
    id: g.nextId++, slot, order, patience: base, max: base, state: 'enter', anim: 0, mood: null, say: null, sayT: 0,
    color: special === 'thief' ? '#94a3b8' : special === 'cosplay' ? '#ef4444' : special === 'thanos' ? '#7c3aed' : pick(CUSTOMER_COLORS), eyes: special === 'thanos' ? 2 : 1 + Math.floor(Math.random() * 3), antenna: Math.floor(Math.random() * 3), special, hitT: 0, snapT: special === 'thanos' ? 9 : 0, sway: Math.random() * 10, tut,
  });
}

export function debugSpawnCustomer(g: Game, special: Exclude<Special, null>) {
  const slot = [0, 1].find((candidate) => !g.customers.some((c) => c.slot === candidate));
  if (slot === undefined) return false;
  let order: OrderSpec | undefined = SPECIAL_ORDERS[special];
  if (special === 'topping') order = { ...SPECIAL_ORDERS.topping, tops: INGREDIENTS.filter((i) => i.kind === 'top' && i.day <= g.day).map((i) => i.id) };
  if (special === 'cosplay') order = { ...SPECIAL_ORDERS.cosplay, tops: g.day >= 4 ? ['asteroid'] : [] };
  if (special === 'sway') order = undefined;
  spawnCustomer(g, slot, order, false, special);
  return true;
}
function leave(_g: Game, c: Customer, mood: Customer['mood'], say: string) {
  c.state = 'leave'; c.anim = 0; c.mood = mood; c.say = say; c.sayT = 2;
}

function evaluate(cup: Cup, o: OrderSpec) {
  if (cup.bases.length === 0 && !o.empty && (o.bases === 'any' || !!o.bases.length)) return { score: 0, max: 1 };
  let pts = 0, max = 0;
  const temp = cupTemp(cup);
  const uniq = [...new Set(cup.bases)];
  if (o.empty) { max++; if (!cup.bases.length && !cup.tops.length && !cup.heated && !cup.dense && !cup.burnt) pts++; else pts--; }
  else if (o.bases === 'any') { max++; pts++; }
  else {
    o.bases.forEach((b) => { max++; if (uniq.includes(b)) pts++; });
    pts -= uniq.filter((b) => !(o.bases as string[]).includes(b)).length * 0.6;
  }
  const tops = o.tops ?? [];
  tops.forEach((t) => { max++; if (cup.tops.includes(t)) pts++; });
  pts -= [...new Set(cup.tops)].filter((t) => !tops.includes(t)).length * 0.3;
  if (o.hot || o.superHot) { max++; if (temp > 0) pts++; }
  if (o.cold || o.freezing) { max++; if (temp < 0) pts++; }
  if (o.dense) { max++; if (cup.dense) pts++; }
  let score = Math.max(0, Math.min(1, pts / max));
  if (o.burnt) { max++; if (cup.burnt) pts++; }
  else if (cup.burnt) pts -= 1;
  score = Math.max(0, Math.min(1, pts / max));
  return { score, max };
}

function serve(g: Game, cup: Cup, c: Customer) {
  g.cups = g.cups.filter((x) => x !== cup);
  const cx = L.custX[c.slot], cy = 330;
  if (c.special === 'thief') {
    addMoney(g, -15, cx, cy - 60);
    leave(g, c, 'happy', '음료 감사. 금고도 감사 💰');
    burst(g, cx, cy, 12, { shapes: ['coin'], speed: 300, g: 600, size: 30 });
    muskSay(g, '저거 도둑이었잖아!! 수염 보면 몰라?');
    sfx.bad(); return;
  }
  const { score, max } = evaluate(cup, c.order);
  if (score < 0.99) {
    const missing: string[] = [];
    if (c.order.empty && (cup.bases.length || cup.tops.length || cup.heated || cup.dense || cup.burnt)) missing.push('빈 컵');
    if (c.order.bases === 'any' && cup.bases.length === 0) missing.push('원액');
    if (c.order.bases !== 'any') missing.push(...c.order.bases.filter((id) => !cup.bases.includes(id)).map((id) => ING[id].name));
    missing.push(...(c.order.tops ?? []).filter((id) => !cup.tops.includes(id)).map((id) => ING[id].name));
    if ((c.order.hot || c.order.superHot) && cupTemp(cup) <= 0) missing.push('뜨겁게 가열하기');
    if ((c.order.cold || c.order.freezing) && cupTemp(cup) >= 0) missing.push('차갑게 만들 재료');
    if (c.order.dense && !cup.dense) missing.push('중력 압축');
    if (c.order.burnt && !cup.burnt) missing.push('완전히 태우기');
    if (!c.order.burnt && cup.burnt) missing.push('태우지 않기');
    const wants = [c.order.bases === 'any' ? '원하는 원액' : c.order.bases.map((id) => ING[id]?.name ?? id).join('과 '), ...(c.order.tops ?? []).map((id) => ING[id]?.name ?? id), c.order.hot || c.order.superHot ? '뜨거운 온도' : '', c.order.cold || c.order.freezing ? '차가운 온도' : '', c.order.dense ? '중력 압축' : '', c.order.burnt ? '완전히 태운 상태' : '', c.order.empty ? '빈 컵' : ''].filter(Boolean).join(', ');
    muskSay(g, `정답은 ${wants}야. ${missing.length ? `빠진 조건: ${[...new Set(missing)].join(', ')}.` : '주문에 없는 재료를 넣지 말고 조건을 정확히 맞춰.'}`);
  }
  let pay = 8 + 5 * max;
  const mult = c.special === 'doge' || c.special === 'vip' ? 2 : 1;
  pay *= mult * (1 + 0.15 * g.upgrades.tip);
  g.stats.served++;
  if (c.tut) {
    if (g.tut <= 4) {
      g.tut = 5;
      spawnCustomer(g, 1, { text: '따뜻한 지구 음료 한 잔 주세요!', bases: ['earth'], hot: true }, true);
    } else if (g.tut <= 9) {
      g.tut = 10;
      const available = INGREDIENTS.find((ing) => g.stock[ing.id] > 0)?.id ?? 'earth';
      g.thieves.push({ id: g.nextId++, ing: available, t: 0, max: 30, state: 'steal', anim: 0 });
    }
  }
  if (score >= 0.99) {
    const tip = pay * 0.5 * (c.patience / c.max);
    addMoney(g, Math.round(pay + tip), cx, cy - 60);
    text(g, cx, cy - 130, 'PERFECT!', '#4ade80', 60);
    leave(g, c, 'happy', c.special === 'doge' ? 'such drink. wow. 🐕' : pick(HAPPY_LINES));
    burst(g, cx, cy, 30, { shapes: ['star', 'heart', 'spark', 'coin'], speed: 500, g: 500, size: 30 });
    g.stats.perfect++; sfx.perfect(); sfx.coin();
    if (Math.random() < 0.35) muskSay(g, pick(MUSK_PERFECT));
  } else if (score >= 0.55) {
    addMoney(g, Math.round(pay * 0.6), cx, cy - 60);
    text(g, cx, cy - 130, 'GOOD', '#facc15', 50);
    leave(g, c, 'ok', pick(OK_LINES));
    burst(g, cx, cy, 12, { shapes: ['spark', 'coin'], speed: 350, g: 500, size: 26 });
    sfx.coin();
  } else if (score >= 0.25) {
    addMoney(g, Math.round(pay * 0.2), cx, cy - 60);
    text(g, cx, cy - 130, 'MEH...', '#fb923c', 46);
    leave(g, c, 'bad', pick(BAD_LINES)); sfx.ok();
  } else {
    text(g, cx, cy - 130, 'BAD!!', '#ef4444', 56);
    addMoney(g, -3, cx, cy - 60);
    leave(g, c, 'angry', pick(BAD_LINES));
    burst(g, cx, cy, 10, { shapes: ['anger', 'smoke'], speed: 300, size: 30 });
    sfx.bad();
  }
}

// ---------- disasters ----------
function addSpot(g: Game) {
  for (let i = 0; i < 12; i++) {
    const x = rnd(300, 1560), y = rnd(95, 520);
    if (g.spots.every((s) => Math.hypot(s.x - x, s.y - y) > 110)) {
      g.spots.push({ id: g.nextId++, x, y, prog: 0, r: rnd(0, 360) }); return;
    }
  }
}
function startDisaster(g: Game, type: DisasterType) {
  const info = DISASTER_INFO[type];
  banner(g, info.icon, info.name);
  if (!g.alerts.some((alert) => alert.type === type)) g.alerts.push({ id: g.nextId++, type, text: info.name, icon: info.icon });
  muskSay(g, info.musk, 4.5);
  sfx.alarm();
  g.seen[type] = true;
  switch (type) {
    case 'breakdown': { const n = 2 + Math.floor(g.day / 3); for (let i = 0; i < n; i++) addSpot(g); g.shake += 10; sfx.boom(); break; }
    case 'thief': {
      const n = g.day >= 5 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const opts = INGREDIENTS.filter((ig) => ig.day <= g.day && g.stock[ig.id] > 0 && !g.thieves.some((t) => t.ing === ig.id));
        if (!opts.length) break;
        const max = Math.max(4, 8 - g.day * 0.4);
        g.thieves.push({ id: g.nextId++, ing: pick(opts).id, t: 0, max, state: 'steal', anim: 0 });
      }
      break;
    }
    case 'flare': g.flareT = 9; g.shake += 8; g.flash = 0.6; break;
    case 'supernova': g.supernova = 1; g.flash = 1; sfx.boom(); break;
    case 'rain': g.rainT = 10; g.rainTick = 0; g.rainSpot = 2.5; break;
    case 'meteor': {
      const hp = 12 - g.upgrades.shield * 3;
      g.meteor.push({ t: 0, max: Math.max(6, 10 - g.day * 0.4), hp, maxHp: hp, x: rnd(900, 1350), y: rnd(200, 300), hitT: 0 });
      break;
    }
    case 'gravity': g.gravityT = 8; break;
    case 'blackout': g.blackoutT = 7.4; g.flash = 0.6; break;
  }
}
export function debugTriggerDisaster(g: Game, type: DisasterType) { startDisaster(g, type); }
export function debugRestock(g: Game) { for (const ing of INGREDIENTS) if (ing.day <= g.day) g.stock[ing.id] += 10; }
export function debugAddMoney(g: Game, amount = 1000) { g.money += amount; }
function scheduleDisaster(g: Game) {
  const pool = (Object.keys(DISASTER_DAY) as DisasterType[]).filter((t) => DISASTER_DAY[t] <= g.day && !(t === 'flare' && g.flareT > 0) && !(t === 'rain' && g.rainT > 0) && !(t === 'supernova' && g.supernova > 0) && !(t === 'gravity' && g.gravityT !== 0) && !(t === 'blackout' && g.blackoutT > 0));
  if (!pool.length) return;
  // prefer unseen
  const unseen = pool.filter((p) => !g.seen[p]);
  startDisaster(g, unseen.length && Math.random() < 0.7 ? unseen[0] : pick(pool));
  if (g.day >= 5 && Math.random() < 0.25 + g.day * 0.03) { const t = pick(pool); setTimeout(() => g.phase === 'play' && startDisaster(g, t), 1500); }
}
export function hitMeteor(g: Game, dmg: number, x?: number, y?: number) {
  const m = g.meteor.filter((q) => Math.hypot(q.x - (x ?? 0), q.y - (y ?? 0)) < 420).sort((a, b) => Math.hypot(a.x - (x ?? 0), a.y - (y ?? 0)) - Math.hypot(b.x - (x ?? 0), b.y - (y ?? 0)))[0] ?? g.meteor[0]; if (!m) return;
  m.hp -= dmg; m.hitT = 0.15; g.shake += 4;
  burst(g, m.x, m.y, 8, { colors: ['#fb923c', '#78716c', '#fde047'], speed: 400, size: 12 });
  sfx.bonk();
  if (m.hp <= 0) {
    burst(g, m.x, m.y, 60, { colors: ['#fb923c', '#f87171', '#fde047', '#78716c'], shapes: ['spark', 'star', 'shard'], speed: 700, size: 30 });
    g.meteor = g.meteor.filter((q) => q !== m); g.shake += 20; g.flash = 0.5; sfx.boom();
    addMoney(g, 15, m.x, m.y); text(g, m.x, m.y - 80, '운석 격파!', '#4ade80', 56);
    muskSay(g, '방금 지구를 구했군. 수당은 없어.');
  }
}

// ---------- actions ----------
export function takeCup(g: Game) {
  const loc = ([0, 1] as const).find((s) => !g.cups.some((c) => c.loc === s));
  if (loc === undefined) return;
  g.cups.push({ id: g.nextId++, loc, bases: [], tops: [], heated: false, dense: false, burnt: false, pop: 0.3 });
  if (g.tut === 5) g.tut = 6;
  sfx.cup();
  const p = cupPos(loc); burst(g, p.x, p.y - 40, 10, { shapes: ['spark'], speed: 200, size: 20 });
}

export function cupAt(g: Game, x: number, y: number): Cup | undefined {
  for (let i = g.cups.length - 1; i >= 0; i--) {
    const c = g.cups[i];
    const p = cupPos(c.loc), size = 75;
    if (Math.abs(p.x - x) < size && y > p.y - size * 1.6 && y < p.y + size) return c;
  }
  return undefined;
}

export function dropDrag(g: Game) {
  const d = g.drag; if (!d) return;
  g.drag = null;
  const { x, y } = d;
  if (d.type === 'ing') {
    const id = d.id as string;
    const cup = cupAt(g, x, y);
    if (!cup) return;
    const ing = ING[id];
    if (ingDisabled(g, id)) { text(g, x, y, '녹았어!', '#f87171', 30); sfx.bad(); return; }
    if (g.stock[id] <= 0) { text(g, x, y, '재고 없음!', '#f87171', 30); sfx.bad(); return; }
    const arr = ing.kind === 'base' ? cup.bases : cup.tops;
    if (arr.includes(id)) { text(g, x, y, '같은 재료는 한 번만!', '#f87171', 26); sfx.bad(); return; }
    arr.push(id); g.stock[id]--; cup.pop = 0.25;
    const p = cupPos(cup.loc);
    burst(g, p.x, p.y - 60, 16, { colors: [ing.color, ing.color2, '#fff'], speed: 320, g: 700, size: 12 });
    sfx.drop();
    if (g.tut === 2 && id === 'earth') g.tut = 3;
    if (g.tut === 3 && cup.bases.includes('earth') && cup.bases.includes('mars')) g.tut = 4;
    if (g.tut === 6 && id === 'earth') g.tut = 7;
    return;
  }
  if (d.type === 'cup') {
    const cup = g.cups.find((c) => c.id === d.id); if (!cup) return;
    for (const c of g.customers) if (c.state === 'wait' && inR(custRect(c.slot), x, y)) {
      if (c.special === 'thanos') { text(g, x, y - 40, '뿅망치로 막아!', '#fbbf24', 30); return; }
      serve(g, cup, c); return;
    }
    if (inR(L.trash, x, y)) { g.cups = g.cups.filter((c) => c !== cup); burst(g, L.trash.x + 63, L.trash.y + 50, 14, { shapes: ['trash', 'smoke'], speed: 250, size: 24 }); sfx.ok(); return; }
    if (inR(L.musk, x, y)) {
      g.cups = g.cups.filter((c) => c !== cup);
      muskSay(g, cup.bases.length ? `음... ${ING[cup.bases[0]].name} 맛이군. 10점 만점에 X점.` : '빈 컵? 미니멀리즘이군. 좋아.');
      sfx.ok(); return;
    }
    const targets: CupLoc[] = [0, 1, 'heater', 'comp'];
    for (const t of targets) {
      const r = t === 0 || t === 1 ? L.slots[t] : t === 'heater' ? L.heater : L.comp;
      if (t === 'comp' && g.day < MACHINE_DAY.comp) continue;
      if (inR(r, x, y) && !g.cups.some((c) => c !== cup && c.loc === t)) { cup.loc = t; cup.pop = 0.2; sfx.drop(); if (g.tut === 7 && t === 'heater') g.tut = 8; return; }
    }
    return;
  }
  if (d.type === 'hammer') {
    g.hammerSwing = { x, y, t: 0.35 };
    const bonk = (cx: number, cy: number) => { burst(g, cx, cy, 14, { shapes: ['star', 'spark', 'spark'], speed: 380, size: 28 }); text(g, cx, cy - 40, '뿅!', '#f472b6', 64); g.shake += 6; sfx.bonk(); };
    const meteor = g.meteor.find((m) => Math.hypot(m.x - x, m.y - y) < 60 + 140 * (m.t / m.max));
    if (meteor) { bonk(x, y); hitMeteor(g, 4, meteor.x, meteor.y); return; }
    for (const t of g.thieves) {
      if (t.state !== 'steal') continue;
      const r = ingRect(t.ing);
      if (Math.hypot(r.x + r.w / 2 - x, r.y - 20 - y) < 110) {
        t.state = 'bonked'; t.anim = 0; bonk(x, y); addMoney(g, 10, x, y - 60); muskSay(g, '나이스 뿅. 그게 바로 보안 시스템이야.');
        if (g.tut === 10) { g.tut = 11; const s = { id: g.nextId++, x: 940, y: 450, prog: 0, r: rnd(0, 360) }; g.spots.push(s); }
        return;
      }
    }
    if (inR(L.musk, x, y)) {
      bonk(x, y); g.musk.hitT = 1.2; muskSay(g, pick(MUSK_HIT), 3);
      if (Math.random() < 0.3) { addMoney(g, 5, x, y - 80); text(g, x, y - 140, '도지코인 떨굼', '#fde047', 30); }
      return;
    }
    for (const c of g.customers) {
      if (c.state !== 'leave' && inR(custRect(c.slot), x, y)) {
        bonk(x, y); c.hitT = 0.5;
        if (c.special === 'thanos') { c.snapT = 0; leave(g, c, 'ko', '건틀렛을 놓쳤다!'); muskSay(g, '타노스의 스냅을 막았어! 재고를 지켰다.'); return; }
        if (c.special === 'thief') { leave(g, c, 'ko', '들켰다...'); addMoney(g, 20, x, y - 60); text(g, x, y - 140, '현상금!', '#4ade80', 44); }
        else { leave(g, c, 'ko', c.special === 'doge' ? 'much pain. wow.' : '@#$%!!'); addMoney(g, -4, x, y - 60); text(g, x, y - 140, '치료비', '#f87171', 30); g.stats.lost++; if (c.tut) { g.tut = g.tut <= 4 ? 1 : 5; const order = g.tut === 1 ? ORDERS[0] : { text: '따뜻한 지구 음료 한 잔 주세요!', bases: ['earth'], hot: true }; spawnCustomer(g, c.slot, order, true); g.customers = g.customers.filter((q) => q !== c); } }
        return;
      }
    }
    for (const s of g.spots) {
      if (Math.hypot(s.x - x, s.y - y) < 60) { bonk(x, y); s.prog += 0.5; text(g, x, y - 80, '물리 수리', '#fde047', 30); if (s.prog >= 1) fixSpot(g, s); return; }
    }
    const cup = cupAt(g, x, y);
    if (cup) { bonk(x, y); g.cups = g.cups.filter((c) => c !== cup); burst(g, x, y, 16, { shapes: ['ice', 'drop'], speed: 400, g: 800, size: 24 }); return; }
    bonk(x, y);
  }
}
function fixSpot(g: Game, s: Spot) {
  g.spots = g.spots.filter((q) => q !== s);
  burst(g, s.x, s.y, 18, { shapes: ['spark', 'gear', 'gear'], speed: 300, size: 22 });
  sfx.perfect();
  if (g.repairing === s.id) g.repairing = null;
  if (g.tut === 11) g.tut = 12;
}

export function releaseMachine(g: Game) {
  const m = g.holding; if (!m) return;
  g.holding = null;
  const v = g.gauge[m]; g.gauge[m] = 0;
  const cup = g.cups.find((c) => c.loc === m); if (!cup) return;
  const p = cupPos(m);
  const [a, b] = m === 'heater' ? heatZone(g) : compZone(g);
  if (v >= a && v <= b) {
    if (m === 'heater') { cup.heated = true; text(g, p.x, p.y - 150, '따끈!', '#fb923c', 40); burst(g, p.x, p.y - 60, 18, { shapes: ['flame', 'flame'], speed: 250, size: 24 }); }
    else { cup.dense = true; text(g, p.x, p.y - 150, '압축!', '#c084fc', 40); burst(g, p.x, p.y - 60, 18, { colors: ['#c084fc', '#7c3aed', '#fff'], speed: -200, size: 12 }); }
    cup.pop = 0.3; sfx.perfect();
    if (g.tut === 8) g.tut = 9;
  } else if (v > b) {
    if (m === 'heater') { cup.burnt = true; text(g, p.x, p.y - 150, '탔다...', '#78716c', 40); burst(g, p.x, p.y - 60, 14, { shapes: ['smoke', 'flame'], speed: 200, size: 26 }); sfx.sizzle(); }
    else { text(g, p.x, p.y - 150, '너무 셈!', '#f87171', 34); sfx.bad(); }
  }
}

export function pointerDownMeteor(g: Game, x: number, y: number) {
  const m = g.meteor.find((q) => Math.hypot(q.x - x, q.y - y) < 60 + 140 * (q.t / q.max)); if (!m) return false;
  hitMeteor(g, 1, m.x, m.y);
  return true;
}

// ---------- update ----------
export function update(g: Game, dt: number) {
  g.time += dt;
  // fx
  let alive = 0;
  for (let i = 0; i < g.particles.length; i++) {
    const p = g.particles[i];
    if (p.targetX !== undefined && p.targetY !== undefined) { const follow = 1 - Math.exp(-dt * 6); p.x += (p.targetX - p.x) * follow; p.y += (p.targetY - p.y) * follow; }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= Math.pow(0.98, dt * 60); }
    p.life -= dt; p.rot += p.vr * dt;
    if (p.life > 0) g.particles[alive++] = p;
  }
  g.particles.length = alive;
  alive = 0;
  for (let i = 0; i < g.texts.length; i++) { const t = g.texts[i]; t.life -= dt; t.y -= 50 * dt; if (t.life > 0) g.texts[alive++] = t; }
  g.texts.length = alive;
  g.flybyT -= dt;
  if (g.flybyT <= 0) {
    g.flybyT = rnd(4, 9);
    const kind = pick(['comet', 'rocket', 'tesla', 'ufo', 'satellite', 'doge', 'tesla', 'rocket'] as Flyby['kind'][]);
    g.flybys.push({ kind, x: -150, y: rnd(90, 380), vx: rnd(120, 280) * (kind === 'comet' ? 2.5 : 1), vy: rnd(-25, 25), s: rnd(0.6, 1.1), rot: 0 });
  }
  for (const f of g.flybys) { f.x += f.vx * dt; f.y += f.vy * dt; f.rot += dt * 40; }
  g.flybys = g.flybys.filter((f) => f.x > -300 && f.x < W + 300);
  g.shake *= Math.exp(-dt * 5); if (g.shake < 0.1) g.shake = 0;
  g.flash = Math.max(0, g.flash - dt * 1.5);
  if (g.banner) { g.banner.t -= dt; if (g.banner.t <= 0) g.banner = null; }
  if (g.hammerSwing) { g.hammerSwing.t -= dt; if (g.hammerSwing.t <= 0) g.hammerSwing = null; }
  for (const c of g.cups) c.pop = Math.max(0, c.pop - dt);
  g.musk.hitT = Math.max(0, g.musk.hitT - dt);
  if (g.musk.sayT > 0) { g.musk.sayT -= dt; if (g.musk.sayT <= 0) g.musk.say = null; }

  if (g.phase !== 'play') return;
  const tut = tutActive(g);
  if (!tut) {
    g.musk.idleT -= dt;
    if (g.musk.idleT <= 0) muskSay(g, pick(MUSK_IDLE));
  }

  // customers
  for (const c of g.customers) {
    c.hitT = Math.max(0, c.hitT - dt);
    if (c.sayT > 0) { c.sayT -= dt; if (c.sayT <= 0 && c.state !== 'leave') c.say = null; }
    if (c.state === 'enter') { c.anim += dt * 2; if (c.anim >= 1) { c.state = 'wait'; c.anim = 1; } }
    else if (c.state === 'wait') {
      if (!tut) c.patience -= dt * (c.special === 'jerk' ? 2.6 : 1) * (1 + 0.25 * g.spots.length) * (g.halfBroken ? 1.2 : 1);
      if (c.special === 'thanos' && !tut) {
        c.snapT -= dt;
        c.patience = Math.max(0, c.snapT);
        c.say = c.snapT > 2 ? '나는 필연적인 존재다.' : '인피니티 건틀렛이 빛난다… 막아!'; c.sayT = 0.4;
        if (c.snapT <= 0) {
          const stocked = INGREDIENTS.filter((i) => g.stock[i.id] > 0).map((i) => i.id);
          for (let k = stocked.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [stocked[k], stocked[j]] = [stocked[j], stocked[k]]; }
          for (const id of stocked.slice(0, Math.ceil(stocked.length / 2))) { g.stock[id] = 0; const r = ingRect(id); burst(g, r.x + 60, r.y + 50, 14, { shapes: ['spark', 'smoke'], colors: ['#c4b5fd', '#94a3b8'], speed: 180, size: 22 }); }
          leave(g, c, 'happy', '완벽한 균형이다.'); g.flash = 1; muskSay(g, '타노스가 재고 절반을 먼지로 만들었어.');
        }
      }
      if (c.patience <= 0 && c.special !== 'thanos') {
        if (c.special === 'thief') { leave(g, c, 'happy', '지갑 잘 받아감 ㅋ'); addMoney(g, -10, L.custX[c.slot], 300); }
        else { leave(g, c, 'angry', pick(LEAVE_LINES)); addMoney(g, -6, L.custX[c.slot], 300); g.stats.lost++; sfx.bad(); }
      }
    } else if (c.state === 'leave') c.anim += dt;
  }
  g.customers = g.customers.filter((c) => !(c.state === 'leave' && c.anim > 1.3));

  // machines
  if (g.holding) {
    const m = g.holding;
    if (!g.cups.some((c) => c.loc === m)) { g.holding = null; g.gauge[m] = 0; }
    else {
      g.gauge[m] += dt * (m === 'heater' ? 48 : 42) * (1 + g.day * 0.04);
      if (m === 'heater' && Math.random() < dt * 8) { const p = cupPos('heater'); burst(g, p.x + rnd(-30, 30), p.y - 40, 1, { shapes: ['flame'], speed: 80, size: 18, life: 0.6 }); }
      if (m === 'comp') g.shake = Math.max(g.shake, g.gauge.comp / 30);
      if (g.gauge[m] >= 100) {
        const cup = g.cups.find((c) => c.loc === m)!;
        const p = cupPos(m);
        if (m === 'heater') { cup.burnt = true; text(g, p.x, p.y - 150, '불탔다!!', '#f87171', 44); sfx.sizzle(); burst(g, p.x, p.y - 60, 20, { shapes: ['flame', 'smoke'], speed: 300, size: 28 }); }
        else {
          g.cups = g.cups.filter((c) => c !== cup);
          text(g, p.x, p.y - 150, '블랙홀화!!', '#c084fc', 48);
          burst(g, p.x, p.y - 50, 40, { colors: ['#000', '#7c3aed', '#c084fc', '#fff'], speed: 500, size: 16 });
          g.shake += 18; sfx.blackhole();
          muskSay(g, '컵이 사건의 지평선 너머로 갔어. 컵값은 월급에서 깜.');
          addMoney(g, -2, p.x, p.y - 100);
        }
        g.holding = null; g.gauge[m] = 0;
      }
    }
  }

  if (tut) {
    for (const t of g.thieves) if (t.state !== 'steal') t.anim += dt;
    g.thieves = g.thieves.filter((t) => t.state === 'steal' || t.anim < 1.2);
    if (g.repairing !== null && g.repairing !== -1) {
      const s = g.spots.find((q) => q.id === g.repairing);
      if (!s) g.repairing = null;
      else {
        s.prog += dt / (1.3 - g.upgrades.shield * 0.3);
        if (Math.random() < dt * 12) { burst(g, s.x, s.y, 2, { colors: ['#fde047', '#fff'], speed: 250, size: 6, life: 0.4 }); sfx.repair(); }
        if (s.prog >= 1) fixSpot(g, s);
      }
    }
    return;
  }

  // day timer
  if (!g.timerPaused) {
    g.dayTime += dt;
    if (g.dayTime >= g.dayLen) { endDay(g); return; }
  }

  // spawn
  g.spawnT -= dt;
  if (g.spawnT <= 0 && g.dayTime < g.dayLen - 6) {
    const free = [0, 1].filter((s) => !g.customers.some((c) => c.slot === s));
    if (free.length) { spawnCustomer(g, pick(free)); g.spawnT = Math.max(1.5, 6.5 - g.day * 0.9) * rnd(0.7, 1.0); }
    else g.spawnT = 0.5;
  }

  // disasters
  g.disasterT -= dt;
  if (g.disasterT <= 0) { scheduleDisaster(g); g.disasterT = Math.max(6, 24 - g.day * 3.5) + rnd(0, 6); }
  if (g.flareT > 0) { g.flareT -= dt; if (Math.random() < dt * 3) g.shake += 2; }
  if (g.supernova > 0) g.supernova = Math.max(0, g.supernova - dt * 0.2);
  if (g.rainT > 0) {
    g.rainT -= dt; g.rainTick -= dt; g.rainSpot -= dt;
    if (g.rainTick <= 0) {
      g.rainTick = rnd(0.6, 1.4); g.shake += rnd(8, 16); sfx.boom();
      const x = rnd(300, 1500), y = rnd(100, 480);
      burst(g, x, y, 14, { colors: ['#fb923c', '#fde047', '#78716c'], shapes: ['spark'], speed: 350, size: 18 });
    }
    if (g.rainSpot <= 0) { g.rainSpot = 3 - g.upgrades.shield * 0.5; addSpot(g); }
  }
  for (let i = g.meteor.length - 1; i >= 0; i--) {
    const m = g.meteor[i]; m.t += dt; m.hitT = Math.max(0, m.hitT - dt);
    g.shake = Math.max(g.shake, (m.t / m.max) * 5);
    if (m.t >= m.max) {
      g.meteor.splice(i, 1); g.halfBroken = true; g.breach ??= { x: 800, y: 310, progress: 0, escapeT: 0.32 }; g.flash = 1; g.shake += 45; sfx.boom();
      const dmg = 80 + g.day * 20;
      addMoney(g, -dmg, 800, 300); text(g, 800, 220, '카페 반파!!!', '#ef4444', 80);
      for (let i = 0; i < 3; i++) addSpot(g);
      burst(g, m.x, m.y, 80, { colors: ['#fb923c', '#ef4444', '#fde047', '#44403c'], shapes: ['spark', 'flame', 'shard'], speed: 900, size: 34, g: 400 });
      muskSay(g, '운석이 창문 중앙을 뚫었어! 구멍을 꾹 눌러 수리해. 재료와 손님이 빨려나가고 있어!', 5);
    }
  }
  if (g.gravityT > 0) { g.gravityT -= dt; if (g.gravityT <= 0) g.gravityT = -1; }
  else if (g.gravityT < 0) g.gravityT = Math.min(0, g.gravityT + dt);
  if (g.blackoutT > 0) { g.blackoutT = Math.max(0, g.blackoutT - dt); if (g.blackoutT === 0) g.flash = 0.6; }
  if (g.breach) {
    g.breach.escapeT -= dt;
    if (g.breach.escapeT <= 0) {
      g.breach.escapeT = 0.12;
      const stocked = INGREDIENTS.filter((i) => g.stock[i.id] > 0);
      if (stocked.length) {
        const ing = pick(stocked);
        g.stock[ing.id]--; pullStockToBreach(g, ing.id);
      }
      else { const c = g.customers.find((q) => q.state === 'wait'); if (c) { leave(g, c, 'angry', '으아아아 우주로!'); g.stats.lost++; } }
    }
    if (g.repairing === -1) {
      g.breach.progress += dt / 2.4;
      if (g.breach.progress >= 1) { g.breach = null; g.halfBroken = false; g.repairing = null; burst(g, 800, 310, 30, { shapes: ['spark', 'gear'], speed: 350, size: 25 }); muskSay(g, '창문 수리 완료! 이제 아무것도 우주로 안 날아가.'); }
    }
  }
  for (const t of g.thieves) {
    t.anim += dt;
    if (t.state === 'steal') {
      t.t += dt;
      if (t.t >= t.max) {
        t.state = 'fled'; t.anim = 0;
        const n = Math.min(g.stock[t.ing], 3 + Math.floor(g.day / 2));
        g.stock[t.ing] -= n;
        const r = ingRect(t.ing);
        text(g, r.x + 60, r.y - 30, `${ING[t.ing].name} -${n}`, '#f87171', 36);
        sfx.bad();
      }
    }
  }
  g.thieves = g.thieves.filter((t) => t.state === 'steal' || t.anim < 1.2);
  g.alerts = g.alerts.filter((a) => {
    if (a.type === 'breakdown') return g.spots.length > 0;
    if (a.type === 'thief') return g.thieves.some((t) => t.state === 'steal');
    if (a.type === 'flare') return g.flareT > 0;
    if (a.type === 'supernova') return g.supernova > 0;
    if (a.type === 'rain') return g.rainT > 0;
    if (a.type === 'meteor') return g.meteor.length > 0 || !!g.breach;
    if (a.type === 'gravity') return g.gravityT !== 0;
    if (a.type === 'blackout') return g.blackoutT > 0;
    return false;
  });
  if (g.repairing !== null && g.repairing !== -1) {
    const s = g.spots.find((q) => q.id === g.repairing);
    if (!s) g.repairing = null;
    else {
      s.prog += dt / (1.3 - g.upgrades.shield * 0.3);
      if (Math.random() < dt * 12) { burst(g, s.x, s.y, 2, { colors: ['#fde047', '#fff'], speed: 250, size: 6, life: 0.4 }); sfx.repair(); }
      if (s.prog >= 1) fixSpot(g, s);
    }
  }
}

export function restock(g: Game, id: string) {
  const p = ING[id].price;
  if (g.money < p) return false;
  g.money -= p; g.stock[id] += 5; sfx.coin(); return true;
}
export function buyUpgrade(g: Game, id: string, cost: number) {
  if (g.money < cost) return false;
  g.money -= cost; g.upgrades[id]++; sfx.perfect(); return true;
}
