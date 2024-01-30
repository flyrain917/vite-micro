// *****************************************************************************
// Copyright (C) 2022 Origin.js and others.
//
// This program and the accompanying materials are licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
// EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
// MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
//
// SPDX-License-Identifier: MulanPSL-2.0
// *****************************************************************************

import type { PluginHooks } from 'types/pluginHooks'
import { parseSharedOptions } from './parseShared'
import { parsedOptions } from '../../../public'
import type { VitePluginFederationOptions } from 'types/federation'
import type { federationOptions, RemotesOption } from 'types'
import { transformImportForSahre, parseSharedToShareMap } from './handleShare'
import { federationFnImportFunc } from '../../../../template/__federation_fn_import'
import type { AcornNode, TransformPluginContext } from 'rollup'
import { devSharedScopeCode } from './handleShare'
import type { ViteDevServer } from 'types/viteDevServer'
import { NAME_CHAR_REG, removeNonRegLetter, isObject } from '../../../utils'
import type { Alias, Plugin } from 'vite'

const shareVirsualModuleId = 'virtual:__federation_fn_import'
const resolveShareVirsualModuleId = '\0' + shareVirsualModuleId

export function devSharedPlugin(options: federationOptions): PluginHooks {
  parsedOptions.devShared = parseSharedOptions(options as VitePluginFederationOptions)

  let viteConfig: any = {}
  let viteDevServer: ViteDevServer

  const shareName2Prop = parsedOptions.devShared.map((devSharedItem) => devSharedItem[0])

  const sharedMap = parseSharedToShareMap(options.shared || [])
  const federationFnImport = federationFnImportFunc(sharedMap)

  return {
    name: 'originjs:shared-development',
    options(inputOptions) {
      // vite-plugin-externals
      inputOptions.external = inputOptions.external || []
      inputOptions.external = [...(inputOptions.external as any), ...shareName2Prop]

      return inputOptions
    },
    config(config: any) {
      viteConfig = config
      config.optimizeDeps = config.optimizeDeps || {}
      config.optimizeDeps.exclude = config.optimizeDeps.exclude || []
      config.optimizeDeps.exclude = [...config.optimizeDeps.exclude, ...shareName2Prop]
    },
    async resolveId(...args) {
      if (args[0] === shareVirsualModuleId) {
        return resolveShareVirsualModuleId
      }
    },
    configureServer(server: ViteDevServer) {
      // get moduleGraph for dev mode dynamic reference
      viteDevServer = server
    },
    load(id: string) {
      if (id === resolveShareVirsualModuleId) return federationFnImport
    },
    // @ts-ignore
    async transform(this: TransformPluginContext, code: string, id: string) {
      if (id === '\0virtual:__federation__') {
        const scopeCode = await devSharedScopeCode.call(this, parsedOptions.devShared as any, viteDevServer)
        return code.replace('__shareScope__', scopeCode.join(','))
      }

      const result = transformImportForSahre.call(this, code, parsedOptions.devShared)

      return result
    },
  }
}
