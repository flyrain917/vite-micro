import { cac } from 'cac' // 命令行工具:  node micro.js rm div --version
import colors from 'picocolors' // cmd color

const cli = cac('micro')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  c?: boolean | string
  config?: string
  base?: string
  clearScreen?: boolean
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  force?: boolean
}

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions<Options extends GlobalCLIOptions>(options: Options): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options }
  delete ret['--']
  delete ret.c
  delete ret.config
  delete ret.base
  delete ret.clearScreen
  delete ret.d
  delete ret.debug
  delete ret.f
  delete ret.filter
  delete ret.m
  delete ret.mode
  return ret
}

// dev
cli
  .command('[root]', 'start dev server') // default command
  .alias('serve')
  .action(async (root: string, options: GlobalCLIOptions) => {
    // output structure is preserved even after bundling so require()
    // is ok here
    const { createServer } = await import('./server')
    try {
      const { app } = await createServer()

      if (!app.httpServer) {
        throw new Error('HTTP server not available')
      }

      app.listen(8080, () => {
        console.log('http://localhost:8080')
      })
    } catch (e) {
      process.exit(1)
    }
  })
