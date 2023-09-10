import { registerMicroApps, start, RegistrableApp } from 'qiankun'

const apps: Array<RegistrableApp<object>> = [
    {
        name: 'microappliction',
        entry: '//localhost:8081',
        container: '#micro-appliction',
        activeRule: '/microappliction',
    }
]

function init() {
    registerMicroApps(apps)
    start()
}

export default init
