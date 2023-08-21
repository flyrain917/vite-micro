import type { RemotesObject } from '@originjs/vite-plugin-federation'

declare interface federationOptions {
  /**
   * 判断启动服务器的模式，是否为按需启动的模式
   */
  isRootService?: boolean

  /**
   * 远程模块入口文件，本地模块可通过vite.config.ts的remotes引入
   */
  filename?: string

  /**
   * 需要共享的模块
   */
  shared?: SharedOption[]

  /**
   * 开发模式或生产模式 的微应用加载方式有区别
   */
  mode: 'development' | 'production'

  /**
   *  注册远程模块的相关配置
   */
  remotes?: RemotesOption

  /**
   *  应用透出接口的配置
   */
  exposes?: ExposesOption
}

/**
 *  需要分享的全局组件的配置
 */
type SharedOption = string | SharedObject

declare interface SharedObject {
  /**
   *  组件的名称
   */
  name: string

  /**
   *  组件可以共享的版本号
   */
  requiredVersion?: string
}

/**
 *  远程模块的相关配置
 */
declare interface RemotesOption {
  [index: string]: MicroRemoteObject | RemotesObject
}

declare interface MicroRemoteObject {
  /**
   *  远程模块的地址，用于生产环境
   */
  url: string

  /**
   *  远程模块的地址，用于开发环境项目外链，不提供则默认根据项目结构来获取
   */
  devUrl?: string

  external?: string
}

/**
 *  应用透出接口的配置
 */
declare interface ExposesOption {
  /**
   *  组件名称：组件相对根目录地址
   */
  [index: string]: string
}
