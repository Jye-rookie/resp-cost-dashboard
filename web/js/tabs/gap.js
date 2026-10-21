import { h, fmtInt, fmtWon, fmtPct, div, sumBy } from "../util.js";
import { card, bars, table } from "../charts.js";
import { slice, scopeSick, perClaim, CL_ORDER, INC_ORDER, INC_LABEL } from "../model.js";

export const controls = ["mode", "metric"];
const METRIC = { tot: "진료비 총액", ins: "보험자부담금" };

export function render({ state, data, sickLabel }) {
  const sk = scopeSick(state);
  const { cube } = slice(data, state, { sick: sk });
  const mname = METRIC[state.metric];
  const scope = sk ? `상병 고정: ${sickLabel(sk)}` : "전체 호흡기 상병 (중증도·상병 구성 보정 없음)";

  const byCl = sumBy(cube, (r) => r.cl, ["n", "tot", "ins"]);
  const base = perClaim(byCl.get("31"), state.metric);
  const vals = CL_ORDER.map((c) => perClaim(byCl.get(c), state.metric));
  const clItems = CL_ORDER.map((c, i) => ({
    label: data.cl.get(c) ?? c, value: vals[i],
    cls: i === 0 ? "mute" : "", tipLabel: `1건당 ${mname}`,
    extra: [["청구 건수", fmtInt(byCl.get(c)?.n ?? 0)]],
    sub: `${fmtInt(byCl.get(c)?.n ?? 0)}건` + (i ? ` · 의원 대비 ×${(vals[i] / base).toFixed(2)}` : " · 기준"),
  }));
  const top = vals.at(-1) && base ? vals.at(-1) / base : null;

  const byInc = sumBy(cube, (r) => r.inc, ["n", "tot", "ins"]);
  const incVals = INC_ORDER.map((k) => perClaim(byInc.get(k), state.metric));
  const q = incVals.slice(0, 5).filter((v) => v != null);
  const spread = q.length ? Math.max(...q) / Math.min(...q) - 1 : null;
  const incItems = INC_ORDER.map((k, i) => ({
    label: INC_LABEL[k], value: incVals[i], cls: k === "M" ? "hl" : "",
    tipLabel: `1건당 ${mname}`, extra: [["청구 건수", fmtInt(byInc.get(k)?.n ?? 0)]],
    sub: `${fmtInt(byInc.get(k)?.n ?? 0)}건`,
  }));

  // 종별 × 상병 표: 상병 고정이 필요한 이유(상병마다 금액 수준이 다름)를 보여 준다
  const all = slice(data, state).cube;
  const bySick = sumBy(all, (r) => r.sick, ["n"]);
  const topSick = [...bySick.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((o) => o.key);
  const cell = sumBy(all.filter((r) => topSick.includes(r.sick)), (r) => r.sick + "|" + r.cl, ["n", "tot", "ins"]);
  const gmax = Math.max(...[...cell.values()].map((o) => o[state.metric] / o.n), 1);
  const heatRows = topSick.map((c) => [
    h("span", {}, sickLabel(c)),
    ...CL_ORDER.map((cl) => {
      const o = cell.get(c + "|" + cl);
      if (!o || o.n < 5) return h("span", { title: o ? `n=${o.n} (5건 미만, 표시 안 함)` : "" }, "–");
      const v = o[state.metric] / o.n;
      const td = h("span", { title: `${fmtInt(o.n)}건` }, fmtInt(v));
      td.style.cssText = `display:block;margin:-7px -10px;padding:7px 10px;background:color-mix(in srgb, var(--s1) ${Math.round((v / gmax) * 55)}%, var(--surface))`;
      return td;
    }),
  ]);
  const heat = () => ({ node: table(["상병", ...CL_ORDER.map((c) => data.cl.get(c) ?? c)], heatRows), tbl: null });

  const head = h("div", { class: "insights" },
    h("div", { class: "insight" }, h("b", {}, scope), " · 외래 · 1건당 ", mname, " 기준."),
    h("div", { class: "insight" }, "상급종합병원은 의원의 ", h("b", {}, top ? `×${top.toFixed(2)}` : "–"),
      ". ", sk ? "같은 상병 안에서의 차이라 중증도 구성 차이는 일부 통제된 값입니다(상병 내 중증도 차이는 데이터에 없음)." : "상병 구성이 종별로 달라 생긴 차이가 섞여 있으니 '상병 고정'과 비교해 보세요."),
    h("div", { class: "insight" }, "보험료 1~5분위 간 차이는 ", h("b", {}, spread == null ? "–" : fmtPct(spread)), ". 의료급여 수진자는 별도 막대로 표시합니다."));

  return h("div", {}, head,
    h("div", { class: "grid" },
      card(`종별 1건당 ${mname}`, scope, () => ({ node: bars(clItems, { fmt: fmtWon }), tbl: { head: ["종별", `1건당 ${mname}`, "청구 건수"], rows: CL_ORDER.map((c, i) => [clItems[i].label, fmtWon(vals[i]), fmtInt(byCl.get(c)?.n ?? 0)]) } })),
      card(`소득군별 1건당 ${mname}`, `${scope} · 보험료 5분위와 의료급여`, () => ({ node: bars(incItems, { fmt: fmtWon }), tbl: { head: ["소득군", `1건당 ${mname}`, "청구 건수"], rows: INC_ORDER.map((k, i) => [INC_LABEL[k], fmtWon(incVals[i]), fmtInt(byInc.get(k)?.n ?? 0)]) } })),
      card(`종별 × 상병 1건당 ${mname} (외래 상위 8개 상병)`, "상병마다 금액 수준이 다르므로 종별 비교는 같은 줄(상병) 안에서 읽는다. 5건 미만 칸은 생략.", heat, { wide: true })));
}
