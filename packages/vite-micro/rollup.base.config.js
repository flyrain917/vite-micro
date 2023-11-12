// import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
// import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import pkg from './package.json'
import path from 'path'

export function createNodeConfig(config) {
  return {
    input: config.input,
    output: {
      dir: 'dist/node',
      name: config.name,
      // file: config.file,
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },

    external: ['fs', 'path', ...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)],

    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      commonjs(),
      config.isCli &&
        copy({
          targets: [
            {
              src: './src/bin',
              dest: 'dist',
            },
          ],
        }),
      // babel({
      //   babelHelpers: 'bundled',
      //   exclude: ['node_modules/**'],
      // }),
      // config.env === 'prod' && terser(),
    ],
  }
}

export function createClientConfig(config) {
  return {
    input: config.input,
    output: {
      name: config.name,
      file: config.file,
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },

    external: ['vue', '__federation__'],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      commonjs(),
      // babel({
      //   babelHelpers: 'bundled',
      //   exclude: ['node_modules/**'],
      // }),
      // config.env === 'prod' && terser(),
    ],
  }
}
