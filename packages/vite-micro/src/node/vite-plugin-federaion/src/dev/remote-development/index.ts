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

import type { UserConfig } from 'vite'
import type { ConfigTypeSet, RemotesConfig, VitePluginFederationOptions } from 'types/federation'
import type { federationOptions, RemotesOption } from 'types'
import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import type { ViteDevServer } from 'types/viteDevServer'
import { getFileExtname, getModuleMarker, normalizePath, REMOTE_FROM_PARAMETER } from '../../../utils'
import { builderInfoFactory, parsedOptions } from '../../../public'
import type { PluginHooks } from 'types/pluginHooks'
import { parseRemoteOptions, createRemotesMap, Remote } from './parseRemotes'
import { parseSharedOptions } from '../shared-development/parseShared'
import remoteFederationTemplate from '../../../../template/__federation__'
import { transformImportForRemote } from './tansformImportForRemote'

export function devRemotePlugin(options: federationOptions): PluginHooks {
  parsedOptions.devRemote = parseRemoteOptions(options)

  parsedOptions.devShared = parseSharedOptions(options as VitePluginFederationOptions)

  const remotes: { id: string; regexp: RegExp; config: string | ConfigTypeSet }[] = []
  for (const item of parsedOptions.devRemote) {
    remotes.push({
      id: item[0],
      regexp: new RegExp(`^${item[0]}/.+?`),
      config: item[1],
    })
  }

  const needHandleFileType = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.vue', '.svelte']
  options.transformFileTypes = (options.transformFileTypes ?? []).concat(needHandleFileType).map((item) => item.toLowerCase())
  const transformFileTypeSet = new Set(options.transformFileTypes)

  let viteDevServer: ViteDevServer

  const builderInfo = builderInfoFactory()

  const remoteMap = createRemotesMap(remotes as Remote[])

  const __federation__Temp = remoteFederationTemplate(remoteMap)

  return {
    name: 'originjs:remote-development',
    virtualFile: {
      __federation__: __federation__Temp,
    },
    config(config: UserConfig) {
      // need to include remotes in the optimizeDeps.exclude
      if (parsedOptions.devRemote.length) {
        const excludeRemotes: string[] = []
        parsedOptions.devRemote.forEach((item) => excludeRemotes.push(item[0]))
        let optimizeDeps = config.optimizeDeps
        if (!optimizeDeps) {
          optimizeDeps = config.optimizeDeps = {}
        }
        if (!optimizeDeps.exclude) {
          optimizeDeps.exclude = []
        }
        optimizeDeps.exclude = optimizeDeps.exclude.concat(excludeRemotes)
      }
    },

    async resolveId(...args) {},

    async load(id: string) {},

    configureServer(server: ViteDevServer) {
      // get moduleGraph for dev mode dynamic reference
      viteDevServer = server
    },

    transform(this: TransformPluginContext, code: string, id: string): any {
      // ignore some not need to handle file types
      const fileExtname = getFileExtname(id)
      if (!transformFileTypeSet.has((fileExtname ?? '').toLowerCase())) {
        return
      }

      const result = transformImportForRemote.call(this, code, remotes as Remote[])

      return result
    },
  }
}
