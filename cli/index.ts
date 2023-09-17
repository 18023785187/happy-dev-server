import { program } from 'commander'
import pkg from '../src/helper/package.json'
import start from './start'

program
    .name(pkg.name)
    .version(pkg.version, '-v, --version')

program
    .option('-c, --config [filename]', '指定配置文件', 'happy.config.js')
    .option('-w, --watch', '监听文件变动，从而刷新浏览器')
    .option('-p, --port <number>', '指定端口号')
    .option('-s, --static <path>', '指定静态目录存放路径')
    .option('-hs, --https [filePath...]', '指定开启https协议，需提供 key 和 cert 路径，若不提供参数则会自动生成自签名证书')
    .action(start)

program.parse()
