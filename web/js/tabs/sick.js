import { h, fmtInt, fmtWon, fmtPct, div, sumBy } from "../util.js";
import { card, line, bars, table } from "../charts.js";
import { slice, totals, abxRate, CL_ORDER } from "../model.js";

export const controls = [];
let selected = null; // 탭 안에서만 쓰는 선택 상병

export function render({ state, data, rerender }) {
  const { cube, rx } = slice(data, state);
  const bySick = sumBy(cube, (r) => r.sick, ["n", "tot", "ins"]);
  const rows = [...bySick.values()].sort((a, b) => b.n - a.n);
  if (!selected || !bySick.has(selected)) selected = rows[0]?.key;
  const maxN = Math.max(...rows.map((r) => r.n), 1);

  const tblRows = rows.map((o) => {
    const d = data.sick.get(o.key);
    const sub = { cube: cube.filter((r) => r.sick === o.key), rx: rx.filter((r) => r.sick === o.key) };
    return [
      h("span", {}, `${d.name} (${o.key})`, d.cdd ? " " : "", d.cdd ? h("span", { class: "badge" }, `법정감염병 ${d.cdd}`) : null),
      d.grp, fmtInt(o.n), fmtWon(div(o.tot, o.n)), fmtWon(div(o.ins, o.n)), fmtPct(abxRate(sub.cube, sub.rx, data)),
    ];
  });
  const list = card("호흡기 상병 목록 (외래)", "행을 클릭하면 아래에 월별 추이와 종별 구성이 나옵니다", () => ({
    node: table(["상병", "계열", "청구 건수", "1건당 진료비", "1건당 보험자부담", "항생제 처방률"], tblRows,
      { onRow: (i) => { selected = rows[i].key; rerender(); }, selected: rows.findIndex((r) => r.key === selected) }),
    tbl: null,
  }), { wide: true });

  const d = data.sick.get(selected);
  const sel = cube.filter((r) => r.sick === selected);
  const months = data.months.filter((m) => m >= state.from && m <= state.to);
  const byM = sumBy(sel, (r) => r.ym, ["n"]);
  const vals = months.map((m) => byM.get(m)?.n ?? 0);
  const trend = card(`${d?.name} (${selected}) 월별 청구 건수`, d?.grp, () => ({
    node: line({ labels: months, series: [{ name: "청구 건수", color: "var(--s1)", values: vals }], unit: "건" }),
    tbl: { head: ["진료월", "청구 건수"], rows: months.map((m, i) => [m, fmtInt(vals[i])]) },
  }));
  const byCl = sumBy(sel, (r) => r.cl, ["n", "tot"]);
  const tn = totals(sel).n;
  const mix = card(`${d?.name} 종별 구성`, "청구 건수와 비중", () => {
    const items = CL_ORDER.map((c) => ({ label: data.cl.get(c) ?? c, value: byCl.get(c)?.n ?? 0, sub: `${fmtPct(div(byCl.get(c)?.n ?? 0, tn))} · 1건당 ${fmtWon(div(byCl.get(c)?.tot ?? 0, byCl.get(c)?.n ?? 0))}` }));
    return { node: bars(items, { fmt: (v) => fmtInt(v) + "건" }), tbl: { head: ["종별", "청구 건수"], rows: items.map((i) => [i.label, fmtInt(i.value)]) } };
  });
  return h("div", {}, h("div", { class: "grid" }, list, trend, mix));
}
