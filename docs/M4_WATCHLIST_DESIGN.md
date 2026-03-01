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

*(다음 티켓에서 상세화)*

### 핵심 기능
- 가격 조건: 이상/이하/도달
- 지표 조건: RSI > 70, MACD 골든크로스 등
- 조건 저장: Supabase alerts 테이블

---

## MCHART-019: 알림 워커

*(다음 티켓에서 상세화)*

### 핵심 기능
- Supabase Edge Function
- 1분마다 스케줄 실행
- 조건 평가 → 텔레그램 발송
