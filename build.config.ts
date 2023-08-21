import { defineBuildConfig } from 'unbuild'
import pkg from './package.json'

// externals 不好使，所以废弃

export default defineBuildConfig({
  entries: ['src/node/index'],
  clean: true,
  declaration: true,
  failOnWarn: false,
  outDir: 'dist/node',
  externals: [], //['path', ...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)].filter((item) => item !== 'estree-walker'),
  rollup: {
    emitCJS: true,
  },
})
