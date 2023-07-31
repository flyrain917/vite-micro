import { defineComponent, h } from 'vue'
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
    render() {
      return h('div', { style: 'height: 100%' }, [h('div', { id: name })])
    },
  })
}

export async function entryImportVue(name: string) {
  const [remoteName, remoteScript] = splitName(name)
  const remote: RemoteEntry = await remoteImport(name)

  return getComp(remoteName, remoteScript, remote.mount, remote.unMount)
}
