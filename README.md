# 건강보험 청구 · 폐암 대시보드

원본 SQL(MySQL 덤프) → SQLite → 집계 JSON → 정적 웹 페이지. 명령 3개로 처음부터 재현된다.

```bash
make raw    # 원본 SQL 5개를 data/raw/ 로 복사 (경로는 Makefile 의 RAW_SRC)
make db     # data/db/kr_claims.sqlite, kr_lung_cancer.sqlite 생성 (MySQL 불필요)
make data   # sql/queries/**/*.sql 실행 -> web/data/**.json
make serve  # http://localhost:8000
```

## 구조

```
data/raw/        원본 SQL (gitignore)
data/db/         생성된 SQLite (gitignore)
data/processed/  집계 JSON (web/data/ 의 원본)
sql/queries/     지표 하나 = .sql 하나. claims/ lung/ 로 DB 구분
scripts/         load_sqlite.py, build_data.py
web/             정적 사이트 (index.html, css/, js/, data/)
docs/            data-dictionary.md, interview.md
```

## 새 지표 추가 절차
1. `sql/queries/<claims|lung>/<name>.sql` 작성 (열 이름 = JSON 키, `_` 로 시작하면 샘플)
2. `make data`
3. `web/js` 에서 `loadData("claims", "<name>")` 로 읽어 차트 렌더링

## 현재 구성: 호흡기 진료비 격차 모니터
탭: 개요 / 진료비 격차 / 상병 분석 / 처방·항생제 / 입원 요약. 필터: 기간, 비교 기준(상병 고정↔전체), 상병, 금액 지표.
갱신: `data/raw/` 의 SQL 을 교체한 뒤 `make clean && make raw db data`. 화면은 `make serve`.
