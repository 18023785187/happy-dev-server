import fs from 'fs'
import HappyDevServer from '../src/index'
import type { HappyDevServerOptions } from '../src/index'
import { join, isBoolean } from '../src/helper'
import loadConfigFile from './loadConfigFile'

interface CommandOptions {
    config: string;
    watch?: boolean;
    port?: number;
    static?: string;
    https?: string[] | boolean
}

export default async function start(config: CommandOptions) {
    const commandOptions: HappyDevServerOptions = {}

    if (isBoolean(config.https)) {
        commandOptions.https = config.https
    } else if (!config.https) {
        commandOptions.https = false
    } else {
        const keyPath = join(process.cwd(), config.https[0])
        const certPath = join(process.cwd(), config.https[1])
        commandOptions.https = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        }
    }

    commandOptions.watch = config.watch
    commandOptions.port = config.port
    commandOptions.static = config.static

    const fileOptions = await loadConfigFile(config.config)

    new HappyDevServer({ ...commandOptions, ...fileOptions }).start()
}
