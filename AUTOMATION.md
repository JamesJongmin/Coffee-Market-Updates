# 주간 리포트 자동화 가이드

## 개요

매주 토요일 자동으로 주간 리포트 템플릿이 생성되는 시스템입니다.

## 자동화 프로세스

### 1. 자동 실행

- **스케줄**: 매주 토요일 03:00 UTC (한국시간 낮 12시)
- **트리거**: GitHub Actions 워크플로우 (`create-weekly-report.yml`)
- **동작**: 
  1. 다음 토요일 날짜의 리포트 템플릿 생성
  2. RSS 피드에서 최근 1주일 커피 뉴스 자동 수집 (47개)
  3. 상위 6개 뉴스를 리포트에 자동 삽입

### 2. 수동 실행

로컬에서 직접 실행할 수도 있습니다:

```bash
node create-weekly-report.js
```

## 생성되는 파일 구조

```
Reports/
  └── YYYY/
      └── MM/
          └── YYYY-MM-DD.html  (토요일 날짜)
```

예시: `Reports/2025/11/2025-11-01.html`

## 리포트 템플릿 구조

자동 생성되는 리포트에는 다음이 포함됩니다:

1. **REPORT_META 블록**: 기본 메타데이터 자동 생성
   - 제목: "커피 선물 시장 주간 동향"
   - 날짜: 자동 계산된 다음 토요일
   - 기본 태그: 아라비카, 로부스타, 시장분석, 주간동향
   - 기본 summary: 날짜 기반 자동 생성

2. **HTML 구조**:
   - 헤더 (제목, 부제목, 날짜)
   - 가격 박스 (업데이트 필요 플레이스홀더)
   - 주요 지표 박스
   - 주요 헤드라인 섹션
   - **주간 주요 뉴스 섹션 (RSS 자동 수집)** ✨ NEW
   - 시장 분석 섹션
   - 상세 분석 섹션
   - 전망 및 시사점 섹션

## RSS 뉴스 자동 수집

### 데이터 소스
- Google News - Coffee Futures
- Google News - Coffee Brazil
- (Reuters는 401 에러로 제외됨)

### 필터링
- 최근 7일 이내 뉴스만
- 커피 관련 키워드 필터 (coffee, arabica, robusta, brazil, vietnam 등)
- 중복 제거
- 최신순 및 중요도순 정렬

### 자동 포맷팅
- 날짜: YYYY.MM.DD 형식
- 제목: 100자 제한
- 내용: 200자 제한
- 출처 링크 포함

## 리포트 작성 프로세스

### 자동 생성 후

1. **파일 확인**: 생성된 HTML 파일 열기
2. **자동 수집된 뉴스 확인**: ✨ NEW
   - RSS에서 자동 수집된 6개 뉴스 항목 확인
   - 필요시 편집 또는 추가 뉴스 삽입
3. **메타데이터 업데이트**: 
   - REPORT_META 블록의 `summary` 업데이트
   - `tags` 배열에 관련 태그 추가
4. **내용 작성**:
   - 가격 데이터 입력
   - 주요 헤드라인 작성
   - (뉴스는 이미 자동 수집됨) ✅
   - 시장 분석 내용 작성
5. **커밋 및 푸시**: 변경사항 커밋 후 푸시

## 스크립트 기능

### `create-weekly-report.js`

주요 함수:
- `getNextSaturday(date)`: 다음 토요일 날짜 계산
- `formatDate(date)`: YYYY-MM-DD 형식으로 포맷팅
- `formatKoreanDate(date)`: 한국어 날짜 포맷팅
- `generateReportTemplate(date)`: 리포트 HTML 템플릿 생성

## GitHub Actions 워크플로우

### `create-weekly-report.yml`

- **트리거**: 매주 토요일 자정 (UTC), 또는 수동 실행
- **동작**:
  1. 저장소 체크아웃
  2. Node.js 설정
  3. 주간 리포트 템플릿 생성
  4. 자동 커밋 및 푸시

### 보안 및 권한

- `contents: write` 권한 필요
- `GITHUB_TOKEN` 사용 (자동 제공)

## 문제 해결

### 파일이 이미 존재하는 경우

스크립트는 기존 파일을 덮어쓰지 않습니다. 다음 토요일 리포트가 이미 있다면:
- 기존 파일을 수정하여 사용하거나
- 날짜를 변경하여 실행할 수 있습니다

### 수동 실행 방법

```bash
# 다음 토요일 리포트 생성
node create-weekly-report.js

# 특정 날짜 계산 테스트 (Node.js REPL에서)
node -e "const { getNextSaturday, formatDate } = require('./create-weekly-report.js'); console.log(formatDate(getNextSaturday(new Date('2025-10-20'))));"
```

### 워크플로우 실행 확인

GitHub Actions 탭에서 다음을 확인할 수 있습니다:
- 최근 실행 내역
- 실행 로그
- 커밋 기록

## 커스터마이징

### 리포트 템플릿 수정

`create-weekly-report.js`의 `generateReportTemplate()` 함수를 수정하여:
- 기본 태그 변경
- HTML 구조 변경
- 추가 섹션 추가

### 스케줄 변경

`.github/workflows/create-weekly-report.yml`의 `cron` 설정을 변경:

```yaml
schedule:
  - cron: '0 0 * * 6'  # 매주 토요일
  # 분 시 일 월 요일
  # 0 9 * * 1 = 매주 월요일 오전 9시 (UTC)
```

## 참고사항

- 리포트는 템플릿만 생성되며, 실제 내용은 수동으로 작성해야 합니다
- 생성된 리포트는 자동으로 `reports.json`에 추가되지 않습니다
- `update-reports.yml` 워크플로우가 리포트 업데이트를 감지하여 `reports.json`을 자동 업데이트합니다
