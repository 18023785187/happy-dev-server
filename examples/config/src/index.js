import { getList, getNodeList } from "./service/request";

getList()
.then(response => {
    const ul = document.createElement('ul')
    response.data.forEach(item => {
        const li = document.createElement('li')
        li.innerText = JSON.stringify(item)
        ul.appendChild(li)
    })
    document.body.appendChild(ul)
})

getNodeList()