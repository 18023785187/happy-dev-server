#!/usr/bin/env node
import os from 'os'
import { createRequire } from 'module'
import { program } from 'commander'
import chalk from 'chalk'
import HappyDevServer from '../dist/happy-dev-server.mjs'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

program
    .name(pkg.name)
    .version(pkg.version, '-v, --version')

program
    .option('-w, --watch')
    .option('-p, --port <char>')
    .option('-s, --static <char>')
    .action(start)

program.parse()

function start(config) {
    const startTimestamp = Date.now()

    const server = new HappyDevServer({
        port: config.port,
        static: config.static
    })

    if (config.watch) server.watch()

    server.start()
        .then(() => {
            const elapsedTime = Date.now() - startTimestamp

            console.log(
                `${chalk.bold(chalk.green(`${pkg.name} v${pkg.version}`))
                }   ready in ${chalk.bold(chalk.white(elapsedTime))
                } ms`
            )

            const arrow = chalk.bold(chalk.green(`➜`))
            const ips = getNetworkIps()
            ips.unshift('localhost')
            ips.forEach((ip, index) => {
                const prefix = chalk.bold(chalk.white(index === 0 ? 'Local  ' : 'Network'))
                const url = `${server.https ? 'https' : 'http'}://${ip}:${server.port}`
                console.log(`${arrow}  ${prefix}:   ${chalk.bold(chalk.blue(url))}`)
            })
        })
}

/**
 * 获取除 localhost 外的 ipv4 地址
 * @returns 
 */
function getNetworkIps() {
    return Object.values(
        os.networkInterfaces()
    )
        .filter(net => net.every(item => item.address !== '127.0.0.1'))
        .map(network => network.filter(item => item.family === 'IPv4')[0].address)
}
