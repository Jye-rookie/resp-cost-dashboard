# 반복 가능한 파이프라인: raw SQL -> SQLite -> 집계 JSON -> 정적 웹
PY ?= python3
RAW_SRC ?= $(HOME)/Desktop/나노디그리/SQL/[실습]청구서류

.PHONY: all raw db data serve clean artifact
all: db data

raw:            ## 원본 SQL 5개를 data/raw/ 로 복사
	@mkdir -p data/raw && cp "$(RAW_SRC)"/0*.sql data/raw/ && ls data/raw

db:             ## data/raw/*.sql -> data/db/*.sqlite
	$(PY) scripts/load_sqlite.py

data:           ## sql/queries/**/*.sql 실행 -> data/processed/*.json -> web/data/
	$(PY) scripts/build_data.py

serve:          ## http://localhost:8000
	cd web && $(PY) -m http.server 8000

clean:
	rm -rf data/db/* data/processed/* web/data/*

artifact:       ## dist/index.html (단일 파일, 아티팩트 업로드용)
	$(PY) scripts/build_artifact.py
