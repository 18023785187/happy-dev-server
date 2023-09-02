import fs from 'fs'
import path from 'path'
import express from 'express';
import { WebSocketServer } from 'ws'
import { render as ejsRender } from 'ejs'
import Server from './Server'
import type { ServerOptions } from './Server'
import { rootPath, resolve, toUnixPath, debounce } from './utils'
import wsScriptTemp from './client/wsScriptTemp'
import { transform, urlTransform } from './transform';
import build from './build'

interface StaticPlugin {
    (html: string): string
}

export interface Imports {
    [k: string]: string
}

const wsPath = '/ws'

export default class HappyDevServer extends Server {
    private isWatch: boolean
    private imports: Imports
    private fileMap: Map<string, string> // 缓存文件编译结果
    constructor(options: ServerOptions = {}) {
        super(options)
        this.isWatch = false
        this.imports = {}
        this.fileMap = new Map()

        this.start()
            .then(async () => {
                this.imports = await this.buildLib()
                // 如果 isWatch = true，那么自动调用 watchHandler
                if (this.isWatch) {
                    this.watchHandler()
                }
                this.static(staticPlugin)
                this.loadFile()

                console.log(`http://${this.options.host}:${this.options.port}`)
            })
            .catch(err => {
                throw new Error(err)
            })

        // 为 html 注入若干功能性效果
        const staticPlugin: StaticPlugin = (html) => {
            if (this.isWatch) {
                // 向浏览器注入 ws 服务
                const url = `${this.options.https ? 'wss' : 'ws'}://${this.options.host}:${this.options.port}${wsPath}`
                const wsScript: string = ejsRender(wsScriptTemp, { url })
                html += wsScript
            }

            return html
        }
    }

    /**
     * 提供给外部的 api，用于监听文件变化从而刷新浏览器
     * @returns 
     */
    public watch(): void {
        if (this.isWatch) return
        this.isWatch = true
        /**
         *     watchHandler 必须在服务器部署后调用，因为需要启动 ws 服务，
         * 如果在服务器启动之前就调用了 watch 那么会在服务器部署之后自动调用 watchHandler
         */
        if (this.server) {
            this.watchHandler()
        }
    }

    /**
     * 监听处理器，启动 ws 服务并监听根目录
     */
    private watchHandler(): void {
        const ws = new WebSocketServer({
            server: this.server!,
            path: wsPath
        })

        const watchListener: fs.WatchListener<string> = debounce((eventType, fileName) => {
            let filePath: string
            // 如果文件改动，则清除该文件的缓存
            if (
                fileName &&
                this.fileMap.has(
                    (filePath = resolve(toUnixPath(rootPath), fileName))
                )
            ) {
                this.fileMap.delete(filePath)
            }
            ws.clients.forEach(ws => ws.send('reload'))
        })

        fs.watch(
            rootPath,
            {
                recursive: true // 深度监听文件夹
            },
            watchListener
        )
    }

    /**
     * 处理静态目录
     */
    private static(plugin: StaticPlugin): void {
        // 拦截 index.html 进行修改
        this.app.get('/', (req, res) => {
            // 以 html 作为模板注入环境变量以扩展功能
            const html = ejsRender(
                fs.readFileSync(resolve(this.options.contentBase, 'index.html'), 'utf-8'),
                { static: this.options.static }
            )
            res.setHeader('Context-Type', 'text/html')
            res.send(plugin(html))
        })
        // 部署静态文件
        this.app.use(this.options.static, express.static(this.options.contentBase))
    }

    /**
     * 打包所有第三方库
     */
    private buildLib(): Promise<Imports> {
        return new Promise(promiseResolve => {
            const imports: Imports = {}
            const prefix = '.happy-dev-server'
            try {
                const packageJsonPath = resolve(toUnixPath(rootPath), './package.json')
                const { dependencies } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) // 获取生产依赖
                const dependencys = Object.keys(dependencies) // 只取依赖包的名字，后续前往 node_modules 获取包路径

                const promises: Array<ReturnType<typeof build>> = []
                const node_modules = resolve(toUnixPath(rootPath), './node_modules')
                const printLibName: Array<string> = []
                dependencys.forEach(dependency => {
                    const libName = `${dependency}${encodeURI(dependencies[dependency])}.js`
                    // 如果之前已经打包过当前依赖包，且版本没变，那么跳过当前依赖包的打包
                    if (fs.existsSync(resolve(node_modules, `./${prefix}/${libName}`))) {
                        imports[dependency] = `${prefix}/${libName}`
                        return
                    }

                    // 使用 try 兜底，因为可能找不到当前依赖包
                    try {
                        const dependencyRootPath = resolve(node_modules, `./${dependency}`)
                        const dependencyPackageJsonPath = resolve(dependencyRootPath, `./package.json`)
                        const dependencyPackageJson = JSON.parse(fs.readFileSync(dependencyPackageJsonPath, 'utf-8'))

                        promises.push(
                            build(
                                resolve(dependencyRootPath, dependencyPackageJson.module ?? dependencyPackageJson.main),
                                resolve(node_modules, `./${prefix}/${libName}`)
                            )
                        )

                        imports[dependency] = `${prefix}/${libName}`

                        printLibName.push(dependency)
                    } catch { }
                })
                if (promises.length) console.log(`building libraries... \n${printLibName.join(',')}`)
                Promise.all(promises).then(() => promiseResolve(imports))
            } catch {
                promiseResolve(imports)
            }
        })
    }

    /**
     * 加载来自除静态目录外的各种资源
     * 所有资源都经过处理变成 javascript 格式并发送
     */
    private loadFile(): void {
        this.app.all('/*', async (req, res, next) => {
            const filePath = resolve(toUnixPath(rootPath), '.' + req.url)
            /**
             * 其他 accept 类型的请求原封不动地返回
             * 
             * 例如 link、iframe、img、css @import 等
             */
            if(req.headers.accept !== '*/*') {
                res.sendFile(filePath)
                return
            }
            // 如果有缓存，则取缓存结果发送
            if (this.fileMap.has(filePath)) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8')
                res.send(this.fileMap.get(filePath))
                return
            }
            try {
                const parsedPath = path.parse(resolve(toUnixPath(rootPath), '.' + req.url))
                const buffer: Buffer = fs.readFileSync(filePath)
                let result: string = await transform(buffer, parsedPath)
                // 如果 babel 转换路径失败，说明不是能识别的文件，那么将不处理直接放行
                try {
                    // 转换第三方库的路径
                    result = urlTransform(result, this.imports)
                } catch { }
                // 设置文件缓存
                this.fileMap.set(filePath, result)
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8')
                res.send(result)
                return
            } catch (e) {
                console.log(e)
                next()
            }
        })
    }
}
