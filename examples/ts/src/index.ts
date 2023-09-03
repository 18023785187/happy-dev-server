import bindEvent from "./bind-event"
import type { Word } from './bind-event'

const content = document.getElementById('content')!

bindEvent('transform-button')

const word: Word = 'word'
console.log(word)

export default content
