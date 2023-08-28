import { defineComponent, h } from 'vue'
import { remoteImport, splitName } from './import'

interface RemoteEntry {
  mount: Function
  unMount: Function
}

interface CompConfig {
  mounted: Function
  unMounted: Function
  destroyed: Function
}

export function getComp(name: string, base: string, mountFunc: Function, unMountFunc: Function, config: CompConfig) {
  return defineComponent({
    async mounted() {
      await (mountFunc && mountFunc(`#${name}`, base))
      return config.mounted && config.mounted()
    },
    async beforeDestroy() {
      await (unMountFunc && unMountFunc())
      return config.unMounted && config.unMounted()
    },
    destroyed() {
      return config.destroyed && config.destroyed()
    },
    render() {
      return h('div', { style: 'height: 100%' }, [h('div', { id: name })])
    },
  })
}

export async function entryImportVue(name: string, config: CompConfig) {
  const [remoteName, remoteScript] = splitName(name)
  const remote: RemoteEntry = await remoteImport(name)

  return getComp(remoteName, remoteScript, remote.mount, remote.unMount, config || {})
}
