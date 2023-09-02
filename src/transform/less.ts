import type { ParsedPath } from 'path'
import less from 'less'
import style from './helpers/style'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    const result = await less.render(buffer.toString('utf-8'))

    return style(result.css)
}