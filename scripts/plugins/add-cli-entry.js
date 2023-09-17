import { resolve } from 'path'
import { chmod } from 'node:fs/promises';
import MagicString from 'magic-string';
import pkg from '../package.json.js'

const CLI_CHUNK = `bin/${pkg.name}.js`

/**
 * 插入 bin 执行文件
 */
export default function addCliEntry() {
    return {
        name: 'add-cli-entry',
        buildStart() {
            this.emitFile({
				fileName: CLI_CHUNK,
				id: 'cli/index.ts',
				preserveSignature: false,
				type: 'chunk',
			});
        },
        renderChunk(code, chunkInfo) {
			if (chunkInfo.fileName === CLI_CHUNK) {
				const magicString = new MagicString(code);
				magicString.prepend('#!/usr/bin/env node\n\n');
				return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
			}
			return null;
		},
        writeBundle({ dir }) {
			return chmod(resolve(dir, CLI_CHUNK), '755');
		}
    }
}
