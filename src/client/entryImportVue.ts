import { defineComponent } from 'vue'
import { remoteImport, splitName } from './import'

interface RemoteEntry {
  mount: Function
  unMount: Function
}

export function getComp(name: string, base: string, mountFunc: Function, unMountFunc: Function) {
  return defineComponent({
    mounted() {
      mountFunc(`#${name}`, base)
    },
    beforeDestroy() {
      unMountFunc && unMountFunc()
    },
    render(h) {
      return h('div', { style: 'height: 100%' }, [h('div', { id: name })])
    },
  })
}

export async function entryImportVue(name) {
  const [namespace, remoteScript] = splitName(name)
  const remote: RemoteEntry = await remoteImport(name)

  return getComp(namespace, remoteScript, remote.mount, remote.unMount)
}
