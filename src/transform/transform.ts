import type { ParsedPath } from 'path'
import origin from './origin'
import json from './json'
import css from './css'
import url from './url'
import ts from './ts'
import less from './less'
import scss from './scss'
import vue from './vue'
import react from './react'

interface Transform {
    (buffer: Buffer, parsedPath: ParsedPath): Promise<string>
}

type Handlers = Array<[RegExp, Transform]>

const handlers: Handlers = Object.values({
    js: [/\.js$/, origin],
    json: [/\.json$/, json],
    css: [/\.css$/, css],
    url: [/\.(jpg|png|gif|bmp|jpeg)$/, url],
    ts: [/\.ts$/, ts],
    less: [/\.less$/, less],
    scss: [/\.scss$/, scss],
    vue: [/\.vue$/, vue],
    react: [/\.(jsx|tsx)$/, react],
})

export const transform: Transform = async (buffer: Buffer, parsedPath: ParsedPath) => {
    let result: string = ''
    const extname = parsedPath.ext.toLowerCase() // 转小写匹配正则
    for(const handler of handlers) {
        if(handler[0].test(extname)) {
            result = await handler[1](buffer, parsedPath)
            break
        }
    }
    return result ? result : origin(buffer, parsedPath)
}
