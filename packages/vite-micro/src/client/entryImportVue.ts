import { defineComponent, h } from 'vue'
import { remoteImport, splitName } from './import'
import { createShadow, deleteShadow } from './shadow'
import type { ImportCompConfig } from '../../types/client'

interface RemoteEntry {
  mount?: Function
  unMount?: Function
}

/**
 *
 * @param name : '{remoteName}/{remoteScript}'
 * @param config
 * @returns
 */
export function getComp(name: string, config: ImportCompConfig) {
  const [remoteName, remoteScript] = splitName(name)

  if (!config) config = {}
  config.remoteScriptName = remoteScript

  let remote: RemoteEntry = {}

  return defineComponent({
    async mounted() {
      let shadow = config.shadow ? createShadow(remoteName, config) : null

      remote = await remoteImport(name)

      await (remote.mount && remote.mount(shadow || `#${remoteName}`, config.base, `#${remoteName}`))
      return config.mounted && config.mounted()
    },
    async beforeDestroy() {
      await (remote.unMount && remote.unMount())
      const res = await (config.unMounted && config.unMounted())
      config.shadow && deleteShadow(name, config)
      return res
    },
    destroyed() {
      return config.destroyed && config.destroyed()
    },
    render() {
      return h('div', { style: 'height: 100%' }, [h('div', { id: remoteName })])
    },
  })
}

export async function entryImportVue(name: string, config?: ImportCompConfig) {
  return getComp(name, config || {})
}
