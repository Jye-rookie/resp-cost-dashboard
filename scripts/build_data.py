"""sql/queries/<group>/<name>.sql 을 실행해 data/processed/<group>/<name>.json 으로 저장하고 web/data/ 로 복사한다.

<group> 폴더 이름은 data/db/ 의 SQLite 파일 이름과 같거나, 파일 이름의 접미어여야 한다
(예: group `lung` -> kr_lung_cancer.sqlite). 쿼리 하나 = 차트/지표 하나 = JSON 하나(행 배열).
열 이름이 곧 JSON 키다. 파일명이 `_` 로 시작하는 쿼리는 샘플이지만 똑같이 실행된다.
"""
import json
import shutil
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
Q, OUT, DB, WEB = ROOT / "sql/queries", ROOT / "data/processed", ROOT / "data/db", ROOT / "web/data"


def find_db(group: str) -> Path:
    dbs = list(DB.glob("*.sqlite"))
    hit = [p for p in dbs if p.stem == group] or [p for p in dbs if group in p.stem]
    if group == "example" and dbs:
        return sorted(dbs)[0]  # 샘플 그룹은 아무 DB 로나 확인
    if len(hit) != 1:
        sys.exit(f"그룹 '{group}' 에 맞는 SQLite 를 못 찾음 (후보: {[p.name for p in dbs]})")
    return hit[0]


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    shutil.rmtree(WEB, ignore_errors=True)
    total = 0
    for group in sorted(p for p in Q.iterdir() if p.is_dir()):
        con = sqlite3.connect(find_db(group.name))
        con.row_factory = sqlite3.Row
        for sql in sorted(group.glob("*.sql")):
            rows = [dict(r) for r in con.execute(sql.read_text(encoding="utf8"))]
            dest = OUT / group.name / f"{sql.stem}.json"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
            total += 1
            print(f"{group.name}/{sql.stem}: {len(rows)} rows")
    if OUT.exists():
        shutil.copytree(OUT, WEB)
    print(f"{total} datasets -> web/data/")


if __name__ == "__main__":
    main()
