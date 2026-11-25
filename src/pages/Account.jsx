import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { PiHeart, PiMapPin, PiPencilSimple, PiPlus, PiSignOut, PiTrash } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSession } from '../app/session.jsx'
import AddressForm, { AddressIcon } from '../components/AddressForm.jsx'
import { EmptyState, LoadError, Notice, Spinner } from '../components/bits.jsx'
import OutletCard, { OutletCardSkeleton } from '../components/OutletCard.jsx'
import { useAddresses, useDeleteAddress, useFavourites, useUpdateProfile } from '../lib/queries.js'
import { setTheme, toast, useTheme, useTitle } from '../lib/ui.js'
import { SignInGate } from './Orders.jsx'

const TABS = [
  ['profile', 'Profile', '/account'],
  ['addresses', 'Addresses', '/account/addresses'],
  ['favourites', 'Favourites', '/account/favourites'],
]

function Profile({ user }) {
  const update = useUpdateProfile()
  const theme = useTheme()

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    update.mutate({ name: form.get('name'), phone: form.get('phone') }, { onSuccess: () => toast.success('Profile updated.') })
  }

  return (
    <div className="grid max-w-xl gap-8">
      <form onSubmit={submit} className="grid gap-3.5" noValidate>
        <div>
          <label className="label" htmlFor="profile-name">Full name</label>
          <input id="profile-name" name="name" className="field" defaultValue={user.name} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="profile-email">Email</label>
          <input id="profile-email" className="field bg-sunken text-soft" value={user.email} readOnly />
          <p className="mt-1 text-sm text-faint">Your email is your sign-in and cannot be changed here.</p>
        </div>
        <div>
          <label className="label" htmlFor="profile-phone">Mobile number</label>
          <input id="profile-phone" name="phone" type="tel" inputMode="numeric" className="field" defaultValue={user.phone} autoComplete="tel-national" placeholder="10 digits" />
        </div>
        {update.error && <Notice tone="bad"><span role="alert">{update.error.message}</span></Notice>}
        <button type="submit" className="btn btn-primary w-fit" disabled={update.isPending}>{update.isPending && <Spinner />} Save changes</button>
      </form>

      <div>
        <p className="label">Appearance</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Theme">
          {[['light', 'Light'], ['dark', 'Dark']].map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={theme === value} className="chip" onClick={() => setTheme(value)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Addresses() {
  const addresses = useAddresses()
  const remove = useDeleteAddress()
  const [editing, setEditing] = useState(null)

  if (addresses.isPending) return <div className="skeleton h-32 w-full max-w-2xl" />
  if (addresses.isError) return <LoadError error={addresses.error} onRetry={addresses.refetch} />
  const list = addresses.data

  return (
    <div className="grid max-w-3xl gap-4">
      {list.length === 0 && editing !== 'new' && (
        <EmptyState icon={PiMapPin} title="No saved addresses" action="Add an address" onAction={() => setEditing('new')}>
          Save your home or work address once and checkout takes a single tap.
        </EmptyState>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((address) => (
          <li key={address.id} className={`panel px-4 py-4 ${editing === address.id ? 'sm:col-span-2' : ''}`}>
            {editing === address.id ? (
              <AddressForm address={address} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-start gap-3">
                <AddressIcon label={address.label} size={20} className="mt-0.5 shrink-0 text-leaf" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{address.label}</p>
                  <p className="text-[0.95rem] leading-snug text-soft">{address.line1}{address.landmark ? `, ${address.landmark}` : ''}</p>
                  <p className="text-[0.95rem] text-soft">{address.localityName}, {address.cityName}</p>
                  <div className="-ml-2 mt-2 flex gap-1">
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(address.id)}><PiPencilSimple size={15} /> Edit</button>
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm text-chili hover:bg-chili-tint"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(address.id, { onSuccess: () => toast('Address removed.'), onError: (error) => toast.error(error.message) })}
                    >
                      <PiTrash size={15} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editing === 'new' ? (
        <div className="panel max-w-xl px-4 py-4">
          <p className="mb-3 font-display text-lg font-semibold">New address</p>
          <AddressForm onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        </div>
      ) : list.length > 0 ? (
        <button type="button" className="btn btn-outline w-fit" onClick={() => setEditing('new')}><PiPlus size={16} /> Add a new address</button>
      ) : null}
    </div>
  )
}

function Favourites() {
  const { localityId } = usePlace()
  const favourites = useFavourites(localityId)

  if (favourites.isPending) {
    return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <OutletCardSkeleton key={index} />)}</div>
  }
  if (favourites.isError) return <LoadError error={favourites.error} onRetry={favourites.refetch} />
  if (favourites.data.outlets.length === 0) {
    return (
      <EmptyState icon={PiHeart} title="No favourites yet" action="Browse restaurants" to="/">
        Tap the heart on any restaurant and it will be kept here for next time.
      </EmptyState>
    )
  }
  return (
    <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {favourites.data.outlets.map((outlet) => <li key={outlet.id} className="min-w-0"><OutletCard outlet={outlet} /></li>)}
    </ul>
  )
}

export default function Account() {
  const { tab = 'profile' } = useParams()
  const navigate = useNavigate()
  const { user, status, signOut } = useSession()
  useTitle('Your account')

  if (status === 'checking') return <div className="wrap py-10"><div className="skeleton h-40 w-full max-w-2xl" /></div>
  if (!user) return <SignInGate title="Your account">Sign in to manage your profile, addresses and favourite restaurants.</SignInGate>

  return (
    <div className="wrap py-7 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker mb-1.5">Your account</p>
          <h1 className="text-[2rem] sm:text-[2.4rem]">Hello, {user.name.split(' ')[0]}</h1>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { signOut(); toast('You have been signed out.'); navigate('/') }}>
          <PiSignOut size={16} /> Sign out
        </button>
      </div>

      <nav aria-label="Account sections" className="mb-8 mt-6 flex gap-6 border-b border-line">
        {TABS.map(([key, label, to]) => (
          <NavLink key={key} to={to} end className={({ isActive }) => `-mb-px border-b-2 pb-2.5 text-[1.05rem] font-semibold ${isActive ? 'border-leaf text-ink' : 'border-transparent text-faint hover:text-ink'}`}>
            {label}
          </NavLink>
        ))}
      </nav>

      {tab === 'addresses' ? <Addresses /> : tab === 'favourites' ? <Favourites /> : <Profile user={user} />}
    </div>
  )
}
