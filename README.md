# happy-dev-server

能导入js、css、image等文件的静态服务器。

目前支持的功能有：

- 监听文件改动自动刷新浏览器。
- js、ts、json 文件引入扩展名省略，如 `import {} from './src/index`。
- 支持导入 js、css、图片、json、ts、less、scss 文件。
- 支持 html 注入环境变量，如 `<script src="<%= static %>index.js"></script>`。

## 使用

```
npm i happy-dev-server -g
```

命令行使用

```
// 项目的根目录下
happy-dev-server -w
```

`-w` 为监听根目录下的文件变化，从而通知浏览器刷新

api 调用

```javascript
import HappyDevServer from 'happy-dev-server'

const server = new HappyDevServer()
server.start()
server.watch()
```

## 配置参数

```typescript
type port = number
type https = {
    key: Buffer,
    cert: Buffer
}

interface ServerOptions {
    port?: port, // 端口
    https?: https | false // https 服务
    static?: string // 线上静态目录文件位置
    contentBase?: string // 静态文件目录
}

const defaultOptions: Required<ServerOptions> = {
    port: 1234,
    https: false,
    static: '/static/',
    contentBase: rootPath + '/public'
}
```

命令行配置参数

```
happy-dev-server -w -p 8000 -h
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

## 备忘录

还差 https 模块的支持

还可以增加对 vue、jsx 等文件的支持
