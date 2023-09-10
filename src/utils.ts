import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import type { Exports } from './types'

export function isObj(target: any): target is Object {
    return Object.prototype.toString.call(target) === '[object Object]'
}

// 执行文件的根目录
export const rootPath = process.cwd()
// happy-dev-server的根目录
export const libPath = resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 合并文件路径
 * @param paths 
 * @returns 
 */
export function resolve(...paths: string[]): string {
    return path.resolve(...paths)
}

export function join(...paths: string[]): string {
    return path.join(...paths)
}

/**
 * 转换掉反斜杠的路径
 * D:\Top\index.js -> D:/Top/index.js
 * @param url 
 * @returns 
 */
export function toUnixPath(url: string): string {
    return url.split(path.sep).join('/')
}

/**
 * 解析 package.json 中的 exports 字段，返回处理后的结果
 * 1、如果属性值为字符串，直接赋值
 * 2、如果属性值为 null，跳过
 * 3、如果属性值为 Object，查找是否存在 import、require、default 字段，有且不为 null 则赋值，没有则跳过
 * 4、路径暂不支持 /*、/**，这类情况将跳过处理
 * @param exports 
 */
export function resolveExports(exports: Exports): { [k: string]: string } {
    const omit = '/*'
    const getExportUrl: (exportUrl: string | null) => string | null = (exportUrl) => {
        if (!exportUrl) return null
        if (exportUrl.indexOf(omit) === -1) return exportUrl
        return null
    }
    const result: ReturnType<typeof resolveExports> = {}
    for (const k in exports) {
        const item = exports[k]
        if (typeof item === 'string') {
            if (!getExportUrl(item)) continue
            result[k] = item
        } else if (item === null) {
            continue
        } else { // 对象
            const exportUrl =
            getExportUrl(isObj(item.import) ? (item.import as any).default : item.import) ??
            getExportUrl(isObj(item.require) ? (item.require as any).default : item.require) ??
            getExportUrl(isObj(item.default) ? (item.default as any).default : item.default)
            if (exportUrl) {
                result[k] = exportUrl
            }
        }
    }
    return result
}

/**
 * 防抖函数
 * @param func 
 * @param wait 
 * @returns 
 */
export function debounce<T extends (...rest: any[]) => void>(func: T, wait: number = 300)
    : T {
    let timer: NodeJS.Timeout
    return function (this: unknown, ...rest: Parameters<T>) {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.call(this, ...rest)
        }, wait)
    } as T
}

/**
 * 输入字符串返回 md5 加密结果
 * @param text 
 * @returns 
 */
export function md5(text: string): string {
    return crypto.createHash('md5').update(text).digest("hex")
}
