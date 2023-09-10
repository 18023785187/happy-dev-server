import React, { createContext, useState, useMemo } from 'react'
import defaultRoutes from '@/router/index'
import { useRoutes } from 'react-router-dom';

// 信息载体
export const RouteContext = createContext({})
// 信息供应组件
const RouteProvider = () => {
    const [routes, setRoutes] = useState(defaultRoutes)

    const context = useMemo(() => ({ routes, setRoutes }), [routes])

    return (
        <RouteContext.Provider value={context}>
            {useRoutes(routes)}
        </RouteContext.Provider>
    )
}

export default RouteProvider
