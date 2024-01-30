import type { ConfigEnv, Plugin, UserConfig, PluginOption, ViteDevServer, ResolvedConfig } from 'vite'
import path from 'path'
import type { federationOptions, RemotesOption } from '../../types'
import host from './hostAddress'
import devFederation from './vite-plugin-federaion/index'

const federationDefaultOption = {
  isRootService: true, // 判断启动服务器的模式，是否为按需启动的模式
  shared: [],
}

export function federationMicro(options: federationOptions): PluginOption {
  options = Object.assign(federationDefaultOption, options)

  return devFederation(options)
}
