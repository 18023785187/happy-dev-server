import fs from 'fs'
import { transform as babelTransform, PluginItem } from '@babel/core'
import { resolve, toUnixPath, rootPath } from '../utils'
import type { Alias, Extensions, Imports } from '../types'

// 排除 http、https、路径引入
const exclude = ['http', '/', './', '../']
const isMatchExclude: (filePath: string) => boolean
    = (filePath) => {
        return exclude.some(prefix => filePath.indexOf(prefix) === 0)
    }
// 排除 http、https引入
const excludeHttp = ['http', '//']
const isHttp: (filePath: string) => boolean = (filePath) => excludeHttp.some(prefix => filePath.indexOf(prefix) === 0)

const transformPath: (path: string) => string
    = (path) => toUnixPath(resolve('./' + path).replace(rootPath, ''))

/**
 *  查找给定路径和扩展名的文件是否存在
 */
const exists: (dir: string, path: string, extensions: Extensions) => string = (dir, path, extensions) => {
    let filePath: string
    if (path[0] === '/') {
        filePath = resolve(rootPath, '.' + path)
    } else {
        filePath = resolve(dir, path)
    }
    if (fs.existsSync(filePath)) {
        return path
    } else {
        let result: string = path
        extensions.some(extension => {
            const newFilePath = filePath + extension
            if (fs.existsSync(newFilePath)) {
                return result = path + extension
            }
        })
        return result
    }
}

/**
 * 解析 import 中的路径
 * 包括处理路径别名、扩展名、第三方库路径
 * @param node babel StringLiteral
 * @returns 
 */
function transformNodePath(node: any, dir: string, alias: Alias, extensions: Extensions, imports: Imports): void {
    // 获取加载路径
    let filePath = node.value
    // 如果是正常的路径，则只检查文件是否存在
    if (isMatchExclude(filePath)) {
        // 如果是 http，则不作处理
        if (isHttp(filePath)) return
        node.extra.raw = `"${exists(dir, filePath, extensions)}"`
        return
    }
    // 检查是否有路径别名，有则替换并检查文件是否存在
    const subdirectories = filePath.split('/')
    if (alias[subdirectories[0]]) {
        subdirectories[0] = '/' + alias[subdirectories[0]]
        filePath = subdirectories.join('/')
        node.extra.raw = `"${exists(dir, filePath, extensions)}"`
        return
    }
    // 替换第三方库路径，第三方库路径不做路径检查
    const resultPath = transformPath(`node_modules/${imports[filePath] ?? filePath}`)
    node.extra.raw = `"${resultPath}"`
}

const createPlugin: (dir: string, alias: Alias, extensions: Extensions, imports: Imports) => PluginItem
    = (dir, alias, extensions, imports = {}) => ({
        visitor: {
            // 处理 import ... from url
            ImportDeclaration(path) {
                const { node } = path
                if (node.source.extra) {
                    transformNodePath(node.source, dir, alias, extensions, imports)
                }
            },
            // 处理 import(url)
            CallExpression(path) {
                const { node } = path
                if (node.callee.type === 'Import') {
                    if (node.arguments[0].extra) {
                        transformNodePath(node.arguments[0], dir, alias, extensions, imports)
                    }
                }
            },
            // 处理 export ... from url
            ExportNamedDeclaration(path) {
                const { node } = path
                if (node.source?.extra) {
                    transformNodePath(node.source, dir, alias, extensions, imports)
                }
            }
        }
    })

/**
 * 对 import 语句中的路径进行转换
 * @param source 
 * @param dir 文件的执行目录
 * @param alias 路径别名，用于解析别名为真实路径
 * @param extensions 扩展名，用于匹配正确的扩展名
 * @param imports 匹配表，用于匹配第三方库真实路径
 * @returns 
 */
export function urlTransform(source: string, dir: string, alias: Alias, extensions: Extensions, imports: Imports = {}): string {
    return babelTransform(source, {
        plugins: [createPlugin(dir, alias, extensions, imports)],
        ast: false,
        compact: false
    })!.code as string
}