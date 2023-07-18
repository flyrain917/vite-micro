import rollup from './rollup.base.config'

export default rollup([
  { input: 'src/index.js', file: 'lib/index.js', env: 'prod' },
  { input: 'src/index.js', file: 'lib/index.dev.js' },
  { input: 'src/qiyu.js', file: 'lib/qiyu.js', env: 'prod' },
  { input: 'src/qiyu.js', file: 'lib/qiyu.dev.js' },
  { input: 'src/geetest/index.js', file: 'lib/geetest.js', env: 'prod' },
  { input: 'src/geetest/index.js', file: 'lib/geetest.dev.js' },
  { input: 'src/esign-jssdk/index.js', file: 'lib/esign-jssdk.js', env: 'prod' },
  { input: 'src/esign-jssdk/index.js', file: 'lib/esign-jssdk.dev.js' },

  // { input: 'src/geetest/index.js', file: 'lib/geetest.dev.js', format: 'esm', name: 'geetest.dev.js' },
])
