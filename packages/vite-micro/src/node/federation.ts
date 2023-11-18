import federation from '@originjs/vite-plugin-federation'
import type { ConfigEnv, Plugin, UserConfig, ViteDevServer, ResolvedConfig } from 'vite'
import path from 'path'
import fs from 'fs-extra'
import { federationFnImportFunc } from './__federation_fn_import'
import { transform, parseSharedToShareMap } from './transformShareImport'
import type { federationOptions, RemotesOption } from '../../types'
import host from './hostAddress'

const virtualModuleId = '__remoteEntryHelper__'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const shareVirsualModuleId = 'virtual:__federation_fn_import'
const resolveShareVirsualModuleId = '\0' + shareVirsualModuleId

const federationDefaultOption = {
  isRootService: true, // 判断启动服务器的模式，是否为按需启动的模式
  shared: [],
}

function normalizePath(id: any) {
  return path.posix.normalize(id.replace(/\\/g, '/'))
}

function getRemoteEntryFile(options: federationOptions, viteConfig: UserConfig) {
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

function generateCommonRemoteEntryFile(version: string) {
  return `
    export * from './${version}/remoteEntry.js'
  `
}

function getDevRemoteFileUrl(options: federationOptions | { remotes: any }, remoteName: string, base: string) {
  // 这里外部其他项目组件引入配置devUrl
  const { devUrl, url, filename } = options.remotes[remoteName]

  if (devUrl) return `${devUrl}/@id/__remoteEntryHelper__`

  if (url.startsWith('http')) return url + `/${filename || 'remoteEntrys.js'}?version=v${Date.now()}`

  return `${host}/${base}/@id/__remoteEntryHelper__`
}

function parseRemotes(options: federationOptions) {
  const remotes = options.remotes || {}
  Object.keys(remotes).forEach((remoteName) => {
    let base = remoteName.split('Remote')[0]

    if (options.mode === 'development') {
      remotes[remoteName].external = getDevRemoteFileUrl(options, remoteName, base)
    } else {
      remotes[remoteName].url = remotes[remoteName].url || `/assets/${base}`
      remotes[remoteName].external =
        remotes[remoteName].external ||
        remotes[remoteName].url + `/${remotes[remoteName].filename || 'remoteEntrys.js'}?version=v${Date.now()}`
    }
    remotes[remoteName].from = 'vite'
    remotes[remoteName].format = 'esm'
  })

  return remotes
}

function parseExposes(options: federationOptions) {
  options.exposes = options.exposes || {}
  let exposes = {}
  Object.keys(options.exposes).forEach((exposesName) => {
    //@ts-ignore
    exposes['./' + exposesName] = options.exposes[exposesName]
  })
  return exposes
}

export function federationMicro(options: federationOptions): Plugin {
  let viteConfig: UserConfig = {}

  options = Object.assign(federationDefaultOption, options)

  if (options.remotes) {
    options.remotes = parseRemotes(options)
  }

  if (options.exposes) {
    options.exposes = parseExposes(options)
  }

  const federationPlugin = federation(options)

  /**
   * 重构config
   */
  const federationConfigFunc = federationPlugin.config
  federationPlugin.config = function config(config: UserConfig, env: ConfigEnv) {
    viteConfig = config
    federationConfigFunc.call(this, config, env)
  }

  /**
   * 如果是生产环境，则打包结束后，生成一个具有版本管理功能的入口文件
   */
  if (options.mode !== 'development') {
    federationPlugin.closeBundle = function (value: any) {
      if (options.exposes) {
        if (!viteConfig?.build?.assetsDir) throw new Error('需要配置build/assetsDir')
        if (!viteConfig?.build?.outDir) throw new Error('需要配置build/outDir')

        const dirArrs = viteConfig.build.assetsDir.split('/')
        const version = dirArrs[dirArrs.length - 1]
        const commonRemotePath = path.resolve(viteConfig.build.outDir + '/' + viteConfig.build.assetsDir, '../remoteEntrys.js')
        fs.ensureDir(path.resolve(viteConfig.build.outDir + '/' + viteConfig.build.assetsDir), () => {
          fs.writeFileSync(commonRemotePath, generateCommonRemoteEntryFile(version))
        })
      }
    }
  }

  if (options.mode === 'development') {
    /**
     * 重写插件的resolveId方法
     */
    const resolveIdFunc = federationPlugin.resolveId
    federationPlugin.resolveId = (...args: string[]) => {
      if (args[0] === virtualModuleId) {
        return resolvedVirtualModuleId
      }

      if (args[0] === shareVirsualModuleId) {
        return resolveShareVirsualModuleId
      }

      return resolveIdFunc(...args)
    }

    const sharedMap = parseSharedToShareMap(options.shared || [])
    const federationFnImport = federationFnImportFunc(sharedMap)

    const loadFunc = federationPlugin.load
    federationPlugin.load = (...args: string[]) => {
      if (args[0] === resolvedVirtualModuleId) return getRemoteEntryFile(options, viteConfig)

      if (args[0] === resolveShareVirsualModuleId) return federationFnImport

      return loadFunc(args[0])
    }

    const transformFunc = federationPlugin.transform
    federationPlugin.transform = function (code: string, id: string) {
      const result = transform(this, code, id, options)

      if (result) {
        if (transformFunc) return transformFunc.call(this, result.code, id)
        return result
      }

      if (transformFunc) return transformFunc.call(this, code, id)

      return code
    }
  }

  return federationPlugin
}
