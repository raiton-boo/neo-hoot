import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['reflect-metadata'],
  },
  plugins: [swc.vite()],
});
