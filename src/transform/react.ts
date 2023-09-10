import type { ParsedPath } from 'path'
import { transform as babelTransform } from '@babel/core'
import { libPath } from '../utils'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    const source = buffer.toString('utf-8')
    const result = babelTransform(source, {
        cwd: libPath, // 指定 babel 执行的路径
        presets: [
            [
                '@babel/preset-typescript',
                {
                    isTSX: true,
                    allExtensions: true,
                }
            ],
            '@babel/preset-react'
        ],
        filename: parsedPath.base
    })
    return result!.code as string
}