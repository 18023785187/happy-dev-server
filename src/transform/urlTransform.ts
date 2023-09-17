import fs from 'fs'
import { transform as babelTransform, PluginItem, NodePath } from '@babel/core'
import { importNamespaceSpecifier, identifier, file } from '@babel/types'
import type { StringLiteral, ImportDeclaration, Program, Identifier } from '@babel/types'
import { statement } from '@babel/template'
import { resolve, toUnixPath, rootPath } from '../helper'
import type { Alias, Extensions, Imports } from '../types'

// 排除 http、https、路径引入
const exclude = ['http', '/', './', '../']
const isMatchExclude: (filePath: string) => boolean
    = (filePath) => {
        return exclude.some(prefix => filePath.indexOf(prefix) === 0)
    }
// 排除 http、https 引入
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
    let stat: fs.Stats
    if (fs.existsSync(filePath)) {
        stat = fs.statSync(filePath)
        if (stat.isFile()) { // 如果路径是文件，那么直接返回
            return path
        } else { // 如果路径是目录，那么加上 ./index 继续查找
            filePath = resolve(filePath, './index')
            path += '/index'
        }
    }

    let result: string = path
    extensions.some(extension => {
        const newFilePath = filePath + extension
        if (fs.existsSync(newFilePath)) {
            return result = path + extension
        }
    })
    return result
}

/**
 * 解析 import 中的路径
 * 包括处理路径别名、扩展名、第三方库路径
 * @param node babel StringLiteral
 * @returns 
 */
function transformNodePath(node: StringLiteral, dir: string, alias: Alias, extensions: Extensions, imports: Imports): void {
    // 获取加载路径
    let filePath = node.value
    // 如果是正常的路径，则只检查文件是否存在
    if (isMatchExclude(filePath)) {
        // 如果是 http，则不作处理
        if (isHttp(filePath)) return
        if (node.extra) {
            node.extra.raw = `"${exists(dir, filePath, extensions)}"`
        }
        return
    }
    // 检查是否有路径别名，有则替换并检查文件是否存在
    const subdirectories = filePath.split('/')
    if (alias[subdirectories[0]]) {
        subdirectories[0] = '/' + alias[subdirectories[0]]
        filePath = subdirectories.join('/')
        if (node.extra) {
            node.extra.raw = `"${exists(dir, filePath, extensions)}"`
        }
        return
    }
    /**
     * 如果是第三方库，替换第三方库路径，第三方库路径不做路径检查
     * 如果在 imports 里没找到匹配的第三方库路径，那么尝试拼接 node_modules/ 前缀查找
     */
    if (node.extra) {
        const resultPath = transformPath(imports[filePath] ?? `node_modules/${filePath}`)
        node.extra.raw = `"${resultPath}"`
    }
}

/**
 *  解析来自 commonjs 打包后的库
 *  因为 @rollup/plugin-commonjs 遇到 module.exports = require(url) 的语句时
 * 会解析为 export { xxx as default }，
 * 
 * 原本应该 import * as React from 'react' 的语句时就只导出了 { default: ... }
 * 所以需要额外的解析令上面语句返回正确的导出
 * 
 * 第一步：增加 rollup plugin，令导出增加一行 export const isCommonJS = true;（详情见 src/Build.ts addCommonJSSymbol）
 * 
 * 第二步：
 *  1、如果遇到 import * as React from 'react' 时，将解析为：
 *      import * as __happy_dev_server_React__ from 'react'
 *      const React = __happy_dev_server_React__.isCommonJS ? __happy_dev_server_React__.default : __happy_dev_server_React__
 * 
 *  2、如果遇到 import { useState } from 'react' 时，将解析为：
 *      import * as __happy_dev_server_react__ from 'react'
 *      const useState = __happy_dev_server_react__.isCommonJS ? __happy_dev_server_react__.default.useState : __happy_dev_server_react__.useState
 * @param path 
 */
function transformCommonJSExports(path: NodePath<ImportDeclaration>, imports: Imports) {
    const { node } = path
    // 如果是第三方库，按以上两种情况去处理
    if (imports[node.source?.value]) {
        let specifiers = node.specifiers
        // 查找上面两种导入方式，如果遇到 * as React，那么只处理这种导入即可
        const importSpecifiers: Array<{
            name: string,
            alia: string
        }> = []
        const isBreak = specifiers.some(specifier => {
            //  * as React
            if (specifier.type === 'ImportNamespaceSpecifier') {
                const name = specifier.local.name
                const namespace = `__happy_dev_server_${name}__`
                specifier.local.name = namespace
                const varAst = statement(`const ${name} = ${namespace}.isCommonJS ? ${namespace}.default : ${namespace}`)()
                const body = (path.parent as Program).body
                const curNodePos = body.indexOf(node)
                body.splice(curNodePos + 1, 0, varAst)
                return true
            } else if (specifier.type === 'ImportSpecifier') {
                importSpecifiers.push({
                    // 不明白为什么会有 string 类型的，但一律转为变量即可
                    name: (specifier.imported as Identifier).name ?? (specifier.imported as StringLiteral).value,
                    alia: specifier.local.name
                })
            }
        })
        if (isBreak) return
        // 接下来处理第二种导入
        if (specifiers[0].type === 'ImportDefaultSpecifier') {
            if (specifiers.length === 1) return
            node.specifiers = specifiers = [specifiers[0]]
        } else {
            if (specifiers.length === 0) return
            node.specifiers = specifiers = []
        }
        // 转为 * as xxx, packageName 可能是 react-dom 这样的，一律转大写 ReactDom
        const packageName = node.source.value.split('-').map(item => item[0].toLocaleUpperCase() + item.slice(1)).join('')
        /**
         * 加一个随机数，这样做的目的是防止用户多次导入
         * import { useState } from 'react'
         * import { useEffect } from 'react'
         */
        const namespace = `__happy_dev_server_${packageName + Math.random().toString().slice(2)}__`
        specifiers.push(importNamespaceSpecifier(
            identifier(namespace)
        ))
        const body = (path.parent as Program).body
        const curNodePos = body.indexOf(node)
        importSpecifiers.forEach(({ name, alia }) => {
            const varAst = statement(`const ${alia} = ${namespace}.isCommonJS ? ${namespace}.default.${name} : ${namespace}.${name}`)()
            body.splice(curNodePos + 1, 0, varAst)
        })
    }
}

const createPlugin: (dir: string, alias: Alias, extensions: Extensions, imports: Imports) => PluginItem
    = (dir, alias, extensions, imports = {}) => ({
        visitor: {
            // 处理 import ... from url
            ImportDeclaration(path) {
                const { node } = path
                if (node.source.extra) {
                    transformNodePath(node.source, dir, alias, extensions, imports)
                    transformCommonJSExports(path, imports)
                }
            },
            // 处理 import(url)
            CallExpression(path) {
                const { node } = path
                if (node.callee.type === 'Import') {
                    if (node.arguments[0].extra) {
                        transformNodePath(node.arguments[0] as StringLiteral, dir, alias, extensions, imports)
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