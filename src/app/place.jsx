// Where the customer is ordering to: a locality inside a city.

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useMeta } from '../lib/queries.js'
import LocationPicker from '../components/LocationPicker.jsx'

const PlaceContext = createContext(null)
const KEY = 'chaska.locality'
const FALLBACK = 'blr-koramangala'

function saved() {
  try {
    return localStorage.getItem(KEY) || FALLBACK
  } catch {
    return FALLBACK
  }
}

export function PlaceProvider({ children }) {
  const meta = useMeta()
  const [localityId, setLocalityId] = useState(saved)
  const [pickerOpen, setPickerOpen] = useState(false)

  const choose = useCallback((id) => {
    setLocalityId(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Applies to this visit only.
    }
  }, [])

  const value = useMemo(() => {
    const cities = meta.data?.cities || []
    let city = null
    let locality = null
    for (const candidate of cities) {
      const found = candidate.localities.find((entry) => entry.id === localityId)
      if (found) {
        city = candidate
        locality = found
      }
    }
    // A saved locality that no longer exists falls back to the first one we know.
    if (!locality && cities.length) {
      city = cities.find((candidate) => candidate.localities.some((entry) => entry.id === meta.data.defaultLocalityId)) || cities[0]
      locality = city.localities.find((entry) => entry.id === meta.data.defaultLocalityId) || city.localities[0]
    }
    return {
      localityId: locality?.id || localityId,
      locality,
      city,
      cities,
      cuisines: meta.data?.cuisines || [],
      meta: meta.data || null,
      ready: Boolean(meta.data),
      setLocality: choose,
      openPicker: () => setPickerOpen(true),
    }
  }, [meta.data, localityId, choose])

  return (
    <PlaceContext.Provider value={value}>
      {children}
      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </PlaceContext.Provider>
  )
}

export function usePlace() {
  return useContext(PlaceContext)
}
