import type { ParsedPath } from 'path'

export default (buffer: Buffer, parsedPath: ParsedPath) => {
    return `
        const styleEl = document.createElement('style')
        styleEl.innerHTML = \`${buffer.toString('utf-8')}\`
        document.body.appendChild(styleEl)
    `
}