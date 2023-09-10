import React, { createContext, useState, useMemo } from 'react'
import defaultRoutes from '@/router/index'
import { useRoutes } from 'react-router-dom';

type Routes = typeof defaultRoutes
type Context = {
    routes: Routes
    setRoutes: React.Dispatch<React.SetStateAction<Routes>>
}
// 信息载体
export const RouteContext = createContext<Context>({} as Context)
// 信息供应组件
const RouteProvider: React.FC = () => {
    const [routes, setRoutes] = useState<Routes>(defaultRoutes)

    const context = useMemo<Context>(() => ({ routes, setRoutes }), [routes])

    return (
        <RouteContext.Provider value={context}>
            {useRoutes(routes)}
        </RouteContext.Provider>
    )
}

export default RouteProvider
