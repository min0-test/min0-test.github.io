import { useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from 'react';
import { Coffee, LoaderCircle, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { MenuItem } from '../orders/client';
import './OrderEntry.css';

type WheelItem = { value: number; label: string };
const ROW_HEIGHT = 48;
const pad = (n: number) => String(n).padStart(2, '0');

function WheelColumn({ label, items, value, onChange, onTouch }: { label: string; items: WheelItem[]; value: number; onChange: (value: number) => void; onTouch: () => void }) {
  const list = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const wheelDelta = useRef(0);
  const wheelTimer = useRef<number | null>(null);
  const skipNextSync = useRef(false);
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === value));
  useEffect(() => {
    if (skipNextSync.current) skipNextSync.current = false;
    else if (list.current && !window.matchMedia('(min-width: 900px)').matches) list.current.scrollTo({ top: activeIndex * ROW_HEIGHT, behavior: 'smooth' });
    return () => { if (settleTimer.current !== null) clearTimeout(settleTimer.current); if (wheelTimer.current !== null) clearTimeout(wheelTimer.current); };
  }, [activeIndex, items.length]);
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    wheelDelta.current += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
    if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => { wheelDelta.current = 0; }, 140);
    if (Math.abs(wheelDelta.current) >= 28) {
      const magnitude = Math.abs(wheelDelta.current);
      const steps = Math.min(5, Math.max(1, Math.round(magnitude / 42)));
      const step = (wheelDelta.current > 0 ? 1 : -1) * steps;
      const next = Math.max(0, Math.min(items.length - 1, activeIndex + step));
      wheelDelta.current = 0;
      if (items[next] && next !== activeIndex) {
        onChange(items[next].value); onTouch();
      }
    }
  };
  const onScroll = () => {
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (!list.current) return;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(list.current.scrollTop / ROW_HEIGHT)));
      if (items[index] && items[index].value !== value) { skipNextSync.current = true; onChange(items[index].value); }
      onTouch();
    }, 65);
  };
  const select = (item: WheelItem, index: number) => {
    onChange(item.value); onTouch();
    if (!window.matchMedia('(min-width: 900px)').matches) list.current?.scrollTo({ top: index * ROW_HEIGHT, behavior: 'smooth' });
  };
  return <div className="wheelColumn"><span className="wheelLabel">{label}</span><div className="wheelFrame"><div className="wheelSelection"/><div ref={list} className="wheelList" role="listbox" aria-label={label} onScroll={onScroll} onWheel={onWheel}>
    <div className="wheelOptions" style={{'--wheel-index':activeIndex} as CSSProperties}><div className="wheelSpacer"/>{items.map((item, index) => <button type="button" role="option" aria-selected={item.value === value} className={`wheelItem ${item.value === value ? 'selected' : ''}`} key={item.value} onClick={() => select(item, index)}>{item.label}</button>)}<div className="wheelSpacer"/></div>
  </div><span className="wheelFade top"/><span className="wheelFade bottom"/></div></div>;
}

<<<<<<< HEAD
export function OrderEntry({ deviceNo, menu, loading, connected, onSubmit }: { deviceNo: number; menu: MenuItem[]; loading: boolean; connected: boolean; onSubmit: (name: string, birthdate: string, menuId: string) => Promise<string> }) {
=======
export function OrderEntry({ deviceNo, menu, loading, connected, menuError, onSubmit, onPlayWithoutOrder }: { deviceNo: number; menu: MenuItem[]; loading: boolean; connected: boolean; menuError: string; onSubmit: (name: string, birthdate: string, menuId: string) => Promise<string>; onPlayWithoutOrder: () => void }) {
>>>>>>> temp-branch
  const [page, setPage] = useState<0 | 1>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [name, setName] = useState('');
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [touched, setTouched] = useState({ year: true, month: true, day: true });
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
<<<<<<< HEAD
=======
  const [allowPlayWithoutOrder, setAllowPlayWithoutOrder] = useState(false);
>>>>>>> temp-branch
  const available = menu.filter((item) => item.available);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const maxMonth = year === currentYear ? currentMonth : 12;
  const maxDay = Math.min(new Date(year, month, 0).getDate(), year === currentYear && month === currentMonth ? currentDay : 31);
  const dateItems = useMemo(() => ({
    years: Array.from({ length: currentYear - 1919 }, (_, i) => ({ value: currentYear - i, label: `${currentYear - i}년` })),
    months: Array.from({ length: maxMonth }, (_, i) => ({ value: i + 1, label: `${i + 1}월` })),
    days: Array.from({ length: maxDay }, (_, i) => ({ value: i + 1, label: `${i + 1}일` })),
  }), [currentYear, maxMonth, maxDay]);
  const birthdate = `${year}-${pad(month)}-${pad(day)}`;
  const validInfo = !!name.trim();
  useEffect(() => {
    if (year === currentYear && month > currentMonth) setMonth(currentMonth);
    if (day > maxDay) setDay(maxDay);
  }, [year, month, day, currentYear, currentMonth, maxDay]);
  const markTouched = (part: keyof typeof touched) => setTouched((prev) => ({ ...prev, [part]: true }));
  const movePage = (next: 0 | 1) => { setDirection(next > page ? 1 : -1); setPage(next); setError(''); };
  const submit = async () => {
    if (!selected) { setError('음료를 하나 선택해 주세요.'); return; }
    setSending(true); setError('');
    try {
      const message = await onSubmit(name.trim(), birthdate, selected);
<<<<<<< HEAD
      if (message) setError(message);
    } catch {
      setError('주문을 전송하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally { setSending(false); }
  };
=======
      if (message) { setError(message); setAllowPlayWithoutOrder(true); }
    } catch {
      setError('주문을 전송하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');
      setAllowPlayWithoutOrder(true);
    } finally { setSending(false); }
  };
  const hasOrderMenu = connected && !menuError && available.length > 0;
  const playWithoutOrder = !loading && (!hasOrderMenu || allowPlayWithoutOrder);
>>>>>>> temp-branch
  return <div className="orderExperience"><div className="orderAmbient ambientOne"/><div className="orderAmbient ambientTwo"/>
    <main className="orderLayout">
      <header className="orderHeader"><div className="orderBrand"><span className="orderLogo"><Coffee size={19}/></span><span>우주 한입</span></div><span className="stationPill">기기 <b>{deviceNo}</b></span></header>
      {!connected && <div className="connectionNotice">주문 시스템에 연결할 수 없습니다. 운영팀에 문의해 주세요.</div>}
      <div className="stepMeter" aria-label={`${page + 1} / 2`}><span className={page === 0 ? 'current' : 'complete'}/><span className={page === 1 ? 'current' : ''}/></div>
      <section className={`orderSlide ${direction > 0 ? 'slideForward' : 'slideBack'}`} key={page}>
        {page === 0 ? <>
          <div className="orderIntro"><span className="orderEyebrow">A LITTLE TASTE OF SPACE</span><h1>먼저, 탑승자 정보를<br/>알려주세요.</h1><p>주문표에 이름과 별자리가 표시돼요.</p></div>
          <div className="orderInfoGrid"><label className="nameField"><span>이름</span><input autoComplete="name" maxLength={30} placeholder="이름을 입력해 주세요" value={name} onChange={(event) => setName(event.target.value)}/></label>
          <div className="birthdayBlock"><div className="birthdayTitle"><div><b>생년월일</b><span>휠을 돌리거나 항목을 눌러 선택해요</span></div><Sparkles size={18}/></div>
            <div className="birthdayWheels"><WheelColumn label="연도" items={dateItems.years} value={year} onChange={setYear} onTouch={() => markTouched('year')}/><WheelColumn label="월" items={dateItems.months} value={month} onChange={setMonth} onTouch={() => markTouched('month')}/><WheelColumn label="일" items={dateItems.days} value={day} onChange={setDay} onTouch={() => markTouched('day')}/></div>
            <p className="birthdayPreview">{validInfo ? `${year}년 ${month}월 ${day}일` : '연도 · 월 · 일을 각각 선택해 주세요'}</p>
          </div></div>
        </> : <>
          <div className="orderIntro"><span className="orderEyebrow">CHOOSE YOUR DRINK</span><h1>오늘은 어떤 맛으로<br/>여행할까요?</h1><p>마음에 드는 음료 하나를 골라주세요.</p></div>
<<<<<<< HEAD
          <div className="drinkGrid">{available.map((item) => <button type="button" key={item.id} className={`drinkOption ${selected === item.id ? 'chosen' : ''}`} onClick={() => { setSelected(item.id); setError(''); }}><span className="drinkEmoji">{['🍏','🥭','🍊','🍇','🌿','🍊','🍍','🍈','🍓','🍈','🍋','🫐'][menu.findIndex((m) => m.id === item.id) % 12]}</span><span>{item.name}</span>{selected === item.id && <Check className="drinkCheck" size={17}/>}</button>)}</div>
          {!loading && available.length === 0 && <div className="emptyDrinks">{connected ? '지금 주문할 수 있는 음료가 없어요.' : '메뉴를 불러오지 못했어요.'}</div>}
        </>}
      </section>
      {error && <div className="orderError" role="alert">{error}</div>}
      <footer className="orderFooter">{page === 0 ? <button className="continueButton" disabled={!validInfo} onClick={() => movePage(1)}>메뉴 고르기 <ChevronRight size={19}/></button> : <div className="footerActions"><button className="backButton" onClick={() => movePage(0)}><ChevronLeft size={18}/> 이전</button><button className="continueButton" disabled={!selected || sending || loading || !connected} onClick={() => void submit()}>{sending ? <><LoaderCircle className="buttonSpin" size={18}/> 주문 중</> : <>주문하고 게임 시작 <ChevronRight size={19}/></>}</button></div>}
=======
          <div className="drinkGrid">{available.map((item) => <button type="button" key={item.id} className={`drinkOption ${selected === item.id ? 'chosen' : ''}`} onClick={() => { setSelected(item.id); setError(''); setAllowPlayWithoutOrder(false); }}><span className="drinkEmoji">{['🍏','🥭','🍊','🍇','🌿','🍊','🍍','🍈','🍓','🍈','🍋','🫐'][menu.findIndex((m) => m.id === item.id) % 12]}</span><span>{item.name}</span>{selected === item.id && <Check className="drinkCheck" size={17}/>}</button>)}</div>
          {!loading && available.length === 0 && <div className="emptyDrinks">{menuError || (connected ? '지금 주문할 수 있는 음료가 없어요.' : '메뉴를 불러오지 못했어요.')}</div>}
        </>}
      </section>
      {error && <div className="orderError" role="alert">{error}</div>}
      <footer className="orderFooter">{page === 0 ? <button className="continueButton" disabled={!validInfo} onClick={() => movePage(1)}>메뉴 고르기 <ChevronRight size={19}/></button> : <div className="footerActions"><button className="backButton" onClick={() => movePage(0)}><ChevronLeft size={18}/> 이전</button><button className="continueButton" disabled={sending || loading || (!playWithoutOrder && (!selected || !connected))} onClick={() => playWithoutOrder ? onPlayWithoutOrder() : void submit()}>{sending ? <><LoaderCircle className="buttonSpin" size={18}/> 주문 중</> : playWithoutOrder ? <>주문 없이 게임 시작 <ChevronRight size={19}/></> : <>주문하고 게임 시작 <ChevronRight size={19}/></>}</button></div>}
>>>>>>> temp-branch
        <p>{page === 0 ? '정보는 주문 확인에만 사용돼요.' : '주문 후에는 편하게 게임을 즐겨 주세요.'}</p>
      </footer>
    </main>
  </div>;
}
