import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import type { Remote } from './parseRemotes'
import type { SharedOption, federationOptions } from '../../../../../../types'

export function transformImportForRemote(this: TransformPluginContext, code: string, remotes: Remote[], devShared: any) {
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
  const hasStaticImported = new Map<string, string>()

  let requiresRuntime = false
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

      if (
        (node.type === 'ImportExpression' || node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration') &&
        node.source?.value?.indexOf('/') > -1
      ) {
        const moduleId = node.source.value
        const remote = remotes.find((r) => r.regexp.test(moduleId))
        const needWrap = remote?.config.from === 'vite'
        if (remote) {
          requiresRuntime = true
          const modName = `.${moduleId.slice(remote.id.length)}`
          switch (node.type) {
            case 'ImportExpression': {
              magicString.overwrite(
                node.start,
                node.end,
                `__federation_method_getRemote(${JSON.stringify(remote.id)} , ${JSON.stringify(
                  modName
                )}).then(module=>__federation_method_wrapDefault(module, ${needWrap}))`
              )
              break
            }
            case 'ImportDeclaration': {
              if (node.specifiers?.length) {
                const afterImportName = `__federation_var_${moduleId.replace(/[@/\\.-]/g, '')}`
                if (!hasStaticImported.has(moduleId)) {
                  magicString.overwrite(
                    node.start,
                    node.end,
                    `const ${afterImportName} = await __federation_method_getRemote(${JSON.stringify(remote.id)} , ${JSON.stringify(
                      modName
                    )});`
                  )
                  hasStaticImported.set(moduleId, afterImportName)
                }
                let deconstructStr = ''
                node.specifiers.forEach((spec) => {
                  // default import , like import a from 'lib'
                  if (spec.type === 'ImportDefaultSpecifier') {
                    magicString.appendRight(node.end, `\n let ${spec.local.name} = __federation_method_unwrapDefault(${afterImportName}) `)
                  } else if (spec.type === 'ImportSpecifier') {
                    //  like import {a as b} from 'lib'
                    const importedName = spec.imported.name
                    const localName = spec.local.name
                    deconstructStr += `${importedName === localName ? localName : `${importedName} : ${localName}`},`
                  } else if (spec.type === 'ImportNamespaceSpecifier') {
                    //  like import * as a from 'lib'
                    magicString.appendRight(node.end, `let {${spec.local.name}} = ${afterImportName}`)
                  }
                })
                if (deconstructStr.length > 0) {
                  magicString.appendRight(node.end, `\n let {${deconstructStr.slice(0, -1)}} = ${afterImportName}`)
                }
              }
              break
            }
            case 'ExportNamedDeclaration': {
              // handle export like export {a} from 'remotes/lib'
              const afterImportName = `__federation_var_${moduleId.replace(/[@/\\.-]/g, '')}`
              if (!hasStaticImported.has(moduleId)) {
                hasStaticImported.set(moduleId, afterImportName)
                magicString.overwrite(
                  node.start,
                  node.end,
                  `const ${afterImportName} = await __federation_method_getRemote(${JSON.stringify(remote.id)} , ${JSON.stringify(
                    modName
                  )});`
                )
              }
              if (node.specifiers.length > 0) {
                const specifiers = node.specifiers
                let exportContent = ''
                let deconstructContent = ''
                specifiers.forEach((spec) => {
                  const localName = spec.local.name
                  const exportName = spec.exported.name
                  const variableName = `${afterImportName}_${localName}`
                  deconstructContent = deconstructContent.concat(`${localName}:${variableName},`)
                  exportContent = exportContent.concat(`${variableName} as ${exportName},`)
                })
                magicString.append(`\n const {${deconstructContent.slice(0, deconstructContent.length - 1)}} = ${afterImportName}; \n`)
                magicString.append(`\n export {${exportContent.slice(0, exportContent.length - 1)}}; `)
              }
              break
            }
          }
        }
      }
    },
  })

  if (requiresRuntime) {
    magicString.prepend(
      `import {__federation_method_ensure, __federation_method_getRemote , __federation_method_wrapDefault , __federation_method_unwrapDefault} from '__federation__';\n\n`
    )
  }

  if (hasImportShared) {
    magicString.prepend(`import {importShared} from 'virtual:__federation_fn_import';\n`)
  }

  if (requiresRuntime || hasImportShared || modify) {
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
