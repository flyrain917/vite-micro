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

Host side references the resource entry file configuration of the Remote side

#### `url:string`

- Remote module address, for example: `/sets/login` `https://localhost:5011`, this configuration is required
- The URL internally generates an external address, `${URL}/remoteEntries. js`, which will be used as the entry address for the remote module
- The URL can be a relative address determined based on the packaging structure, or it can be a complete external address starting with http

```js
remotes: {
    // '{Remote Module Name} Remote': 'Remote Module Entry File Address'
    'loginRemote': {
      url: `/assets/login`
    },
}
```

#### `devUrl:string`

- Remote module development environment address, for example: '/sets/login'`https://localhost:5011`, this configuration is not required
- If devUrl is not configured, it defaults to the URL address or the relative path of the project
- **\*\***When the URL is a relative address and devUrl is not configured, the format of the remote module name needs to be specified as `{Remote Module Name} Remote`. In the development environment, the remote module entry address will be generated based on the remote module name

```js
remotes: {
    // '{Remote Module Name} Remote': 'Remote Module Entry File Address'
    'loginRemote': {
      url: `https://www.vite-micro.com`,
      devUrl: `https://localhost:5011`
    },
}
```

### `shared`

The shared dependencies between the Host and Remote modules. The host module needs to configure the dependencies of all remote modules used; The remote module needs to configure dependencies on externally provided components.

- It is an array, which can be ['vue ',...], or [{...}]

#### `name: string`

- The name of the shared component, required

#### `requiredVersion: string`

- Only effective for the `remote` module, specifying the required version of the `host shared` used. When the version of the `host` module does not meet the 'required Version' requirements, the `shared` module will be used, and this feature will not be enabled by default

## Browsers support

Modern browsers does not support IE browser

| IEdge / IE | Firefox         | Chrome          | Safari          |
| ---------- | --------------- | --------------- | --------------- |
| Edge       | last 2 versions | last 2 versions | last 2 versions |

## 其他

- The remote footsteps currently loaded do not support sandbox functionality, and the code needs to be constrained by specifications
- If you agree with this framework and find it helpful to you, I hope you can give me a star ^\_^
