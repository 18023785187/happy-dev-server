import * as ll1 from 'll1-grammar'

const grammars = [
    'E -> T E1',
    'E1 -> + T E1 | null',
    'T -> F T1',
    'T1 -> * F T1 | null',
    'F -> ( E ) | id'
]
const terminalSymbols = ['+', '*', '(', 'id', ')']

const predicteTable = ll1.makeLL1(grammars, terminalSymbols)
predicteTable.print()

document.getElementById('console').innerText = JSON.stringify(predicteTable)