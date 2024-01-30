import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import type { Remote } from './parseRemotes'

export function transformImportForRemote(this: TransformPluginContext, code: string, remotes: Remote[]) {
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
  let modify = false

  walk(ast as any, {
    enter(node: any) {
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

  if (requiresRuntime || modify) {
    return {
      code: magicString.toString(),
      map: magicString.generateMap({ hires: true }),
    }
  }
}
