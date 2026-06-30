// Общие типы приложения.

export type Status = "pending" | "reachable" | "unreachable" | "skipped";

// Цель проверки из конфига.
export interface Target {
  name: string;
  url: string;
}

// Цель в составе состояния — с текущим статусом.
export interface Check extends Target {
  status: Status;
}

// Данные по IP пользователя.
export interface IpInfo {
  ip: string;
  countryCode: string | null; // ISO 3166-1 alpha-2, напр. "RU", "DE"
  country: string | null;
}

export type IpState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; info: IpInfo };

export interface AppState {
  checks: Check[];
  ip: IpState;
}
