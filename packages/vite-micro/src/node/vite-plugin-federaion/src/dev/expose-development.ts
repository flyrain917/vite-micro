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

import { parseExposeOptions } from '../../utils'
import { parsedOptions } from '../../public'
import type { VitePluginFederationOptions } from 'types/federation'
import type { PluginHooks } from 'types/pluginHooks'
import { getRemoteEntryFile } from '../../../template/__remoteEntryHelper__'
import type { federationOptions, RemotesOption } from 'types'

const virtualModuleId = '__remoteEntryHelper__'
const resolvedVirtualModuleId = '\0' + virtualModuleId

function parseExposes(options: federationOptions) {
  options.exposes = options.exposes || {}
  let exposes = {}
  Object.keys(options.exposes).forEach((exposesName) => {
    //@ts-ignore
    exposes['./' + exposesName] = options.exposes[exposesName]
  })

  options.exposes = exposes

  return options
}

export function devExposePlugin(options: federationOptions): PluginHooks {
  // parsedOptions.devExpose = parseExposeOptions(parseExposes(options) as VitePluginFederationOptions)

  let viteConfig: any = {}

  return {
    name: 'originjs:expose-development',
    // virtualFile: {
    //   __remoteEntryHelper__: getRemoteEntryFile(),
    // },
    config(config: any) {
      viteConfig = config
    },
    async resolveId(...args) {
      if (args[0] === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) return getRemoteEntryFile(options, viteConfig)
    },
    transform(code: string, id: string) {},
  }
}
