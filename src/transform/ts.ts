import type { ParsedPath } from 'path'
import { transform as babelTransform } from '@babel/core'

export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    const source = buffer.toString('utf-8')
    const result = babelTransform(source, {
        presets: ['@babel/preset-typescript'],
        filename: parsedPath.base
    })
    return result!.code as string
}