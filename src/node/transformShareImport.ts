import type { AcornNode, TransformPluginContext } from 'rollup'
import MagicString from 'magic-string'
import { walk } from 'estree-walker'
import type { SharedOption, federationOptions } from '../../types'

export function transform(self: TransformPluginContext, code: string, id: string, config: federationOptions) {
  let ast: AcornNode | null = null
  const shared = config.shared || []
  try {
    ast = self.parse(code)
  } catch (err) {
    console.error(err)
  }
  if (!ast) {
    return null
  }

  const magicString = new MagicString(code)
  const hasStaticImported = new Map<string, string>()
  let hasImportShared = false
  let modify = false

  // @ts-ignore
  walk(ast, {
    enter(node: any) {
      // handle share, eg. replace import {a} from b  -> const a = importShared('b')
      if (node.type === 'ImportDeclaration') {
        const moduleName = node.source.value
        if (shared.some((sharedInfo: string | SharedOption) => sharedInfo === moduleName)) {
          const namedImportDeclaration: (string | never)[] = []
          let defaultImportDeclaration: string | null = null
          if (!node.specifiers?.length) {
            // invalid import , like import './__federation_shared_lib.js' , and remove it
            magicString.remove(node.start, node.end)
            modify = true
          } else {
            node.specifiers.forEach((specify: any) => {
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
              magicString.overwrite(node.start, node.end, line)
            } else if (defaultImportDeclaration) {
              magicString.overwrite(node.start, node.end, `const ${defaultImportDeclaration} = await importShared('${moduleName}');\n`)
            } else if (namedImportDeclaration.length) {
              magicString.overwrite(
                node.start,
                node.end,
                `const {${namedImportDeclaration.join(',')}} = await importShared('${moduleName}');\n`
              )
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

interface OptionType {}

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
