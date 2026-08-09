import { SETTINGS, type SettingDef, type SettingKey, type State } from "../settings";
import { load, subscribe, update } from "../storage";

const optionList = document.getElementById("options") as HTMLUListElement;
const enabledToggle = document.getElementById("enabled") as HTMLInputElement;

const rows = new Map<SettingKey, HTMLInputElement>();

let state: State;

function buildRow(def: SettingDef): HTMLLIElement {
  const item = document.createElement("li");

  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = def.key;

  const text = document.createElement("span");
  text.className = "label";
  text.textContent = def.label;

  label.append(box, text);
  item.append(label);

  if (def.hint) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = def.hint;
    item.append(hint);
  }

  rows.set(def.key as SettingKey, box);
  box.addEventListener("change", () => void onToggle(def, box.checked));

  if (def.children?.length) {
    const sublist = document.createElement("ul");
    for (const child of def.children) sublist.append(buildRow(child));
    item.append(sublist);
  }

  return item;
}

// A parent writes only its own key. Its rule already hides everything the
// children target, so forcing them on used to destroy the user's choices for
// when the parent goes back off — and left the UI offering toggles that
// couldn't do anything. Children are disabled instead, see renderTree().
async function onToggle(def: SettingDef, checked: boolean): Promise<void> {
  try {
    render(
      await update((draft) => {
        draft.settings[def.key as SettingKey] = checked;
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

function anyDescendantOn(def: SettingDef): boolean {
  return (def.children ?? []).some(
    (child) => state.settings[child.key as SettingKey] || anyDescendantOn(child),
  );
}

/** `suppressed` — an ancestor is already hiding everything below it. */
function renderTree(defs: readonly SettingDef[], suppressed: boolean): void {
  for (const def of defs) {
    const box = rows.get(def.key as SettingKey);
    if (!box) continue;

    box.checked = state.settings[def.key as SettingKey];
    box.disabled = suppressed;
    box.indeterminate = !suppressed && !box.checked && anyDescendantOn(def);

    if (def.children?.length) renderTree(def.children, suppressed || box.checked);
  }
}

function render(next: State): void {
  state = next;

  enabledToggle.checked = state.enabled;
  document.documentElement.dataset.enabled = String(state.enabled);

  renderTree(SETTINGS, false);
}

for (const def of SETTINGS) optionList.append(buildRow(def));

enabledToggle.addEventListener("change", () => {
  void update((draft) => {
    draft.enabled = enabledToggle.checked;
  })
    .then(render)
    .catch(console.error);
});

subscribe(render);

void load().then(render).catch(console.error);
