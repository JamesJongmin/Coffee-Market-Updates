# Coffee Market Updates

Weekly and monthly coffee market updates for business intelligence

## 🚀 최적화 내역

### 성능 개선
- 이미지 최적화: JPG → WebP 변환으로 90% 이상 용량 절감
  - coffee-abstract-dark: 600KB → 54KB
  - coffee-beans-pattern: 306KB → 41KB
- HTML 최적화: Critical CSS inline, 비동기 리소스 로딩
- Service Worker를 통한 캐싱 전략 구현

### 프로젝트 구조
```
├── index.html           # 메인 페이지 (최적화됨)
├── app.js              # 메인 애플리케이션 로직
├── styles.css          # 스타일시트
├── sw.js               # Service Worker
├── reports.json        # 리포트 메타데이터 (자동 생성)
├── *.xlsx/xls          # 시장 데이터 파일
├── *-optimized.webp    # 최적화된 이미지
└── Reports/            # 주간/월간 리포트
```

### 주요 기능
- 📊 실시간 커피 시장 데이터 시각화
- 📈 선물 가격, 환율, CFTC 포지션 분석
- 🌍 NVDI (식생 지수) 모니터링
- 📱 반응형 디자인 및 PWA 지원

### 빌드 및 배포
- GitHub Actions를 통한 자동 reports.json 업데이트
- GitHub Pages로 호스팅

### 개발 환경 설정
```bash
# 이미지 최적화 (필요시)
./optimize-images.sh

# 로컬 서버 실행
python -m http.server 8000
# 또는
npx serve
```

### 기여 방법
1. 새로운 리포트는 `Reports/YYYY/MM/` 디렉토리에 추가
2. 데이터 파일 업데이트 시 해당 Excel 파일 교체
3. PR 생성 후 자동 빌드 확인
