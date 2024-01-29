export default function getShareTemplate(moduleName) {
  return `
    import {importShared} from '\0virtual:__federation_fn_import';\n

    const shareModule = await importShared('${moduleName}')

    export default shareModule
    `
}
