# 프로젝트 규칙
- 파이프라인: raw SQL -> `make db` -> `make data` -> `web/`. 수동 편집 금지: data/db, data/processed, web/data (모두 생성물).
- 지표 = `sql/queries/<db>/<name>.sql` 1개 = JSON 1개. SQLite 문법으로 쓴다 (MySQL 전용 함수 금지).
- 웹은 빌드 도구 없는 정적 HTML/ES module. 데이터는 `web/js/data.js` 의 `loadData` 로만 읽는다.
- 데이터는 가상/합성이다. 화면에 "가상 데이터" 고지를 둔다.
- 폐암 `ovrl_srvl_dtrn_dcnt` 는 음수 -> 날짜로 재계산하거나 abs. 청구 DB와 폐암 DB는 키가 연결되지 않는다.
