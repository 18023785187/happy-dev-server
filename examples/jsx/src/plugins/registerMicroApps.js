import { registerMicroApps, start } from 'qiankun'

const apps = [
    {
        name: 'microapplication',
        entry: '//localhost:8081',
        container: '#micro-application',
        activeRule: '/microapplication',
    }
]

function init() {
    registerMicroApps(apps)
    start()
}

export default init
