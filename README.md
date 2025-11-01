# Coffee-Market-Updates

Weekly and monthly coffee market updates for business intelligence

## 프로젝트 개요

커피 선물 시장의 주간 동향과 심층 분석을 제공하는 웹사이트입니다.

### 주요 기능

- 📊 **주간 시장 동향**: 아라비카와 로부스타 선물 가격 분석
- 📈 **심층 분석 리포트**: 특별 이슈와 시장 전망
- 📉 **실시간 차트**: 커피 선물, 환율, CFTC 포지션 등
- 🌍 **글로벌 시장 데이터**: 브라질, 베트남 등 주요 생산국 정보

### 리포트 작성

새로운 리포트를 작성할 때는 [리포트 작성 가이드라인](REPORT_TEMPLATE_GUIDE.md)을 참고하세요.

### 자동화 (95% 완전 자동화 달성! 🎉)

- 📅 **주간 리포트 완전 자동 생성**: 매주 토요일 낮 12시 자동 실행
  - [자동화 가이드](AUTOMATION.md) | [완전 자동화 완료](FULL_AUTOMATION_COMPLETE.md)
  - 🤖 **뉴스**: RSS 피드에서 47개 수집 → 6개 자동 선택
  - 💰 **가격**: Yahoo Finance API 실시간 데이터
  - 📊 **재고**: ICE 재고 트렌드 기반 추정
  - ✍️ **헤드라인**: AI 키워드 분석으로 자동 생성
  - 📝 **시장 분석**: 단기/중기 전망 자동 생성
  - `create-weekly-report.js` 스크립트로 수동 실행 가능
- 🔄 **리포트 메타데이터 자동 업데이트**: 새 리포트 추가 시 자동으로 `reports.json` 업데이트
- 📝 **메타데이터 추출 및 인덱싱 자동화**

### 웹사이트

https://jamesjongmin.github.io/Coffee-Market-Updates/
