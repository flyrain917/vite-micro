// import type {
//   ComponentRenderProxy,
//   VNode,
//   VNodeChild,
//   ComponentPublicInstance,
//   FunctionalComponent,
//   PropType as VuePropType,
// } from 'vue';

declare module '*.vue' {
  import { defineComponent } from 'vue';
  const component: ReturnType<typeof defineComponent>;
  export default component;
}



// declare module 'vue' {
//   export type JSXComponent<Props = any> =
//     | { new (): ComponentPublicInstance<Props> }
//     | FunctionalComponent<Props>;
// }

declare module 'vue'

declare module 'vue-router'