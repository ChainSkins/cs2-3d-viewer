import { useMemo } from 'react'
import { createBrowserRouter, Outlet, redirect, ScrollRestoration, useParams, type Location as RouterLocation, type RouteObject } from 'react-router-dom'
import { Spinner } from '@/components/common/spinner'
import { HomePage } from '@/pages/home-page'
import type { Selection } from '@/lib/selection'

const scrollKey = (location: RouterLocation) => (location.key === 'default' ? location.pathname + location.search + location.hash : location.key)

function Root() {
  return (
    <>

      <ScrollRestoration getKey={scrollKey} />
      <Outlet />
    </>
  )
}

function PageSpinner() {
  return <div className="grid h-dvh place-items-center"><Spinner /></div>
}

function viewerRoute(path: string, kind: Selection['kind']): RouteObject {
  return {
    path,
    lazy: async () => {
      const { ViewerPage } = await import('@/pages/viewer-page')
      function SelectionRoute() {
        const { item = '', kit = '', id = '' } = useParams()
        const selection = useMemo<Selection>(() => (kind === 'skin' ? { kind, item, kit } : { kind, id } as Selection), [item, kit, id])
        return <ViewerPage selection={selection} />
      }
      return { Component: SelectionRoute }
    },
  }
}

const routes: RouteObject[] = [
  {
    element: <Root />,
    HydrateFallback: PageSpinner,
    children: [
      { path: '/', Component: HomePage },
      viewerRoute('/skin/:item/:kit', 'skin'),
      viewerRoute('/sticker/:id', 'sticker'),
      viewerRoute('/charm/:id', 'charm'),
      viewerRoute('/agent/:id', 'agent'),
      viewerRoute('/pin/:id', 'pin'),
      viewerRoute('/patch/:id', 'patch'),
      viewerRoute('/pet/:id', 'pet'),
      { path: '/inspect/*', lazy: async () => ({ Component: (await import('@/pages/inspect-page')).InspectPage }) },
      { path: '/share/:code', lazy: async () => ({ Component: (await import('@/pages/share-page')).SharePage }) },
      { path: '/embed', lazy: async () => ({ Component: (await import('@/pages/embed-page')).EmbedPage }) },
      { path: '/api', lazy: async () => ({ Component: (await import('@/pages/api-page')).ApiPage }) },
      { path: '*', loader: () => redirect('/') },
    ],
  },
]

export const router = createBrowserRouter(routes)
