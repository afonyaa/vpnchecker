import { reachable } from "./net.js";
import { lookupIp } from "./ip.js";
import { PipelineStep } from "./pipeline.js";
import type { Store } from "./store.js";
import type { AppState } from "./types.js";

export class IpStep extends PipelineStep {
  constructor(private store: Store<AppState>) {
    super();
  }

  protected async execute(): Promise<boolean> {
    try {
      const { info, warnings } = await lookupIp();
      this.store.set({ ip: { status: "ok", info, warnings } });
      return true;
    } catch (error) {
      // IP не определён: показываем причину, помечаем проверки как пропущенные,
      // чтобы список не висел на «проверяю…», и обрываем цепочку.
      const message = error instanceof Error ? error.message : "все провайдеры недоступны";
      this.store.set((state) => ({
        ...state,
        ip: { status: "error", message },
        checks: state.checks.map((c) => ({ ...c, status: "skipped" as const })),
      }));
      return false;
    }
  }
}

export class ChecksStep extends PipelineStep {
  constructor(private store: Store<AppState>) {
    super();
  }

  protected async execute(): Promise<boolean> {
    await Promise.all(
      this.store.get().checks.map(async (check) => {
        const ok = await reachable(check.url);
        this.store.set((state) => ({
          ...state,
          checks: state.checks.map((c) =>
            c.url === check.url ? { ...c, status: ok ? "reachable" : "unreachable" } : c
          ),
        }));
      })
    );
    return true; // последний шаг; продолжать дальше нечего, но контракт требует флаг.
  }
}
