import HTTP from './http'

export async function getList() {
    return await HTTP.get('/list')
}

export async function getNodeList() {
    return await HTTP.get('/api/list')
}