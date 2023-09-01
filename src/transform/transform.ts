import type { ParsedPath } from 'path'
import origin from './origin'
import json from './json'
import css from './css'
import url from './url'

interface Transform {
    (buffer: Buffer, parsedPath: ParsedPath): string
}

type Handlers = Array<[RegExp, Transform]>

const handlers: Handlers = Object.values({
    js: [/\.js$/, origin],
    json: [/\.json$/, json],
    css: [/\.css$/, css],
    url: [/\.(jpg|png|gif|bmp|jpeg)$/, url],
})

export const transform: Transform = (buffer: Buffer, parsedPath: ParsedPath) => {
    let result: string = ''
    const extname = parsedPath.ext.toLowerCase() // 转小写匹配正则
    handlers.some(handler => {
        if(handler[0].test(extname)) {
            result = handler[1](buffer, parsedPath)
            return true
        }
    })
    return result ? result : origin(buffer, parsedPath)
}
