import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['./src/node/index.ts'],
      formats: ['es', 'cjs'],
    },
    outDir: 'dist/node',
    target: 'node14',
    minify: false,
    rollupOptions: {
      external: ['rollup', 'fs', 'fs-extra', 'os', 'path', 'crypto', 'magic-string', '@originjs/vite-plugin-federation'],
      output: {
        minifyInternalExports: false,
      },
    },
  },
})
