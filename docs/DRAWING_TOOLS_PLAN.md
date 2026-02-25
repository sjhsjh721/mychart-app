# 차트 작도 도구 구현 플랜

**Option B: 완전 구현**
**예상 기간:** 1~2주
**담당:** 박개발

---

## 📅 스프린트 계획

### Week 1: 인프라 + 기본 도구

#### Day 1-2: 인프라 구축
- [x] **DRAW-001** 작도 상태 관리 (Zustand store) ✅
  - 현재 선택된 도구
  - 그려진 도형 목록
  - 편집 모드 상태
- [x] **DRAW-002** 작도 툴바 UI ✅
  - 도구 선택 버튼
  - 모바일 반응형
- [x] **DRAW-003** 작도 데이터 로컬 저장 ✅
  - localStorage 활용
  - 종목별 저장

#### Day 3-4: 수평선 + 추세선
- [x] **DRAW-004** 수평선 (HorizontalLine) ✅
  - 차트 클릭으로 추가
  - 드래그로 위치 조정
  - 가격 레이블 표시
- [x] **DRAW-005** 추세선 (TrendLine) ✅
  - 시작점-끝점 클릭
  - 각도 자유 조절
  - 연장선 옵션

#### Day 5: 수직선 + 레이
- [x] **DRAW-006** 수직선 (VerticalLine) ✅
  - 특정 시점 표시
  - 날짜 레이블
- [x] **DRAW-007** 레이 (Ray) ✅
  - 한 방향 무한 연장

---

### Week 2: 고급 도구 + UX

#### Day 6-7: 피보나치 + 채널
- [x] **DRAW-008** 피보나치 되돌림 (FibRetracement) ✅
  - 0%, 23.6%, 38.2%, 50%, 61.8%, 100% 레벨
  - 레벨별 색상
  - 가격 표시
- [x] **DRAW-009** 평행 채널 (ParallelChannel) ✅
  - 상단선, 하단선, 중심선
  - LineSeries 조합으로 구현 (custom primitives 대신)
  - 커밋: `f1e924d`

#### Day 8-9: 도형 도구
- [x] **DRAW-010** 사각형 (Rectangle) ✅
  - 박스권 표시
  - LineSeries 조합으로 구현
  - 커밋: `14afbc6`
- [x] **DRAW-011** 삼각형 (Triangle) ✅
  - 3점 지정
  - LineSeries 조합으로 구현
  - 커밋: `185da8f`
- [x] **DRAW-012** 텍스트 (Text) ✅
  - 차트에 메모 추가

#### Day 10: UX 완성
- [x] **DRAW-013** 선택/편집 모드 ✅
  - 클릭으로 도형 선택
  - 핸들로 크기/위치 조절
- [x] **DRAW-014** 삭제 기능 ✅
  - 선택 후 Delete 키
  - 키보드 단축키 (V/H/T/F/R)
- [x] **DRAW-015** 도형 스타일 설정 ✅
  - 선 색상 (7가지 프리셋)
  - Popover UI

---

## 🏗️ 기술 구현

### 아키텍처

```
src/features/drawing/
├── components/
│   ├── drawing-toolbar.tsx      # 도구 선택 UI
│   ├── drawing-layer.tsx        # 캔버스 오버레이
│   └── primitives/
│       ├── horizontal-line.ts   # 수평선 프리미티브
│       ├── trend-line.ts        # 추세선 프리미티브
│       ├── fib-retracement.ts   # 피보나치
│       └── ...
├── hooks/
│   └── use-drawing.ts           # 그리기 로직
├── store/
│   └── drawing-store.ts         # 상태 관리
├── types.ts                     # 타입 정의
└── utils/
    ├── geometry.ts              # 좌표 계산
    └── storage.ts               # 로컬 저장
```

### Lightweight Charts Primitives API

```typescript
// 예시: 수평선 프리미티브
class HorizontalLinePrimitive implements ISeriesPrimitive {
  private _price: number;
  private _options: HorizontalLineOptions;

  constructor(price: number, options: HorizontalLineOptions) {
    this._price = price;
    this._options = options;
  }

  updateAllViews(): void {
    // 뷰 업데이트
  }

  paneViews(): readonly ISeriesPrimitivePaneView[] {
    return [new HorizontalLinePaneView(this._price, this._options)];
  }
}
```

### 상태 관리 (Zustand)

```typescript
interface DrawingState {
  activeTool: DrawingTool | null;
  drawings: Drawing[];
  selectedId: string | null;
  
  setActiveTool: (tool: DrawingTool | null) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  selectDrawing: (id: string | null) => void;
}
```

### 로컬 저장

```typescript
// 종목별로 작도 데이터 저장
const STORAGE_KEY = 'mychart-drawings';

function saveDrawings(code: string, drawings: Drawing[]) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  all[code] = drawings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function loadDrawings(code: string): Drawing[] {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return all[code] || [];
}
```

---

## 🎨 UI/UX 설계

### 작도 툴바 (모바일)

```
┌─────────────────────────────────┐
│ ─  │  /  │  ⟂  │  ◇  │ □  │ T │
│수평 추세 수직 피보 사각 텍스트│
└─────────────────────────────────┘
```

### 작도 툴바 (데스크톱)

사이드바 또는 상단에 아이콘 + 텍스트

### 인터랙션

1. **도구 선택** → 툴바에서 클릭
2. **그리기** → 차트에서 클릭/드래그
3. **편집** → 도형 클릭 → 핸들 드래그
4. **삭제** → 선택 후 Delete 또는 우클릭

---

## ✅ 완료 조건

- [ ] 모든 기본 도구 작동 (수평선, 추세선, 수직선, 레이)
- [ ] 고급 도구 작동 (피보나치, 채널, 사각형)
- [ ] 모바일에서 터치로 그리기 가능
- [ ] 로컬 저장 작동 (새로고침해도 유지)
- [ ] 선택/편집/삭제 UX 완성

---

## 📝 참고 자료

- [Lightweight Charts Plugins](https://tradingview.github.io/lightweight-charts/docs/plugins/intro)
- [Series Primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
- [Plugin Examples](https://tradingview.github.io/lightweight-charts/plugin-examples)
- [lightweight-charts-line-tools](https://github.com/difurious/lightweight-charts-line-tools)

---

**생성일:** 2026-02-12
**작성자:** 김PM
