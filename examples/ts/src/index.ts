import bindEvent from "./bind-event.ts"
import type { Word } from './bind-event.ts'

const content = document.getElementById('content')!

bindEvent('transform-button')

const word: Word = 'word'
console.log(word)

export default content
