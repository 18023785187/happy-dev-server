import express from 'express';
import type { Express } from 'express'
import type { GenerateResult } from 'selfsigned'
import type { Server as ServerType, IncomingMessage, ServerResponse } from 'http'
import { resolve, rootPath } from './helper'

export type HttpServer = ServerType<typeof IncomingMessage, typeof ServerResponse>

type port = number
type https = {
    key: Buffer | string,
    cert: Buffer | string
}

export interface ServerOptions {
    port?: port, // 端口
    https?: https | boolean // https 服务
    static?: string // 线上静态目录文件位置
    contentBase?: string // 静态文件目录
}

const defaultOptions: Required<ServerOptions> = {
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

    get port(): number {
        return this.options.port
    }

    get https(): boolean {
        return !!this.options.https
    }

    /**
     * 整理 options 参数
     * @param options 
     * @returns 
     */
    private normalization(options: ServerOptions): typeof defaultOptions {
        const newOptions = { ...defaultOptions }

        if (options?.port) newOptions.port = options.port
        if (options?.https) newOptions.https = options.https
        if (options?.static) newOptions.static = options.static
        if (options?.contentBase) newOptions.contentBase = options.contentBase

        return newOptions
    }

    /**
     * 初始化服务器
     * @returns 
     */
    protected async init(): ReturnType<Server['listen']> {
        return new Promise(async (resolve) => {
            let certificate: https
            if (this.options.https) {
                if(this.options.https === true) {
                    const pems = await this.createPems()
                    certificate = {
                        key: pems.private,
                        cert: pems.cert
                    }
                } else {
                    certificate = this.options.https
                }
                const https = await import('https')
                const httpsServer = https.createServer(certificate, this.app)
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
            this.server!.listen(port)
            this.server!.on('listening', () => {
                resolve(port)
            })
            this.server!.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') { // 系统监听端口操作报错
                    this.server!.listen(++port) // 端口递增并再次监听
                } else {
                    reject(error)
                }
            })
        })
    }

    private async createPems(): Promise<GenerateResult> {
        const selfsigned = await import('selfsigned')
        const attributes = [{ name: "commonName", value: "localhost" }];
        return selfsigned.generate(attributes, {
            algorithm: "sha256",
            days: 30,
            keySize: 2048,
            extensions: [
                {
                    name: "basicConstraints",
                    cA: true,
                },
                {
                    name: "keyUsage",
                    keyCertSign: true,
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true,
                },
                {
                    name: "extKeyUsage",
                    serverAuth: true,
                    clientAuth: true,
                    codeSigning: true,
                    timeStamping: true,
                },
                {
                    name: "subjectAltName",
                    altNames: [
                        {
                            // type 2 is DNS
                            type: 2,
                            value: "localhost",
                        },
                        {
                            type: 2,
                            value: "localhost.localdomain",
                        },
                        {
                            type: 2,
                            value: "lvh.me",
                        },
                        {
                            type: 2,
                            value: "*.lvh.me",
                        },
                        {
                            type: 2,
                            value: "[::1]",
                        },
                        {
                            // type 7 is IP
                            type: 7,
                            ip: "127.0.0.1",
                        },
                        {
                            type: 7,
                            ip: "fe80::1",
                        },
                    ],
                },
            ],
        });
    }
}
