import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "screwdriver",
  short_name: "screwdriver",
  version: pkg.version,
  description: pkg.description,

  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },

  action: {
    default_popup: "src/popup/index.html",
    default_title: "screwdriver",
    // Without this the toolbar falls back to the top-level `icons` — the "on"
    // set — until the worker wakes and calls setIcon(), so a user who has
    // screwdriver switched off sees it look switched on at every browser start.
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },

  background: {
    service_worker: "src/background.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
      js: ["src/content.ts"],
      css: [
        "src/rules/base.css",
        "src/rules/feed.css",
        "src/rules/shorts.css",
        "src/rules/sidebar.css",
        "src/rules/comments.css",
        "src/rules/player.css",
      ],
      run_at: "document_start",
      all_frames: true,
    },
  ],

  // No host_permissions: the content script's own `matches` is what grants it
  // access, and nothing here calls fetch or the scripting API. Listing them
  // only adds an install-time permission warning. Phase 4's
  // declarativeNetRequest work will need them back.
  permissions: ["storage"],
});
