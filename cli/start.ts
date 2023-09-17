import fs from 'fs'
import pkg from '../src/helper/package.json'
import HappyDevServer from '../src/index'
import type { HappyDevServerOptions } from '../src/index'
import { getNetworkIps, join, isBoolean } from '../src/helper'
import beautify from '../src/helper/fontStyle'
import loadConfigFile from './loadConfigFile'

interface CommandOptions {
    config: string;
    watch?: boolean;
    port?: number;
    static?: string;
    https?: string[] | boolean
}

export default async function start(config: CommandOptions) {
    const startTimestamp = Date.now()

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

    const server = new HappyDevServer({ ...commandOptions, ...fileOptions })

    server.start()
        .then(() => {
            const elapsedTime = Date.now() - startTimestamp

            console.log(
                `${beautify(`${pkg.name} v${pkg.version}`, 'green')
                }   ready in ${beautify(elapsedTime, 'white')} ms`
            )

            const arrow = beautify(`➜`, 'green')
            const ips = getNetworkIps()
            ips.unshift('localhost')
            ips.forEach((ip, index) => {
                const prefix = beautify(index === 0 ? 'Local  ' : 'Network', 'white')
                const url = `${server.https ? 'https' : 'http'}://${ip}:${server.port}`
                console.log(`${arrow}  ${prefix} :   ${beautify(url, 'blue')}`)
            })
        })
}
