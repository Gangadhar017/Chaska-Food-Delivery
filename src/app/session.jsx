// Who is signed in, and a way for any screen to ask for sign-in.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getToken, onSessionExpired, setToken } from '../lib/api.js'
import AuthDialog from '../components/AuthDialog.jsx'

const SessionContext = createContext(null)

// Cached data that belongs to an account and must go when the account changes.
const PERSONAL = new Set(['me', 'addresses', 'orders', 'order', 'favourites'])

export function SessionProvider({ children }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()))
  const [prompt, setPrompt] = useState(null)

  const me = useQuery({ queryKey: ['me'], queryFn: () => api.get('/me'), enabled: hasToken, staleTime: Infinity, retry: false })

  const forget = useCallback(() => {
    setHasToken(false)
    queryClient.removeQueries({ predicate: (query) => PERSONAL.has(query.queryKey[0]) })
    queryClient.invalidateQueries({ predicate: (query) => ['restaurant', 'quote'].includes(query.queryKey[0]) })
  }, [queryClient])

  useEffect(() => onSessionExpired(forget), [forget])

  const start = useCallback((data) => {
    setToken(data.token)
    queryClient.removeQueries({ predicate: (query) => PERSONAL.has(query.queryKey[0]) })
    queryClient.setQueryData(['me'], { user: data.user })
    queryClient.invalidateQueries({ predicate: (query) => ['restaurant', 'quote'].includes(query.queryKey[0]) })
    setHasToken(true)
    return data.user
  }, [queryClient])

  const value = useMemo(() => {
    const user = hasToken ? me.data?.user || null : null
    return {
      user,
      // 'checking' only while a saved session is being confirmed on first load.
      status: user ? 'signed-in' : hasToken && me.isPending ? 'checking' : 'guest',
      signIn: async (email, password) => start(await api.post('/auth/login', { email, password })),
      signUp: async (details) => start(await api.post('/auth/register', details)),
      signOut: () => {
        setToken(null)
        forget()
      },
      /** Open the sign-in dialog. `then` runs after a successful sign-in. */
      askToSignIn: (reason, then) => setPrompt({ reason, then }),
    }
  }, [hasToken, me.data, me.isPending, start, forget])

  return (
    <SessionContext.Provider value={value}>
      {children}
      <AuthDialog
        open={Boolean(prompt)}
        reason={prompt?.reason}
        onClose={() => setPrompt(null)}
        onDone={() => {
          const then = prompt?.then
          setPrompt(null)
          then?.()
        }}
      />
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
