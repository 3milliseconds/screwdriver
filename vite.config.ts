import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./src/manifest.config.ts";

// `vite build` defaults to mode 'production' — the release build. Readable
// output is still a `vite build --mode development` away (see build:debug),
// which is what you want when stepping through an unpacked install.
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [crx({ manifest })],

    build: {
      minify: isProd,
      // Sourcemaps would otherwise ship our whole source to every user, and
      // crxjs lists the .map files under web_accessible_resources to boot.
      sourcemap: !isProd,
      target: "es2022",
    },
  };
});
