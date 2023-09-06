import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// 执行文件的根目录
export const rootPath = process.cwd()

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
 * 查找给定路径的文件是否存在，首先匹配 filePath，若不存在再通过拼接 extensions 逐一匹配，最后返回路径
 * @param filePath 
 * @param extensions 
 * @returns path.ParsedPath
 */
export function resolvePath(filePath: string, extensions: string[]): string | undefined {
    if(fs.existsSync(filePath)) {
        return filePath
    } else {
        let result: string | undefined = undefined
        extensions.some(extension => {
            const newFilePath = filePath + '.' + extension
            if(fs.existsSync(newFilePath)) {
                return result = newFilePath
            }
        })
        return result
    }
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
