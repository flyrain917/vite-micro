import { ConfigEnv, loadEnv, UserConfig, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import viteCompression from 'vite-plugin-compression'

import path from 'path'
import packageJson from './package.json'
import { federation } from 'vite-micro/dist/node/index'

const HOST = '0.0.0.0'

export default ({ mode, root, base }) => {
  return defineConfig({
    base: base || './',
    root: root || './',
    build: {
      // target: 'modules',
      target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
      outDir: `${path.resolve(__dirname, '../../dist')}`,
      assetsDir: `assets/login/${packageJson.version}`,
      sourcemap: mode !== 'production',
      minify: false, //mode !== 'development' ? 'esbuild' : false, // 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        // input: [['test.html', `${path.resolve(__dirname, './index.html')}`]],
        input: {
          main: `${path.resolve(__dirname, './src/main.ts')}`,
        },
        output: {
          minifyInternalExports: false,
          plugins: [],
        },
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
        base,
        mode,
        exposes: {
          //远程模块对外暴露的组件列表,远程模块必填
          entry: './src/bootstrap.ts',
        },
        shared: ['vue'], //本地模块和远程模块共享的依赖。本地模块需配置所有使用到的远端模块的依赖；远端模块需要配置对外提供的组件的依赖。
      }),

      // mode !== 'development' && viteCompression(),
    ],
  })
}
