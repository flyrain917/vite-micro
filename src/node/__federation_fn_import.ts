export const federationFnImportFunc = (moduleMapStr: string) => `
import { importSharedMicro } from 'vite-micro/client'



export async function importShared(name, shareScope = 'default') {

    if (!window._federation_shared_moduleMap) {
        window._federation_shared_moduleMap = ${moduleMapStr}
    } 

    return importSharedMicro(name, window._federation_shared_moduleMap, shareScope)
}
`
