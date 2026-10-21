import { h, fmtInt } from "./util.js";

/* ---- tooltip (하나만 쓴다) ---- */
let tipEl;
function tipNode() {
  if (!tipEl) { tipEl = h("div", { class: "tt", role: "tooltip" }); document.body.append(tipEl); }
  return tipEl;
}
function fill(t, spec) {
  t.replaceChildren(h("div", { class: "tt-title" }, spec.title));
  for (const r of spec.rows) {
    const key = r.color ? h("span", { class: "key", style: `background:${r.color}` }) : null;
    t.append(h("div", { class: "tt-row" }, h("span", {}, key, r[0]), h("b", {}, r[1])));
  }
}
export function showTip(spec, x, y) {
  const t = tipNode();
  fill(t, spec);
  t.style.display = "block";
  const w = t.offsetWidth, hh = t.offsetHeight;
  t.style.left = Math.min(x + 14, innerWidth - w - 8) + "px";
  t.style.top = Math.min(y + 14, innerHeight - hh - 8) + "px";
}
export const hideTip = () => { if (tipEl) tipEl.style.display = "none"; };
export function tip(el, specFn) {
  el.addEventListener("pointermove", (e) => showTip(specFn(), e.clientX, e.clientY));
  el.addEventListener("pointerleave", hideTip);
  el.addEventListener("focus", () => { const b = el.getBoundingClientRect(); showTip(specFn(), b.left + b.width / 2, b.top); });
  el.addEventListener("blur", hideTip);
}

/* ---- 가로 막대 (HTML) : 기준선(왼쪽)에 붙고 끝만 둥글다 ---- */
export function bars(items, { max, fmt = fmtInt } = {}) {
  const mx = max ?? Math.max(...items.map((i) => i.value || 0), 1e-9);
  const root = h("div", { class: "bars" });
  for (const it of items) {
    const val = it.text ?? (it.value == null ? "–" : fmt(it.value));
    const row = h("div", { class: "bar-row", tabindex: 0 },
      h("div", { class: "bar-label", title: it.label }, it.label),
      h("div", { class: "bar-track" }, h("div", { class: "bar-fill" + (it.cls ? " " + it.cls : ""), style: `width:${((it.value || 0) / mx) * 100}%` })),
      h("div", { class: "bar-val" }, val),
      it.sub ? h("div", { class: "bar-sub" }, it.sub) : null);
    tip(row, () => ({ title: it.label, rows: [[it.tipLabel || "값", val], ...(it.extra || [])] }));
    root.append(row);
  }
  return root;
}

/* ---- 선 차트 (SVG) : 단일 축, 크로스헤어 + 툴팁 ---- */
const NS = "http://www.w3.org/2000/svg";
const s = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const m = [1, 2, 2.5, 5, 10].find((k) => k * p >= v); return m * p; }

export function line({ labels, series, fmt = fmtInt, unit = "" }) {
  const W = 640, H = 240, L = 46, R = 12, T = 12, B = 28;
  const maxV = niceMax(Math.max(...series.flatMap((x) => x.values.filter((v) => v != null)), 1));
  const xAt = (i) => L + (labels.length < 2 ? 0 : (i / (labels.length - 1)) * (W - L - R));
  const yAt = (v) => T + (1 - v / maxV) * (H - T - B);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });
  for (let k = 0; k <= 4; k++) {
    const v = (maxV * k) / 4, y = yAt(v);
    svg.append(s("line", { x1: L, x2: W - R, y1: y, y2: y, class: "grid-l" }));
    const t = s("text", { x: L - 6, y: y + 4, "text-anchor": "end", class: "tick" }); t.textContent = fmt(v); svg.append(t);
  }
  const step = Math.ceil(labels.length / 8);
  labels.forEach((lb, i) => {
    if (i % step) return;
    const t = s("text", { x: xAt(i), y: H - 8, "text-anchor": "middle", class: "tick" }); t.textContent = lb; svg.append(t);
  });
  for (const se of series) {
    let d = "";
    se.values.forEach((v, i) => { if (v != null) d += (d ? "L" : "M") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1); });
    svg.append(s("path", { d, class: "path", style: `stroke:${se.color}` }));
  }
  const xh = s("line", { y1: T, y2: H - B, class: "xh", style: "display:none" }); svg.append(xh);
  const dots = series.map((se) => { const c = s("circle", { r: 4, style: `fill:${se.color};stroke:var(--surface);stroke-width:2;display:none` }); svg.append(c); return c; });
  const hit = s("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent", tabindex: 0 }); svg.append(hit);
  const at = (i) => {
    xh.setAttribute("x1", xAt(i)); xh.setAttribute("x2", xAt(i)); xh.style.display = "";
    dots.forEach((c, k) => { const v = series[k].values[i]; c.style.display = v == null ? "none" : ""; if (v != null) { c.setAttribute("cx", xAt(i)); c.setAttribute("cy", yAt(v)); } });
    return { title: labels[i], rows: series.map((se) => [se.name, se.values[i] == null ? "–" : fmt(se.values[i]) + unit]).map((r, k) => Object.assign(r, { color: series[k].color })) };
  };
  const idxOf = (e) => { const b = svg.getBoundingClientRect(); const x = ((e.clientX - b.left) / b.width) * W; return Math.max(0, Math.min(labels.length - 1, Math.round(((x - L) / (W - L - R)) * (labels.length - 1)))); };
  hit.addEventListener("pointermove", (e) => showTip(at(idxOf(e)), e.clientX, e.clientY));
  hit.addEventListener("pointerleave", () => { hideTip(); xh.style.display = "none"; dots.forEach((c) => (c.style.display = "none")); });
  const wrap = h("div", { class: "line" }); wrap.append(svg);
  return wrap;
}

/* ---- 표 ---- */
export function table(head, rows, { onRow, selected } = {}) {
  const tb = h("tbody");
  rows.forEach((r, i) => {
    const tr = h("tr", { class: (onRow ? "click " : "") + (selected === i ? "sel" : "") }, r.map((c) => h("td", {}, c?.nodeType ? c : c ?? "–")));
    if (onRow) tr.addEventListener("click", () => onRow(i));
    tb.append(tr);
  });
  return h("div", { class: "tbl-wrap" }, h("table", {}, h("thead", {}, h("tr", {}, head.map((x) => h("th", {}, x)))), tb));
}

/* ---- 카드: 모든 차트는 '표로 보기' 로 같은 수치를 볼 수 있다 ---- */
export function card(title, note, build, { wide = false } = {}) {
  const { node, tbl } = build();
  const body = h("div", {}, node);
  let showTbl = false;
  const btn = tbl ? h("button", { class: "tbl-toggle", type: "button", "aria-pressed": "false" }, "표로 보기") : null;
  btn?.addEventListener("click", () => {
    showTbl = !showTbl; btn.setAttribute("aria-pressed", showTbl); btn.textContent = showTbl ? "차트로 보기" : "표로 보기";
    body.replaceChildren(showTbl ? table(tbl.head, tbl.rows) : node);
  });
  return h("section", { class: "card" + (wide ? " wide" : "") },
    h("div", { class: "card-head" }, h("div", {}, h("h2", {}, title), note ? h("p", { class: "note" }, note) : null), btn), body);
}
