import type { Target } from "./types.js";

// Заблокированные в РФ ресурсы. Грузятся только при работающем VPN.
export const BLOCKED: Target[] = [
  { name: "Instagram", url: "https://www.instagram.com/favicon.ico" },
  { name: "X (Twitter)", url: "https://x.com/favicon.ico" },
  { name: "Meduza", url: "https://meduza.io/favicon.ico" },
];
