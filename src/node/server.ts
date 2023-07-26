import Koa from 'koa'
import vite from 'vite'
import koaConnect from 'koa-connect'
import Static from 'koa-static'
import Mount from 'koa-mount'
import staticCache from 'koa-static-cache'
import { debug } from './utils'

const app = new Koa()
const fs = require('fs')
const path = require('path')

const configRoot = process.cwd() // node执行根目录及项目根目录
const packageJsonPath = path.resolve(configRoot, 'package.json')

if (!packageJsonPath || !fs.existsSync(packageJsonPath)) {
  debug('config not found!')
}

const pkgContent = fs.readFileSync(packageJsonPath, 'utf-8')

const pdg = JSON.parse(pkgContent)

const workspace = pdg.workspaces

const modules = pdg.workspace.map((space) => space.split('/')[1])
const mainModules = modules[0]

function getViteConnect(module): Function {
  const base = module === mainModules ? undefined : `/${module}/`
  const viteConfigPath = path.resolve(configRoot, `./packages/${module}/vite.config`)
  const viteConfig = require(viteConfigPath).default({ mode: 'development', root: `./packages/${module}`, base })
  viteConfig.server = {
    middlewareMode: true,
    fs: {
      strict: false,
      allow: [], // ['../packages'],
    },
  }
  viteConfig.configFile = false

  if (module === mainModules) {
    return async function () {
      console.log('open main server!!')
      const viteServer = await vite.createServer(viteConfig)
      return [koaConnect(viteServer.middlewares), viteServer]
    }
  }

  let viteServerConnect = null

  return async function (ctx, next) {
    if (ctx.originalUrl.startsWith(`/${module}/`)) {
      if (!viteServerConnect || (viteServerConnect && viteServerConnect.then)) {
        if (viteServerConnect && viteServerConnect.then) {
          console.log('wating--- server!!', module)
          viteServerConnect = await viteServerConnect
        } else {
          viteServerConnect = vite.createServer(viteConfig).then((viteServer) => koaConnect(viteServer.middlewares))

          console.log('open--- server!!', module)
          viteServerConnect = await viteServerConnect
        }
      }

      if (ctx.originalUrl.includes('@id') || ctx.originalUrl.includes('@vite')) {
        ctx.url = ctx.url.replace(`/${module}/`, '/')
        return viteServerConnect(ctx, next)
      }

      if (!notHtml(ctx.originalUrl)) return next()

      ctx.url = ctx.url.replace(`/${module}/`, '/')
      return viteServerConnect(ctx, next)
    } else {
      return next()
    }
  }
}

// 判断url是否去拉取index.html
function isIndexHtml(url) {
  const urlObj = new URL(url)
  if (urlObj.pathname.includes('.')) return false
  return true
}

function isPublicAssets(url) {
  var assets = ['.html', 'antd.css', 'vender.js', 'antd.min.js', 'antd-with-locales.min.js']
  let flag = assets.find((assetsSurfix) => url.endsWith(assetsSurfix))
  return flag
}

export async function createServer() {
  const [mainConnect, viteMain] = await getViteConnect(mainModules)()

  modules.forEach((module) => {
    if (module === mainModules) return
    app.use(getViteConnect(module))
  })

  app.use(async (ctx, next) => {
    if (ctx.originalUrl.includes('@id') || ctx.originalUrl.includes('@vite')) {
      return mainConnect(ctx, next)
    }

    if (isIndexHtml(ctx.originalUrl)) return next()

    return mainConnect(ctx, next)
  })

  app.use(async (ctx) => {
    try {
      let template
      // 读取index.html模板文件
      template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      template = await viteMain.transformIndexHtml(ctx.originalUrl, template)

      ctx.body = template
    } catch (e) {
      console.log(e.stack)
    }
  })

  return { app }
}
