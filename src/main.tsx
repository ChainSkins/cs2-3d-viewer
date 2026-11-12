import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { DbProvider } from '@/context/db-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/routes'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <DbProvider>
        <RouterProvider router={router} />
      </DbProvider>
    </TooltipProvider>
  </StrictMode>,
)
