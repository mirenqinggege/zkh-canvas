import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['renderer/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: false, // 关闭 sourcemap，减小包体积约 370KB
  clean: true,
  outDir: 'dist',
  minify: true, // 启用代码压缩，进一步减小体积
  terserOptions: {
    compress: {
      drop_console: true, // 移除 console.log
      drop_debugger: true, // 移除 debugger
      pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除这些函数调用
    },
    format: {
      comments: false, // 移除注释
    },
  },
  external: [],
});