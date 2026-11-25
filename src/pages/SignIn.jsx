import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../app/session.jsx'
import AuthForm from '../components/AuthForm.jsx'
import Photo from '../components/Photo.jsx'
import { useTitle } from '../lib/ui.js'

/** Only allow redirects back into the app, never to another site. */
const safeNext = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/')

export default function SignIn() {
  useTitle('Sign in')
  const { user } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  if (user) return <Navigate to={next} replace />

  return (
    <div className="wrap grid gap-10 py-8 sm:py-12 lg:grid-cols-2 lg:items-center">
      <div className="mx-auto w-full max-w-md">
        <p className="kicker mb-1.5">Your account</p>
        <h1 className="text-[2.2rem] sm:text-[2.6rem]">Welcome to Chaska</h1>
        <p className="mb-6 mt-2 text-soft">Sign in to save addresses, keep favourites and follow your orders to the door.</p>
        <div className="panel px-5 py-5">
          <AuthForm onDone={() => navigate(next, { replace: true })} />
        </div>
      </div>
      <div className="hidden lg:block" aria-hidden="true">
        <Photo name="thali" width={640} ratio={0.9} eager className="aspect-[10/9] rounded-2xl border border-line" />
      </div>
    </div>
  )
}
