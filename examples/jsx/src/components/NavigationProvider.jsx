import React, { createContext, useState, useMemo } from 'react'
import defaultNavigation from '@/configs/navigation'

// 信息载体
export const NavigationContext = createContext({})
// 信息供应组件
const NavigationProvider = (props) => {
    const [navigation, setNavigation] = useState(defaultNavigation)

    const context = useMemo(() => ({ navigation, setNavigation }), [navigation])

    return (
        <NavigationContext.Provider value={context}>
            {props.children}
        </NavigationContext.Provider>
    )
}

export default NavigationProvider
