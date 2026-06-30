import type { AppState, Check, IpState, Status } from "./types.js";

// Декларативная отрисовка: state -> DOM. Чистая функция от состояния, без побочной логики.

const checksEl = document.getElementById("checks") as HTMLElement;
const ipEl = document.getElementById("ip") as HTMLElement;

const DOT: Record<Status, string> = {
  pending: "pending",
  reachable: "ok",
  unreachable: "bad",
  skipped: "",
};
const TAG: Record<Status, string> = {
  pending: "проверяю…",
  reachable: "доступен",
  unreachable: "недоступен",
  skipped: "не проверялось",
};

function renderChecks(checks: Check[]): void {
  checksEl.innerHTML = checks
    .map(
      (c) => `
      <div class="check">
        <span class="dot ${DOT[c.status]}"></span>
        <span class="name">${c.name}</span>
        <span class="tag">${TAG[c.status]}</span>
      </div>`
    )
    .join("");
}

function renderIp(ip: IpState): void {
  if (ip.status === "loading") {
    ipEl.className = "ip";
    ipEl.innerHTML = `<span class="ip-label">IP</span><span class="ip-value">определяю…</span>`;
    return;
  }
  if (ip.status === "error") {
    ipEl.className = "ip";
    ipEl.innerHTML = `<span class="ip-label">IP</span><span class="ip-value">не определён</span>`;
    return;
  }

  const { ip: addr, countryCode } = ip.info;
  const isRu = countryCode === "RU";
  ipEl.className = "ip " + (countryCode ? (isRu ? "bad" : "ok") : "");
  const place = countryCode ?? "—";
  ipEl.innerHTML = `
    <span class="ip-label">IP</span>
    <span class="ip-value">${addr}</span>
    <span class="ip-country">${place}</span>`;
}

export function render(state: AppState): void {
  renderIp(state.ip);
  renderChecks(state.checks);
}
