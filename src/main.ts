import { BLOCKED } from "./config.js";
import { createStore } from "./store.js";
import { render } from "./view.js";
import { IpStep, ChecksStep } from "./steps.js";
import type { AppState, Check } from "./types.js";

const initialChecks: Check[] = BLOCKED.map(
  (target): Check => ({ ...target, status: "pending" })
);

const store = createStore<AppState>({ checks: initialChecks, ip: { status: "loading" } });
store.subscribe(render);
render(store.get());

// Цепочка: сначала определяем IP, затем проверяем доступность ресурсов.
const ipStep = new IpStep(store);
ipStep.setNext(new ChecksStep(store));
ipStep.run();
