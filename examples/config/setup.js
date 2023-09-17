export default function setup (app) {
    app.get('/list', (req, res) => {
        res.send(JSON.stringify({
            code: 200,
            data: [
                {
                    name: '张三',
                    age: 18,
                    sex: 1
                },
                {
                    name: '李四',
                    age: 17,
                    sex: 0
                }
            ]
        }))
    })
}