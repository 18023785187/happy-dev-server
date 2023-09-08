import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

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
