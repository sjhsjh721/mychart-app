# PRD: MyChart - 나만의 트레이딩 차트 플랫폼

**Version:** 1.0  
**Date:** 2026-02-07  
**Author:** 김PM  
**Status:** Draft

---

## 1. 개요

TradingView 스타일의 개인용 트레이딩 차트 플랫폼. 국내/해외 주식 차트 분석, 기술적 지표, 차트 작도, 커스텀 알림 기능 제공.

## 2. 목표

### 비즈니스 목표

- 개인 투자 분석을 위한 올인원 차트 플랫폼
- TradingView 의존도 줄이고 커스텀 기능 자유롭게 추가
- 텔레그램 연동으로 실시간 알림

### 성공 지표

- MVP 완성 후 일일 사용
- 알림 정확도 99%+
- 차트 로딩 2초 이내

## 3. 타겟 사용자

**Primary:** 신종현 대표님 (개인 투자자)

- 국내/해외 주식 투자
- 기술적 분석 활용
- 모바일보다 웹 선호

## 4. 핵심 기능

### 4.1 차트 뷰어 (P0)

| 기능       | 설명                                    | 우선순위 |
| ---------- | --------------------------------------- | -------- |
| 캔들 차트  | OHLCV 캔들스틱                          | P0       |
| 타임프레임 | 1분, 5분, 15분, 1시간, 일봉, 주봉, 월봉 | P0       |
| 줌/팬      | 마우스 휠, 드래그                       | P0       |
| 크로스헤어 | 가격/시간 표시                          | P0       |

### 4.2 기술적 지표 (P0)

| 지표            | 설명                                     | 우선순위 |
| --------------- | ---------------------------------------- | -------- |
| 이동평균선 (MA) | SMA, EMA, 기간 커스텀                    | P0       |
| RSI             | 14일 기본, 과매수/과매도 라인            | P0       |
| 볼린저 밴드     | 20일, 2σ 기본                            | P0       |
| 일목균형표      | 전환선, 기준선, 선행스팬, 후행스팬, 구름 | P0       |
| 거래량          | 하단 바 차트                             | P0       |
| MACD            | 12, 26, 9 기본                           | P1       |
| 스토캐스틱      | %K, %D                                   | P1       |

### 4.3 차트 작도 (P0)

| 도구      | 설명         | 우선순위 |
| --------- | ------------ | -------- |
| 추세선    | 직선 그리기  | P0       |
| 수평선    | 지지/저항선  | P0       |
| 피보나치  | 되돌림, 확장 | P1       |
| 사각형/원 | 영역 표시    | P1       |
| 텍스트    | 메모 추가    | P1       |

### 4.4 관심종목 (P0)

| 기능        | 설명             | 우선순위 |
| ----------- | ---------------- | -------- |
| 종목 검색   | 이름/코드로 검색 | P0       |
| 워치리스트  | 그룹별 관리      | P0       |
| 현재가 표시 | 실시간/지연      | P0       |
| 등락률      | 전일 대비        | P0       |

### 4.5 알림 시스템 (P0)

| 기능          | 설명                  | 우선순위 |
| ------------- | --------------------- | -------- |
| 가격 알림     | 특정 가격 도달 시     | P0       |
| 지표 알림     | RSI < 30, RSI > 70 등 | P0       |
| 커스텀 조건   | AND/OR 조합           | P1       |
| 텔레그램 발송 | 봇으로 알림           | P0       |

### 4.6 데이터 소스 (P0)

| 시장      | 소스                       | 실시간 | 비용      |
| --------- | -------------------------- | ------ | --------- |
| 국내 주식 | KIS API (한국투자증권)     | O      | 무료      |
| 해외 주식 | Yahoo Finance / Polygon.io | △      | 무료/유료 |

## 5. 기술 스택

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Chart:** TradingView Lightweight Charts v4
- **State:** Zustand
- **UI:** Tailwind CSS + shadcn/ui
- **Drawing:** Canvas API / Konva.js

### Backend

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (optional)
- **Realtime:** Supabase Realtime / WebSocket
- **Scheduler:** Supabase Edge Functions / Cron

### External APIs

- **KIS API:** 국내 주식 실시간/일봉
- **Yahoo Finance:** 해외 주식 (yfinance)
- **Polygon.io:** 해외 주식 실시간 (유료, optional)

### Infra

- **Hosting:** Vercel
- **Alerts:** Telegram Bot API

## 6. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ 차트뷰어 │  │ 지표패널 │  │ 작도도구 │  │ 알림설정 │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ 관심종목 │  │ 알림조건 │  │ 작도데이터│  │ 사용자설정│    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   KIS API (국내)     │     │  Yahoo/Polygon (해외)│
└─────────────────────┘     └─────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Alert Worker (Edge Function)                │
│  가격/지표 모니터링 → 조건 충족 시 텔레그램 발송           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Telegram   │
                    └─────────────┘
```

## 7. 데이터 모델

### stocks (종목 마스터)

```sql
id: uuid
symbol: text (005930, AAPL)
name: text (삼성전자, Apple Inc.)
market: text (KRX, NASDAQ, NYSE)
currency: text (KRW, USD)
```

### watchlists (관심종목 그룹)

```sql
id: uuid
user_id: uuid
name: text
created_at: timestamp
```

### watchlist_items (관심종목)

```sql
id: uuid
watchlist_id: uuid
stock_id: uuid
order: int
```

### drawings (차트 작도)

```sql
id: uuid
user_id: uuid
stock_id: uuid
timeframe: text
type: text (trendline, horizontal, fib, rect, text)
data: jsonb (좌표, 스타일 등)
created_at: timestamp
```

### alerts (알림 조건)

```sql
id: uuid
user_id: uuid
stock_id: uuid
condition_type: text (price, rsi, macd, custom)
condition: jsonb
enabled: boolean
triggered_at: timestamp
created_at: timestamp
```

### alert_history (알림 이력)

```sql
id: uuid
alert_id: uuid
triggered_at: timestamp
price: decimal
message: text
```

## 8. 마일스톤

### M1: Foundation (1주)

- [ ] 프로젝트 셋업 (Next.js, Supabase)
- [ ] 기본 차트 뷰어 (캔들, 줌/팬)
- [ ] KIS API 연동 (국내 주식)
- [ ] 종목 검색

### M2: Indicators (1주)

- [ ] 이동평균선
- [ ] RSI
- [ ] 볼린저밴드
- [ ] 일목균형표
- [ ] 거래량

### M3: Drawing Tools (0.5주)

- [ ] 추세선
- [ ] 수평선
- [ ] 작도 데이터 저장/로드

### M4: Watchlist & Alerts (0.5주)

- [ ] 관심종목 관리
- [ ] 알림 조건 설정
- [ ] 텔레그램 연동
- [ ] 알림 워커

### M5: Polish (0.5주)

- [ ] 해외 주식 연동
- [ ] UI/UX 개선
- [ ] 성능 최적화
- [ ] 버그 수정

**Total: 3.5주 (MVP)**

## 9. 리스크

| 리스크               | 영향 | 대응                        |
| -------------------- | ---- | --------------------------- |
| KIS API 인증 복잡    | 중   | 문서 충분, 테스트 계정      |
| 일목균형표 구현 복잡 | 중   | 라이브러리 또는 공식 참고   |
| 실시간 데이터 부하   | 저   | 폴링 주기 조절, 캐싱        |
| 차트 작도 UX         | 중   | TradingView 참고, 반복 개선 |

## 10. 의존성

- [ ] 한국투자증권 계좌 (KIS API용)
- [ ] Supabase 프로젝트 생성
- [ ] Vercel 배포 설정
- [ ] 텔레그램 봇 (기존 것 사용 가능)

## 11. 오픈 질문

1. 해외 주식 실시간 필요? (Polygon 유료) vs 지연 데이터 OK?
2. 멀티 차트 레이아웃 필요? (2x2 등)
3. 다크모드 우선?
4. 모바일 대응 필요?

---

**Next Steps:**

1. PRD 리뷰 및 확정
2. 디자인 와이어프레임
3. 티켓 분리
4. 개발 시작
