#!/usr/bin/env node
import { createRequire } from 'module'
import { program } from 'commander'
import HappyDevServer from '../dist/happy-dev-server.mjs'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

program
    .name(pkg.name)
    .description('start server...')
    .version(pkg.version, '-v, --version')

program
    .option('-w, --watch')
    .option('-p, --port <char>')
    .option('-h, --host <char>')
    .option('-s, --static <char>')
    .action(start)

program.parse()

function start(config) {
    const server = new HappyDevServer({
        port: config.port,
        host: config.host,
        static: config.static
    })

    if(config.watch) server.watch()
}