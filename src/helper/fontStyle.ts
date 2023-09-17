import chalk from 'chalk'

type color = 'white' | 'blue' | 'green'

function bold(string: any): string {
    return chalk.bold(string)
}

export default function beautify(string: any, color: color, isBold: boolean = true): string {
    return isBold ? bold(chalk[color](string)) : chalk[color](string)
}
