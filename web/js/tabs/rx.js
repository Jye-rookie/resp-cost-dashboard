import { h, fmtInt, fmtWon, fmtPct, div, sumBy } from "../util.js";
import { card, line, bars } from "../charts.js";
import { slice, scopeSick, abxRate, abxLines, CL_ORDER } from "../model.js";

export const controls = ["mode"];

export function render({ state, data, sickLabel }) {
  const sk = scopeSick(state);
  const { cube, rx } = slice(data, state, { sick: sk });
  const all = slice(data, state);
  const scope = sk ? `상병 고정: ${sickLabel(sk)}` : "전체 호흡기 상병";

  // 상병별 항생제 처방률 (비교 기준과 무관하게 모든 상병을 보여 준다)
  const nBy = sumBy(all.cube, (r) => r.sick, ["n"]);
  const abxBy = new Map();
  for (const r of all.rx) if (data.drug.get(r.gnl)?.is_abx) abxBy.set(r.sick, (abxBy.get(r.sick) || 0) + r.lines);
  const sickItems = [...nBy.values()].filter((o) => o.n >= 20)
    .map((o) => ({ code: o.key, n: o.n, v: div(abxBy.get(o.key) || 0, o.n) }))
    .sort((a, b) => b.v - a.v)
    .map((o) => ({ label: data.sick.get(o.code)?.name ?? o.code, value: o.v, text: fmtPct(o.v), cls: o.code === sk ? "hl" : "", sub: `청구 ${fmtInt(o.n)}건 중 ${fmtInt(abxBy.get(o.code) || 0)}건`, tipLabel: "항생제 처방률" }));

  const nCl = sumBy(cube, (r) => r.cl, ["n"]);
  const abxCl = new Map();
  for (const r of rx) if (data.drug.get(r.gnl)?.is_abx) abxCl.set(r.cl, (abxCl.get(r.cl) || 0) + r.lines);
  const clItems = CL_ORDER.map((c) => ({ label: data.cl.get(c) ?? c, value: div(abxCl.get(c) || 0, nCl.get(c)?.n ?? 0), text: fmtPct(div(abxCl.get(c) || 0, nCl.get(c)?.n ?? 0)), sub: `청구 ${fmtInt(nCl.get(c)?.n ?? 0)}건`, tipLabel: "항생제 처방률" }));

  const months = data.months.filter((m) => m >= state.from && m <= state.to);
  const nM = sumBy(cube, (r) => r.ym, ["n"]);
  const aM = new Map();
  for (const r of rx) if (data.drug.get(r.gnl)?.is_abx) aM.set(r.ym, (aM.get(r.ym) || 0) + r.lines);
  const rate = months.map((m) => div(aM.get(m) || 0, nM.get(m)?.n ?? 0));

  const byG = sumBy(rx, (r) => r.gnl, ["lines", "amt"]);
  const nTot = cube.reduce((a, r) => a + r.n, 0);
  const gRows = [...byG.values()].sort((a, b) => b.lines - a.lines).map((o) => {
    const d = data.drug.get(o.key);
    return [d?.name ?? o.key, d?.cls ?? "–", d?.is_abx ? h("span", { class: "badge" }, "항생제") : "–", fmtInt(o.lines), fmtPct(div(o.lines, nTot)), fmtWon(o.amt)];
  });

  const head = h("div", { class: "insights" },
    h("div", { class: "insight" }, h("b", {}, scope), " · 외래. 항생제 처방률 = 항생제 성분이 처방된 청구 수 ÷ 청구 수."),
    h("div", { class: "insight" }, `전체 항생제 처방률 `, h("b", {}, fmtPct(abxRate(cube, rx, data))), ` (항생제 처방 ${fmtInt(abxLines(rx, data))}건 / 청구 ${fmtInt(nTot)}건). 처방의 임상적 적정성은 판단하지 않습니다.`));

  return h("div", {}, head, h("div", { class: "grid" },
    card("상병별 항생제 처방률", "처방률이 높은 순 · 청구 20건 미만 상병 제외", () => ({ node: bars(sickItems, { max: 1, fmt: fmtPct }), tbl: { head: ["상병", "항생제 처방률"], rows: sickItems.map((i) => [i.label, i.text]) } })),
    card("종별 항생제 처방률", scope, () => ({ node: bars(clItems, { max: 1, fmt: fmtPct }), tbl: { head: ["종별", "항생제 처방률"], rows: clItems.map((i) => [i.label, i.text]) } })),
    card("월별 항생제 처방률", scope, () => ({ node: line({ labels: months, series: [{ name: "항생제 처방률", color: "var(--s1)", values: rate }], fmt: (v) => fmtPct(v, 0) }), tbl: { head: ["진료월", "항생제 처방률"], rows: months.map((m, i) => [m, fmtPct(rate[i])]) } })),
    card("처방 성분", `${scope} · 청구에 붙은 성분별 처방 건수와 금액`, () => ({ node: await_table(gRows), tbl: null }), { wide: true })));
}
import { table } from "../charts.js";
const await_table = (rows) => table(["성분", "약효분류번호", "구분", "처방 청구 수", "청구 대비", "금액"], rows);
