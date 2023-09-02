import type { ParsedPath } from 'path'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    return buffer.toString('utf-8')
}