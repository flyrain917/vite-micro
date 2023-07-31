import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import viteCompression from 'vite-plugin-compression'

import path from 'path'
import packageJson from './package.json'
import { federation } from 'vite-micro/dist/node/index'

const HOST = '0.0.0.0'

export default ({ mode, root, base }) => {
  return defineConfig({
    base: '/',
    root: root || './',
    publicDir: '../../public/',
    build: {
      mode,
      // target: 'modules',
      target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
      outDir: `${path.resolve(__dirname, '../../dist')}`,
      assetsDir: `assets/main/${packageJson.version}`,
      sourcemap: mode !== 'production',
      minify: false, //mode !== 'development' ? 'esbuild' : false, // 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        input: root ? '../../index.html' : '',
        // external: ['vue', 'vue-router', 'vuex'],
        // input: {
        //   // main: `${path.resolve(__dirname, './src/main.ts')}`,
        // },
      },
    },
    optimizedeps: {
      esbuildoptions: {
        target: 'esnext',
      },
    },
    server: {
      host: HOST,
      port: 3001, //process.env.PORT,
      fs: {
        strict: false,
        allow: ['../packages'],
      },
    },
    css: {
      devSourcemap: true, // 不启用这个，vite对带css的vue文件不支持sourcemap
      preprocessorOptions: {
        // less: {
        //   modifyVars: theme,
        //   javascriptEnabled: true,
        // },
      },
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: `${path.resolve(__dirname, 'src')}`,
        },
      ],
    },
    plugins: [
      vue({
        jsx: true,
      }),

      vueJsx(),

      federation({
        base: '/main',
        mode,
        remotes: {
          loginRemote: {
            url: `/assets/login`,
          },
          userRemote: {
            url: '/assets/user',
          },
        },
        shared: ['vue'],
      }),

      // mode !== 'development' && viteCompression(),
    ],
  })
}
