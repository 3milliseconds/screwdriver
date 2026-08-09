import { load, subscribe } from "./storage";

function setIcon(enabled: boolean): void {
  const suffix = enabled ? "" : "-off";

  void chrome.action
    .setIcon({
      path: {
        16: `icons/icon${suffix}-16.png`,
        32: `icons/icon${suffix}-32.png`,
        48: `icons/icon${suffix}-48.png`,
        128: `icons/icon${suffix}-128.png`,
      },
    })
    .catch(console.error);
}

// No install seed: storage is `sync`, so a fresh install can land on a profile
// that already holds settings (a reinstall, or a second synced device) and
// writing defaults there would wipe them. load() fills in every missing key
// via withDefaults() anyway, so an unwritten store is already the defaults.

void load()
  .then((state) => setIcon(state.enabled))
  .catch(console.error);

subscribe((state) => setIcon(state.enabled));
