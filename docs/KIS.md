# KIS (한국투자증권) OpenAPI 연동

> MCHART-005

## 환경변수

`.env.local`에 아래 값 설정 (키가 없으면 자동으로 mock 데이터로 동작).

```bash
# 필수
KIS_APP_KEY=...
KIS_APP_SECRET=...

# 옵션
# real | virtual (기본: virtual)
KIS_MODE=virtual

# true면 강제로 mock 모드
KIS_MOCK=false

# 베이스 URL 직접 지정 (필요 시)
# KIS_BASE_URL=https://openapi.koreainvestment.com:9443
```

## 내부 API (Next Route Handlers)

- `GET /api/kis/search?q=삼성`
  - 국내 종목마스터(.mst.zip)를 다운로드/파싱해서 검색합니다.
  - 결과는 `.cache/kis-domestic-master.json`에 캐시(TTL 7일)됩니다.
  - 네트워크/파싱 실패 시 small mock 목록으로 fallback

- `GET /api/kis/candles?code=005930&timeframe=1D&count=240`
  - mock 모드: 랜덤 샘플 캔들
  - 실 API 모드:
    - 일/주/월봉: `inquire-daily-itemchartprice` (tr_id: `FHKST03010100`)
    - 분봉(당일 1분): `inquire-time-itemchartprice` (tr_id: `FHKST03010200`) + 서버에서 5/15/60분 집계

- `GET /api/kis/quote?code=005930`
  - mock 모드: 랜덤 현재가
  - 실 API 모드: `inquire-price` (tr_id: `FHKST01010100`)

## 토큰 관리

- 서버에서 OAuth 토큰을 발급/캐시합니다.
- 기본은 메모리 캐시 + 로컬 개발 편의를 위해 `.cache/kis-token.json`에 저장(배포 환경에선 실패해도 무시).
