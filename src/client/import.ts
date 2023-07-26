function splitName(name) {
  return name.split('/')
}

export const remoteImport = async (name) => {
  const [namespace, remoteScript] = splitName(name)
  // 加载脚步
}
