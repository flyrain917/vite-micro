import type { federationOptions, RemotesOption } from 'types'
import host from '../../../../hostAddress'
import { parseOptions } from '../../../utils'
import type { ConfigTypeSet, Exposes, Remotes, RemotesConfig, Shared, VitePluginFederationOptions } from 'types/federation'

export function parseSharedOptions(options: VitePluginFederationOptions): [string, string | ConfigTypeSet][] {
  const shared = parseOptions(
    options.shared || {},
    (value, key) => ({
      import: true,
      shareScope: 'default',
      packagePath: key,
      // Whether the path is set manually
      manuallyPackagePathSetting: false,
      generate: true,
    }),
    (value, key) => {
      value.import = value.import ?? true
      value.shareScope = value.shareScope || 'default'
      value.packagePath = value.packagePath || key
      value.manuallyPackagePathSetting = value.packagePath !== key
      value.generate = value.generate ?? true
      return value
    }
  )

  return shared
}
