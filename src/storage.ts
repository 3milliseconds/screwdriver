import { type State, withDefaults } from "./settings";

const KEY = "state";

// Picked once, at module load, and never reassigned. The popup, the service
// worker, and every content-script frame each get their own module instance —
// a fallback that mutates this on a runtime error (a sync write-quota blip,
// say) flips one context onto `local` while the rest stay on `sync`, and from
// then on they read each other's stale state.
const AREA_NAME = chrome.storage.sync ? "sync" : "local";
const area: chrome.storage.StorageArea = chrome.storage[AREA_NAME];

export async function load(): Promise<State> {
  const stored = await area.get(KEY);
  return withDefaults(stored[KEY]);
}

export async function save(state: State): Promise<void> {
  await area.set({ [KEY]: state });
}

// update() is a read-modify-write, so two overlapping calls both read the
// pre-write state and the first one's change is lost on save. Chaining them
// through one promise serialises every writer in this context.
let queue: Promise<unknown> = Promise.resolve();

export function update(mutate: (draft: State) => void): Promise<State> {
  const next = queue.then(async () => {
    const state = await load();
    mutate(state);
    await save(state);
    return state;
  });

  queue = next.catch(() => undefined);
  return next;
}

export function subscribe(onChange: (state: State) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== AREA_NAME) return;

    const change = changes[KEY];
    if (change) onChange(withDefaults(change.newValue));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
