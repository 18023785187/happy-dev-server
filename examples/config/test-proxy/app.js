import express from 'express';

const app = express()

app.get('/list', (req, res) => {
    res.send(response(200, []))
})

app.listen(3000, () => {
    console.log('测试代理功能：http://localhost:3000')
})

function response(code, data) {
    return JSON.stringify({
        code, data
    })
}
