import type { ConfigEnv, Plugin, UserConfig, PluginOption, ViteDevServer, ResolvedConfig } from 'vite'
import path from 'path'
import type { federationOptions, RemotesOption } from '../../types'
import host from './hostAddress'
import devFederation from './vite-plugin-federaion/index'

const federationDefaultOption = {
  isRootService: true, // 判断启动服务器的模式，是否为按需启动的模式
  shared: [],
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

export function federationMicro(options: federationOptions): PluginOption {
  let viteConfig: UserConfig = {}
  let viteConfigFunc: Function | null = null

  options = Object.assign(federationDefaultOption, options)

  if (options.remotes) {
    options.remotes = parseRemotes(options)
  }

  if (options.exposes) {
    options.exposes = parseExposes(options)
  }

  return devFederation(options)
}
