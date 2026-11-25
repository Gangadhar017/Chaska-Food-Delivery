import { lazy, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App, { Crash } from './App.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'

// The home page ships in the first bundle; every other page loads when it is first opened.
const Restaurant = lazy(() => import('./pages/Restaurant.jsx'))
const Collection = lazy(() => import('./pages/Collection.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Offers = lazy(() => import('./pages/Offers.jsx'))
const Help = lazy(() => import('./pages/Help.jsx'))
const SignIn = lazy(() => import('./pages/SignIn.jsx'))

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <Crash />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/restaurant/:id', element: <Restaurant /> },
      { path: '/cuisine/:id', element: <Collection /> },
      { path: '/search', element: <Search /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/orders', element: <Orders /> },
      { path: '/orders/:id', element: <OrderDetail /> },
      { path: '/account', element: <Account /> },
      { path: '/account/:tab', element: <Account /> },
      { path: '/offers', element: <Offers /> },
      { path: '/help', element: <Help /> },
      { path: '/signin', element: <SignIn /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => count < 2 && (!error?.status || error.status >= 500),
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
