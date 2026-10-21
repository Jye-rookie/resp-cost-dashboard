import { h, fmtInt, fmtWon, div, sumBy } from "../util.js";
import { card, bars, table } from "../charts.js";
import { slice, totals, CL_ORDER } from "../model.js";

export const controls = [];

export function render({ state, data }) {
  const { cube } = slice(data, state, { fom: "021" });
  const t = totals(cube);
  const kpi = (label, value) => h("div", { class: "card kpi" }, h("div", { class: "label" }, label), h("div", { class: "value" }, value));
  const byCl = sumBy(cube, (r) => r.cl, ["n", "tot", "days"]);
  const clItems = CL_ORDER.filter((c) => byCl.has(c)).map((c) => ({ label: data.cl.get(c) ?? c, value: div(byCl.get(c).tot, byCl.get(c).n), sub: `${fmtInt(byCl.get(c).n)}건 · 평균 ${div(byCl.get(c).days, byCl.get(c).n).toFixed(1)}일`, tipLabel: "1건당 진료비" }));
  const bySick = sumBy(cube, (r) => r.sick, ["n", "tot", "days"]);
  const rows = [...bySick.values()].sort((a, b) => b.n - a.n).map((o) => [`${data.sick.get(o.key)?.name ?? o.key} (${o.key})`, fmtInt(o.n), fmtWon(div(o.tot, o.n)), div(o.days, o.n).toFixed(1) + "일"]);
  return h("div", {},
    h("div", { class: "insights" }, h("div", { class: "insight" }, "입원은 표본이 작아(기간 내 ", h("b", {}, fmtInt(t.n) + "건"), ") 종별 비교는 참고용입니다. 격차 분석은 외래 기준입니다.")),
    h("div", { class: "grid kpis" }, kpi("입원 청구 건수", fmtInt(t.n) + "건"), kpi("1건당 진료비", fmtWon(div(t.tot, t.n))), kpi("평균 입원일수", t.n ? (t.days / t.n).toFixed(1) + "일" : "–")),
    h("div", { class: "grid", style: "margin-top:16px" },
      card("종별 1건당 진료비 (입원)", "건수가 적은 종별은 값이 흔들린다", () => ({ node: clItems.length ? bars(clItems, { fmt: fmtWon }) : h("p", { class: "empty" }, "해당 기간 입원 청구 없음"), tbl: null })),
      card("상병별 입원", "청구 건수 순", () => ({ node: rows.length ? table(["상병", "건수", "1건당 진료비", "평균 입원일수"], rows) : h("p", { class: "empty" }, "해당 기간 입원 청구 없음"), tbl: null }))));
}
