export interface SettingDef {
  readonly key: string;
  readonly label: string;
  readonly hint?: string;
  readonly default: boolean;
  readonly children?: readonly SettingDef[];
}

export const SETTINGS = [
  {
    key: "hideFeed",
    label: "Hide home feed",
    hint: "The recommendation grid on youtube.com",
    default: true,
  },
  {
    key: "hideShorts",
    label: "Hide Shorts",
    hint: "Shelves, sidebar entry, and channel tab",
    default: true,
  },
  {
    key: "hideSidebar",
    label: "Hide video sidebar",
    default: true,
    children: [
      { key: "hideRecommended", label: "Hide recommended videos", default: true },
      { key: "hideLiveChat", label: "Hide live chat", default: true },
      { key: "hidePlaylist", label: "Hide playlist panel", default: false },
    ],
  },
  {
    key: "hideComments",
    label: "Hide comments",
    default: false,
    children: [{ key: "hideCommentAvatars", label: "Hide commenter avatars", default: false }],
  },
  {
    key: "hideEndScreen",
    label: "Hide end screen feed",
    hint: "The video grid over the last seconds of playback",
    default: true,
  },
  {
    key: "hideEndCards",
    label: "Hide end screen cards",
    default: true,
  },
] as const satisfies readonly SettingDef[];

type CollectKeys<T extends readonly SettingDef[]> = {
  [I in keyof T]: T[I] extends { readonly key: infer K extends string }
    ? T[I] extends { readonly children: infer C extends readonly SettingDef[] }
      ? K | CollectKeys<C>
      : K
    : never;
}[number];

export type SettingKey = CollectKeys<typeof SETTINGS>;
export type Settings = Record<SettingKey, boolean>;

export interface State {
  enabled: boolean;
  settings: Settings;
}

function flatten(defs: readonly SettingDef[]): SettingDef[] {
  return defs.flatMap((def) => [def, ...(def.children ? flatten(def.children) : [])]);
}

export const ALL_SETTINGS: readonly SettingDef[] = flatten(SETTINGS);

export const SETTING_KEYS = ALL_SETTINGS.map((def) => def.key) as readonly SettingKey[];

export const DEFAULT_SETTINGS = Object.fromEntries(
  ALL_SETTINGS.map((def) => [def.key, def.default]),
) as Settings;

export const DEFAULT_STATE: State = {
  enabled: true,
  settings: DEFAULT_SETTINGS,
};

const ATTR_PREFIX = "data-screwdriver-";

export function attrName(key: string): string {
  return ATTR_PREFIX + key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

export function withDefaults(stored: unknown): State {
  const raw = (stored ?? {}) as Partial<State>;
  const settings = { ...DEFAULT_SETTINGS };

  if (raw.settings && typeof raw.settings === "object") {
    for (const key of SETTING_KEYS) {
      const value = (raw.settings as Record<string, unknown>)[key];
      if (typeof value === "boolean") settings[key] = value;
    }
  }

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_STATE.enabled,
    settings,
  };
}

/** The `data-screwdriver-*` attributes `<html>` should carry for this state. */
export function activeAttrs(state: State): string[] {
  if (!state.enabled) return [];
  return SETTING_KEYS.filter((key) => state.settings[key]).map(attrName);
}
