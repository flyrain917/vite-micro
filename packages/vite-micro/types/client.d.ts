/**
 * entryImport(Vue/React/*) 引入组件时，加载组件的配置
 */
export declare interface ImportCompConfig {
  shadow: Boolean // 是否开启 shadow模式
  strictShadow: Boolean // css 是否完全隔离，shadow内的样式不会受主样式的影响
  mounted: Function
  unMounted: Function
  destroyed: Function
}
