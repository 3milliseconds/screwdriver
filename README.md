# screwdriver

Toggle off YouTube's feed, Shorts, and recommendations so you can focus on what you came to watch instead of doomscrolling.

screwdriver is a Chrome extension (Manifest V3) that hides the parts of YouTube built to keep you watching — the home feed, Shorts, the recommended-videos sidebar, the end-screen grid — while leaving search, subscriptions, and the video itself alone. Everything is toggleable from the toolbar popup, per feature, with a master on/off switch.

## What it can hide

| Setting | Default | Covers |
| --- | --- | --- |
| Home feed | on | The recommendation grid and filter chips on youtube.com |
| Shorts | on | Shelves, the sidebar entry, and the channel Shorts tab |
| Video sidebar | on | With child toggles for recommended videos, live chat, and the playlist panel |
| Comments | off | With a child toggle for commenter avatars |
| End screen feed | on | The video grid over the last seconds of playback |
| End screen cards | on | The overlay cards a creator places in the video |

Settings sync across devices via `chrome.storage.sync` (falling back to `local` where sync is unavailable). Desktop (`www.youtube.com`) and mobile (`m.youtube.com`) layouts are both covered.

## How it works

There is no DOM-watching or element removal. The content script (`src/content.ts`) reads the saved settings and sets matching `data-screwdriver-*` attributes on `<html>`; static stylesheets in `src/rules/` do the actual hiding with selectors like:

```css
html[data-screwdriver-hide-feed] ytd-browse[page-subtype='home'] ytd-rich-grid-renderer {
  display: none !important;
}
```

Toggling a setting just adds or removes an attribute, so changes apply instantly in every open tab (the content script subscribes to storage changes).

To avoid a flash of the feed before the async `chrome.storage` read resolves, the content script mirrors the last-applied attribute set into `localStorage` and replays it synchronously at `document_start`, before first paint. `chrome.storage` remains the source of truth and corrects the cache moments later. The cache is validated against the known setting keys, so a tampered value can't put arbitrary attributes on the page.

The background service worker (`src/background.ts`) does one job: keeping the toolbar icon in sync with the master on/off switch.

The only permission requested is `storage`.

## Building and installing

```sh
npm install
npm run build
```

Then load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory

## Development

```sh
npm run dev        # Vite dev server with hot reload (via @crxjs/vite-plugin)
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run icons      # regenerate icons/ from scripts/make-icons.py
```

## Layout

```
src/
  manifest.config.ts  MV3 manifest (crxjs defineManifest)
  settings.ts         Setting definitions, defaults, and the State schema
  storage.ts          Load/save/subscribe over chrome.storage, serialized writes
  content.ts          Applies data-screwdriver-* attributes to <html>
  background.ts       Toolbar icon state
  popup/              Toolbar popup UI
  rules/              One stylesheet per feature area (feed, shorts, sidebar, …)
```

`src/settings.ts` is the single source of truth: adding a setting there generates its storage key, its popup checkbox, and its `data-screwdriver-*` attribute name — the only other thing a new feature needs is a stylesheet in `src/rules/`.
