import React, { createContext, useState, useMemo } from 'react'
import defaultNavigation from '@/configs/navigation'

type Navigation = typeof defaultNavigation
type Context = {
    navigation: Navigation
    setNavigation: React.Dispatch<React.SetStateAction<Navigation>>
}
// 信息载体
export const NavigationContext = createContext<Context>({} as Context)
// 信息供应组件
const NavigationProvider: React.FC<{ children: React.ReactNode }> = (props) => {
    const [navigation, setNavigation] = useState<Navigation>(defaultNavigation)

    const context = useMemo<Context>(() => ({ navigation, setNavigation }), [navigation])

    return (
        <NavigationContext.Provider value={context}>
            {props.children}
        </NavigationContext.Provider>
    )
}

export default NavigationProvider
