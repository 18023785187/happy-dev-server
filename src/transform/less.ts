import type { ParsedPath } from 'path'
import less from 'less'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    const result = await less.render(buffer.toString('utf-8'))

    return `
        const styleEl = document.createElement('style')
        styleEl.innerHTML = \`${result.css}\`
        document.body.appendChild(styleEl)
    `
}