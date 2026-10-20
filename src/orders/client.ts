import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const staffApp = import.meta.env.VITE_STAFF_APP === 'true';

export const supabase = url && key ? createClient(url, key, {
  realtime: { params: { eventsPerSecond: 10 } },
  auth: { persistSession: staffApp, autoRefreshToken: staffApp, detectSessionInUrl: staffApp, storageKey: 'space-cafe-staff-auth' },
}) : null;

export const DRINKS = ['청사과', '망고', '자몽', '포도', '매실', '오렌지', '파인애플', '청포도', '딸기', '멜론', '레몬', '블루베리'] as const;
export type OrderStatus = 'queued' | 'ready' | 'picked_up';
export type MenuItem = { id: string; name: string; available: boolean; position: number };
export type DrinkOrder = {
  id: string; queue_no: number; created_at: string; customer_name: string; customer_birthdate: string;
  menu_id: string; device_no: number; status: OrderStatus; completed_at: string | null;
  picked_up_at: string | null; updated_at: string;
};
export type GuestOrder = { id: string; queue_no: number; created_at: string; device_no: number; status: OrderStatus };

export function getSupabaseErrorMessage(error: unknown): string {
  const value = error && typeof error === 'object' ? error as { code?: string; message?: string } : undefined;
  const message = value?.message?.trim();
  if (value?.code === 'PGRST202' || value?.code === '42883' || /could not find the function|schema cache|function .* does not exist/i.test(message ?? '')) {
    return 'Supabase 주문 기능이 데이터베이스에 반영되지 않았습니다. Supabase SQL Editor에서 저장소의 supabase/schema.sql을 실행해 주세요.';
  }
  if (value?.code === '42501' || /permission denied|not authorized|insufficient privilege/i.test(message ?? '')) {
    return 'Supabase 주문 권한이 설정되지 않았습니다. supabase/schema.sql의 권한과 정책을 적용했는지 확인해 주세요.';
  }
  if (/failed to fetch|networkerror|load failed/i.test(message ?? '')) {
    return 'Supabase 서버에 연결하지 못했습니다. 네트워크와 Supabase URL을 확인해 주세요.';
  }
  return message || 'Supabase 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export async function getDeviceOrder(deviceNo: number): Promise<GuestOrder | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_device_order', { p_device_no: deviceNo });
  if (error) throw error;
  return ((data ?? []) as GuestOrder[])[0] ?? null;
}

export async function getGuestOrderStatus(orderId: string): Promise<OrderStatus | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_guest_order_status', { p_order_id: orderId });
  if (error) throw error;
  return data as OrderStatus | null;
}

export async function createGuestOrder(input: { customerName: string; birthdate: string; menuId: string; deviceNo: number }): Promise<GuestOrder> {
  if (!supabase) throw new Error('Supabase 연결을 확인해 주세요.');
  const { data, error } = await supabase.rpc('create_guest_order', {
    p_customer_name: input.customerName, p_customer_birthdate: input.birthdate,
    p_menu_id: input.menuId, p_device_no: input.deviceNo,
  });
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const order = ((data ?? []) as GuestOrder[])[0];
  if (!order) throw new Error('주문을 생성하지 못했습니다.');
  return order;
}

export const orderSelect = 'id,queue_no,created_at,customer_name,customer_birthdate,menu_id,device_no,status,completed_at,picked_up_at,updated_at';
export function subscribeOrders(onChange: () => void) {
  if (!supabase) return () => {};
  const ch = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, onChange).subscribe();
  return () => { void supabase.removeChannel(ch); };
}
export async function fetchMenu(): Promise<MenuItem[]> {
  if (!supabase) return DRINKS.map((name, position) => ({ id: `demo-${position}`, name, available: true, position }));
  const { data, error } = await supabase.from('menu').select('*').order('position');
  if (error) throw error;
  return (data ?? []) as MenuItem[];
}
export async function fetchOrders(): Promise<DrinkOrder[]> {
  if (!supabase) return [];
  const rows: DrinkOrder[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('orders').select(orderSelect).order('queue_no', { ascending: true }).range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as DrinkOrder[]));
    if (!data || data.length < 1000) return rows;
  }
}
export function zodiacFromBirthdate(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  if (!m || !d) return '—';
  const signs = [['염소자리', 1, 20], ['물병자리', 2, 19], ['물고기자리', 3, 21], ['양자리', 4, 20], ['황소자리', 5, 21], ['쌍둥이자리', 6, 21], ['게자리', 7, 23], ['사자자리', 8, 23], ['처녀자리', 9, 23], ['천칭자리', 10, 23], ['전갈자리', 11, 22], ['사수자리', 12, 22], ['염소자리', 13, 1]] as const;
  return signs.find(([, month, day]) => m < month || (m === month && d < day))?.[0] ?? '염소자리';
}
