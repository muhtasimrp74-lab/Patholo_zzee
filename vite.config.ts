// Stage 2 scaffold: builds the same site as the legacy tools/build.py output into dist/.
// The legacy-generated index.html is the entry; its inline classic scripts are left untouched (they become TS modules in Stage 4+).
// Non-module assets referenced by the page are copied verbatim so URLs, routes and deep links are unchanged.
import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const STATIC = ['welcome.js', 'sw.js', 'manifest.json', '_headers', 'annot', 'icons', 'fonts', 'textbook'];
const TOOLS_DATA = ['tools/source_map.json', 'tools/mcqs.json']; // read by tools/integrity/check.py; harmless to ship

function copyLegacyStatic(): Plugin {
  return {
    name: 'copy-legacy-static',
    apply: 'build',
    closeBundle() {
      const out = resolve(import.meta.dirname, 'dist');
      for (const p of [...STATIC, ...TOOLS_DATA]) {
        const src = resolve(import.meta.dirname, p);
        if (!existsSync(src)) throw new Error(`missing static asset: ${p}`);
        const dst = resolve(out, p);
        mkdirSync(resolve(dst, '..'), { recursive: true });
        cpSync(src, dst, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [copyLegacyStatic()],
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', minify: false, assetsInlineLimit: 0 },
});
