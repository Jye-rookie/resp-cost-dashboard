"""web/ (모듈 + 외부 JSON) -> dist/index.html 한 파일.

claude.ai 아티팩트처럼 단일 HTML 로 올려야 할 때 쓴다. CSS, JS, 데이터를 모두 인라인한다.
모듈은 import/export 를 제거하고 합친다. tabs/* 는 이름 충돌을 피하려고 IIFE 로 감싼다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB, DIST = ROOT / "web", ROOT / "dist"
TABS = ["overview", "gap", "sick", "rx", "inpatient"]
TITLE = "호흡기 진료비 격차 모니터"


def strip(src: str) -> str:
    src = re.sub(r"^import .*?;\s*$", "", src, flags=re.M)
    src = re.sub(r"^export \{[^}]*\};\s*$", "", src, flags=re.M)
    return re.sub(r"^export (const|let|function|async function)", r"\1", src, flags=re.M)


def main():
    data = {}
    for f in sorted((WEB / "data").rglob("*.json")):
        data[f"{f.parent.name}/{f.stem}"] = json.loads(f.read_text(encoding="utf8"))
    js = ["const DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";",
          "const loadData = async (g, n) => DATA[g + '/' + n];"]
    for m in ["util", "model", "charts"]:
        js.append(strip((WEB / "js" / f"{m}.js").read_text(encoding="utf8")))
    for t in TABS:
        body = strip((WEB / "js/tabs" / f"{t}.js").read_text(encoding="utf8"))
        js.append(f"const {t} = (() => {{\n{body}\nreturn {{ controls, render }};\n}})();")
    js.append(strip((WEB / "js/main.js").read_text(encoding="utf8")))
    css = (WEB / "css/style.css").read_text(encoding="utf8")
    css = css.replace(".wrap { max-width:1280px; margin:0 auto; padding:16px; }",
                      ".wrap { max-width:1280px; margin:0 auto; padding-block:16px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }")
    css = css.replace("body { margin:0;", "body { margin:0; font-size:16px;")
    page = (WEB / "index.html").read_text(encoding="utf8")
    body_html = re.search(r"<body>(.*)</body>", page, re.S).group(1)
    body_html = re.sub(r'\s*<script type="module" src="js/main.js"></script>', "", body_html)
    out = (f'<title>{TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
           f"<style>\n{css}\n</style>\n{body_html}\n<script type=\"module\">\n" + "\n".join(js) + "\n</script>\n")
    DIST.mkdir(exist_ok=True)
    (DIST / "index.html").write_text(out, encoding="utf8")
    (DIST / "app.mjs").write_text("\n".join(js), encoding="utf8")  # 문법 검사용
    print(f"dist/index.html {len(out)/1024:.0f} KB")


if __name__ == "__main__":
    main()
