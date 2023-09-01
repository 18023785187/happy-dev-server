import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import terser from "@rollup/plugin-terser"; // 压缩代码
import { nodeResolve } from '@rollup/plugin-node-resolve' // 支持第三方模块导入
import ts from 'rollup-plugin-typescript2' // 编译 ts
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

// 导入 commonjs 加载 json
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

const packageName = pkg.name

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolve(...paths) {
    return path.resolve(__dirname, ...paths)
}

const input = resolve('./src/index.ts')
const output = [
    // cjs 格式打包
    { file: resolve(`./dist/${packageName}.cjs`), format: "cjs" },
    // es 格式打包
    { file: resolve(`./dist/${packageName}.mjs`), format: "es" },
    // cjs 格式压缩打包
    { file: resolve(`./dist/${packageName}.min.cjs`), format: "cjs", plugins: [terser()] },
    // es 格式压缩打包
    { file: resolve(`./dist/${packageName}.min.mjs`), format: "es", plugins: [terser()] },
]

export default {
    input,
    output: process.env.NODE_ENV === 'development' ? [output[1]] : [...output],
    plugins: [
        nodeResolve({
            extensions: ['.js', '.ts']
        }),
        commonjs(),
        ts({
            exclude: ["node_modules/**"],
            tsconfig: resolve('./tsconfig.json')
        }),
        json(),
    ],
    // 把生产依赖视为外部库排除打包
    external: Object.keys(pkg.dependencies)
}
