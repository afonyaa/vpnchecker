import type { IpInfo } from "./types.js";

const TIMEOUT_MS = 3000;

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    // Приводим разные виды сбоя к понятной причине.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`таймаут ${TIMEOUT_MS / 1000}с`);
    }
    if (error instanceof TypeError) {
      // Браузер схлопывает все сетевые ошибки в общий TypeError: Failed to fetch.
      throw new Error("сеть недоступна");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

abstract class IpProvider {
  private next?: IpProvider;
  protected abstract readonly name: string;

  setNext(provider: IpProvider): IpProvider {
    this.next = provider;
    return provider;
  }

  // errors копится через всю цепочку — чтобы в финале показать причину по каждому.
  async handle(errors: string[] = []): Promise<IpInfo> {
    try {
      return await this.fetchIp();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(`${this.name}: ${reason}`);
      if (this.next) return this.next.handle(errors);
      // Дошли до конца цепочки — ни один провайдер не ответил.
      throw new Error(`ни один провайдер не ответил — ${errors.join("; ")}`);
    }
  }

  protected abstract fetchIp(): Promise<IpInfo>;
}

class IpWhoProvider extends IpProvider {
  protected readonly name = "ipwho.is";
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipwho.is/")) as {
      success?: boolean;
      ip?: string;
      country?: string;
      country_code?: string;
    };
    if (!d.success || !d.ip) throw new Error("неуспех");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country ?? null };
  }
}

// api.country.is — минималистичный: IP + код страны (поле country = ISO-код).
class CountryIsProvider extends IpProvider {
  protected readonly name = "country.is";
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://api.country.is/")) as { ip?: string; country?: string };
    if (!d.ip) throw new Error("пустой ответ");
    return { ip: d.ip, countryCode: d.country ?? null, country: null };
  }
}

// get.geojs.io — IP + код страны + полное имя.
class GeoJsProvider extends IpProvider {
  protected readonly name = "geojs";
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://get.geojs.io/v1/ip/geo.json")) as {
      ip?: string;
      country?: string;
      country_code?: string;
    };
    if (!d.ip) throw new Error("пустой ответ");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country ?? null };
  }
}

// ipinfo.io — поле country = ISO-код.
class IpinfoProvider extends IpProvider {
  protected readonly name = "ipinfo";
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipinfo.io/json")) as { ip?: string; country?: string };
    if (!d.ip) throw new Error("пустой ответ");
    return { ip: d.ip, countryCode: d.country ?? null, country: null };
  }
}

// ipapi.co — отдаёт код и имя страны, но часто упирается в rate-limit (тогда error:true).
class IpapiProvider extends IpProvider {
  protected readonly name = "ipapi";
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipapi.co/json/")) as {
      ip?: string;
      error?: boolean;
      country_code?: string;
      country_name?: string;
    };
    if (d.error || !d.ip) throw new Error("неуспех/лимит");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country_name ?? null };
  }
}

export interface IpResult {
  info: IpInfo;
  // Провайдеры, упавшие до того, как сработал успешный (по ссылке из handle).
  warnings: string[];
}

// Цепочка по убыванию надёжности.
export async function lookupIp(): Promise<IpResult> {
  const chain = new GeoJsProvider();
  chain
    .setNext(new IpWhoProvider())
    .setNext(new IpinfoProvider())
    .setNext(new CountryIsProvider())
    .setNext(new IpapiProvider());

  const warnings: string[] = [];
  const info = await chain.handle(warnings);
  return { info, warnings };
}
