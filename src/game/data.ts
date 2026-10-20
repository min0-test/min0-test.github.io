export type IngKind = 'base' | 'top';
export interface Ingredient {
  id: string;
  name: string;
  kind: IngKind;
  color: string;
  color2: string;
  temp: number; // +hot / -cold
  cold?: boolean;
  day: number; // unlock day
  price: number; // restock price per 5
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'earth', name: '지구', kind: 'base', color: '#3b82f6', color2: '#22c55e', temp: 0, day: 1, price: 10 },
  { id: 'mars', name: '화성', kind: 'base', color: '#ef4444', color2: '#b45309', temp: 0, day: 1, price: 10 },
  { id: 'venus', name: '금성', kind: 'base', color: '#facc15', color2: '#f97316', temp: 1, day: 1, price: 12 },
  { id: 'neptune', name: '해왕성', kind: 'base', color: '#1e40af', color2: '#67e8f9', temp: -1, cold: true, day: 2, price: 14 },
  { id: 'jupiter', name: '목성', kind: 'base', color: '#d97706', color2: '#fde68a', temp: 0, day: 3, price: 16 },
  { id: 'ring', name: '토성 고리', kind: 'top', color: '#fcd34d', color2: '#a16207', temp: 0, day: 1, price: 8 },
  { id: 'moondust', name: '달가루', kind: 'top', color: '#e5e7eb', color2: '#9ca3af', temp: 0, day: 1, price: 8 },
  { id: 'comet', name: '혜성 얼음', kind: 'top', color: '#a5f3fc', color2: '#e0f2fe', temp: -1, cold: true, day: 2, price: 10 },
  { id: 'asteroid', name: '소행성 크런치', kind: 'top', color: '#78716c', color2: '#44403c', temp: 0, day: 4, price: 12 },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])) as Record<string, Ingredient>;

export const MACHINE_DAY = { heater: 1, comp: 3 } as const;

export interface OrderSpec {
  text: string;
  bases: string[] | 'any';
  tops?: string[];
  hot?: boolean; // temp >= 1
  superHot?: boolean; // temp >= 3
  cold?: boolean; // temp <= -1
  freezing?: boolean; // temp <= -2
  dense?: boolean;
  burnt?: boolean;
  empty?: boolean;
}

export const ORDERS: OrderSpec[] = [
  { text: '테라포밍된 화성 주세요', bases: ['earth', 'mars'] },
  { text: '화성 갈끄니까~ 🚀', bases: ['mars'] },
  { text: '창백한 푸른 점 하나. 근본으로.', bases: ['earth'] },
  { text: '뜨끈한 거. 뜨.끈.', bases: 'any', hot: true },
  { text: '지구 온난화 체험판 주세요', bases: ['earth'], hot: true },
  { text: '화성에 반지 끼워줘요 💍', bases: ['mars'], tops: ['ring'] },
  { text: '달달한 달 라떼 🌙', bases: ['earth'], tops: ['moondust'] },
  { text: '금성보다 뜨겁게!!! 🔥🔥', bases: ['venus'], superHot: true },
  { text: '금성 샷. 맵게.', bases: ['venus'] },
  { text: '인류 달 착륙 기념 세트', bases: ['earth'], tops: ['moondust', 'ring'] },
  { text: '결혼식 하객룩 금성 💍', bases: ['venus'], tops: ['ring'] },
  { text: '얼죽아. 무조건 얼죽아.', bases: 'any', cold: true },
  { text: '빙하기 지구 하나요 🥶', bases: ['earth'], cold: true },
  { text: '절대영도로. 영하 273도.', bases: ['neptune'], tops: ['comet'], freezing: true },
  { text: '파란 거 두 개 섞어줘', bases: ['earth', 'neptune'] },
  { text: '화성에 눈 내리게 해주세요 ❄️', bases: ['mars'], tops: ['comet'] },
  { text: '토성 코스프레 해줘 🪐', bases: ['jupiter'], tops: ['ring'] },
  { text: '중성자별처럼 무거운 거', bases: 'any', dense: true },
  { text: '블랙홀 직전까지 압축한 지구', bases: ['earth'], dense: true },
  { text: '목성 대적점 스무디. 쫀쫀하게.', bases: ['jupiter'], dense: true },
  { text: '뜨겁고 무거운 거. 이유는 묻지마.', bases: 'any', hot: true, dense: true },
  { text: '공룡 멸종 세트 🦖', bases: ['earth'], tops: ['asteroid'] },
  { text: '아아 (아이스 아스테로이드)', bases: 'any', tops: ['asteroid'], cold: true },
  { text: '태양계 정복 세트 ㄱㄱ', bases: ['earth', 'mars', 'jupiter'] },
  { text: '가스 행성 2개 섞어줘요', bases: ['jupiter', 'neptune'] },
  { text: '소행성 박힌 화성 (바삭하게)', bases: ['mars'], tops: ['asteroid'], hot: true },
];

export const SPECIAL_ORDERS: Record<string, OrderSpec> = {
  topping: { text: '원액 말고 토핑만 한가득 주세요!', bases: [], tops: ['ring', 'moondust'] },
  empty: { text: '아무것도 넣지 않은 빈 컵 주세요.', bases: [], empty: true },
  burnt: { text: '완전히 태운 음료로 주세요. 숯맛 좋아요.', bases: ['earth'], burnt: true },
  cosplay: { text: '화성으로 가는 붉은 행성 스페셜!', bases: ['mars'], tops: ['asteroid'], hot: true },
  jerk: { text: '내가 원하는 건 네가 알아서 맞춰. 빨리!', bases: ['earth', 'venus'], tops: ['ring'] },
  thanos: { text: '나는 필연적인 존재다.', bases: 'any' },
};

export function orderNeeds(o: OrderSpec): string[] {
  const n: string[] = [];
  if (o.bases !== 'any') n.push(...o.bases);
  if (o.tops) n.push(...o.tops);
  if (o.hot || o.superHot) n.push('heater');
  if (o.superHot) n.push('venus');
  if (o.cold || o.freezing) n.push('neptune');
  if (o.dense) n.push('comp');
  return n;
}

export function isUnlocked(id: string, day: number) {
  if (id === 'heater') return day >= MACHINE_DAY.heater;
  if (id === 'comp') return day >= MACHINE_DAY.comp;
  return (ING[id]?.day ?? 99) <= day;
}

export type DisasterType = 'breakdown' | 'thief' | 'flare' | 'supernova' | 'rain' | 'meteor' | 'gravity' | 'blackout';
export const DISASTER_DAY: Record<DisasterType, number> = {
  breakdown: 1, thief: 2, flare: 2, supernova: 3, rain: 3, meteor: 4, gravity: 4, blackout: 5,
};
export const DISASTER_INFO: Record<DisasterType, { icon: string; name: string; musk: string }> = {
  breakdown: { icon: '🔧', name: '우주선 고장!', musk: '고장난 데 꾹~ 눌러서 고쳐. 테슬라도 그렇게 고침.' },
  thief: { icon: '🦹', name: '우주 도둑!', musk: '도둑이다! 뿅망치 들고 가서 때려! 🔨' },
  flare: { icon: '☀️', name: '태양 흑점 폭발!', musk: '차가운 재료 다 녹았어. 잠깐 쓰지 마.' },
  supernova: { icon: '💥', name: '초신성 폭발!', musk: '초신성 섬광이야. 잠시 기다리면 천천히 사라질 거야.' },
  rain: { icon: '☄️', name: '소행성 비!', musk: '흔들려도 일해. 하드코어 모드야.' },
  meteor: { icon: '🌑', name: '거대 운석 접근!', musk: '저거 막 때려! 클릭 연타 or 뿅망치!!' },
  gravity: { icon: '🌀', name: '중력장 비활성화!', musk: '중력이 꺼졌어! 잠깐이면 다시 돌아와.' },
  blackout: { icon: '🌑', name: '정전!', musk: '불이 나갔어. 조리대 위치를 기억해! 곧 복구돼.' },
};

export const MUSK_IDLE = [
  '화성 갈끄니까.',
  '도지 투 더 문 🐕🚀',
  '최저시급? 그건 레거시 개념이야.',
  'Funding secured.',
  '우린 시뮬레이션 속에 살 확률이 높아.',
  '사이버트럭 유리는 방탄이야. (쨍그랑)',
  '하드코어하게 일할 사람만 남아.',
  '이 카페 원래 트위터였음.',
  '주 120시간 근무는 휴식이야.',
  '내 아들 이름은 X Æ A-12. 너는?',
  '다음 분기엔 카페를 화성으로 옮길 거야.',
  '방금 X에 네 욕 올림 ㅋ',
  '컵도 재사용 로켓처럼 착륙시켜.',
  '이 음료, 완전 자율주행 가능.',
  '사실 난 외계인이야. 농담임. 아마도.',
  '이번 달 월급은 도지코인으로 줄게.',
];
export const MUSK_HIT = [
  '아야! 이거 X에 올린다!',
  '폭력은 제1원칙에 위배돼!',
  '...이게 바로 혁신이군.',
  '월급 삭감. 농담. 진짜임.',
  '뉴럴링크가 흔들렸어!!',
  '방금 주가 3% 빠짐.',
];
export const MUSK_PERFECT = ['완벽해. 로켓처럼.', '이게 바로 퍼스트 프린시플.', '좋아, 너 화성 1호 알바.', 'Based.'];
export const MUSK_FAIL = ['그건 음료가 아니라 사고야.', '실패는 선택지야. 근데 자주는 말고.', '빠르게 실패하고 빠르게... 아니 실패하지 마.'];

export const CUSTOMER_COLORS = ['#a3e635', '#f472b6', '#60a5fa', '#c084fc', '#fb923c', '#34d399', '#f87171', '#facc15', '#22d3ee'];

export const HAPPY_LINES = ['맛있다 삐빅!', '우주 최고 👽💚', '별 다섯 개 ⭐', '고향의 맛...', '미쳤다 ㄷㄷ'];
export const OK_LINES = ['음... 먹을만함', '쏘쏘삐', '반은 맞았네'];
export const BAD_LINES = ['이게 뭐야;;', '행성 모독이다', '리뷰 1점 드림', '퉤퉤 👽💢'];
export const LEAVE_LINES = ['너무 느려!!', '그냥 화성 갈래', '별점 테러 간다'];

export interface Upgrade { id: string; name: string; icon: string; desc: string; cost: number[] }
export const UPGRADES: Upgrade[] = [
  { id: 'chair', name: '안마의자', icon: '💺', desc: '손님 인내심 +20%', cost: [60, 120, 220] },
  { id: 'tip', name: '도지 팁통', icon: '🐕', desc: '수입 +15%', cost: [80, 160, 300] },
  { id: 'heat', name: '골디락스 렌즈', icon: '🔭', desc: '가공 성공존 넓힘', cost: [50, 110] },
  { id: 'shield', name: '운석 방패', icon: '🛡️', desc: '운석·고장 대응 쉬워짐', cost: [70, 150] },
];
