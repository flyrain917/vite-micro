import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import { readFileSync } from 'fs'
import type { ConfigTypeSet, SharedConfig } from '../../../types'
import { createRemotesMap, getFileExtname, getModuleMarker, normalizePath, REMOTE_FROM_PARAMETER } from '../../../utils'

export async function handleShareVersion(this: TransformPluginContext, devShared: [string, string | ConfigTypeSet][]) {
  for (const arr of devShared) {
    const config = arr[1] as SharedConfig
    if (!config.version && !config.manuallyPackagePathSetting) {
      const packageJsonPath = (await this.resolve(`${arr[0]}/package.json`))?.id
      if (!packageJsonPath) {
        this.error(
          `No description file or no version in description file (usually package.json) of ${arr[0]}(${packageJsonPath}). Add version to description file, or manually specify version in shared config.`
        )
      } else {
        const json = JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' }))
        config.version = json.version
      }
    }
  }
}

export async function devSharedScopeCode(
  this: TransformPluginContext,
  shared: [string, string | ConfigTypeSet][],
  viteDevServer
): Promise<string[]> {
  await handleShareVersion.call(this, shared)

  const res: string[] = []
  if (shared.length) {
    const serverConfiguration = viteDevServer.config.server
    const cwdPath = normalizePath(process.cwd())

    for (const item of shared) {
      const obj = item[1] as SharedConfig
      const moduleInfo = await this.resolve(obj.packagePath as string, undefined, {
        skipSelf: true,
      })

      if (!moduleInfo) continue

      const moduleFilePath = normalizePath(moduleInfo.id)
      const idx = moduleFilePath.indexOf(cwdPath)

      const relativePath = idx === 0 ? moduleFilePath.slice(cwdPath.length) : null

      const sharedName = item[0]

      let str = ''
      if (typeof obj === 'object') {
        const origin = serverConfiguration.origin
        const pathname = relativePath ?? `/@fs/${moduleInfo.id}`
        const url = origin ? `'${origin}${pathname}'` : `window.location.origin+'${pathname}'`
        str += `get:()=> get(${url}, ${REMOTE_FROM_PARAMETER})`
        res.push(`'${sharedName}':{'${obj.version}':{${str}}}`)
      }
    }
  }
  return res
}
