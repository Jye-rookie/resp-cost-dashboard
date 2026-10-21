// 작은 DOM/포맷 도우미. 텍스트는 항상 textContent 로 넣는다(라벨은 신뢰하지 않는 데이터).
export const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") e.className = v;
    else if (k === "style") e.style.cssText = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    e.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return e;
};
const nf = new Intl.NumberFormat("ko-KR");
export const fmtInt = (x) => nf.format(Math.round(x));
export const fmtWon = (x) => (x == null || !isFinite(x) ? "–" : fmtInt(x) + "원");
export const fmtPct = (x, d = 1) => (x == null || !isFinite(x) ? "–" : (x * 100).toFixed(d) + "%");
export const div = (a, b) => (b ? a / b : null);
export function sumBy(rows, keyFn, fields) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    let o = m.get(k);
    if (!o) { o = { key: k }; for (const f of fields) o[f] = 0; m.set(k, o); }
    for (const f of fields) o[f] += r[f];
  }
  return m;
}
