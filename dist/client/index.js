import { __federation_method_getRemote } from '__federation__';
import { defineComponent, h } from 'vue';

function splitName(name) {
    return name.split('/');
}
const remoteImport = async (name) => {
    const [remoteName, remoteScript] = splitName(name);
    // 加载脚步
    return __federation_method_getRemote(remoteName, './' + remoteScript);
};

function getComp(name, base, mountFunc, unMountFunc) {
    return defineComponent({
        mounted() {
            mountFunc(`#${name}`, base);
        },
        beforeDestroy() {
            unMountFunc && unMountFunc();
        },
        render() {
            return h('div', { style: 'height: 100%' }, [h('div', { id: name })]);
        },
    });
}
async function entryImportVue(name) {
    const [remoteName, remoteScript] = splitName(name);
    const remote = await remoteImport(name);
    return getComp(remoteName, remoteScript, remote.mount, remote.unMount);
}

export { entryImportVue, remoteImport };
