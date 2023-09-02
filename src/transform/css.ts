import type { ParsedPath } from 'path'
import style from './helpers/style'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    return style(buffer.toString('utf-8'))
}