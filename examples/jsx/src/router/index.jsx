import React from 'react'
import Container from '@/views/Container/index'
import Loading from '@/components/Loading'

const lazy = (importReactFC) => {
      const LoadComponent = React.lazy(importReactFC)
      return (
         <React.Suspense fallback={<Loading />}>
            <LoadComponent />
         </React.Suspense>
      )
   }

const routes = [
   {
      path: '*',
      element: <Container />,
      children: [
         {
            path: 'home',
            element: lazy(() => import('@/views/Home/index')),
            children: [
               {
                  path: 'other',
                  element: lazy(() => import('@/views/Home/Other'))
               }
            ]
         },
         {
            path: 'about',
            element: lazy(() => import('@/views/About/index'))
         }
      ]
   }
]

export default routes
