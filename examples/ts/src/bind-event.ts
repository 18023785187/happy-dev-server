import content from './index'

type Word = string

function bindEvent(selected: string): void {
    const btn = document.getElementById(selected)
    if(btn) {
        btn.addEventListener('click', () => {
            content.innerText = 'js'
        })
    }
}

export default bindEvent
export type { Word }
