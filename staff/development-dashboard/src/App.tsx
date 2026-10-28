import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, CheckCircle2, Clock3, Download, FileSpreadsheet, Hash, Monitor, Radio, RefreshCw, Timer, Wifi, WifiOff } from 'lucide-react';
import { supabase, fetchMenu, fetchOrders, subscribeOrders, zodiacFromBirthdate, type DrinkOrder, type MenuItem } from '@orders';
import { StaffAuthGate, StaffLogoutButton } from '../../../src/components/StaffAuth';

const KEY = 'space-cafe-device-number';
const statusLabel = (status: string) => status === 'queued' ? '제조 중' : status === 'ready' ? '수령 대기' : '수령 완료';
const timeLabel = (date: Date | null) => date ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '—';
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
function exportCsv(filename: string, headers: string[], rows: unknown[][]) {
  const contents = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() { return <StaffAuthGate><Dashboard /></StaffAuthGate>; }

function Dashboard() {
  const [input, setInput] = useState(() => localStorage.getItem(KEY) ?? '1');
  const [orders, setOrders] = useState<DrinkOrder[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [nextOrders, nextMenu] = await Promise.all([fetchOrders(), fetchMenu()]);
      setOrders(nextOrders); setMenu(nextMenu); setUpdated(new Date()); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : '연결할 수 없습니다.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    void refresh(); const unsub = subscribeOrders(() => void refresh());
    const poll = window.setInterval(() => void refresh(), 30000);
    return () => { unsub(); clearInterval(poll); };
  }, [refresh]);

  const stats = useMemo(() => {
    const queued = orders.filter((o) => o.status === 'queued').length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const picked = orders.filter((o) => o.status === 'picked_up').length;
    const prep = orders.filter((o) => o.completed_at).map((o) => (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 60000).filter((n) => n >= 0 && n < 240);
    const pickup = orders.filter((o) => o.completed_at && o.picked_up_at).map((o) => (new Date(o.picked_up_at!).getTime() - new Date(o.completed_at!).getTime()) / 60000).filter((n) => n >= 0 && n < 1440);
    const created = orders.map((o) => new Date(o.created_at)).filter((d) => Number.isFinite(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    const intervals = created.slice(1).map((d, i) => (d.getTime() - created[i].getTime()) / 60000).filter((n) => n >= 0);
    const activeMinutes = created.length > 1 ? Math.max(1, (created.at(-1)!.getTime() - created[0].getTime()) / 60000) : 0;
    return {
      total: orders.length, queued, ready, picked, completion: orders.length ? Math.round((picked + ready) / orders.length * 100) : 0,
      avgPrep: average(prep), medianPrep: median(prep), fastestPrep: prep.length ? Math.min(...prep) : null, slowestPrep: prep.length ? Math.max(...prep) : null,
      avgPickup: average(pickup), avgInterval: average(intervals), firstOrder: created[0] ?? null, lastOrder: created.at(-1) ?? null,
      perHour: activeMinutes > 0 ? orders.length / activeMinutes * 60 : null,
    };
  }, [orders]);

  const minuteRows = useMemo(() => {
    const counts = new Map<number, number>();
    orders.forEach((o) => { const d = new Date(o.created_at); if (Number.isFinite(d.getTime())) { const minute = d.getHours() * 60 + d.getMinutes(); counts.set(minute, (counts.get(minute) ?? 0) + 1); } });
    if (!counts.size) return [];
    const first = Math.min(...counts.keys()), last = Math.max(...counts.keys());
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const minute = first + i;
      return { minute, count: counts.get(minute) ?? 0, label: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}` };
    });
  }, [orders]);
  const menuRows = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => counts.set(o.menu_id, (counts.get(o.menu_id) ?? 0) + 1));
    const rows = menu.map((item) => ({ id: item.id, label: item.name, count: counts.get(item.id) ?? 0, available: item.available }));
    counts.forEach((count, id) => { if (!menu.some((m) => m.id === id)) rows.push({ id, label: '삭제된 메뉴', count, available: false }); });
    return rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
  }, [orders, menu]);
  const zodiacRows = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => { const sign = zodiacFromBirthdate(o.customer_birthdate); counts.set(sign, (counts.get(sign) ?? 0) + 1); });
    return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
  }, [orders]);
  const statusParts = [{ label: '제조 중', count: stats.queued, color: '#d99b58' }, { label: '수령 대기', count: stats.ready, color: '#6f9f7d' }, { label: '수령 완료', count: stats.picked, color: '#8992a3' }];
  let angle = 0;
  const donut = `conic-gradient(${statusParts.map((part) => { const start = angle; angle += stats.total ? part.count / stats.total * 360 : 0; return `${part.color} ${start}deg ${angle}deg`; }).join(',')}${stats.total ? '' : ',#edf0f3 0deg 360deg'})`;
  const ordered = [...orders].sort((a, b) => b.queue_no - a.queue_no);
  const save = () => { const n = Number(input); if (!Number.isSafeInteger(n) || n < 1 || n > 9999) return; localStorage.setItem(KEY, String(n)); document.cookie = `${KEY}=${n}; path=/; max-age=31536000; SameSite=Lax`; };
  const maxMenu = Math.max(1, ...menuRows.map((row) => row.count));
  const maxMinute = Math.max(1, ...minuteRows.map((row) => row.count));
  const maxZodiac = Math.max(1, ...zodiacRows.map((row) => row.count));
  const tickEvery = Math.max(1, Math.ceil(minuteRows.length / 12));
  const topMinute = [...minuteRows].sort((a, b) => b.count - a.count)[0];
  const topMenu = menuRows.find((row) => row.count > 0);

  const exportOrders = () => exportCsv('space-cafe-orders.csv', ['queue_no', 'id', 'created_at', 'customer_birthdate', 'zodiac', 'menu', 'device_no', 'status', 'completed_at', 'picked_up_at'], ordered.map((o) => [o.queue_no, o.id, o.created_at, o.customer_birthdate, zodiacFromBirthdate(o.customer_birthdate), menu.find((m) => m.id === o.menu_id)?.name ?? '삭제된 메뉴', o.device_no, o.status, o.completed_at, o.picked_up_at]));
  const exportMenu = () => exportCsv('space-cafe-menu-analysis.csv', ['menu', 'orders', 'share_percent', 'available', 'average_prep_minutes'], menuRows.map((row) => [row.label, row.count, stats.total ? (row.count / stats.total * 100).toFixed(1) : '0.0', row.available, average(orders.filter((o) => o.menu_id === row.id && o.completed_at).map((o) => (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 60000))?.toFixed(1) ?? '']));
  const exportMinutes = () => exportCsv('space-cafe-minute-traffic.csv', ['minute', 'orders', 'cumulative_orders'], minuteRows.reduce<Array<[string, number, number]>>((rows, row) => { const cumulative = (rows.at(-1)?.[2] ?? 0) + row.count; rows.push([row.label, row.count, cumulative]); return rows; }, []));
  const exportZodiac = () => exportCsv('space-cafe-zodiac-analysis.csv', ['zodiac', 'orders', 'share_percent'], zodiacRows.map((row) => [row.label, row.count, stats.total ? (row.count / stats.total * 100).toFixed(1) : '0.0']));
  const exportSummary = () => exportCsv('space-cafe-daily-summary.csv', ['metric', 'value'], [
    ['total_orders', stats.total], ['orders_per_hour', stats.perHour?.toFixed(1) ?? ''], ['completed_rate_percent', stats.completion],
    ['queued', stats.queued], ['ready_for_pickup', stats.ready], ['picked_up', stats.picked], ['average_prep_minutes', stats.avgPrep?.toFixed(1) ?? ''],
    ['median_prep_minutes', stats.medianPrep?.toFixed(1) ?? ''], ['fastest_prep_minutes', stats.fastestPrep?.toFixed(1) ?? ''], ['slowest_prep_minutes', stats.slowestPrep?.toFixed(1) ?? ''],
    ['average_pickup_wait_minutes', stats.avgPickup?.toFixed(1) ?? ''], ['average_minutes_between_orders', stats.avgInterval?.toFixed(1) ?? ''],
    ['first_order_time', timeLabel(stats.firstOrder)], ['last_order_time', timeLabel(stats.lastOrder)], ['peak_minute', topMinute?.label ?? ''], ['peak_minute_orders', topMinute?.count ?? 0], ['top_menu', topMenu?.label ?? ''], ['top_menu_orders', topMenu?.count ?? 0],
  ]);

  return <main className="shell"><header className="head"><div className="brand"><div className="mark"><Activity size={17}/></div><span>우주 한입</span><i>운영</i></div><div className="staffHeaderActions"><div className={`conn ${supabase ? '' : 'off'}`}>{supabase ? <><Wifi size={14}/> LIVE</> : <><WifiOff size={14}/> SETUP</>}</div><StaffLogoutButton/></div></header>
    <div className="body"><div className="title"><div><p className="eyebrow">DEVELOPMENT CONSOLE</p><h1>운영 현황</h1></div><button className="refresh" aria-label="새로고침" disabled={busy} onClick={() => void refresh()}><RefreshCw className={busy ? 'rot' : ''} size={16}/></button></div>{error && <div className="error">{error}</div>}
      <section className="deviceCard"><div className="deviceIcon"><Monitor size={18}/></div><div className="deviceInfo"><b>이 기기 번호</b><span>게임 및 새 주문에 적용됩니다</span></div><form onSubmit={(e) => { e.preventDefault(); save(); }}><input aria-label="기기 번호" inputMode="numeric" type="number" min="1" max="9999" value={input} onChange={(e) => setInput(e.target.value)}/><button>저장</button></form></section>
      <div className="analyticsTop"><div><h2>오늘의 운영</h2><span>하루 영업의 주문 흐름과 처리 결과</span></div></div>
      <div className="statGrid"><Stat label="전체 주문" value={stats.total} icon={<Hash size={16}/>} suffix="건"/><Stat label="제조 중" value={stats.queued} icon={<Clock3 size={16}/>} suffix="건"/><Stat label="수령 대기" value={stats.ready} icon={<Radio size={16}/>} suffix="건"/><Stat label="수령 완료" value={stats.picked} icon={<CheckCircle2 size={16}/>} suffix="건"/><Stat label="완료율" value={stats.completion} icon={<Activity size={16}/>} suffix="%"/><Stat label="평균 제조" value={round(stats.avgPrep)} icon={<Timer size={16}/>} suffix={stats.avgPrep === null ? '' : '분'}/><Stat label="중앙 제조" value={round(stats.medianPrep)} icon={<Timer size={16}/>} suffix={stats.medianPrep === null ? '' : '분'}/><Stat label="평균 수령 대기" value={round(stats.avgPickup)} icon={<Clock3 size={16}/>} suffix={stats.avgPickup === null ? '' : '분'}/><Stat label="시간당 주문" value={round(stats.perHour)} icon={<Activity size={16}/>} suffix={stats.perHour === null ? '' : '건'}/></div>
      <div className="insightStrip"><Insight label="첫 주문" value={timeLabel(stats.firstOrder)}/><Insight label="마지막 주문" value={timeLabel(stats.lastOrder)}/><Insight label="가장 붐빈 분" value={topMinute ? `${topMinute.label} · ${topMinute.count}건` : '—'}/><Insight label="가장 인기 메뉴" value={topMenu ? `${topMenu.label} · ${topMenu.count}건` : '—'}/><Insight label="주문 간격 평균" value={stats.avgInterval === null ? '—' : `${stats.avgInterval.toFixed(1)}분`}/><Insight label="가장 빠른 제조" value={stats.fastestPrep === null ? '—' : `${stats.fastestPrep.toFixed(1)}분`}/><Insight label="가장 오래 걸린 제조" value={stats.slowestPrep === null ? '—' : `${stats.slowestPrep.toFixed(1)}분`}/></div>
      <div className="chartGrid"><section className="card minuteTrend"><div className="cardHead"><h2>분 단위 주문 흐름</h2><span>주문 시각 기준</span></div>{minuteRows.length ? <div className="minuteChart">{minuteRows.map((row, i) => <div key={row.minute} title={`${row.label} · ${row.count}건`}><i style={{ height: `${Math.max(row.count ? 7 : 2, row.count / maxMinute * 100)}%` }}/>{(i % tickEvery === 0 || i === minuteRows.length - 1) && <span>{row.label}</span>}</div>)}</div> : <p className="empty">주문이 접수되면 분별 흐름이 표시됩니다</p>}</section>
        <section className="card"><div className="cardHead"><h2>주문 처리 상태</h2><span>전체 {stats.total}건</span></div><div className="statusChart"><div className="donut" style={{ background: donut }}><div><b>{stats.total}</b><span>주문</span></div></div><div className="legend">{statusParts.map((part) => <div key={part.label}><i style={{ background: part.color }}/><span>{part.label}</span><b>{part.count}</b></div>)}</div></div></section>
        <section className="card"><div className="cardHead"><h2>메뉴 선호도</h2><span>{stats.total}건 기준</span></div><Bars rows={menuRows.map((row) => ({ label: row.label, count: row.count }))} max={maxMenu}/></section>
        <section className="card"><div className="cardHead"><h2>별자리 분포</h2><span>주문자 생년월일 기준</span></div><Bars rows={zodiacRows} max={maxZodiac}/></section>
        <section className="card"><div className="cardHead"><h2>제조 시간 분석</h2><span>주문부터 제조 완료</span></div><div className="metricList"><Metric label="평균" value={stats.avgPrep}/><Metric label="중앙값" value={stats.medianPrep}/><Metric label="최단" value={stats.fastestPrep}/><Metric label="최장" value={stats.slowestPrep}/></div></section>
        <section className="card"><div className="cardHead"><h2>수령 대기 분석</h2><span>제조 완료부터 수령</span></div><div className="metricList"><Metric label="평균 대기" value={stats.avgPickup}/><Metric label="제조 완료" value={stats.picked + stats.ready} suffix="건"/><Metric label="미수령" value={stats.ready} suffix="건"/><Metric label="수령 완료" value={stats.picked} suffix="건"/></div></section>
      </div>
      <section className="card exportCard"><div className="cardHead"><div><h2>CSV 데이터 내보내기</h2><span>현재 불러온 하루 영업 데이터</span></div><FileSpreadsheet size={18}/></div><div className="exportGrid"><ExportButton label="운영 요약" detail="핵심 지표와 운영 시간" onClick={exportSummary}/><ExportButton label="전체 주문" detail="이름을 제외한 주문·메뉴·시간·처리 상태" onClick={exportOrders}/><ExportButton label="메뉴 분석" detail="주문 수·비중·제조 시간" onClick={exportMenu}/><ExportButton label="분 단위 흐름" detail="분별 주문 수와 누적 수" onClick={exportMinutes}/><ExportButton label="별자리 분석" detail="별자리별 주문 수와 비중" onClick={exportZodiac}/></div></section>
      <section className="card history"><div className="cardHead"><h2>주문 내역</h2><span>{orders.length}건 전체</span></div><div className="tableHeader"><span>주문</span><span>기기</span><span>메뉴</span><span>상태</span></div>{ordered.length === 0 ? <p className="empty">표시할 내역이 없습니다</p> : ordered.map((o) => <div className="orderRow" key={o.id}><span><b>{o.customer_name}</b><small>{new Date(o.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</small></span><strong>#{o.device_no}</strong><span>{menu.find((m) => m.id === o.menu_id)?.name ?? '—'}</span><em className={`status ${o.status}`}>{statusLabel(o.status)}</em></div>)}</section>
      <p className="foot">{updated ? `마지막 동기화 ${timeLabel(updated)}` : '연결 대기'} · 30초마다 자동 새로고침</p>
    </div>
  </main>;
}

function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function round(value: number | null) { return value === null ? '—' : Math.round(value); }
function Stat({ label, value, icon, suffix }: { label: string; value: number | string; icon: ReactNode; suffix: string }) { return <article className="stat"><div>{icon}<span>{label}</span></div><b>{value}<small>{suffix}</small></b></article>; }
function Insight({ label, value }: { label: string; value: string }) { return <article><span>{label}</span><b>{value}</b></article>; }
function Metric({ label, value, suffix = '분' }: { label: string; value: number | null; suffix?: string }) { return <div><span>{label}</span><b>{value === null ? '—' : `${value.toFixed(1)}${suffix}`}</b></div>; }
function Bars({ rows, max }: { rows: { label: string; count: number }[]; max: number }) { return rows.length ? <div className="bars">{rows.map((row) => <div className="barRow" key={row.label}><span>{row.label}</span><div><i style={{ width: `${Math.max(4, row.count / max * 100)}%` }}/></div><b>{row.count}</b></div>)}</div> : <p className="empty">아직 주문이 없습니다</p>; }
function ExportButton({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) { return <button className="exportButton" onClick={onClick}><span><b>{label}</b><small>{detail}</small></span><Download size={16}/></button>; }
