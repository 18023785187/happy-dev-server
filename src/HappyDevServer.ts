import fs from 'fs'
import path from 'path'
import axios from 'axios'
import express from 'express';
import type { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware'
import type { Options as ProxyOptions } from 'http-proxy-middleware'
import { WebSocketServer } from 'ws'
import { render as ejsRender } from 'ejs'
import Server from './Server'
import type { ServerOptions } from './Server'
import { join, rootPath, resolve, toUnixPath, resolveExports, debounce, isObj, getNetworkIps } from './helper'
import wsScriptTemp from './client/wsScriptTemp'
import { transform, urlTransform } from './transform';
import Build from './Build'
import type { Alias, Extensions, Imports, PackageJSON } from './types'
import beautify from './helper/fontStyle'
import pkg from './helper/package.json'

interface StaticPlugin {
    (html: string): string
}

export interface HappyDevServerOptions extends ServerOptions {
    watch?: boolean // 是否开启监听模式
    setup?: (app: Express) => void // 获取 Express 示例，可以劫持请求做一些数据模拟等
    extensions?: Extensions // 匹配的扩展名，如请求路径为 ./index，会依次查找 ./index.js、./index.ts、./index.json
    /**
     * 路径别名，方便用户编写路径使用，例如在深层次的文件往上找 src/index.js
     * import {} from '../../../src/index.js'
     * 可以改写为
     * import {} from '@/index.js'
     */
    alias?: Alias
    proxy?: { [path: string]: ProxyOptions } // 代理配置
}

const wsPath = '/ws'
const defaultExtensions: Extensions = ['.js', '.ts', '.vue', '.jsx', '.tsx', '.json']
const defaultAlias: Alias = {
    '@': 'src'
}

export default class HappyDevServer extends Server {
    private readonly alias: Alias
    private readonly extensions: Extensions
    private isWatch: boolean
    private imports: Imports // 存储第三方库的路径映射
    private importPaths: Array<string> // 存储第三方库的真实路径
    private fileMap: Map<string, string> // 缓存文件编译结果
    private readonly build: Build // 打包管理器
    private readonly setup: HappyDevServerOptions['setup']
    private readonly proxyOptions: HappyDevServerOptions['proxy']
    constructor(options: HappyDevServerOptions = {}) {
        super(options)
        this.isWatch = false
        this.imports = {}
        this.importPaths = []
        this.fileMap = new Map()
        this.build = new Build()

        this.setup = options.setup
        this.extensions = options.extensions ? [...options.extensions, ...defaultExtensions] : [...defaultExtensions]
        this.alias = isObj(options.alias) ? { ...options.alias, ...defaultAlias } : { ...defaultAlias }
        this.proxyOptions = isObj(options.proxy) ? options.proxy : {}
        if (options.watch) this.watch()
    }

    /**
     * 启用代理
     */
    private proxy(): void {
        for (const path in this.proxyOptions) {
            this.app.use(path, createProxyMiddleware(this.proxyOptions[path]))
        }
    }

    /**
     * 启动服务器
     */
    public start(): Promise<void> {
        return new Promise(promiseResolve => {
            const startTimestamp = Date.now()
            super.init()
                .then(async () => {
                    this.imports = this.gatherLib()
                    this.importPaths = Object.values(this.imports)
                    // 如果 isWatch = true，那么自动调用 watchHandler
                    if (this.isWatch) {
                        this.watchHandler()
                    }
                    this.static(staticPlugin)
                    this.setup?.(this.app)
                    this.proxy()
                    this.loadFile()

                    const elapsedTime = Date.now() - startTimestamp
                    console.log(
                        `${beautify(`${pkg.name} v${pkg.version}`, 'green')
                        }   ready in ${beautify(elapsedTime, 'white')} ms`
                    )

                    const arrow = beautify(`➜`, 'green')
                    const ips = getNetworkIps()
                    ips.unshift('localhost')
                    ips.forEach((ip, index) => {
                        const prefix = beautify(index === 0 ? 'Local  ' : 'Network', 'white')
                        const url = `${this.https ? 'https' : 'http'}://${ip}:${this.port}`
                        console.log(`${arrow}  ${prefix} :   ${beautify(url, 'blue')}`)
                    })

                    promiseResolve()
                })
                .catch(err => {
                    throw new Error(err)
                })

            // 为 html 注入若干功能性效果
            const staticPlugin: StaticPlugin = (html) => {
                if (this.isWatch) {
                    // 向浏览器注入 ws 服务
                    const wsScript: string = ejsRender(wsScriptTemp)
                    html += wsScript
                }

                return html
            }
        })
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
            // 如果是 node_module 下的文件变化，则不作处理
            if (fileName?.indexOf('node_module') === 0) return
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
     * 收集所有第三方库
     */
    private gatherLib(): Imports {
        const imports: Imports = {}
        try {
            const packageJson = fs.readFileSync(resolve(toUnixPath(rootPath), './package.json'), 'utf-8')
            const { dependencies } = JSON.parse(packageJson) as PackageJSON // 获取生产依赖
            const packageNames = dependencies ? Object.keys(dependencies) as string[] : [] // 只取依赖包的名字，后续前往 node_modules 获取包路径

            const node_modules = resolve(toUnixPath(rootPath), './node_modules')
            packageNames.forEach(packageName => {
                // 使用 try 兜底，因为可能找不到当前依赖包
                try {
                    const packageRootPath = resolve(node_modules, `./${packageName}`)
                    const packageJsonPath = resolve(packageRootPath, `./package.json`)
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJSON
                    const version = dependencies![packageName]

                    // 如果 exports 字段为对象，将对 exports 对象分析并收集打包项
                    const { exports } = packageJson
                    if (isObj(exports)) {
                        const pureExports = resolveExports(exports)
                        for (const alia in pureExports) {
                            const input = resolve(packageRootPath, pureExports[alia])
                            // 暂时只支持 js 文件的打包
                            if (!['.js', '.cjs', '.mjs'].includes(path.extname(input))) continue

                            const libName = toUnixPath(join(packageName, alia))
                            imports[libName] = this.build.addPackageItem(
                                libName,
                                version,
                                input,
                                packageNames
                            )
                        }
                    } else { // 如果打包入口只有一个，则以 exports > module > main 的顺序打包
                        const { module, main } = packageJson
                        const input = resolve(packageRootPath, exports ?? module ?? main)
                        imports[packageName] = this.build.addPackageItem(
                            packageName,
                            version,
                            input,
                            packageNames
                        )
                    }
                } catch (e) {
                    console.error(e)
                }
            })
        } catch (err) { }
        return imports
    }

    /**
     * 加载来自除静态目录外的各种资源
     * 所有资源都经过处理变成 javascript 格式并发送
     */
    private loadFile(): void {
        this.app.all('/*', async (req, res, next) => {
            const originPath = resolve(toUnixPath(rootPath), '.' + req.url)
            /**
             * 其他 accept 类型的请求将会直接拦截，然后查找是否有目标文件，
             * 如果找不到目标文件将转发 '/' 请求并返回
             */
            if (req.headers.accept !== '*/*') {
                try {
                    const content = fs.readFileSync(originPath)
                    res.send(content)
                } catch (e) {
                    const host = req.get('Host')
                    if (host) {
                        const { data } = await axios.get(`//${host}`)
                        res.send(data)
                    }
                }
                return
            }
            let isLib: boolean = false
            // 如果路径指向第三方库的真实路径，那么打包并开启强缓存
            let libPathIndex: number = -1
            if ((libPathIndex = this.importPaths.indexOf(req.url.slice(1))) !== -1) {
                // 如果存在打包项，那么对第三方库进行打包
                await this.build.building(this.importPaths[libPathIndex])
                res.setHeader("Cache-Control", "max-age=99999999")
                isLib = true
            }
            // 获取解析后的路径
            const filePath = resolve(rootPath, "." + req.url)
            // 如果获取到的文件找不到，则抛出错误
            if (!filePath) {
                try {
                    fs.readFileSync(originPath)
                } catch (e) {
                    console.error(e)
                }
                return
            }
            // 如果有缓存，则取缓存结果发送
            if (this.fileMap.has(filePath)) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8')
                res.send(this.fileMap.get(filePath))
                return
            }
            try {
                const parsedPath = path.parse(filePath)
                const buffer: Buffer = fs.readFileSync(filePath)
                let result: string = await transform(buffer, parsedPath)
                // 如果 babel 转换路径失败，说明不是能识别的文件，那么将不处理直接放行
                try {
                    // 转换路径别名、扩展名和第三方库的路径
                    result = urlTransform(
                        result,
                        parsedPath.dir,
                        this.alias,
                        this.extensions,
                        this.imports
                    )
                } catch (err) {
                    console.log(err)
                }
                // 对于不是指向第三方库的路径，设置文件缓存
                !isLib && this.fileMap.set(filePath, result)
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8')
                res.send(result)
                return
            } catch (e) {
                console.error(e)
                next()
            }
        })
    }
}
