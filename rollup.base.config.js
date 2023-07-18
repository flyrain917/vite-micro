import babel from '@rollup/plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import commonjs from 'rollup-plugin-commonjs'

export default configs => {
  return configs.map(config => {
    return {
      input: config.input,
      output: {
        name: config.name,
        file: config.file,
        format: config.format || 'cjs',
        sourcemap: false,
        exports: 'named',
      },

      external: ['axios', 'vue', 'antd'],

      experimentalCodeSplitting: true,
      plugins: [
        resolve(), 
        commonjs(), 
        babel({
          babelHelpers: 'bundled',
          exclude: ['node_modules/**'],
        }),
        config.env === 'prod' && terser(),
      ],
    }
  })
}
