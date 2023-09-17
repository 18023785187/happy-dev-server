import setup from "./setup.js"

export default {
    watch: true,
    setup,
    proxy: {
        '/api': {
            target: 'http://localhost:3000', // 这是本地用 node 写的一个服务
            pathRewrite: { "^/api": "" }, // 后台在转接的时候 url 中是没有 /api 的
            changeOrigin: true, // 加了这个属性，那后端收到的请求头中的 host 是目标地址 target
        }
    }
}