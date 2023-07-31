import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/node/index'],
  clean: true,
  declaration: true,
  failOnWarn: false,
  outDir: 'dist/node',
  rollup: {
    emitCJS: true,
  },
})
