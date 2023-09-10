import fs from 'fs'
import { rollup } from 'rollup'
import type { InputOptions, OutputOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from 'rollup-plugin-replace'
import chalk from 'chalk'
import { resolve, rootPath } from './utils'

export default class Build {
    public static readonly prefix = 'node_modules/.happy-dev-server'
    public readonly packages: Map<string, () => ReturnType<typeof Build['build']>>
    constructor() {
        this.packages = new Map()
    }

    /**
     * 向 packages 添加打包项，返回包相对路径
     * 
     * @param packageName 包名
     * @param version 包版本号
     * @param input 打包入口
     * @param external 排除的第三方库，不让第三方库打包入内
     * @returns string 包装后的库路径
     */
    public addPackageItem(packageName: string, version: string, input: string, external: string[]): string {
        const libName = `${packageName}${encodeURI(version)}.js`
        const libPath = `${Build.prefix}/${libName}`
        // 如果之前已经打包过当前依赖包，且版本没变，那么跳过当前依赖包的打包
        if (fs.existsSync(resolve(rootPath, `./${libPath}`))) {
            return libPath
        }

        const build: () => ReturnType<typeof Build['build']> = () => {
            return new Promise((promiseResolve, promiseReject) => {
                const startTimestamp = Date.now()
                console.log(
                    chalk.bold(`${chalk.green(`🚧  Building:  `)}${chalk.blue(packageName)}`)
                )

                Build.build(
                    input,
                    resolve(rootPath, `./${libPath}`),
                    external
                )
                    .then(() => {
                        const elapsedTime = Date.now() - startTimestamp
                        console.log(
                            `${chalk.bold(chalk.green(`📦  Completed:  ${chalk.blue(packageName)}`))
                            }   ready in ${chalk.bold(chalk.white(elapsedTime))} ms`
                        )
                        promiseResolve()
                    })
                    .catch(err => {
                        promiseReject(err)
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
