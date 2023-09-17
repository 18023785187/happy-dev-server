import fs from 'fs'
import { rollup } from 'rollup'
import type { InputOptions, OutputOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from 'rollup-plugin-replace'
import { resolve, rootPath } from './helper'
import beautify from './helper/fontStyle'

export default class Build {
    private static readonly prefix = 'node_modules/.happy-dev-server'
    private readonly packages: Map<string, () => ReturnType<typeof Build['build']>>
    constructor() {
        this.packages = new Map()
    }

    /**
     * 向外暴露用于打包某个库的方法
     * @param tag 
     */
    public async building(tag: string): Promise<any> {
        const buildFunc = this.packages.get(tag)
        if(buildFunc) {
            await buildFunc()
        }
    }

    /**
     * 向 packages 添加打包项，返回包相对路径
     * 
     * @param packageName 包名
     * @param version 包版本号
     * @param input 打包入口
     * @param external 排除的第三方库，不让第三方库打包入内
     * @returns string 包装后的库路径，后续作为标识找到该库的打包方法
     */
    public addPackageItem(packageName: string, version: string, input: string, external: string[]): string {
        const libName = `${packageName}${encodeURI(version)}.js`
        const libPath = `${Build.prefix}/${libName}`
        // 如果之前已经打包过当前依赖包，且版本没变，那么跳过当前依赖包的打包
        if (fs.existsSync(resolve(rootPath, `./${libPath}`))) {
            return libPath
        }

        /**
         * 避免多次打包，所以在打包过程中多次调用时只有第一次是打了包的，接下来的调用都是在等待第一次打包完成
         * 用户加载到库进行打包时可能也在更改内容，导致浏览器刷新，从而导致多次调用打包器
         */
        let isBuilding: boolean = false
        const fullfilledSubscribers: Array<(res?: any) => void> = []
        const rejectedSubscribers: Array<(err?: any) => void> = []
        const build: () => ReturnType<typeof Build['build']> = () => {
            return new Promise((promiseResolve, promiseReject) => {
                if(isBuilding) {
                    fullfilledSubscribers.push(promiseResolve)
                    rejectedSubscribers.push(promiseReject)
                    return
                }
                isBuilding = true
                const startTimestamp = Date.now()
                console.log(
                    beautify(`🚧  Building:  `, 'green') + beautify(packageName, 'blue')
                )

                Build.build(
                    input,
                    resolve(rootPath, `./${libPath}`),
                    external
                )
                    .then(() => {
                        const elapsedTime = Date.now() - startTimestamp
                        console.log(
                            `${beautify(`📦  Completed:  `, 'green') + beautify(packageName, 'blue')
                            }   ready in ${beautify(elapsedTime, 'white')} ms`
                        )
                        promiseResolve()
                        fullfilledSubscribers.forEach(resolve => resolve())
                        fullfilledSubscribers.length = 0
                        isBuilding = false
                    })
                    .catch(err => {
                        promiseReject(err)
                        rejectedSubscribers.forEach(reject => reject(err))
                        rejectedSubscribers.length = 0
                        isBuilding = false
                    })
            })
        }

        this.packages.set(libPath, build)
        return libPath
    }

    /**
     * 调用 rollup 在线打包文件
     * @param input 打包入口
     * @param output 打包出口
     * @param external 排除的第三方库，不让第三方库打包入内
     */
    private static build(input: string, output: string, external: string[]): Promise<void> {
        return new Promise(async (promiseResolve, promiseReject) => {
            try {
                const inputOptions: InputOptions = {
                    input,
                    plugins: [
                        commonjs(),
                        replace({
                            'process.env.NODE_ENV': JSON.stringify('development')
                        }),
                        nodeResolve({
                            extensions: ['.js']
                        }),
                    ],
                    external
                }
                const outputOptions: OutputOptions = {
                    file: output,
                    format: "es",
                    sourcemap: true,
                }

                const bundle = await rollup(inputOptions)
                await bundle.write(outputOptions);

                promiseResolve()
            } catch (err) {
                promiseReject(err)
            }
        })
    }
}
