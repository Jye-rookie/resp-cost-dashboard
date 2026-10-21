import { h, fmtInt, fmtWon, fmtPct, div, sumBy } from "../util.js";
import { card, line, bars } from "../charts.js";
import { slice, totals, abxRate, CL_ORDER, perClaim } from "../model.js";

export const controls = [];

function kpi(label, value, delta) {
  return h("div", { class: "card kpi" }, h("div", { class: "label" }, label), h("div", { class: "value" }, value), delta ? h("div", { class: "delta" }, delta) : null);
}

export function render({ state, data, sickLabel }) {
  const { cube, rx } = slice(data, state);
  const t = totals(cube);
  const months = data.months.filter((m) => m >= state.from && m <= state.to);
  const byM = sumBy(cube, (r) => r.ym, ["n"]);
  const flu = sumBy(cube.filter((r) => r.sick === "J101"), (r) => r.ym, ["n"]);

  // 핵심 발견 (현재 기간·외래 기준, 상병 고정 = 현재 선택 상병)
  const sk = state.sick;
  const fx = slice(data, state, { sick: sk }).cube;
  const byCl = sumBy(fx, (r) => r.cl, ["n", "tot", "ins"]);
  const small = perClaim(byCl.get("31"), "tot"), big = perClaim(byCl.get("01"), "tot");
  const incAll = sumBy(fx.filter((r) => r.inc !== "M"), (r) => r.inc, ["n", "tot"]);
  const incV = [...incAll.values()].map((o) => o.tot / o.n);
  const spread = incV.length ? Math.max(...incV) / Math.min(...incV) - 1 : null;
  const abx = abxRate(cube, rx, data);

  const insights = h("div", { class: "insights" },
    h("div", { class: "insight" }, "같은 상병(", h("b", {}, sickLabel(sk)), ")끼리 비교하면 상급종합병원 1건당 진료비는 의원의 ", h("b", {}, big && small ? `${(big / small).toFixed(2)}배` : "–"), ` (${fmtWon(big)} vs ${fmtWon(small)}).`),
    h("div", { class: "insight" }, "같은 상병에서 보험료 1~5분위 간 1건당 진료비 차이는 최대 ", h("b", {}, spread == null ? "–" : fmtPct(spread)), " 입니다.", spread != null && big && small ? (spread < big / small - 1 ? ` 종별 격차(${fmtPct(big / small - 1, 0)})보다 작습니다.` : " 종별 격차보다 큽니다.") : ""),
    h("div", { class: "insight" }, "호흡기 외래 청구 중 항생제 성분이 처방된 비율은 ", h("b", {}, fmtPct(abx)), " 입니다. 상병별 차이는 '처방·항생제' 탭에서 확인하세요."));

  const trend = card("월별 호흡기 외래 청구 건수", "겨울(11~3월)에 늘고 여름에 줄어드는 계절성", () => {
    const vals = months.map((m) => byM.get(m)?.n ?? 0);
    return {
      node: line({ labels: months, series: [{ name: "청구 건수", color: "var(--s1)", values: vals }], unit: "건" }),
      tbl: { head: ["진료월", "청구 건수"], rows: months.map((m, i) => [m, fmtInt(vals[i])]) },
    };
  });
  const fluCard = card("월별 인플루엔자(J101) 청구 건수", "법정감염병 4급 · 별도 축으로 표시", () => {
    const vals = months.map((m) => flu.get(m)?.n ?? 0);
    return {
      node: line({ labels: months, series: [{ name: "인플루엔자", color: "var(--s2)", values: vals }], unit: "건" }),
      tbl: { head: ["진료월", "청구 건수"], rows: months.map((m, i) => [m, fmtInt(vals[i])]) },
    };
  });
  const clCard = card("종별 청구 구성", "외래 호흡기 청구 건수 (기간 내)", () => {
    const m = sumBy(cube, (r) => r.cl, ["n"]);
    const items = CL_ORDER.map((c) => ({ label: data.cl.get(c) ?? c, value: m.get(c)?.n ?? 0, sub: fmtPct(div(m.get(c)?.n ?? 0, t.n)) + " of 청구" }));
    return { node: bars(items, { fmt: (v) => fmtInt(v) + "건" }), tbl: { head: ["종별", "청구 건수"], rows: items.map((i) => [i.label, fmtInt(i.value)]) } };
  });

  return h("div", {},
    insights,
    h("div", { class: "grid kpis" },
      kpi("외래 청구 건수", fmtInt(t.n) + "건"),
      kpi("1건당 진료비 총액", fmtWon(div(t.tot, t.n))),
      kpi("1건당 보험자부담금", fmtWon(div(t.ins, t.n)), `본인부담 ${fmtPct(1 - div(t.ins, t.tot))}`),
      kpi("항생제 처방 청구 비율", fmtPct(abx))),
    h("div", { class: "grid", style: "margin-top:16px" }, trend, fluCard, clCard));
}
