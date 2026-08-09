import { activeAttrs, attrName, SETTING_KEYS, type State } from "./settings";
import { load, subscribe } from "./storage";

const CACHE_KEY = "screwdriver:attrs";

const root = document.documentElement;

/**
 * The rules in `src/rules/` are injected at `document_start`, but they only
 * match once these attributes exist — and getting them takes an async
 * `chrome.storage` read, behind an async module import. Both resolve after the
 * first paint, so the feed renders and *then* vanishes.
 *
 * localStorage is the only storage a content script can read synchronously, so
 * the last known attribute set is mirrored there and replayed before anything
 * paints. chrome.storage stays the source of truth; this is a cache that gets
 * corrected a few milliseconds later.
 */
function readCache(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeCache(attrs: readonly string[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(attrs));
  } catch {
    // Sandboxed frame, quota, storage disabled — the async path still works.
  }
}

// Only ever writes attributes the current schema knows about, so a stale or
// page-tampered cache can't put arbitrary attributes on <html>.
function set(attrs: readonly string[]): void {
  const wanted = new Set(attrs);

  for (const key of SETTING_KEYS) {
    const name = attrName(key);

    if (wanted.has(name)) {
      root.setAttribute(name, "");
    } else {
      root.removeAttribute(name);
    }
  }
}

function apply(state: State): void {
  const attrs = activeAttrs(state);
  set(attrs);
  writeCache(attrs);
}

set(readCache());

void load().then(apply).catch(console.error);

subscribe(apply);
