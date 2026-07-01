
const DEFAULT_TIMEOUT_MS = 5000;

// Таймаут запроса к ресурсу. Переопределяется через ?timeoutMS в адресной строке;
// некорректное/неположительное значение игнорируем и берём дефолт.
function timeoutMs(): number {
  const raw = new URLSearchParams(window.location.search).get("timeoutMS");
  if (raw === null) return DEFAULT_TIMEOUT_MS;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

function withoutCache(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
}

export async function reachable(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs());
  try {
    await fetch(withoutCache(url), {
      mode: "no-cors",
      cache: "no-store",
      signal: ctrl.signal,
      // В no-cors режиме redirect ОБЯЗАН быть "follow": любое другое значение спека
      // трактует как network error (промис реджектится для всех хостов). См. main fetch.
      redirect: "follow",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
