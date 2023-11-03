import { defineComponent, h } from 'vue'
import { remoteImport, splitName } from './import'
import { createShadow, deleteShadow } from './shadow'
import type { ImportCompConfig } from '../../types/client'

interface RemoteEntry {
  mount: Function
  unMount: Function
}

export function getComp(name: string, base: string, mountFunc: Function, unMountFunc: Function, config: ImportCompConfig) {
  return defineComponent({
    async mounted() {
      let shadow = config.shadow ? createShadow(name, config) : null

      await (mountFunc && mountFunc(shadow || `#${name}`, base, `#${name}`))
      return config.mounted && config.mounted()
    },
    async beforeDestroy() {
      await (unMountFunc && unMountFunc())
      const res = await (config.unMounted && config.unMounted())
      config.shadow && deleteShadow(name, config)
      return res
    },
    destroyed() {
      return config.destroyed && config.destroyed()
    },
    render() {
      return h('div', { style: 'height: 100%' }, [h('div', { id: name })])
    },
  })
}

export async function entryImportVue(name: string, config: ImportCompConfig) {
  const [remoteName, remoteScript] = splitName(name)
  const remote: RemoteEntry = await remoteImport(name)

  return getComp(remoteName, remoteScript, remote.mount, remote.unMount, config || {})
}
