import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file, so the prototype can be emailed or opened offline.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  // Build copies and test output change while the dev server runs (npm run e2e rebuilds dist-e2e-*);
  // watching them crashed the dev server on Windows when a file was still locked.
  server: { watch: { ignored: ['**/dist*/**', '**/test-results/**', '**/playwright-report/**'] } },
  test: { environment: 'node' },
} as never);
