import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout'
import { DealsList } from '@/features/deals/DealsList'
import { SailingDetail } from '@/features/sailing-detail/SailingDetail'
import { AlertsList } from '@/features/alerts/AlertsList'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { LoginPage } from '@/features/auth/LoginPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DealsList /> },
      { path: '/sailing/:id', element: <SailingDetail /> },
      { path: '/alerts', element: <AlertsList /> },
      { path: '/insights', element: <InsightsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
