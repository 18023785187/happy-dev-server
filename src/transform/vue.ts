import type { ParsedPath } from 'path'
import { parse, compileTemplate, compileScript, compileStyle, rewriteDefault } from '@vue/compiler-sfc'
import { md5 } from '../utils'
import style from './helpers/style'
import transformTs from './ts'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    const id = md5(parsedPath.dir)
    const dataVId = `data-v-${id}`
    const filename = parsedPath.base
    const name = parsedPath.name
    const renderName = '_sfc_render'
    const source = buffer.toString('utf-8')

    const sfc = parse(source, {
        filename,
        sourceMap: false
    })
    const descriptor = sfc.descriptor
    // 检测 style 标签中是否有 scoped
    const hasScoped = descriptor.styles.some(style => style.scoped)
    const scopeId = hasScoped ? dataVId : undefined

    const output: string[] = []

    // 如果不是 setup 语法，则需要单独处理 template 标签，如果是 setup 语法则不需要
    if (!sfc.descriptor.scriptSetup) {
        const templateSource = compileTemplate({
            id,
            filename,
            source: sfc.descriptor.template!.content,
            scoped: hasScoped,
            compilerOptions: {
                scopeId,
            }
        })
        const templateCode =
            (
                sfc.descriptor.script || sfc.descriptor.scriptSetup ?
                    templateSource.code :
                    rewriteDefault(templateSource.code, parsedPath.name)
            )   // 替换 render 函数的名字
                .replace(
                    /\nexport (function|const) (render|ssrRender)/,
                    '\n$1 _sfc_$2'
                )
        output.push(templateCode)
    }

    // 处理 script 标签
    if (sfc.descriptor.script || sfc.descriptor.scriptSetup) {
        const scriptSource = compileScript(sfc.descriptor, {
            id,
            templateOptions: {
                scoped: hasScoped,
                compilerOptions: {
                    scopeId,
                }
            },
            // 如果是 setup 语法糖，则生成内联 render 函数
            inlineTemplate: !!sfc.descriptor.scriptSetup
        })
        const tsScriptCode = rewriteDefault(scriptSource.content, name, ['typescript'])
        /**
         * TODO:
         * 暂时没弄懂为什么 @vue/compiler-sfc 能不能处理 <script lang="ts"> 中的 ts 语法，
         * 尝试后 ts 并未转为 js，所以先用 babel 手动把 ts 转 js
         */
        const jsScriptCode = await transformTs(
            Buffer.from(tsScriptCode),
            // 改写 parsedPath 对象后缀，让 babel 识别为 ts
            {
                ...parsedPath,
                base: parsedPath.name + '.ts',
                ext: '.ts'
            }
        )
        output.push(jsScriptCode)
    }

    // 处理 style 标签
    const styleSource = descriptor.styles.map(style => {
        const { code } = compileStyle({
            id: dataVId,
            filename,
            source: style.content,
            scoped: style.scoped,
            // 处理相应的 css 预处理器，目前支持 less、scss
            preprocessLang: style.lang as any
        })
        return code
    })
    styleSource.length && output.push(style(styleSource.join('\n')))

    const exportCode = `
    ${!sfc.descriptor.scriptSetup ? `${name}.render= ${renderName}` : ''}
    export default ${name}
    ${hasScoped ? `${name}.__scopeId = "${dataVId}"` : ''}
    `
    output.push(exportCode)

    return output.join('\n')
}
