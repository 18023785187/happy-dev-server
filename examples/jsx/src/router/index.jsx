import React from 'react'
import Container from '@/views/Container'
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
            element: lazy(() => import('@/views/Home')),
            children: [
               {
                  path: 'other',
                  element: lazy(() => import('@/views/Home'))
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
