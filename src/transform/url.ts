import type { ParsedPath } from 'path'

const types: { [k: string]: string } = {
    '.doc': 'data:application/msword;base64,',
    '.docx': 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
    '.xls': 'data:application/vnd.ms-excel;base64,',
    '.xlsx': 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,',
    '.pdf': 'data:application/pdf;base64,',
    '.ppt': 'data:application/vnd.ms-powerpoint;base64,',
    '.pptx': 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,',
    '.txt': 'data:text/plain;base64,',
    '.png': 'data:image/png;base64,',
    '.jpg': 'data:image/jpeg;base64,',
    '.gif': 'data:image/gif;base64,',
    '.svg': 'data:image/svg+xml;base64,',
    '.ico': 'data:image/x-icon;base64,',
    '.bmp': 'data:image/bmp;base64,',
}

/**
 * buffer 转 base64
 */
export default async (buffer: Buffer, parsedPath: ParsedPath) => {
    return `
        export default "${types[parsedPath.ext]}${buffer.toString('base64')}"
    `
}