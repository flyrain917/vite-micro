export function generateCommonRemoteEntryFile(version: string) {
  return `
      export * from './${version}/remoteEntry.js'
    `
}
