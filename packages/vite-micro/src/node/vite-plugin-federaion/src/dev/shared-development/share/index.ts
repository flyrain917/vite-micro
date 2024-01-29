import type { Alias, Plugin } from 'vite'
import { NAME_CHAR_REG, removeNonRegLetter, isObject } from '../../../../utils'
import { CACHE_DIR, NODE_MODULES_FLAG } from './constant'
import path from 'path'
import { emptyDirSync, ensureDir, ensureFile, writeFile } from 'fs-extra'
import type { ConfigTypeSet, Exposes, Remotes, RemotesConfig, Shared, VitePluginFederationOptions } from '../../../../types'

export async function handleConfigAlias(config, shares: [string, string | ConfigTypeSet][]) {
  const newAlias: Alias[] = []
  const alias = config.resolve?.alias ?? {}
  if (isObject(alias)) {
    Object.keys(alias).forEach((aliasKey) => {
      newAlias.push({ find: aliasKey, replacement: (alias as Record<string, string>)[aliasKey] })
    })
  } else if (Array.isArray(alias)) {
    newAlias.push(...alias)
  }

  const cachePath = path.join(process.cwd(), NODE_MODULES_FLAG, CACHE_DIR)

  await ensureDir(cachePath)
  await emptyDirSync(cachePath)

  shares.forEach(async (sharesItem) => {
    const externalKey = sharesItem[0]
    const externalCachePath = path.join(cachePath, `SHARE_HELPER_${externalKey}.js`)

    newAlias.push({
      find: new RegExp(`^${externalKey}$`),
      replacement: externalCachePath,
    })
    await ensureFile(externalCachePath)
    await writeFile(externalCachePath, `module.exports = window['${externalKey}']`)
  })

  config.resolve = config.resolve || {}
  config.resolve.alias = newAlias
}

// export function transform

/**
 * // optimizeDeps.esbuildOptions
 * 
 * import * as esbuild from 'esbuild'
import fs from 'node:fs'

let exampleOnLoadPlugin = {
  name: 'example',
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.txt$/ }, async (args) => {
      let text = await fs.promises.readFile(args.path, 'utf8')
      return {
        contents: JSON.stringify(text.split(/\s+/)),
        loader: 'json',
      }
    })
  },
}

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  outfile: 'out.js',
  plugins: [exampleOnLoadPlugin],
})
 */
