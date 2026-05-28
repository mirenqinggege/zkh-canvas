import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['renderer/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  minify: false,
  external: [],
});