import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file, so the prototype can be emailed or opened offline.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  test: { environment: 'node' },
} as never);
