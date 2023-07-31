import Koa from 'koa'
import { createServer } from 'vite'
import koaConnect from 'koa-connect'
import Static from 'koa-static'
import Mount from 'koa-mount'
import staticCache from 'koa-static-cache'
import { debug } from './utils'
import fs from 'fs'
import path from 'path'

const app = new Koa()

const configRoot = process.cwd() // node执行根目录及项目根目录
const packageJsonPath = path.resolve(configRoot, 'package.json')

if (!packageJsonPath || !fs.existsSync(packageJsonPath)) {
  debug('config not found!')
}

const pkgContent = fs.readFileSync(packageJsonPath, 'utf-8')

const pdg = JSON.parse(pkgContent)

const workspace = pdg.workspaces

const modules = pdg.workspaces.map((space: any) => space.split('/')[1])
const mainModules = modules[0]

// 判断url是否去拉取index.html
function isRootIndexHtml(url: any) {
  let pathname = url
  if (url.includes('http')) {
    const urlObj = new URL(url)
    pathname = urlObj.pathname
  }

  if (pathname.includes('.')) return false

  return true
}

async function getViteConfig(viteConfigPath: string, module: string, base: string) {
  const viteConfigFactory = await import(viteConfigPath)
  const viteConfig = viteConfigFactory({ mode: 'development', root: `./packages/${module}`, base })

  viteConfig.server = {
    middlewareMode: true,
    fs: {
      strict: false,
      allow: [], // ['../packages'],
    },
  }
  viteConfig.configFile = false

  return viteConfig
}

function getViteConnect(module: any): Function {
  const base = module === mainModules ? undefined : `/${module}/`
  const viteConfigPath = path.resolve(configRoot, `./packages/${module}/vite.config.js`)

  const viteConfigPrams = {
    configFile: viteConfigPath,
    mode: 'development',
    root: `./packages/${module}`,
    base,
    server: {
      middlewareMode: true,
      fs: {
        strict: false,
        allow: [], // ['../packages'],
      },
    },
  }

  if (module === mainModules) {
    return async function () {
      console.log('open main server!!')
      const viteServer = await createServer(viteConfigPrams)
      return [koaConnect(viteServer.middlewares), viteServer]
    }
  }

  let viteServerConnect: any = null

  return async function (ctx: any, next: any) {
    if (ctx.originalUrl.startsWith(`/${module}/`)) {
      if (!viteServerConnect || (viteServerConnect && viteServerConnect.then)) {
        if (viteServerConnect && viteServerConnect.then) {
          console.log('wating--- server!!', module)
          viteServerConnect = await viteServerConnect
        } else {
          viteServerConnect = createServer(viteConfigPrams).then((viteServer) => koaConnect(viteServer.middlewares))

          console.log('open--- server!!', module)
          viteServerConnect = await viteServerConnect
        }
      }

      if (ctx.originalUrl.includes('@id') || ctx.originalUrl.includes('@vite')) {
        ctx.url = ctx.url.replace(`/${module}/`, '/')
        return viteServerConnect(ctx, next)
      }

      if (isRootIndexHtml(ctx.originalUrl)) return next()

      ctx.url = ctx.url.replace(`/${module}/`, '/')
      return viteServerConnect(ctx, next)
    } else {
      return next()
    }
  }
}

function isPublicAssets(url: string) {
  var assets = ['.html', 'antd.css', 'vender.js', 'antd.min.js', 'antd-with-locales.min.js']
  let flag = assets.find((assetsSurfix) => url.endsWith(assetsSurfix))
  return flag
}

export async function createMicroServer() {
  const [mainConnect, viteMain] = await getViteConnect(mainModules)()

  modules.forEach((module: any) => {
    if (module === mainModules) return
    app.use(getViteConnect(module))
  })

  app.use(async (ctx: any, next: any) => {
    if (ctx.originalUrl.includes('@id') || ctx.originalUrl.includes('@vite')) {
      return mainConnect(ctx, next)
    }

    console.log('=====ctx.originalUrl====', ctx.originalUrl)

    if (isRootIndexHtml(ctx.originalUrl)) return next()

    return mainConnect(ctx, next)
  })

  app.use(async (ctx: any) => {
    try {
      let template
      // 读取index.html模板文件
      template = fs.readFileSync(path.resolve(configRoot, 'index.html'), 'utf-8')
      template = await viteMain.transformIndexHtml(ctx.originalUrl, template)

      ctx.body = template
    } catch (e: any) {
      console.log(e.stack)
    }
  })

  return { app }
}
