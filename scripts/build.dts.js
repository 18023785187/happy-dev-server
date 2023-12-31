import path from 'path'
import { fileURLToPath } from 'url'
import dts from "rollup-plugin-dts"; // 生成 .d.ts 文件
import { nodeResolve } from '@rollup/plugin-node-resolve' // 支持第三方模块导入
import pkg from './package.json.js'

const packageName = pkg.name

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolve(...paths) {
    return path.resolve(__dirname, ...paths)
}

export default {
    input: resolve('../src/index.ts'),
    output: {
        file: resolve(`../dist/${packageName}.d.ts`),
        format: "es",
    },
    plugins: [
        nodeResolve(), dts()
    ],
}