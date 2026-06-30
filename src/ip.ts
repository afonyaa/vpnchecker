import type { IpInfo } from "./types.js";

const TIMEOUT_MS = 3000;

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

abstract class IpProvider {
  private next?: IpProvider;

  setNext(provider: IpProvider): IpProvider {
    this.next = provider;
    return provider;
  }

  async handle(): Promise<IpInfo> {
    try {
      return await this.fetchIp();
    } catch (error) {
      if (this.next) return this.next.handle();
      throw error instanceof Error ? error : new Error("IP не определён");
    }
  }

  protected abstract fetchIp(): Promise<IpInfo>;
}

class IpWhoProvider extends IpProvider {
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipwho.is/")) as {
      success?: boolean;
      ip?: string;
      country?: string;
      country_code?: string;
    };
    if (!d.success || !d.ip) throw new Error("ipwho.is: неуспех");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country ?? null };
  }
}

// api.country.is — минималистичный: IP + код страны (поле country = ISO-код).
class CountryIsProvider extends IpProvider {
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://api.country.is/")) as { ip?: string; country?: string };
    if (!d.ip) throw new Error("country.is: пустой ответ");
    return { ip: d.ip, countryCode: d.country ?? null, country: null };
  }
}

// get.geojs.io — IP + код страны + полное имя.
class GeoJsProvider extends IpProvider {
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://get.geojs.io/v1/ip/geo.json")) as {
      ip?: string;
      country?: string;
      country_code?: string;
    };
    if (!d.ip) throw new Error("geojs: пустой ответ");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country ?? null };
  }
}

// ipinfo.io — поле country = ISO-код.
class IpinfoProvider extends IpProvider {
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipinfo.io/json")) as { ip?: string; country?: string };
    if (!d.ip) throw new Error("ipinfo: пустой ответ");
    return { ip: d.ip, countryCode: d.country ?? null, country: null };
  }
}

// ipapi.co — отдаёт код и имя страны, но часто упирается в rate-limit (тогда error:true).
class IpapiProvider extends IpProvider {
  protected async fetchIp(): Promise<IpInfo> {
    const d = (await fetchJson("https://ipapi.co/json/")) as {
      ip?: string;
      error?: boolean;
      country_code?: string;
      country_name?: string;
    };
    if (d.error || !d.ip) throw new Error("ipapi: неуспех/лимит");
    return { ip: d.ip, countryCode: d.country_code ?? null, country: d.country_name ?? null };
  }
}

// Цепочка по убыванию надёжности.
export function lookupIp(): Promise<IpInfo> {
  const chain = new GeoJsProvider();
  chain
    .setNext(new IpWhoProvider())
    .setNext(new IpinfoProvider())
    .setNext(new CountryIsProvider())
    .setNext(new IpapiProvider());
  return chain.handle();
}
