import React from 'react'
import { Outlet } from 'react-router-dom';
import { Button, Space } from 'antd';

const Home: React.FC = () => {
    return <div>
        home
        <Space wrap>
            <Button type="primary">Primary Button</Button>
            <Button>Default Button</Button>
            <Button type="dashed">Dashed Button</Button>
            <Button type="text">Text Button</Button>
            <Button type="link">Link Button</Button>
        </Space>
        <Outlet />
    </div>
}

export default Home