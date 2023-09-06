import type { Imports } from '../HappyDevServer'
import { transform as babelTransform, PluginItem, } from '@babel/core'
import { resolve, toUnixPath, rootPath } from '../utils'

// 排除 http、https、路径引入
const exclude = ['http', '/', './', '../']
const isMatchExclude: (filePath: string) => boolean
    = (filePath) => {
        return exclude.some(prefix => filePath.indexOf(prefix) === 0)
    }

const transformPath: (path: string) => string
= (path) => toUnixPath(resolve('./' + path).replace(rootPath, ''))

const createPlugin: (imports: Imports) => PluginItem
= (imports = {}) => ({
    visitor: {
        ImportDeclaration(path) {
            const { node } = path
            if (node.source.extra) {
                // 获取加载路径
                const filePath = node.source.value
                if (isMatchExclude(filePath)) return
                const resultPath = transformPath(`node_modules/${imports[filePath] ?? filePath}`)
                node.source.extra.raw = `"${resultPath}"`
            }
        },
    }
})

/**
 * 对 import 语句中的路径进行转换
 * @param source 
 * @param imports 匹配表，例如 imports = { 'vue': 'node_module/vue/index.js' }
 * @returns 
 */
export function urlTransform(source: string, imports: Imports = {}): string {
    return babelTransform(source, {
        plugins: [createPlugin(imports)],
        ast: false,
        compact: true
    })!.code as string
}