import type { federationOptions, RemotesOption } from '../../../types'
import type { ConfigEnv, Plugin, UserConfig, ViteDevServer, ResolvedConfig } from 'vite'
import { normalizePath } from '../vite-plugin-federaion/utils'
import path from 'path'

export function getRemoteEntryFile(options: federationOptions, viteConfig: UserConfig) {
  if (!options.exposes) return ''
  if (!viteConfig.root) return ''

  let moduleMap = ''
  const exposes = options.exposes || {}

  Object.keys(options.exposes).forEach((item) => {
    const exposeFilepath = normalizePath(path.resolve(viteConfig.root || '', exposes[item]))
    moduleMap += `\n"${item}":()=> import('${exposeFilepath}').then(module => () => module),`
  })

  return `
        const exportSet = new Set(['Module', '__esModule', 'default', '_export_sfc']);
        let moduleMap = {${moduleMap}}
        const seen = {}
  
        export const get =(module) => {
          return moduleMap[module]();
        };
        export const init =(shareScope) => {
          globalThis.__federation_shared__= globalThis.__federation_shared__|| {};
          Object.entries(shareScope).forEach(([key, value]) => {
            const versionKey = Object.keys(value)[0];
            const versionValue = Object.values(value)[0];
            const scope = versionValue.scope || 'default'
            globalThis.__federation_shared__[scope] = globalThis.__federation_shared__[scope] || {};
            const shared= globalThis.__federation_shared__[scope];
            (shared[key] = shared[key]||{})[versionKey] = versionValue;
          });
        }`
}
