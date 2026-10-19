// Stage 2 scaffold: builds the same site as the legacy tools/build.py output into dist/.
// The legacy-generated index.html is the entry; its inline classic scripts are left untouched (they become TS modules in Stage 4+).
// Non-module assets referenced by the page are copied verbatim so URLs, routes and deep links are unchanged.
import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const STATIC = ['welcome.js', 'zz-store.js', 'sw.js', 'manifest.json', '_headers', 'annot', 'icons', 'fonts', 'textbook'];
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


// Stage 6: dist/sw.js is the legacy worker with its precache list REGENERATED from the files that are really in dist.
// Vite hashes fonts/icons/CSS it finds into assets/, so the legacy un-hashed CORE list would not precache what the page
// requests and a cold offline start would break. CORE = index.html + every file the worker may serve from the build.
// VERSION gets a content hash, so any changed byte makes a new cache. The root sw.js is not touched.
function generateServiceWorker(): Plugin {
  const walk = (dir: string, base: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const f = resolve(dir, n), rel = base ? base + '/' + n : n;
      return statSync(f).isDirectory() ? walk(f, rel) : [rel];
    });
  return {
    name: 'generate-service-worker',
    apply: 'build',
    enforce: 'post',
    closeBundle: { order: 'post', handler() {
      const out = resolve(import.meta.dirname, 'dist');
      const swPath = resolve(out, 'sw.js');
      if (!existsSync(swPath)) throw new Error('dist/sw.js missing (copy-legacy-static must run first)');
      const roots = ['assets', 'annot', 'icons', 'fonts'];
      const files = ['index.html', 'welcome.js', 'zz-store.js', 'manifest.json']
        .concat(...roots.map((r) => (existsSync(resolve(out, r)) ? walk(resolve(out, r), r) : [])))
        .filter((f) => existsSync(resolve(out, f))).sort();
      const hash = createHash('sha256');
      for (const f of files) { hash.update(f); hash.update(readFileSync(resolve(out, f))); }
      const version = 'pathviva-zzee-dist-' + hash.digest('hex').slice(0, 10);
      let sw = readFileSync(swPath, 'utf8');
      const core = /const CORE = \[[\s\S]*?\n\];/, ver = /const VERSION = '[^']*';/;
      if (!core.test(sw) || !ver.test(sw)) throw new Error('sw.js layout changed: cannot regenerate CORE/VERSION');
      sw = sw.replace(core, () => 'const CORE = [\n' + files.map((f) => `  '${f}'`).join(',\n') + '\n];').replace(ver, () => `const VERSION = '${version}';`);
      writeFileSync(swPath, sw);
      writeFileSync(resolve(out, 'sw_precache.json'), JSON.stringify({ version, files }, null, 1));
    } },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [copyLegacyStatic(), generateServiceWorker()],
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', minify: false, assetsInlineLimit: 0 },
});
