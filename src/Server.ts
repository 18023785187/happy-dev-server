import express from 'express';
import type { Express } from 'express'
import type { Server as ServerType, IncomingMessage, ServerResponse } from 'http'
import { resolve, rootPath } from './utils'

export type HttpServer = ServerType<typeof IncomingMessage, typeof ServerResponse>

type port = number
type https = {
    key: Buffer,
    cert: Buffer
}

export interface ServerOptions {
    host?: string // 域名
    port?: port, // 端口
    https?: https | false // https 服务
    static?: string // 线上静态目录文件位置
    contentBase?: string // 静态文件目录
}

const defaultOptions: Required<ServerOptions> = {
    host: 'localhost',
    port: 1234,
    https: false,
    static: '/static/',
    contentBase: resolve(rootPath + '/public')
}

export default class Server {
    protected readonly options: typeof defaultOptions
    protected app: Express
    protected server: HttpServer | undefined
    constructor(options: ServerOptions) {
        this.options = this.normalization(options)
        this.app = express()
    }

    /**
     * 整理 options 参数
     * @param options 
     * @returns 
     */
    private normalization(options: ServerOptions): typeof defaultOptions {
        const newOptions = { ...defaultOptions }

        if (options?.host) newOptions.host = options.host
        if (options?.port) newOptions.port = options.port
        if (options?.https) newOptions.https = options.https
        if (options?.static) newOptions.static = options.static
        if (options?.contentBase) newOptions.contentBase = options.contentBase

        return newOptions
    }

    /**
     * 启动服务
     * @returns 
     */
    protected async start(): ReturnType<Server['listen']> {
        return new Promise(async (resolve) => {
            if (this.options.https) {
                const https = await import('https')
                const httpsServer = https.createServer(this.options.https, this.app)
                this.server = httpsServer
            } else {
                const http = await import('http')
                const httpServer = http.createServer(this.app)
                this.server = httpServer
            }
            this.options.port = await this.listen()
            resolve(this.options.port)
        })
    }

    /**
     * 监听端口，如果端口被占用则将端口递增再次监听
     */
    private async listen(port = this.options.port): Promise<number> {
        return new Promise((resolve: (port: port) => void, reject: (error: Error) => void) => {
            this.server!.listen(port, this.options.host)
            this.server!.on('listening', () => {
                resolve(port)
            })
            this.server!.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') { // 系统监听端口操作报错
                    this.server!.listen(++port, this.options.host) // 端口递增并再次监听
                } else {
                    reject(error)
                }
            })
        })
    }
}
