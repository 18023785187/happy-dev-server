import { pathToFileURL } from 'url'
import fs from 'fs'
import type { HappyDevServerOptions } from '../src/index'
import { rootPath, join, isObj } from '../src/helper'

export default async function loadConfigFile(fileName: string): Promise<HappyDevServerOptions> {
    const filePath = join(rootPath, fileName)
    if(fs.existsSync(filePath)) {
        return await getConfigFileExport(filePath)
    } else {
        return {}
    }
}

async function getConfigFileExport(filePath: string): Promise<HappyDevServerOptions> {
    const fileUrl = pathToFileURL(filePath)
    const fileExport = (await import(fileUrl.href)).default
    return isObj(fileExport) ? fileExport : {}
}