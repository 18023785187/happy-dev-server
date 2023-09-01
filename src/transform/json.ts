import type { ParsedPath } from 'path'

export default (buffer: Buffer, parsedPath: ParsedPath) => {
    return `
        export default ${buffer.toString('utf-8')}
    `
}