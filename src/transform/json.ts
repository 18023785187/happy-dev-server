import type { ParsedPath } from 'path'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    return `
        export default ${buffer.toString('utf-8')}
    `
}