import { describe, expect, it } from "vitest";
import {
  ALL_SETTINGS,
  activeAttrs,
  attrName,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  SETTING_KEYS,
  SETTINGS,
  type SettingDef,
  withDefaults,
} from "./settings";

describe("schema", () => {
  it("flattens nested settings into the key list", () => {
    expect(SETTING_KEYS).toContain("hideSidebar");
    expect(SETTING_KEYS).toContain("hideRecommended");
  });

  it("has a unique key per setting", () => {
    expect(new Set(SETTING_KEYS).size).toBe(SETTING_KEYS.length);
  });

  it("gives every key a default", () => {
    for (const key of SETTING_KEYS) {
      expect(typeof DEFAULT_SETTINGS[key]).toBe("boolean");
    }
  });

  it("counts parents and children alike", () => {
    const defs: readonly SettingDef[] = SETTINGS;
    const expected = defs.reduce((n, def) => n + 1 + (def.children?.length ?? 0), 0);

    expect(ALL_SETTINGS.length).toBe(expected);
  });
});

describe("attrName", () => {
  it("converts camelCase to a prefixed kebab-case attribute", () => {
    expect(attrName("hideFeed")).toBe("data-screwdriver-hide-feed");
    expect(attrName("hideCommentAvatars")).toBe("data-screwdriver-hide-comment-avatars");
  });

  it("produces a distinct attribute per setting", () => {
    const names = SETTING_KEYS.map(attrName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("withDefaults", () => {
  it("returns defaults for empty or junk input", () => {
    expect(withDefaults(undefined)).toEqual(DEFAULT_STATE);
    expect(withDefaults({})).toEqual(DEFAULT_STATE);
  });

  it("keeps stored values", () => {
    const state = withDefaults({ enabled: false, settings: { hideFeed: false } });
    expect(state.enabled).toBe(false);
    expect(state.settings.hideFeed).toBe(false);
  });

  it("fills in keys added since the state was written", () => {
    const state = withDefaults({ settings: { hideFeed: false } });
    expect(state.settings.hideShorts).toBe(DEFAULT_SETTINGS.hideShorts);
  });

  it("drops keys that no longer exist", () => {
    const state = withDefaults({ settings: { hideFeed: true, hideTrending: true } });
    expect(state.settings).not.toHaveProperty("hideTrending");
  });

  it("ignores values of the wrong type", () => {
    const state = withDefaults({ enabled: "yes", settings: { hideFeed: "no" } });
    expect(state.enabled).toBe(DEFAULT_STATE.enabled);
    expect(state.settings.hideFeed).toBe(DEFAULT_SETTINGS.hideFeed);
  });

  it("does not alias the shared defaults", () => {
    const state = withDefaults({});
    state.settings.hideFeed = !DEFAULT_SETTINGS.hideFeed;

    expect(DEFAULT_SETTINGS.hideFeed).toBe(DEFAULT_STATE.settings.hideFeed);
    expect(withDefaults({}).settings.hideFeed).toBe(DEFAULT_SETTINGS.hideFeed);
  });
});

describe("activeAttrs", () => {
  it("lists an attribute per enabled setting", () => {
    const state = withDefaults({ settings: { hideFeed: true, hideShorts: false } });

    expect(activeAttrs(state)).toContain("data-screwdriver-hide-feed");
    expect(activeAttrs(state)).not.toContain("data-screwdriver-hide-shorts");
  });

  it("is empty when screwdriver is switched off", () => {
    expect(activeAttrs(withDefaults({ enabled: false }))).toEqual([]);
  });

  it("only ever names attributes the schema knows about", () => {
    const known = new Set(SETTING_KEYS.map(attrName));

    for (const name of activeAttrs(DEFAULT_STATE)) {
      expect(known.has(name)).toBe(true);
    }
  });
});
