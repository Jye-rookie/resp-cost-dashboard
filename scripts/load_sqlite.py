"""data/raw/*.sql (MySQL 덤프, 파일명 순서) -> data/db/<database>.sqlite

문장이 `db.table` 형태로 데이터베이스를 지정하면 db 마다 SQLite 파일을 하나 만든다.
접두어가 없으면 main.sqlite. MySQL 없이 돌리기 위해 CREATE TABLE 을 SQLite 문법으로 바꾸고
INSERT 는 그대로 실행한다. 실행할 때마다 DB 파일을 새로 만들어 결과가 같다.
"""
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW, DB = ROOT / "data" / "raw", ROOT / "data" / "db"
SKIP = re.compile(r"^\s*(SET|TRUNCATE|DROP|CREATE DATABASE|CREATE SCHEMA|USE|SELECT|COMMIT|START)\b", re.I)
TARGET = re.compile(r"(?:CREATE TABLE(?: IF NOT EXISTS)?|INSERT INTO|INSERT IGNORE INTO)\s+`?(\w+)`?\.`?(\w+)`?", re.I)


def convert_create(stmt: str) -> str:
    stmt = re.sub(r"\s+COMMENT\s+'[^']*'", "", stmt)               # 컬럼 주석
    stmt = re.sub(r"\)\s*(ENGINE=[^;]*?)?\s*COMMENT='[^']*'\s*;?\s*$", ");", stmt)  # 테이블 주석
    stmt = re.sub(r"\)\s*ENGINE=[^;]*;?\s*$", ");", stmt)
    stmt = re.sub(r",\s*(UNIQUE\s+)?KEY\s+`?\w+`?\s*\([^)]*\)", "", stmt)  # 인라인 KEY
    stmt = re.sub(r"\bUNSIGNED\b|\bAUTO_INCREMENT\b", "", stmt, flags=re.I)
    stmt = re.sub(r"\bCHAR\((\d+)\)", "TEXT", stmt)
    return stmt.replace("`", "")


def statements(path: Path):
    buf = []
    with path.open(encoding="utf8") as f:
        for line in f:
            if not buf and (not line.strip() or line.lstrip().startswith("--")):
                continue
            buf.append(line)
            joined = "".join(buf)
            if sqlite3.complete_statement(joined):
                yield joined
                buf = []


def main():
    files = sorted(RAW.glob("*.sql"))
    if not files:
        sys.exit("data/raw/ 에 .sql 파일이 없다 -> make raw")
    DB.mkdir(parents=True, exist_ok=True)
    for old in DB.glob("*.sqlite"):
        old.unlink()
    conns = {}
    for fp in files:
        n = 0
        for stmt in statements(fp):
            if SKIP.match(stmt):
                continue
            m = TARGET.search(stmt)
            db = m.group(1) if m else "main"
            if m:
                stmt = stmt.replace(m.group(0), m.group(0).replace(f"{m.group(1)}.", "", 1).replace(f"`{m.group(1)}`.", "", 1), 1)
            if db not in conns:
                conns[db] = sqlite3.connect(DB / f"{db}.sqlite")
            if stmt.lstrip().upper().startswith("CREATE TABLE"):
                stmt = convert_create(stmt)
            conns[db].execute(stmt)
            n += 1
        for c in conns.values():
            c.commit()
        print(f"{fp.name}: {n} statements")
    for name, c in conns.items():
        tabs = [r[0] for r in c.execute("select name from sqlite_master where type='table' order by 1")]
        print(name, {t: c.execute(f'select count(*) from "{t}"').fetchone()[0] for t in tabs})
        c.close()


if __name__ == "__main__":
    main()
