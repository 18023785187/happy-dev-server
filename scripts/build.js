import path from 'path'
import { fileURLToPath } from 'url'
import terser from "@rollup/plugin-terser"; // 压缩代码
import { nodeResolve } from '@rollup/plugin-node-resolve' // 支持第三方模块导入
import ts from 'rollup-plugin-typescript2' // 编译 ts
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import addCliEntry from './plugins/add-cli-entry.js';
import pkg from './package.json.js'

const packageName = pkg.name

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolve(...paths) {
    return path.resolve(__dirname, ...paths)
}

const input = {
    [packageName]: resolve('../src/index.ts')
}
const commonPlugins = [
    nodeResolve({
        extensions: ['.js', '.ts']
    }),
    commonjs(),
    ts({
        exclude: ["node_modules/**"],
        tsconfig: resolve('../tsconfig.json')
    }),
    json(),
]
const commonExternal = Object.keys(pkg.dependencies)

const builds = []
// cli 打包
builds.push(
    {
        input,
        output: [
            {
                dir: resolve(`../dist`),
                chunkFileNames: 'shared/[name].mjs',
                entryFileNames: 'es/[name].mjs',
                format: "es",
            },
        ],
        plugins: [
            addCliEntry(),
            ...commonPlugins,
        ],
        external: commonExternal
    }
)
if (process.env.NODE_ENV !== 'development') {
    const esMinBuild = {
        input,
        output: [
            {
                dir: resolve(`../dist`),
                chunkFileNames: 'shared/[name].min.mjs',
                entryFileNames: 'es/[name].min.mjs',
                format: "es",
                plugins: [terser()]
            },
        ],
        plugins: [
            ...commonPlugins,
        ],
        external: commonExternal
    }
    const commonJSBuild = {
        input,
        output: [
            {
                dir: resolve(`../dist`),
                chunkFileNames: 'shared/[name].cjs',
                entryFileNames: '[name].cjs',
                format: "cjs",
            },
        ],
        plugins: [
            ...commonPlugins,
        ],
        external: commonExternal
    }
    const commonJSMinBuild = {
        input,
        output: [
            {
                dir: resolve(`../dist`),
                chunkFileNames: 'shared/[name].min.cjs',
                entryFileNames: '[name].min.cjs',
                format: "cjs",
                plugins: [terser()]
            },
        ],
        plugins: [
            ...commonPlugins,
        ],
        external: commonExternal
    }
    builds.push(
        esMinBuild,
        commonJSBuild,
        commonJSMinBuild
    )
}

export default builds
