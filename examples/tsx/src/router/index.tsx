import React from 'react'
import { RouteObject } from 'react-router-dom';
import Container from '@/views/Container/index'
import Loading from '@/components/Loading'

// 封装懒加载组件方法
type ImportReactFC = () => Promise<{
   default: React.ComponentType<any>;
}>
const lazy: (importReactFC: ImportReactFC) => JSX.Element
   = (importReactFC) => {
      const LoadComponent = React.lazy(importReactFC)
      return (
         <React.Suspense fallback={<Loading />}>
            <LoadComponent />
         </React.Suspense>
      )
   }

const routes: RouteObject[] = [
   {
      path: '*',
      element: <Container />,
      children: [
         {
            path: 'home',
            element: lazy(() => import('@/views/Home')),
            children: [
               {
                  path: 'other',
                  element: lazy(() => import('@/views/Home/Other'))
               }
            ]
         },
         {
            path: 'about',
            element: lazy(() => import('@/views/About'))
         }
      ]
   }
]

export default routes
