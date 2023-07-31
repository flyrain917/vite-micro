import { createNodeConfig, createClientConfig } from './rollup.base.config'

export default [
  // createNodeConfig({ input: 'src/node/index.ts' }),
  createNodeConfig({ input: 'src/node/cli.ts', isCli: true }),
  createClientConfig({ input: 'src/client/index.ts', file: 'dist/client/index.js' }),
]
