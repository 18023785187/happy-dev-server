import type { ParsedPath } from 'path'
import sass from 'node-sass'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    let source: string | Buffer = buffer.toString('utf-8')
    source = source ? sass.renderSync({
        data: buffer.toString('utf-8')
    }).css : source

    return `
        const styleEl = document.createElement('style')
        styleEl.innerHTML = \`${source}\`
        document.body.appendChild(styleEl)
    `
}