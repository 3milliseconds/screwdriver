// Zips dist/ into an upload-ready Chrome Web Store package.
//
// The store expects manifest.json at the *root* of the zip, so we archive the
// contents of dist/ rather than the directory itself, and bail if anything the
// store would object to (or that we'd rather not publish) made it into dist/.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

const walk = (dir, prefix = "") =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    return statSync(full).isDirectory() ? walk(full, rel) : [rel];
  });

const die = (msg) => {
  console.error(`package: ${msg}`);
  process.exit(1);
};

let files;
try {
  files = walk(dist);
} catch {
  die("no dist/ — run `npm run build` first");
}

if (!files.includes("manifest.json")) die("dist/manifest.json is missing");

const maps = files.filter((f) => f.endsWith(".map"));
if (maps.length) {
  die(
    `dist/ contains sourcemaps (${maps.length}), so this is a debug build.\n` +
      "  Run `npm run build` (production mode) before packaging.",
  );
}

const { version, name } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
if (manifest.version !== version) {
  die(`manifest version ${manifest.version} != package.json version ${version} — stale dist/`);
}

const zip = join(root, `${name}-${version}.zip`);
rmSync(zip, { force: true });

// -X drops the macOS extended-attribute junk that would otherwise ride along.
execFileSync("zip", ["-qrX", zip, ...files, "-x", ".DS_Store"], { cwd: dist });

const kb = (statSync(zip).size / 1024).toFixed(1);
console.log(`package: ${name}-${version}.zip (${files.length} files, ${kb} KB)`);
console.log("package: upload at https://chrome.google.com/webstore/devconsole");
