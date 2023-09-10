import React, { useState, useEffect, useTransition } from 'react'

const Other: React.FC = () => {
    const [list, setList] = useState<number[]>(new Array(10).fill(1))
    const [color, setColor] = useState<string>('red')
    const [isPending, startTransition] = useTransition()
    useEffect(() => {
        setTimeout(() => {
            setColor('blue')
            startTransition(() => {
                setList(new Array(10000).fill(1))
            })
        }, 1000)
    }, [])

    return (
        <div>
            测试 useTransition 作用，<span style={{ color }}>1秒后该红色文本先变为蓝色，后渲染长列表，因为渲染长列表的优先级变低了</span>
            {list.map((num, i) => (<div key={Math.random()}>{i}</div>))}
        </div>
    )
}

export default Other