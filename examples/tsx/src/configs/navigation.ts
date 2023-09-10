
type SingleNavigation = {
    name: string,
    path: string,
    children?: SingleNavigation[]
}

const navigation:SingleNavigation[] = [
    {
        name: '首页',
        path: '/home',
        children: [
            {
                name: '其他',
                path: '/other'
            }
        ]
    },
    {
        name: '关于',
        path: '/about'
    },
    {
        name: '微前端',
        path: '/microappliction'
    }
]

export default navigation
export type { SingleNavigation }
