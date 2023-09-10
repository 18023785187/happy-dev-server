import React from 'react'
import type { SingleNavigation } from '@/configs/navigation'
import { useNavigate } from 'react-router-dom'

type NavOption = {
    option: SingleNavigation & { prefixPath: string }
}
const SideItem: React.FC<NavOption> = (props) => {
    const { option } = props
    const navigate = useNavigate()

    return (
        <div
            className="side-item"
            onClick={() => navigate(option.prefixPath + option.path)}
        >{option.name}</div>
    )
}

type NavOptions = {
    options: SingleNavigation[]
}
const SideUnit: React.FC<NavOptions & { prefixPath: string }> = (props) => {
    const { options, prefixPath } = props

    return (
        <div className="side-unit">
            {
                options.map(option => {
                    const { name, path, children } = option
                    return <React.Fragment key={name}>
                        <SideItem option={{ name, path, prefixPath: prefixPath }} />
                        {children?.length && <SideUnit options={children} prefixPath={prefixPath + path} />}
                    </React.Fragment>
                })
            }
        </div>
    )
}
const Sidebar: React.FC<NavOptions> = (props) => {
    const { options } = props

    return (
        <div className="sidebar">
            <SideUnit options={options} prefixPath={""} />
        </div>
    )
}

export default Sidebar
