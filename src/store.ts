export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((prev: T) => T)): void;
  subscribe(fn: (state: T) => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const subscribers = new Set<(state: T) => void>();

  return {
    get: () => state,

    set(patch) {
      state =
        typeof patch === "function" ? patch(state) : ({ ...state, ...patch } as T);
      for (const fn of subscribers) fn(state);
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
