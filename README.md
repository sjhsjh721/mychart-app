# MyChart 📈

주식 차트 분석 및 기술적 지표 시각화 웹 앱

## 스택

- **프레임워크:** Next.js 14 (App Router)
- **언어:** TypeScript (strict mode)
- **스타일링:** Tailwind CSS + shadcn/ui
- **차트:** TradingView Lightweight Charts
- **데이터:** Yahoo Finance API
- **DB:** Supabase (PostgreSQL)

## 기능

### M1: Foundation ✅

- [x] 기본 레이아웃 (다크모드)
- [x] 캔들스틱 차트
- [x] Yahoo Finance 데이터 연동
- [x] 종목 검색 모달
- [x] 타임프레임 선택 (1m, 5m, 15m, 1h, 1D, 1W, 1M)

### M2: Indicators (진행중)

- [x] 거래량 차트 ✅
- [ ] 이동평균선 (SMA, EMA)
- [ ] RSI
- [ ] 볼린저 밴드
- [ ] 일목균형표

### M3~M5 (예정)

- 작도 도구 (추세선, 수평선)
- 관심종목 & 알림
- 해외 주식, MACD, 피보나치

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API Routes
│   └── page.tsx         # 메인 페이지
├── components/ui/       # shadcn/ui 컴포넌트
├── features/
│   ├── chart/          # 차트 컴포넌트
│   ├── kis/            # 주식 데이터 훅
│   └── search/         # 종목 검색
├── server/
│   ├── kis/            # KIS API (레거시)
│   └── yahoo/          # Yahoo Finance API
└── lib/                # 유틸리티
```

## 문서

- [티켓 목록](./docs/TICKETS.md)
- [백로그](/Users/jonghyeon/.openclaw/workspace/projects/mychart/BACKLOG.md)

---

_Last updated: 2026-02-10_
