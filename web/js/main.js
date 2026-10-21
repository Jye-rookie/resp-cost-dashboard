import { loadData } from "./data.js";
import { h } from "./util.js";
import { hideTip } from "./charts.js";
import * as overview from "./tabs/overview.js";
import * as gap from "./tabs/gap.js";
import * as sick from "./tabs/sick.js";
import * as rx from "./tabs/rx.js";
import * as inpatient from "./tabs/inpatient.js";

const TABS = [
  { id: "overview", label: "개요", mod: overview },
  { id: "gap", label: "진료비 격차", mod: gap },
  { id: "sick", label: "상병 분석", mod: sick },
  { id: "rx", label: "처방·항생제", mod: rx },
  { id: "inpatient", label: "입원 요약", mod: inpatient },
];

const [cube, rxCube, dimSick, dimCl, dimDrug] = await Promise.all(
  ["resp_cube", "resp_rx_cube", "dim_sick", "dim_cl", "dim_drug"].map((n) => loadData("claims", n)));
const months = [...new Set(cube.map((r) => r.ym))].sort();
const data = {
  cube, rx: rxCube, months,
  sick: new Map(dimSick.map((d) => [d.code, d])),
  cl: new Map(dimCl.map((d) => [d.code, d.name])),
  drug: new Map(dimDrug.map((d) => [d.gnl, d])),
};
// 기본 상병: 외래 건수가 가장 많은 상병 (상병 고정 비교의 출발점)
const top = [...cube.filter((r) => r.fom === "031").reduce((m, r) => m.set(r.sick, (m.get(r.sick) || 0) + r.n), new Map())].sort((a, b) => b[1] - a[1])[0][0];
const state = { tab: "overview", from: months[0], to: months.at(-1), mode: "fixed", sick: top, metric: "tot" };

const $ = (id) => document.getElementById(id);
const sickLabel = (c) => `${data.sick.get(c)?.name ?? c} (${c})`;

function seg(options, value, onPick) {
  return h("span", { class: "seg" }, options.map(([v, label]) =>
    h("button", { type: "button", "aria-pressed": String(v === value), onclick: () => onPick(v) }, label)));
}
function select(options, value, onPick) {
  const el = h("select", {}, options.map(([v, label]) => h("option", { value: v, selected: v === value }, label)));
  el.addEventListener("change", () => onPick(el.value));
  return el;
}
const ctl = (label, node) => h("label", { class: "ctl" }, h("span", {}, label), node);

function renderFilters(mod) {
  const f = $("filters");
  const monthOpts = months.map((m) => [m, m]);
  const nodes = [
    ctl("기간", h("span", { class: "ctl" },
      select(monthOpts, state.from, (v) => { state.from = v; if (state.to < v) state.to = v; render(); }),
      h("span", {}, "~"),
      select(monthOpts, state.to, (v) => { state.to = v; if (state.from > v) state.from = v; render(); }))),
  ];
  if (mod.controls?.includes("mode")) {
    nodes.push(ctl("비교 기준", seg([["fixed", "상병 고정"], ["all", "전체(보정 없음)"]], state.mode, (v) => { state.mode = v; render(); })));
    if (state.mode === "fixed") {
      const opts = [...data.sick.keys()].map((c) => [c, sickLabel(c)]);
      nodes.push(ctl("상병", select(opts, state.sick, (v) => { state.sick = v; render(); })));
    }
  }
  if (mod.controls?.includes("metric")) {
    nodes.push(ctl("금액 지표", seg([["tot", "진료비 총액"], ["ins", "보험자부담금"]], state.metric, (v) => { state.metric = v; render(); })));
  }
  f.replaceChildren(...nodes);
}

function render() {
  hideTip();
  const t = TABS.find((x) => x.id === state.tab);
  $("tabs").replaceChildren(...TABS.map((x) => h("button", { role: "tab", type: "button", "aria-selected": String(x.id === state.tab), onclick: () => { state.tab = x.id; render(); } }, x.label)));
  $("period-note").textContent = `${state.from} ~ ${state.to} · 호흡기(J) · ${state.tab === "inpatient" ? "입원" : "외래"}`;
  renderFilters(t.mod);
  $("app").replaceChildren(t.mod.render({ state, data, sickLabel, go: (tab, patch = {}) => { Object.assign(state, patch, { tab }); render(); }, rerender: render }));
}

$("theme").addEventListener("click", () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
});
render();
