[English](./README.md) | 简体中文

## vite-micro 微前端框架

<p align="center">
  <a href="https://bestpractices.coreinfrastructure.org/projects/5752"><img src="https://bestpractices.coreinfrastructure.org/projects/5752/badge"></a>
  <a href="https://api.securityscorecards.dev/projects/github.com/originjs/vite-plugin-federation"><img src="https://api.securityscorecards.dev/projects/github.com/originjs/vite-plugin-federation/badge"></a>
  <a href="https://github.com/originjs/vite-plugin-federation/actions/workflows/ci.yml"><img src="https://github.com/originjs/vite-plugin-federation/actions/workflows/ci.yml/badge.svg?branch=main" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@originjs/vite-plugin-federation"><img src="https://badgen.net/npm/v/@originjs/vite-plugin-federation" alt="Version"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/vite.svg" alt="Node Compatibility"></a>
  <a href="https://www.npmjs.com/package/@originjs/vite-plugin-federation"><img src="https://badgen.net/npm/license/@originjs/vite-plugin-federation" alt="License"></a>
 </p>

基于 vite 的微应用架构，每一个微应用相当于一个微服务，提供微组件 api 相互调用，底层基于@originjs/vite-plugin-federation,
微组件的调用和执行方式按照模块联邦的思想，具有开发和生产 2 种执行方式。
vite-micro 架构 在项目上采用 monorapo 的架构方式，只需在外层启动一次根服务器，后续的微应用可按需自动启动

## 运行效果

1. 生产模式：

```
cd example

pnpm && pnpm run build

node server.mjs
```

2. 开发模式：

```
cd example

pnpm && pnpm run start
```

## 安装

```
npm install vite-micro
```

或者

```
yarn add vite-micro
```

## 使用

vite-micro 架构需要采用 monorapo 项目结构，可参考 example 的项目结构，</br>
packages 里面通常会有 2 个或 2 个以上的微应用，一个作为 Host 端，一个作为 Remote 端。

#### 步骤一：Remote 端配置暴露的模块

```js
// vite.config.js
import { federation } from 'vite-micro/node'
export default {
  build: {
    // 如果出现top level await问题，则需使用import topLevelAwait from 'vite-plugin-top-level-await'
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // 输出目录
    outDir: `${path.resolve(__dirname, '../../dist')}`,
    // 资源存放目录
    assetsDir: `assets/user/${packageJson.version}`,
  },
  plugins: [
    federation({
      mode
      // 需要暴露的模块,
      //远程模块对外暴露的组件列表,远程模块必填
      exposes: {
        Button: './src/Button.vue',
        entry: './src/bootstrap.ts',
      },
      shared: ['vue'],
    }),
  ],
}

```

- 这里的 entry 对应的 bootstrap.ts 来源于 main.ts(项目的入口文件) ,如果有以下配置，则需使用 bootstrap.ts,否则会产生冲突错误

```
rollupOptions: {
  input: main: `${path.resolve(__dirname, './src/main.ts')}`,
}
// bootstrap.ts
export { mount, unMount } from './main'
```

#### 步骤二：Remote 端配置应用入口文件（如果 Host 端需要调用 Remote 微应用）

```
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

let app: any = null
export async function mount(name: string, base: string) {
  app = createApp(App)

  // 其他配置......

  app.mount(name)

  console.log('start mount!!!', name)

  return app
}

export function unMount() {
  console.log('start unmount --->')
  app && app.$destroy()
}

```

- Host 端拿到 Remote 微应用入口文件后，会执行里面的 mount 方法初始化并挂载微应用
- mount 和 unmount 方法 约定导出

#### 步骤三：Host 端配置暴露的模块

```js
// vite.config.js
import { federation } from 'vite-micro/node'
export default {
  build: {
    // 如果出现top level await问题，则需使用import topLevelAwait from 'vite-plugin-top-level-await'
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // 输出目录
    outDir: `${path.resolve(__dirname, '../../dist')}`,
    // 资源存放目录
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

#### 步骤四：Host 端使用远程模块

- 使用微组件方式

```js
import { createApp, defineAsyncComponent } from "vue";
import { remoteImport } from 'vite-micro/client'
const app = createApp(Layout);
...
const RemoteButton = defineAsyncComponent(() => remoteImport("remote_app/Button"));
app.component("RemoteButton", RemoteButton);
app.mount("#root");
```

- 使用微应用入口方式

```js
import { entryImportVue, remoteImport } from 'vite-micro/client'

const mainRoute = [
  {
    path: '/home',
    component: () => import('../../views/Home.vue'),
  },
  {
    path: '/user',
    component: () => entryImportVue('remote_app/entry'),
  },
  {
    path: '/button',
    component: () => remoteImport('remote_app/Button'),
  },
]
```

- entryImportVue('remote_app/entry') 在本质上也是一个微组件，同样可以使用微组件方式调用
- 对于 Remote 模块暴露的脚本有时并非 vue 组件，也可能是 React 组件或其他，也可能是远程应用的入口文件，这种类型的脚本很明显是无法直接被 Host 模块 vue 项目所消费的，entryImportVue 的内部使用一个简单的 vue 组件将这些脚本包裹进来形成一个可以直接被 vue 项目使用的组件
- 对于可以直接被 Host 模块直接引用的远程组件，直接使用 remoteImport 即可

#### 版本管理

- 提供远程引入组件的版本控制的 2 种方式，默认引入最新版

```js
remotes: {
    // 默认会引入loginRemote 应用的remoteEntrys.js ， 这个文件会去加载该应用最新版本的remoteEntry文件
    'loginRemote': {
      url: `/assets/login`
    },
    // 会将 `/assets/login/0.0.1/remoteEntry.js` 作为入口文件引入
    'userRemote': {
      url: `/assets/login`,
      filename: '0.0.1/remoteEntry.js'
    },
}
```

## 配置项说明

### `mode：string`

- 控制开发模式或生产模式，必填。

### `exposes`

- 作为远程模块，对外暴露的组件列表，远程模块必填。

```js
exposes: {
    // '对外暴露的组件名称':'对外暴露的组件地址'
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

#### `filename：string`

- 作为远程模块的入口文件，非必填，默认为`remoteEntrys.js`， 具体使用方式参考版本管理

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
- 如果此框架给您的工作事业带来价值，希望能给我一些捐助，创作不易。
  ![Image text](https://github.com/monkeyfuck/image-blob-flyRain/blob/master/images/wechat-pay.jpg)
