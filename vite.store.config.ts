// Builds TypeScript entries into classic IIFE scripts at the repo root, which the legacy-generated page loads with plain <script src>.
// Outputs are COMMITTED (the legacy deploy publishes repo files without running npm); tools/tests verify they are not stale.
// ZZ_ENTRY picks one entry; `npm run build:classic` builds them all.
import { defineConfig } from 'vite';
export const ENTRIES: Record<string, { entry: string; file: string }> = {
  store: { entry: 'src/storage/browser.ts', file: 'zz-store.js' },
  welcome: { entry: 'src/legacy/welcome.ts', file: 'welcome.js' },
};
const e = ENTRIES[process.env['ZZ_ENTRY'] ?? 'store']!;
export default defineConfig({
  publicDir: false,
  build: {
    outDir: process.env['ZZ_OUT'] ?? '.', emptyOutDir: false, minify: false, target: 'es2022', copyPublicDir: false,
    lib: { entry: e.entry, formats: ['iife'], name: 'zzClassic_' + (process.env['ZZ_ENTRY'] ?? 'store'), fileName: () => e.file },
  },
});
