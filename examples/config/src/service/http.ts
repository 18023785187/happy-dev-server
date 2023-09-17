
export default class HTTP {
    private static request(method: 'GET', url: string) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest()
            request.responseType = 'json'
            request.open(method, url)

            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status === 200) {
                    resolve(this.response)
                }
            }
            request.onerror = function (error) {
                reject(error)
            }

            request.send()
        })
    }

    public static async get(url: string) {
        return await HTTP.request('GET', url)
    }
}
