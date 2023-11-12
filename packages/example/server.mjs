import Koa from 'koa'
import Static from 'koa-static'
import fs from 'fs'
import path from 'path'

const app = new Koa()

app.use(Static('./dist'))

app.use(async (ctx) => {
  try {
    let template
    // 读取index.html模板文件
    template = fs.readFileSync(path.resolve('./dist', 'index.html'), 'utf-8')
    // template = await viteMain.transformIndexHtml(ctx.originalUrl, template)

    ctx.body = template
  } catch (e) {
    console.log(e.stack)
  }
})

app.listen(8080, () => {
  console.log('http://localhost:8080')
})
