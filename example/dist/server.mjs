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

app.use(async (ctx) => {
  try {
    let template
    // 读取index.html模板文件
    template = fs.readFileSync(path.resolve('./dist', 'index.html'), 'utf-8')
    template = await viteMain.transformIndexHtml(ctx.originalUrl, template)

    ctx.body = template
  } catch (e) {
    console.log(e.stack)
  }
})
