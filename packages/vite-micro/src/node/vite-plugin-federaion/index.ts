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

import type { ConfigEnv, Plugin, UserConfig, ViteDevServer, ResolvedConfig } from 'vite'
import virtual from '@rollup/plugin-virtual'
import { dirname } from 'path'
import type { VitePluginFederationOptions } from 'types/federation'
import { builderInfoFactory, DEFAULT_ENTRY_FILENAME, parsedOptions } from './public'
import type { PluginHooks } from 'types/pluginHooks'
import type { ModuleInfo } from 'rollup'
import { devSharedPlugin } from './src/dev/shared-development'
import { devRemotePlugin } from './src/dev/remote-development'
import { devExposePlugin } from './src/dev/expose-development'
import type { federationOptions, RemotesOption } from 'types'
import type { AcornNode, TransformPluginContext, TransformResult as TransformResult_2 } from 'rollup'
import prodFederation from '@originjs/vite-plugin-federation'
import { pluginsTransformCall, parseRemotes, parseExposes } from './utils'
// @ts-ignore
import federation_satisfy from '@originjs/vite-plugin-federation/dist/satisfy.js?raw'

export default function federation(options: federationOptions): Plugin {
  options.filename = options.filename ? options.filename : DEFAULT_ENTRY_FILENAME

  let pluginList: PluginHooks[] = []
  let virtualMod: any
  let registerCount = 0
  const builderInfo = builderInfoFactory()

  function registerPlugins(mode: 'development' | 'production') {
    options.mode = mode
    parseRemotes(options)
    // parseExposes(options)

    if (mode === 'development') {
      pluginList = [devSharedPlugin(options), devExposePlugin(options), devRemotePlugin(options)]
    } else {
      pluginList = [prodFederation(options) as PluginHooks]
    }
    builderInfo.isHost = !!parsedOptions.devRemote?.length
    builderInfo.isRemote = !!parsedOptions.devExpose?.length
    builderInfo.isShared = !!parsedOptions.devShared?.length

    let virtualFiles = {}
    pluginList.forEach((plugin) => {
      if (plugin.virtualFile) {
        virtualFiles = Object.assign(virtualFiles, plugin.virtualFile)
      }
    })
    virtualMod = virtual(virtualFiles)
  }

  return {
    name: 'vite-micro-federation',
    // for scenario vite.config.js build.cssCodeSplit: false
    // vite:css-post plugin will summarize all the styles in the style.xxxxxx.css file
    // so, this plugin need run after vite:css-post in post plugin list
    enforce: 'post',
    // apply:'build',
    options(_options) {
      // rollup doesnt has options.mode and options.command
      if (!registerCount++) {
        registerPlugins((options.mode = options.mode ?? 'production'))
      }

      if (typeof _options.input === 'string') {
        _options.input = { index: _options.input }
      }
      _options.external = _options.external || []
      if (!Array.isArray(_options.external)) {
        _options.external = [_options.external as string]
      }

      for (const pluginHook of pluginList) {
        ;(pluginHook.options as Function)?.call(this, _options)
      }
      return _options
    },
    config(config: UserConfig, env: ConfigEnv) {
      options.mode = options.mode ?? env.mode
      registerPlugins(options.mode)
      registerCount++
      for (const pluginHook of pluginList) {
        ;(pluginHook.config as Function)?.call(this, config, env)
      }

      // only run when builder is vite,rollup doesnt has hook named `config`
      builderInfo.builder = 'vite'
      builderInfo.assetsDir = config?.build?.assetsDir ?? 'assets'
    },
    configureServer(server: ViteDevServer) {
      for (const pluginHook of pluginList) {
        ;(pluginHook.configureServer as Function)?.call(this, server)
      }
    },
    configResolved(config: ResolvedConfig) {
      for (const pluginHook of pluginList) {
        ;(pluginHook.configResolved as Function)?.call(this, config)
      }
    },
    buildStart(inputOptions) {
      for (const pluginHook of pluginList) {
        ;(pluginHook.buildStart as Function)?.call(this, inputOptions)
      }
    },

    async resolveId(...args) {
      const v = virtualMod.resolveId.call(this, ...args)
      if (v) {
        return v
      }

      for (const pluginHook of pluginList) {
        const result = await (pluginHook.resolveId as Function)?.call(this, ...args)
        if (result) {
          return result
        }
      }

      return null
    },

    load(...args) {
      const v = virtualMod.load.call(this, ...args)
      if (v) {
        return v
      }

      for (const pluginHook of pluginList) {
        const result = (pluginHook.load as Function)?.call(this, ...args)
        if (result) {
          return result
        }
      }

      return null
    },

    async transform(code: string, id: string) {
      // 解决插件里面无法解析二级依赖的问题this.resolve('@originjs/vite-plugin-federation')
      if (id === '\0virtual:__federation_lib_semver') return federation_satisfy

      return pluginsTransformCall.call(this, pluginList, [code, id])
    },
    moduleParsed(moduleInfo: ModuleInfo): void {
      for (const pluginHook of pluginList) {
        ;(pluginHook.moduleParsed as Function)?.call(this, moduleInfo)
      }
    },

    outputOptions(outputOptions) {
      for (const pluginHook of pluginList) {
        ;(pluginHook.outputOptions as Function)?.call(this, outputOptions)
      }
      return outputOptions
    },

    renderChunk(code, chunkInfo, _options) {
      for (const pluginHook of pluginList) {
        const result = (pluginHook.renderChunk as Function)?.call(this, code, chunkInfo, _options)
        if (result) {
          return result
        }
      }
      return null
    },

    generateBundle: function (_options, bundle, isWrite) {
      for (const pluginHook of pluginList) {
        ;(pluginHook.generateBundle as Function)?.call(this, _options, bundle, isWrite)
      }
    },
  }
}
