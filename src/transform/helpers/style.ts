// 匹配 @import url() 语句
const importReg = /@import\s+url\((.*)\)\s*;*/g

/**
 * 把 css 源码转为 js 插入，其中 css 的 @import 语句转为 js 的 es module
 * @param source 
 * @returns 
 */
export default function style(source: string) {
    const imports: Array<string> = []

    source = source.replace(importReg, (origin, match) => {
        // @import url() 语法中的 url 可以为 'url'，"url"，url，对此统一转为 "url"
        const url = match[0] === `'` || match[0] === `"` ? match : `"${match}"`
        imports.push(url)
        return ''
    })

    return `
        ${imports.map(url => `import ${url};\n`).join('')}
const sheet = new CSSStyleSheet()
sheet.replaceSync(\`${source}\`)
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]`
}