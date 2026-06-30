
const TIMEOUT_MS = 6000;

function withoutCache(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
}

export async function reachable(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
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
