import React from 'react'
import { useNavigate } from 'react-router-dom'

const SideItem = (props) => {
    const { option } = props
    const navigate = useNavigate()

    return (
        <div
            className="side-item"
            onClick={() => navigate(option.prefixPath + option.path)}
        >{option.name}</div>
    )
}

const SideUnit = (props) => {
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
const Sidebar = (props) => {
    const { options } = props

    return (
        <div className="sidebar">
            <SideUnit options={options} prefixPath={""} />
        </div>
    )
}

export default Sidebar
