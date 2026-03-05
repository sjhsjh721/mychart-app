# MyChart 📈

트레이딩뷰 스타일의 개인 차트 플랫폼

🔗 **Live:** https://mychart-app.vercel.app

## 스택

- **프레임워크:** Next.js 14 (App Router)
- **언어:** TypeScript (strict mode)
- **스타일링:** Tailwind CSS + shadcn/ui
- **차트:** TradingView Lightweight Charts
- **데이터:** Yahoo Finance API
- **상태관리:** Zustand

## 기능

### M1: Foundation ✅

- [x] 기본 레이아웃 (다크모드)
- [x] 캔들스틱 차트
- [x] Yahoo Finance 데이터 연동
- [x] 종목 검색 모달
- [x] 타임프레임 선택 (1m, 5m, 15m, 1h, 1D, 1W, 1M)
- [x] 모바일 반응형 UI
- [x] KST 타임존 표시

### M2: Indicators ✅

- [x] 거래량 차트
- [x] 이동평균선 (5/10/20/60/120/200일)
- [x] RSI (14일)
- [x] 볼린저 밴드 (20일, 2σ)
- [x] 일목균형표 (전환선/기준선/구름대)
- [x] 지표 토글 + 설정 패널

### M3: Drawing Tools (80%)

- [x] 수평선 / 수직선
- [x] 추세선 / 레이
- [x] 피보나치 되돌림
- [x] 텍스트 메모
- [x] 선택/편집 모드
- [x] 키보드 단축키 (V/H/T/F/R, Delete, Esc)
- [x] 색상 선택 UI
- [ ] 사각형 / 삼각형 / 채널 (M3.5)

### M4~M5 (예정)

- 관심종목 & 알림
- 해외 주식 강화

## 시작하기

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

## 테스트

```bash
pnpm test        # Watch 모드
pnpm test:run    # 단일 실행
```

### 테스트 커버리지

| 카테고리 | 테스트 수 | 범위 |
|----------|-----------|------|
| Stores | 55 | indicator, chart, drawing, watchlist, layout, search-modal |
| Indicators | 14 | SMA, RSI, Bollinger Bands, Ichimoku |
| Utils | 4 | timeframe validation |
| **Total** | **73** | |

### CI/CD

GitHub Actions로 PR/push마다 자동 검증:
- ✅ 테스트 (Vitest)
- ✅ 타입체크 (tsc --noEmit)
- ✅ 린트 (ESLint)
- ✅ 빌드 (Next.js)

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router
├── components/ui/        # shadcn/ui
├── features/
│   ├── chart/           # 캔들스틱 차트
│   ├── drawing/         # 작도 도구
│   ├── indicators/      # 기술적 지표
│   └── search/          # 종목 검색
├── store/               # Zustand 스토어
└── lib/                 # 유틸리티
```

---

_Last updated: 2026-03-05_
