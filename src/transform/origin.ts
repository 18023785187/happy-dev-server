import type { ParsedPath } from 'path'

export default (buffer: Buffer, parsedPath: ParsedPath) => {
    return buffer.toString('utf-8')
}