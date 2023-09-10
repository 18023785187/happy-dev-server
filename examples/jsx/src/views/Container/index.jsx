import React, { useContext } from 'react'
import './index.scss'
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'
import MicroAppliction from '@/components/MicroAppliction/index'
import { NavigationContext } from '@/components/NavigationProvider'

const Container = () => {
    const { navigation } = useContext(NavigationContext)

    return (
        <div className={'container'}>
            <div className="header">
                <h1>React Demo</h1>
            </div>
            <div className="main">
                <Sidebar options={navigation} />
                <div id="viewer">
                    <Outlet />
                    <MicroAppliction />
                </div>
            </div>
        </div>
    )
}

export default Container