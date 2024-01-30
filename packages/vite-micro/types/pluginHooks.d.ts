import { Plugin as VitePlugin } from 'vite'
import type { TransformResult as TransformResult_2 } from 'rollup'

export interface PluginHooks extends VitePlugin {
  virtualFile?: Record<string, unknown>
  transform: (
    this: TransformPluginContext,
    code: string,
    id: string,
    options?: {
      ssr?: boolean
    }
  ) => Promise<TransformResult_2> | TransformResult_2
}
