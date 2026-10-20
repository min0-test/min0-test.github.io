create extension if not exists pgcrypto;

create table if not exists public.menu (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  available boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Remove the former menu price field when upgrading an already initialized schema.
alter table public.menu drop column if exists price;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  queue_no bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 1 and 30),
  customer_birthdate date not null,
  menu_id uuid not null references public.menu(id) on delete restrict,
  device_no integer not null check (device_no between 1 and 9999),
  status text not null default 'queued' check (status in ('queued','ready','picked_up')),
  completed_at timestamptz,
  picked_up_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_queue_idx on public.orders(status, queue_no);
create index if not exists orders_device_status_idx on public.orders(device_no, status, queue_no desc);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

insert into public.menu (name, position) values
  ('청사과',0),('망고',1),('자몽',2),('포도',3),('매실',4),('오렌지',5),
  ('파인애플',6),('청포도',7),('딸기',8),('멜론',9),('레몬',10),('블루베리',11)
on conflict (name) do nothing;

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.menu;
exception when duplicate_object then null;
end $$;

-- Public kiosks may read available menu items, while any authenticated user
-- may manage menu/order records. Guest actions use narrow RPC results.
alter table public.menu enable row level security;
alter table public.orders enable row level security;

drop policy if exists "available menu is public" on public.menu;
create policy "available menu is public" on public.menu
  for select to anon using (available);

drop policy if exists "staff can manage menu" on public.menu;
create policy "staff can manage menu" on public.menu
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "staff can manage orders" on public.orders;
create policy "staff can manage orders" on public.orders
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

revoke all on public.menu, public.orders from anon;
grant select (id, name, available, position) on public.menu to anon;
grant select, insert, update, delete on public.menu, public.orders to authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.create_guest_order(
  p_customer_name text,
  p_customer_birthdate date,
  p_menu_id uuid,
  p_device_no integer
)
returns table (id uuid, queue_no bigint, created_at timestamptz, device_no integer, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order public.orders;
begin
  if p_customer_name is null or p_customer_name <> trim(p_customer_name)
     or char_length(trim(p_customer_name)) not between 1 and 30
     or p_customer_name ~ '[[:cntrl:]]' then
    raise exception '이름은 1~30자로 입력해 주세요.' using errcode = '22023';
  end if;
  if p_customer_birthdate is null or p_customer_birthdate > current_date or p_customer_birthdate < date '1920-01-01' then
    raise exception '생년월일을 확인해 주세요.' using errcode = '22023';
  end if;
  if p_device_no is null or p_device_no not between 1 and 9999 or p_menu_id is null then
    raise exception '주문 정보를 확인해 주세요.' using errcode = '22023';
  end if;

  -- Serialize requests from the same kiosk and prevent duplicate active orders.
  perform pg_catalog.pg_advisory_xact_lock(p_device_no);
  if exists (
    select 1 from public.orders as active_order
    where active_order.device_no = p_device_no and active_order.status in ('queued', 'ready')
  ) then
    raise exception '이 기기에는 아직 완료되지 않은 주문이 있습니다.' using errcode = '23505';
  end if;

  insert into public.orders (customer_name, customer_birthdate, menu_id, device_no, status)
  select trim(p_customer_name), p_customer_birthdate, menu.id, p_device_no, 'queued'
  from public.menu as menu
  where menu.id = p_menu_id and menu.available
  returning * into new_order;

  if new_order.id is null then
    raise exception '선택한 메뉴는 현재 주문할 수 없습니다.';
  end if;

  return query select new_order.id, new_order.queue_no, new_order.created_at, new_order.device_no, new_order.status;
end;
$$;

create or replace function public.get_device_order(p_device_no integer)
returns table (id uuid, queue_no bigint, created_at timestamptz, device_no integer, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select orders.id, orders.queue_no, orders.created_at, orders.device_no, orders.status
  from public.orders as orders
  where orders.device_no = p_device_no
  order by orders.queue_no desc
  limit 1;
$$;

create or replace function public.get_guest_order_status(p_order_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select orders.status from public.orders as orders where orders.id = p_order_id;
$$;

revoke all on function public.create_guest_order(text, date, uuid, integer) from public;
revoke all on function public.get_device_order(integer) from public;
revoke all on function public.get_guest_order_status(uuid) from public;
grant execute on function public.create_guest_order(text, date, uuid, integer) to anon, authenticated;
grant execute on function public.get_device_order(integer) to anon, authenticated;
grant execute on function public.get_guest_order_status(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
