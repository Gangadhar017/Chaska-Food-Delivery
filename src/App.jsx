import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useRouteError } from 'react-router-dom'
import { PlaceProvider } from './app/place.jsx'
import { SessionProvider } from './app/session.jsx'
import CartBar from './components/CartBar.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import MobileNav from './components/MobileNav.jsx'
import Toaster from './components/Toaster.jsx'

function PageFallback() {
  return (
    <div className="wrap py-10" aria-busy="true">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton mt-4 h-5 w-96 max-w-full" />
      <div className="skeleton mt-8 h-64 w-full rounded-xl" />
    </div>
  )
}

/** The frame every page sits in: providers, header, footer and the mobile tab bar. */
export default function App() {
  return (
    <PlaceProvider>
      <SessionProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-marigold focus:px-4 focus:py-2 focus:font-semibold focus:text-on-marigold">
          Skip to content
        </a>
        <Header />
        <main id="main" className="min-h-[70dvh]">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <CartBar />
        <MobileNav />
        <Toaster />
        {/* The first page of a visit has no history key of its own, so key it by its address. */}
        <ScrollRestoration getKey={(location) => (location.key === 'default' ? `first:${location.pathname}${location.search}` : location.key)} />
      </SessionProvider>
    </PlaceProvider>
  )
}

/** Shown if a page throws while rendering. */
export function Crash() {
  const error = useRouteError()
  console.error(error)
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6 text-center text-ink">
      <div>
        <p className="kicker mb-2">Something broke</p>
        <h1 className="text-3xl">This page fell over</h1>
        <p className="mx-auto mt-3 max-w-sm text-soft">It is on us, not you. Reloading usually sorts it out.</p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.assign('/')}>Back to the home page</button>
      </div>
    </div>
  )
}
