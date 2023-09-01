import { rollup } from 'rollup'
import type { InputOptions, OutputOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from 'rollup-plugin-replace'

/**
 * 调用 rollup 在线打包文件
 * @param input 
 * @param output 
 */
export default function build(input: string, output: string): Promise<void> {
    return new Promise(async promiseResolve => {
        const inputOptions: InputOptions = {
            input,
            plugins: [
                replace({
                    'process.env.NODE_ENV': JSON.stringify('development')
                }),
                nodeResolve({
                    extensions: ['.js']
                }),
                commonjs(),
            ],
        }
        const outputOptions: OutputOptions = {
            file: output,
            format: "es",
            sourcemap: true,
        }

        const bundle = await rollup(inputOptions)
        await bundle.write(outputOptions);

        promiseResolve()
    })
}
