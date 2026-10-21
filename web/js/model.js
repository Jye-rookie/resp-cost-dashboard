import { sumBy, div } from "./util.js";

// 종별 표시 순서: 작은 기관 -> 큰 기관
export const CL_ORDER = ["31", "21", "11", "01"];
export const INC_ORDER = ["1", "2", "3", "4", "5", "M"];
export const INC_LABEL = { 1: "보험료 1분위", 2: "2분위", 3: "3분위", 4: "4분위", 5: "5분위", M: "의료급여" };

export const inRange = (r, st) => r.ym >= st.from && r.ym <= st.to;
export const scopeSick = (st) => (st.mode === "fixed" ? st.sick : null);

export function slice(data, st, { fom = "031", sick = null } = {}) {
  const f = (r) => inRange(r, st) && (!fom || r.fom === fom) && (!sick || r.sick === sick);
  return { cube: data.cube.filter(f), rx: data.rx.filter(f) };
}
export const totals = (rows) => rows.reduce((a, r) => ({ n: a.n + r.n, tot: a.tot + r.tot, ins: a.ins + r.ins, days: a.days + r.days }), { n: 0, tot: 0, ins: 0, days: 0 });

export const perClaim = (o, metric) => (o ? div(o[metric], o.n) : null);

export function abxLines(rx, data) {
  let s = 0;
  for (const r of rx) if (data.drug.get(r.gnl)?.is_abx) s += r.lines;
  return s;
}
export const abxRate = (cube, rx, data) => div(abxLines(rx, data), cube.reduce((a, r) => a + r.n, 0));

export { sumBy };
