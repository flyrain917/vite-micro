import type { federationOptions, RemotesOption } from 'types'
import host from '../../../../hostAddress'
import { parseOptions } from '../../../utils'
import type { ConfigTypeSet, Exposes, Remotes, RemotesConfig, Shared, VitePluginFederationOptions } from 'types/federation'

export function parseRemotes(options: federationOptions): VitePluginFederationOptions {
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

  options.remotes = remotes

  return options as VitePluginFederationOptions
}

export function getDevRemoteFileUrl(options: federationOptions | { remotes: any }, remoteName: string, base: string) {
  // 这里外部其他项目组件引入配置devUrl
  const { devUrl, url, filename } = options.remotes[remoteName]

  if (devUrl) return `${devUrl}/@id/__remoteEntryHelper__`

  if (url.startsWith('http')) return url + `/${filename || 'remoteEntrys.js'}?version=v${Date.now()}`

  return `${host}/${base}/@id/__remoteEntryHelper__`
}

export function parseRemoteOptions(options: federationOptions): [string, string | ConfigTypeSet][] {
  const federationOptions: VitePluginFederationOptions = parseRemotes(options)
  return parseOptions(
    options.remotes ? options.remotes : {},
    (item) => ({
      external: Array.isArray(item) ? item : [item],
      shareScope: federationOptions.shareScope || 'default',
      format: 'esm',
      from: 'vite',
      externalType: 'url',
    }),
    (item) => ({
      external: Array.isArray(item.external) ? item.external : [item.external],
      shareScope: item.shareScope || federationOptions.shareScope || 'default',
      format: item.format || 'esm',
      from: item.from ?? 'vite',
      externalType: item.externalType || 'url',
    })
  )
}

export type Remote = { id: string; regexp: RegExp; config: RemotesConfig }

export function createRemotesMap(remotes: Remote[]): string {
  const createUrl = (remote: Remote) => {
    const external = remote.config.external[0]
    const externalType = remote.config.externalType
    if (externalType === 'promise') {
      return `()=>${external}`
    } else {
      return `'${external}'`
    }
  }
  return `const remotesMap = {
  ${remotes
    .map((remote) => `'${remote.id}':{url:${createUrl(remote)},format:'${remote.config.format}',from:'${remote.config.from}'}`)
    .join(',\n  ')}
  };`
}
