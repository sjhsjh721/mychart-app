# M4: 관심종목 & 알림 설계

## MCHART-017: 관심종목 패널

### 개요
사이드바에 관심종목 그룹을 표시하고, 실시간 현재가/등락률을 보여주는 패널.

### UI 구조
```
┌─────────────────────────┐
│ 관심종목            [+] │  ← 그룹 추가 버튼
├─────────────────────────┤
│ ▼ 국내주식              │  ← 그룹 (접기/펴기)
│   삼성전자  82,400 +1.2%│
│   SK하이닉스 ...        │
│   카카오    ...         │
├─────────────────────────┤
│ ▼ 미국주식              │
│   AAPL     182.50 +0.8% │
│   NVDA     ...          │
└─────────────────────────┘
```

### 기능
1. **그룹 관리**
   - 그룹 생성/수정/삭제
   - 그룹명 편집 (더블클릭)
   - 그룹 순서 변경 (드래그앤드롭)

2. **종목 관리**
   - 종목 추가 (검색 모달 연동)
   - 종목 삭제 (우클릭 메뉴 or 스와이프)
   - 종목 순서 변경 (드래그앤드롭)
   - 그룹 간 이동

3. **실시간 데이터**
   - 현재가, 등락률 표시
   - 색상: 상승(빨강), 하락(파랑), 보합(회색)
   - 자동 갱신 (10초마다 or WebSocket)

### 데이터 구조

```typescript
// Supabase: watchlist_groups
interface WatchlistGroup {
  id: string;
  user_id: string;
  name: string;
  order: number;
  created_at: string;
}

// Supabase: watchlist_items
interface WatchlistItem {
  id: string;
  group_id: string;
  symbol: string;       // "005930.KS" or "AAPL"
  name: string;         // "삼성전자"
  order: number;
  added_at: string;
}

// Frontend state
interface WatchlistState {
  groups: WatchlistGroup[];
  items: Record<string, WatchlistItem[]>;  // group_id -> items
  prices: Record<string, PriceData>;       // symbol -> price
}
```

### 컴포넌트 구조
```
src/features/watchlist/
├── components/
│   ├── watchlist-panel.tsx      # 메인 패널
│   ├── watchlist-group.tsx      # 그룹 (접기/펴기)
│   ├── watchlist-item.tsx       # 개별 종목
│   ├── add-group-dialog.tsx     # 그룹 추가 모달
│   └── add-item-dialog.tsx      # 종목 추가 모달
├── hooks/
│   ├── use-watchlist.ts         # 관심종목 CRUD
│   └── use-realtime-prices.ts   # 실시간 가격
├── store/
│   └── watchlist-store.ts       # Zustand store
└── api/
    └── watchlist-api.ts         # Supabase 연동
```

### 구현 순서
1. DB 스키마 생성 (watchlist_groups, watchlist_items)
2. Zustand store 설정
3. 기본 UI (그룹/종목 표시)
4. 그룹 CRUD
5. 종목 CRUD
6. 드래그앤드롭 (dnd-kit)
7. 실시간 가격 연동

### 예상 시간: 3시간

---

## MCHART-018: 알림 조건 설정

### 개요
종목별로 알림 조건을 설정하고 저장하는 UI.

### UI 구조
```
┌─────────────────────────────────────┐
│ 알림 설정 - 삼성전자 (005930)    [X]│
├─────────────────────────────────────┤
│ + 새 조건 추가                      │
├─────────────────────────────────────┤
│ ☑ 가격 >= 85,000원           [🗑️] │
│ ☑ RSI(14) >= 70              [🗑️] │
│ ☐ 가격 <= 80,000원 (비활성)  [🗑️] │
├─────────────────────────────────────┤
│           [저장] [취소]             │
└─────────────────────────────────────┘
```

### 조건 타입

```typescript
type AlertConditionType = 
  | 'price_above'      // 가격 이상
  | 'price_below'      // 가격 이하
  | 'price_reach'      // 가격 도달 (±0.5%)
  | 'rsi_above'        // RSI 이상
  | 'rsi_below'        // RSI 이하
  | 'ma_cross_up'      // MA 골든크로스
  | 'ma_cross_down'    // MA 데드크로스
  | 'volume_spike';    // 거래량 급증 (평균 대비 %)

interface AlertCondition {
  id: string;
  user_id: string;
  symbol: string;
  type: AlertConditionType;
  value: number;           // 조건 값
  params?: {               // 추가 파라미터
    period?: number;       // RSI/MA 기간
    ma_short?: number;     // 단기 MA
    ma_long?: number;      // 장기 MA
  };
  enabled: boolean;
  triggered_at?: string;   // 마지막 발동 시간
  created_at: string;
}
```

### 데이터 구조 (Supabase)

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(30) NOT NULL,
  value DECIMAL NOT NULL,
  params JSONB,
  enabled BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_symbol ON alerts(symbol);
CREATE INDEX idx_alerts_enabled ON alerts(enabled) WHERE enabled = true;
```

### 컴포넌트 구조
```
src/features/alerts/
├── components/
│   ├── alert-settings-dialog.tsx  # 알림 설정 모달
│   ├── alert-condition-row.tsx    # 조건 행
│   ├── condition-type-select.tsx  # 조건 타입 선택
│   └── condition-value-input.tsx  # 값 입력
├── hooks/
│   └── use-alerts.ts              # 알림 CRUD
├── store/
│   └── alert-store.ts             # Zustand store
└── types.ts
```

### 구현 순서
1. DB 스키마 생성
2. 알림 설정 모달 UI
3. 조건 타입별 입력 폼
4. Supabase CRUD
5. 조건 활성화/비활성화 토글

### 예상 시간: 3시간

---

## MCHART-019: 알림 워커

### 개요
활성화된 알림 조건을 주기적으로 평가하고, 조건 충족 시 텔레그램으로 알림 발송.

### 아키텍처
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Supabase   │───▶│ Edge Function│───▶│  Telegram   │
│  pg_cron    │    │  (check-     │    │     Bot     │
│  (1분마다)  │    │   alerts)    │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Yahoo Finance│
                   │     API      │
                   └──────────────┘
```

### Edge Function 로직

```typescript
// supabase/functions/check-alerts/index.ts

export default async function handler(req: Request) {
  // 1. 활성화된 알림 조건 조회
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('enabled', true);

  // 2. 종목별로 그룹화
  const symbolGroups = groupBy(alerts, 'symbol');

  // 3. 각 종목 현재가/지표 조회
  for (const [symbol, conditions] of Object.entries(symbolGroups)) {
    const quote = await fetchQuote(symbol);
    const indicators = await calculateIndicators(symbol);

    // 4. 조건 평가
    for (const condition of conditions) {
      if (evaluateCondition(condition, quote, indicators)) {
        // 5. 텔레그램 발송
        await sendTelegramAlert(condition, quote);
        
        // 6. triggered_at 업데이트 (중복 방지)
        await supabase
          .from('alerts')
          .update({ triggered_at: new Date().toISOString() })
          .eq('id', condition.id);
      }
    }
  }
}
```

### 조건 평가 함수

```typescript
function evaluateCondition(
  condition: AlertCondition,
  quote: Quote,
  indicators: Indicators
): boolean {
  // 최근 1시간 내 발동됐으면 스킵 (중복 방지)
  if (condition.triggered_at) {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (new Date(condition.triggered_at).getTime() > hourAgo) {
      return false;
    }
  }

  switch (condition.type) {
    case 'price_above':
      return quote.price >= condition.value;
    case 'price_below':
      return quote.price <= condition.value;
    case 'rsi_above':
      return indicators.rsi >= condition.value;
    case 'rsi_below':
      return indicators.rsi <= condition.value;
    // ...
  }
}
```

### 텔레그램 메시지 포맷

```
🔔 삼성전자 알림

조건: 가격 >= 85,000원
현재가: 85,200원 (+1.5%)

📊 https://mychart-app.vercel.app?symbol=005930.KS
```

### 스케줄 설정 (pg_cron)

```sql
-- 1분마다 실행
SELECT cron.schedule(
  'check-alerts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/check-alerts',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);
```

### 구현 순서
1. Edge Function 생성 (`check-alerts`)
2. 조건 평가 로직
3. 텔레그램 봇 연동
4. pg_cron 스케줄 설정
5. 테스트 및 배포

### 예상 시간: 4시간

---

## 총 예상 시간

| 티켓 | 내용 | 시간 |
|------|------|------|
| MCHART-017 | 관심종목 패널 | 3h |
| MCHART-018 | 알림 조건 설정 | 3h |
| MCHART-019 | 알림 워커 | 4h |
| **합계** | | **10h** |
