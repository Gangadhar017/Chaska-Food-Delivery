// Data hooks. Every screen reads and writes through these.

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api.js'

const MINUTE = 60_000

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => api.get('/meta'), staleTime: Infinity })
}

export function useHome(localityId) {
  return useQuery({
    queryKey: ['home', localityId],
    queryFn: () => api.get('/home', { locality: localityId }),
    staleTime: 5 * MINUTE,
    placeholderData: keepPreviousData,
  })
}

export function useOutlets(localityId, filters) {
  return useInfiniteQuery({
    queryKey: ['outlets', localityId, filters],
    queryFn: ({ pageParam }) => api.get('/restaurants', { locality: localityId, ...filters, page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 5 * MINUTE,
    placeholderData: keepPreviousData,
  })
}

export function useRestaurant(id, localityId) {
  return useQuery({
    queryKey: ['restaurant', id, localityId],
    queryFn: () => api.get(`/restaurants/${id}`, { locality: localityId }),
    staleTime: 5 * MINUTE,
    retry: (count, error) => error?.status !== 404 && count < 2,
  })
}

export function useSearch(localityId, text) {
  const q = text.trim()
  return useQuery({
    queryKey: ['search', localityId, q],
    queryFn: () => api.get('/search', { locality: localityId, q }),
    enabled: q.length >= 2,
    staleTime: 5 * MINUTE,
    placeholderData: keepPreviousData,
  })
}

export function useSuggestions(localityId, text) {
  const q = text.trim()
  return useQuery({
    queryKey: ['suggest', localityId, q],
    queryFn: () => api.get('/suggest', { locality: localityId, q }),
    enabled: q.length >= 2,
    staleTime: 5 * MINUTE,
    placeholderData: keepPreviousData,
  })
}

export function useCoupons(outletId) {
  return useQuery({
    queryKey: ['coupons', outletId || 'all'],
    queryFn: () => api.get('/coupons', { outlet: outletId }),
    staleTime: Infinity,
  })
}

/** The priced cart. Re-fetched whenever anything that affects the bill changes. */
export function useQuote(payload, enabled = true) {
  return useQuery({
    queryKey: ['quote', payload],
    queryFn: () => api.post('/quote', payload),
    enabled: enabled && Boolean(payload?.outletId) && payload.lines.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

// ── Signed-in data ──────────────────────────────────────────────────────────

export function useAddresses(enabled = true) {
  return useQuery({ queryKey: ['addresses'], queryFn: () => api.get('/me/addresses'), enabled, select: (data) => data.items })
}

export function useSaveAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api.put(`/me/addresses/${id}`, body) : api.post('/me/addresses', body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/me/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useFavourites(localityId, enabled = true) {
  return useQuery({
    queryKey: ['favourites', localityId],
    queryFn: () => api.get('/me/favourites', { locality: localityId }),
    enabled,
    staleTime: MINUTE,
  })
}

export function useToggleFavourite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ outletId, on }) => api.put(`/me/favourites/${outletId}`, { on }),
    // Flip the heart straight away; put it back if the request fails.
    onMutate: async ({ outletId, on }) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] })
      const previous = queryClient.getQueriesData({ queryKey: ['favourites'] })
      queryClient.setQueriesData({ queryKey: ['favourites'] }, (data) =>
        data ? { ...data, ids: on ? [...new Set([outletId, ...data.ids])] : data.ids.filter((id) => id !== outletId) } : data,
      )
      return { previous }
    },
    onError: (error, variables, context) => {
      for (const [key, data] of context?.previous || []) queryClient.setQueryData(key, data)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  })
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled,
    select: (data) => data.items,
    // Keep the list moving while something is on its way.
    refetchInterval: (query) => (query.state.data?.items?.some((order) => order.tracking.active) ? 5000 : false),
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: Boolean(id),
    select: (data) => data.order,
    refetchInterval: (query) => (query.state.data?.order?.tracking.active ? 2000 : false),
    retry: (count, error) => error?.status !== 404 && error?.status !== 401 && count < 2,
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/orders', body),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(['order', order.id], { order })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useOrderAction(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, body }) => api.post(`/orders/${id}/${action}`, body),
    onSuccess: (data) => {
      queryClient.setQueryData(['order', id], data)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch('/me', body),
    onSuccess: (data) => queryClient.setQueryData(['me'], data),
  })
}
