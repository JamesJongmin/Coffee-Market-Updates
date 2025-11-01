# 테스트 스케줄 안내

## 오늘 오후 테스트 설정 완료

### 설정 내용

GitHub Actions 워크플로우에 임시 스케줄을 추가했습니다:

```yaml
schedule:
  - cron: '0 3 * * 6'  # 매주 토요일 (정규)
  - cron: '0 3 * * *'  # 매일 (테스트용 - 임시)
```

### 테스트 실행 시간

- **한국시간**: 매일 낮 12시 (오후 12:00)
- **UTC**: 매일 03:00
- **첫 실행**: 2025년 11월 1일 금요일 낮 12시

### 테스트 방법

#### 방법 1: 자동 실행 대기 (추천)
오늘(11/1) 낮 12시에 자동으로 실행됩니다.
- GitHub Actions 탭에서 실행 로그 확인 가능
- 3-5분 후 새 리포트 확인

#### 방법 2: 지금 바로 수동 실행
GitHub 웹사이트에서:
1. 저장소 → Actions 탭 클릭
2. "Create Weekly Report" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. "Run workflow" 확인

#### 방법 3: 로컬에서 테스트
```bash
node create-weekly-report.js
```

## 예상 결과

### 생성될 리포트
- 파일: `Reports/2025/11/2025-11-08.html`
- 크기: 약 18KB
- 포함 내용:
  - ✅ 실시간 가격: 393.05¢ (+0.27%)
  - ✅ ICE 재고: 465,910백
  - ✅ 최신 뉴스: 6개
  - ✅ 자동 헤드라인: "393.05센트 보합, tariff 영향"
  - ✅ 시장 전망: 단기/중기/리스크

### 자동 커밋
- 커밋 메시지: "자동 생성: 주간 리포트 템플릿 [skip ci]"
- 자동 푸시 → reports.json 업데이트
- weekly-report.html에 자동 표시

## 테스트 확인 체크리스트

### GitHub에서 확인
- [ ] Actions 탭에서 워크플로우 실행 확인
- [ ] 새 커밋이 생성되었는지 확인
- [ ] Reports/2025/11/ 폴더에 새 파일 생성 확인

### 로컬에서 확인
```bash
# 리포트 생성 확인
ls -lh Reports/2025/11/

# reports.json 업데이트 확인
node update-reports.js
jq '.reports[0]' reports.json

# weekly-report.html 확인 (브라우저에서 열기)
```

### 내용 확인
- [ ] 가격 데이터가 실시간으로 채워져 있는가?
- [ ] 뉴스 6개가 최신 RSS로 채워져 있는가?
- [ ] 헤드라인이 자동 생성되어 있는가?
- [ ] 시장 전망이 자동 생성되어 있는가?

## 테스트 후 정리

테스트가 성공하면 임시 스케줄을 제거하세요:

```yaml
# .github/workflows/create-weekly-report.yml 수정
schedule:
  - cron: '0 3 * * 6'  # 매주 토요일만 유지
  # - cron: '0 3 * * *'  # 이 줄 삭제
```

## 문제 해결

### 워크플로우가 실행되지 않는 경우
1. GitHub Actions가 활성화되어 있는지 확인
2. 저장소 Settings → Actions → 권한 확인
3. 수동 실행: Actions → Run workflow

### 리포트가 생성되지 않는 경우
1. GitHub Actions 로그 확인
2. 에러 메시지 확인
3. 로컬에서 `node create-weekly-report.js` 실행해보기

### npm install 실패
1. package.json 파일 확인
2. 의존성: rss-parser, node-fetch

## 성공 기준

✅ 다음이 모두 확인되면 성공:
1. Reports/2025/11/2025-11-08.html 파일 생성
2. 가격: 393.05¢ (또는 최신 가격)
3. 뉴스: 6개 항목
4. 헤드라인: 자동 생성
5. 전망: 자동 생성
6. reports.json 업데이트
7. weekly-report.html에 표시

---

**오늘 낮 12시에 첫 자동 실행이 예정되어 있습니다!**
