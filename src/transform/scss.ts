import type { ParsedPath } from 'path'
import sass from 'node-sass'
import style from './helpers/style'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    let source: string = buffer.toString('utf-8')
    source = source ? sass.renderSync({
        data: buffer.toString('utf-8')
    }).css.toString('utf-8') : source

    return style(source)
}