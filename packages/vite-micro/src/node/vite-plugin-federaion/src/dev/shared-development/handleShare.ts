import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import { readFileSync } from 'fs'
import type { ConfigTypeSet, SharedConfig } from 'types/federation'
import type { SharedOption, federationOptions } from 'types'
import { createRemotesMap, getFileExtname, getModuleMarker, normalizePath, REMOTE_FROM_PARAMETER } from '../../../utils'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'

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

export function parseSharedToShareMap(sharedOption: SharedOption[] | []) {
  let modulesMap = `
    {
  `
  sharedOption.forEach((shared) => {
    if (typeof shared === 'string') {
      modulesMap += `${shared}: {
            get: () => import('${shared}'),
        },`
    } else {
      modulesMap += `${shared.name}: {
            get: () => import('${shared.name}'),
            requiredVersion: ${shared.requiredVersion}
        },`
    }
  })

  modulesMap += '}'

  return modulesMap
}

export function transformImportForSahre(this: TransformPluginContext, code: string, devShared: [string, string | ConfigTypeSet][]) {
  let ast: AcornNode | null = null
  try {
    ast = this.parse(code)
  } catch (err) {
    console.error(err)
  }
  if (!ast) {
    return null
  }

  const magicString = new MagicString(code)

  let hasImportShared = false
  let modify = false

  walk(ast as any, {
    enter(node: any) {
      // handle share, eg. replace import {a} from b  -> const a = importShared('b')
      if (node.type === 'ImportDeclaration') {
        let moduleName = node.source.value
        if (devShared.some((sharedInfo) => sharedInfo[0] === moduleName)) {
          const namedImportDeclaration: (string | never)[] = []
          let defaultImportDeclaration: string | null = null
          if (!node.specifiers?.length) {
            // invalid import , like import './__federation_shared_lib.js' , and remove it
            magicString.remove(node.start, node.end)
            modify = true
          } else {
            node.specifiers.forEach((specify) => {
              if (specify.imported?.name) {
                namedImportDeclaration.push(
                  `${
                    specify.imported.name === specify.local.name ? specify.imported.name : `${specify.imported.name}:${specify.local.name}`
                  }`
                )
              } else {
                defaultImportDeclaration = specify.local.name
              }
            })

            hasImportShared = true

            if (defaultImportDeclaration && namedImportDeclaration.length) {
              // import a, {b} from 'c' -> const a = await importShared('c'); const {b} = a;
              const imports = namedImportDeclaration.join(',')
              const line = `const ${defaultImportDeclaration} = await importShared('${moduleName}');\nconst {${imports}} = ${defaultImportDeclaration};\n`
              // magicString.overwrite(node.start, node.end, line)
              magicString.overwrite(node.start, node.end, '')
              magicString.prepend(line)
            } else if (defaultImportDeclaration) {
              // magicString.overwrite(node.start, node.end, `const ${defaultImportDeclaration} = await importShared('${moduleName}');\n`)
              magicString.overwrite(node.start, node.end, '')
              magicString.prepend(`const ${defaultImportDeclaration} = await importShared('${moduleName}');\n`)
            } else if (namedImportDeclaration.length) {
              magicString.overwrite(node.start, node.end, '')
              magicString.prepend(`const {${namedImportDeclaration.join(',')}} = await importShared('${moduleName}');\n`)
              // magicString.overwrite(
              //   node.start,
              //   node.end,
              //   `const {${namedImportDeclaration.join(',')}} = await importShared('${moduleName}');\n`
              // )
            }
          }
        }
      }
    },
  })

  if (hasImportShared) {
    magicString.prepend(`import {importShared} from 'virtual:__federation_fn_import';\n`)
  }

  if (hasImportShared || modify) {
    return {
      code: magicString.toString(),
      map: magicString.generateMap({ hires: true }),
    }
  }
}
