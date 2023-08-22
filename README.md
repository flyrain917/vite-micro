[简体中文](./README-zh.md) | English

## [vite-micro - Micro front-end framework](https://github.com/zhutao315/videoRTP)

[![npm](https://img.shields.io/npm/v/vite-micro.svg)](https://www.npmjs.com/package/vite-micro)

Based on the vite micro application architecture, each micro application is equivalent to a micro service, providing micro component APIs for mutual invocation. The underlying layer is based on @ originjs/vite plugin education.
The invocation and execution methods of microcomponents follow the concept of module federation, with two execution methods: development and production.
The vite-micro front-end framework adopts the front-end architecture of Monorapo in the project, which only requires starting the root server once in the outer layer, and subsequent micro applications can be automatically started as needed.

## The running effect

1. production：

```
cd example

pnpm && pnpm run build

node server.mjs
```

2. development：

```
cd example

pnpm && pnpm run start
```

## Install

```
npm install vite-micro
```

Or

```
yarn add vite-micro
```

## How to Use

The vite-micro front-end framework needs to adopt the Monorapo project structure, which can be referenced in the example project conclusion，</br>
There are usually two or more micro applications in packages, one as the Host side and one as the Remote side.

#### Step 1: Configure exposed modules on the Remote side

```js
// vite.config.js
import { federation } from 'vite-micro/node'
export default {
  build: {
    // If there is a top level await issue, you need to use import topLevelAwait from 'vite plugin top level await'
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // Output Directory
    outDir: `${path.resolve(__dirname, '../../dist')}`,
    // Resource storage directory
    assetsDir: `assets/user/${packageJson.version}`,
  },
  plugins: [
    federation({
      mode
      // Modules that need to be exposed,
      // The list of components exposed by remote modules to the public is mandatory for remote modules
      exposes: {
        Button: './src/Button.vue',
        entry: './src/bootstrap.ts',
      },
      shared: ['vue'],
    }),
  ],
}

```

- The "bootstrap.ts" corresponding to the entry here comes from "main.ts" (the entry file of the project). If there are the following configurations, "bootstrap.ts" needs to be used, otherwise conflicting errors will occur

```
rollupOptions: {
  input: main: `${path.resolve(__dirname, './src/main.ts')}`,
}
// bootstrap.ts
export { mount, unMount } from './main'
```

#### Step 2: Configure the application entry file on the Remote side (if the Host side needs to call the Remote micro application)

```
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

let app: any = null
export async function mount(name: string, base: string) {
  app = createApp(App)

  // Other configurations......

  app.mount(name)

  console.log('start mount!!!', name)

  return app
}

export function unMount() {
  console.log('start unmount --->')
  app && app.$destroy()
}

```

- After receiving the Remote micro application entry file, the host side will execute the mount method inside to initialize and mount the micro application
- mExport according to the conventions of the mount method and unmount method

#### Step 3: Configure exposed modules on the host side

```js
// vite.config.js
import { federation } from 'vite-micro/node'
export default {
  build: {
    // If there is a top level await issue, you need to use import topLevelAwait from 'vite plugin top level await'
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // Output Directory
    outDir: `${path.resolve(__dirname, '../../dist')}`,
    // Resource storage directory
    assetsDir: `assets/main/${packageJson.version}`,
  },
  plugins: [
    federation({
      mode
      remotes: {
        loginRemote: {
          url: `/assets/login`,
        },
        userRemote: {
          url: '/assets/user',
        },
      },
      shared: ['vue'],
    }),
  ],
}
```

#### Step 4: Using Remote Modules on the Host Side

- Using micro components

```js
import { createApp, defineAsyncComponent } from "vue";
const app = createApp(Layout);
...
const RemoteButton = defineAsyncComponent(() => import("remote_app/Button"));
app.component("RemoteButton", RemoteButton);
app.mount("#root");
```

- Using micro application entry

```js
import { entryImportVue } from 'vite-micro/client'

const mainRoute = [
  {
    path: '/home',
    component: () => import('../../views/Home.vue'),
  },
  {
    path: '/user',
    component: () => entryImportVue('remote_app/entry'),
  },
]

// entryImportVue('remote_app/entry') Essentially, it is also a micro component that can be called using the micro component method
```

## Configuration Item Description

### `mode：string`

- Control development mode or production mode, required.

### `filename：string`

- As the entry file for the remote module, it is not mandatory and defaults to 'remoteEntry.js'`

### `exposes`

- As a remote module, the list of exposed components must be filled out by the remote module.

```js
exposes: {
    // 'Name of exposed component': 'Address of exposed component'
    'Button': './src/components/Button.vue',
    'Section': './src/components/Section.vue'
}
```

---

### `remotes`

Host 端引用 Remote 端的资源入口文件配置

#### `url:string`

- 远程模块地址，例如：`/assets/login`, `https://localhost:5011`， 该配置必填
- url 在内部会生成 external 地址，`${url}/remoteEntrys.js`, 该地址会约定为远程模块的入口地址
- url 可以是一个根据打包结构确定的相对地址，也可以是一个带有 http 的完整的外部地址

```js
remotes: {
    // '{远端模块名称}Remote':'远端模块入口文件地址'
    'loginRemote': {
      url: `/assets/login`
    },
}
```

#### `devUrl:string`

- 远程模块开发环境地址，例如：`/assets/login`, `https://localhost:5011`， 该配置非必填
- devUrl 如果不配置，则默认取 url 地址或者项目的相对路径
- **\*\***当 url 为相对地址且未配置 devUrl 时，远端模块名称格式需约定为 '{远端模块名称}Remote',， 在开发环境下，会根据远端模块名称生成远程模块入口地址

```js
remotes: {
    // '远端模块名称':'远端模块入口文件地址'
    'loginRemote': {
      url: `https://www.vite-micro.com`,
      devUrl: `https://localhost:5011`
    },
}
```

### `shared`

本地模块和远程模块共享的依赖。本地模块需配置所有使用到的远端模块的依赖；远端模块需要配置对外提供的组件的依赖。

- 是一个数组，可以是['vue',....], 也可以是[{...}]

#### `name: string`

- 共享组件的名称， 必填

#### `requiredVersion: string`

- 仅对 `remote` 端生效，规定所使用的 `host shared` 所需要的版本，当 `host` 端的版本不符合 `requiredVersion` 要求时，会使用自己的 `shared` 模块，默认不启用该功能

## Browsers support

Modern browsers does not support IE browser

| IEdge / IE | Firefox         | Chrome          | Safari          |
| ---------- | --------------- | --------------- | --------------- |
| Edge       | last 2 versions | last 2 versions | last 2 versions |

## 其他

- 目前加载的远程脚步暂未支持沙箱功能，代码需要靠规范约束
- 如果您认可此框架并对觉得对您有帮助，希望能给我点颗星 ^\_^
