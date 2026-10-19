// Builds TypeScript entries into classic IIFE scripts at the repo root, which the legacy-generated page loads with plain <script src>.
// Outputs are COMMITTED (the legacy deploy publishes repo files without running npm); tools/tests verify they are not stale.
// ZZ_ENTRY picks one entry; `npm run build:classic` builds them all.
import { defineConfig } from 'vite';
export const ENTRIES: Record<string, { entry: string; file: string; generatedBanner?: boolean }> = {
  store: { entry: 'src/storage/browser.ts', file: 'zz-store.js' },
  welcome: { entry: 'src/legacy/welcome.ts', file: 'welcome.js' },
  // inlined into index.html by tools/ui_patch.py / tools/nav_patch.py; (output has no "use strict", matching the sloppy-mode inline scripts they replace)
  home: { entry: 'src/legacy/home.ts', file: 'tools/home.js', generatedBanner: true },
  textbook: { entry: 'src/legacy/textbook.ts', file: 'tools/textbook.js', generatedBanner: true },
};
const e = ENTRIES[process.env['ZZ_ENTRY'] ?? 'store']!;
export default defineConfig({
  publicDir: false,
  build: {
    outDir: process.env['ZZ_OUT'] ?? '.', emptyOutDir: false, minify: false, target: 'es2022', copyPublicDir: false,
    rollupOptions: { output: e.generatedBanner ? { banner: '/* GENERATED from ' + e.entry + ' by `npm run build:classic`. Edit the .ts, not this file. */' } : {} },
    lib: { entry: e.entry, formats: ['iife'], name: 'zzClassic_' + (process.env['ZZ_ENTRY'] ?? 'store'), fileName: () => e.file },
  },
});
