# happy-dev-server

<a href="https://www.npmjs.com/package/happy-dev-server"><img src="https://img.shields.io/npm/v/happy-dev-server.svg?sanitize=true" alt="Version"></a>

无需配置就能导入 js、css、image 等文件的静态服务器。

目前支持的功能有：

- 监听文件改动自动刷新浏览器。
- 支持 `import {} from '@/index' -> import {} from '/src/index'` 路径别名。
- js、ts、json、vue 文件引入扩展名省略，如 `import {} from './src/index`。
- 支持导入 js、css、图片、json、ts、less、scss、vue、jsx、tsx 文件。
- 支持 html 注入环境变量，如 `<script src="<%= static %>index.js"></script>`。

## 使用

```
npm i happy-dev-server -g
```

### 命令行调用

```
// 项目的根目录下
happy-dev-server -w
```

`-w` 为监听根目录下的文件变化，从而通知浏览器刷新

命令行调用的情况下根目录应有一个 `public` 文件夹用于存放静态资源（examples文件夹有详细示例）。

```
root
|---> public
|       |---> index.html
|
|---> src
        |---> index.js、.ts、.css、...、.vue
```

---

### api 调用

```javascript
import HappyDevServer from 'happy-dev-server'

const server = new HappyDevServer({
    watch: true
})
server.start()
```

## 配置参数

### api配置参数

#### watch

可选值: `true` | `false`
默认值: `false`

是否开启监听模式，为 `true` 时开启监听模式，监听文件变动从而刷新浏览器。

#### port

可选值: `number`
默认值: `1234`

指定监听的端口。

#### static

可选值: `string`
默认值: `/static/`

指定服务器托管静态资源的路径。

#### contentBase

可选值: `string`
默认值: `rootPath + '/public'`

指定服务器要托管的静态资源目录。

#### https

可选值: `true` | `false` | `https`
默认值: `false`

是否开启 https 服务，为 `true` 时或者指定 https 证书路径则开启 https 服务。

#### setup

可选值: `(app: Express) => void`
默认值: `undefined`

获取 Express 实例，可以劫持请求做一些数据模拟等。

#### extensions

可选值: `Extensions`
默认值: `['.js', '.ts', '.vue', '.jsx', '.tsx', '.json']`

文件后缀省略配置项，若 `happy-dev-server` 找不到对应路径的文件时会尝试拼接后缀继续查找。

#### alias

可选值: `Alias`
默认值: `{ '@': 'src' }`

路径前缀别名，若路径前缀能匹配上则会替换为对应值。

#### proxy

可选值: `{ [path: string]: ProxyOptions }`
默认值: `{}`

代理配置，其中 `ProxyOptions` 为第三方库 `http-proxy-middleware` 的 `Options` 配置项。

```typescript
type https = {
    key: Buffer
    cert: Buffer
}

interface ServerOptions {
    port?: number
    https?: https | boolean
    static?: string
    contentBase?: string
}

interface Alias {
    [k: string]: string
}

type Extensions = string[]

export interface HappyDevServerOptions extends ServerOptions {
    watch?: boolean
    setup?: (app: Express) => void
    extensions?: Extensions
    alias?: Alias
    proxy?: { [path: string]: ProxyOptions }
}


const defaultOptions: Required<HappyDevServerOptions> = {
    port: 1234,
    https: false,
    static: '/static/',
    contentBase: rootPath + '/public',
    watch: false,
    setup: undefined,
    extensions: ['.js', '.ts', '.vue', '.jsx', '.tsx', '.json'],
    alias: { '@': 'src' },
    proxy: {}
}
```

### 命令行配置参数

```
happy-dev-server -w -p 8000 -hs key+5-key.pem cert+5.pem

Usage: happy-dev-server [options]

Options:
  -v, --version               output the version number
  -c, --config [filename]     指定配置文件 (default: "happy.config.js")
  -w, --watch                 监听文件变动，从而刷新浏览器
  -p, --port <number>         指定端口号
  -s, --static <path>         指定静态目录存放路径
  -hs, --https [filePath...]  指定开启https协议，需提供 key 和 cert 路径，若不提 
供参数则会自动生成自签名证书
  -h, --help                  display help for command
```

## 功能

往 html 注入环境变量

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <div id="box"></div>
    <img id="test" alt="">
    <!-- <%= static %> 为配置参数中的 static 值 -->
    <script type="module" src="<%= static %>index.js">
</body>

</html>
```

劫持除 `public` 文件夹外的文件，使之可以加载 css、image 等文件

```javascript
// root/src/index.js
import './index.css'
import image from './image.png'

console.log(image) // this base64
```

还可以加载第三方模块

```javascript
npm i vue element-plus -S
//////////////////////////////////
// root/src/index.js
import { createApp } from 'vue'
import Elm from 'element-plus'
import 'element-plus/dist/index.css'
```

## 原理

`happy-dev-server` 通过拦截请求处理各类文件，统一返回 `javascript` 格式。

对于第三方模块的加载 `happy-dev-server` 会查找 `package.json` 中的 `dependencies`，并对其进行打包，通过改写 `import` 中的地址来完成加载。

`happy-dev-server` 只拦截通过 `script` 引入的文件，对于诸如 `link`、`img src`、`iframe`、`css @import` 等方式的引入将原封不动地返回文件内容。

例如：

```javascript
/**
 * 加载 root/src/index.js, 解析到以下语法
 */
import Elm from 'element-plus'

// 识别为第三方模块，打包到 node_modules/.happy-dev-server 目录下，并改写 import 语句

// --->
import Elm from '/node_modules/.happy-dev-server/element-plus{version}.js'
```

对于第三方模块静态文件的支持，直接改写路径到对应的静态文件目录

```javascript
import 'element-plus/dist/index.css'

// --->
import '/node_modules/element-plus/dist/index.css'
```
