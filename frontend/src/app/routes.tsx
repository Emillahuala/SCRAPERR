import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout'
import { DealsList } from '@/features/deals/DealsList'
import { SailingDetail } from '@/features/sailing-detail/SailingDetail'
import { LoginPage } from '@/features/auth/LoginPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <DealsList />,
      },
      {
        path: '/sailing/:id',
        element: <SailingDetail />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
