-- MyChart 초기 스키마
-- 2026-02-07

-- 사용자 테이블 (Supabase Auth 연동)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 관심종목 그룹
create table if not exists public.watchlist_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 관심종목
create table if not exists public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.watchlist_groups(id) on delete cascade not null,
  symbol text not null,  -- 종목코드 (005930, AAPL 등)
  market text not null,  -- KR, US
  name text,             -- 종목명
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 작도 데이터
create table if not exists public.drawings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  symbol text not null,
  timeframe text not null,  -- 1m, 5m, 1h, 1D 등
  type text not null,       -- trendline, hline, fib, rect, text
  data jsonb not null,      -- 작도 좌표, 스타일 등
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 알림 설정
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  symbol text not null,
  name text,
  conditions jsonb not null,  -- [{type: 'price', op: 'gte', value: 80000}, ...]
  enabled boolean default true,
  notify_telegram boolean default true,
  last_triggered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 알림 히스토리
create table if not exists public.alert_history (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references public.alerts(id) on delete cascade not null,
  triggered_at timestamptz default now(),
  message text
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.watchlist_groups enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.drawings enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_history enable row level security;

-- RLS 정책: 본인 데이터만 접근
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can manage own watchlist groups"
  on public.watchlist_groups for all using (auth.uid() = user_id);

create policy "Users can manage own watchlist items"
  on public.watchlist_items for all 
  using (group_id in (select id from public.watchlist_groups where user_id = auth.uid()));

create policy "Users can manage own drawings"
  on public.drawings for all using (auth.uid() = user_id);

create policy "Users can manage own alerts"
  on public.alerts for all using (auth.uid() = user_id);

create policy "Users can view own alert history"
  on public.alert_history for select 
  using (alert_id in (select id from public.alerts where user_id = auth.uid()));

-- 인덱스
create index if not exists idx_watchlist_items_symbol on public.watchlist_items(symbol);
create index if not exists idx_drawings_symbol_tf on public.drawings(symbol, timeframe);
create index if not exists idx_alerts_symbol on public.alerts(symbol);
create index if not exists idx_alerts_enabled on public.alerts(enabled) where enabled = true;
