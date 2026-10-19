// Builds src/storage/browser.ts into the classic script ./zz-store.js (IIFE, no module syntax) that the legacy-generated page loads before its inline scripts.
// zz-store.js is committed (like welcome.js) because the legacy deploy publishes repo files without running npm. tools/tests verify it is not stale.
import { defineConfig } from 'vite';
export default defineConfig({
  publicDir: false,
  build: {
    outDir: '.', emptyOutDir: false, minify: false, target: 'es2022', copyPublicDir: false,
    lib: { entry: 'src/storage/browser.ts', formats: ['iife'], name: 'zzStoreBundle', fileName: () => 'zz-store.js' },
  },
});
