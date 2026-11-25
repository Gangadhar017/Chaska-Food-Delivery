// A storage adapter that keeps everything in one plain object.
// The browser-only demo persists that object to localStorage; the tests use it as is.
// It implements the same interface as server/sqliteStore.js.

const emptyState = () => ({ users: [], addresses: [], favourites: [], orders: [] })

export function createMemoryStore({ load, save } = {}) {
  let state = emptyState()
  try {
    const loaded = load ? load() : null
    if (loaded && Array.isArray(loaded.users)) state = { ...emptyState(), ...loaded }
  } catch {
    state = emptyState()
  }
  const commit = () => { if (save) save(state) }
  const copy = (value) => (value ? structuredClone(value) : value)

  return {
    async insertUser(user) {
      state.users.push(copy(user))
      commit()
    },
    async findUserByEmail(email) {
      return copy(state.users.find((user) => user.email === email) || null)
    },
    async findUserById(id) {
      return copy(state.users.find((user) => user.id === id) || null)
    },
    async updateUser(id, patch) {
      const user = state.users.find((entry) => entry.id === id)
      Object.assign(user, patch)
      commit()
      return copy(user)
    },

    async listAddresses(userId) {
      return copy(state.addresses.filter((address) => address.userId === userId).sort((a, b) => a.createdAt - b.createdAt))
    },
    async insertAddress(address) {
      state.addresses.push(copy(address))
      commit()
    },
    async updateAddress(userId, id, patch) {
      const address = state.addresses.find((entry) => entry.id === id && entry.userId === userId)
      if (!address) return null
      Object.assign(address, patch)
      commit()
      return copy(address)
    },
    async deleteAddress(userId, id) {
      const before = state.addresses.length
      state.addresses = state.addresses.filter((entry) => !(entry.id === id && entry.userId === userId))
      commit()
      return state.addresses.length < before
    },

    async listFavourites(userId) {
      return state.favourites.filter((entry) => entry.userId === userId).map((entry) => entry.outletId)
    },
    async setFavourite(userId, outletId, on) {
      state.favourites = state.favourites.filter((entry) => !(entry.userId === userId && entry.outletId === outletId))
      if (on) state.favourites.push({ userId, outletId })
      commit()
    },

    async insertOrder(order) {
      state.orders.push(copy(order))
      commit()
    },
    async listOrders(userId) {
      return copy(state.orders.filter((order) => order.userId === userId).sort((a, b) => b.placedAt - a.placedAt))
    },
    async countOrders(userId) {
      return state.orders.filter((order) => order.userId === userId && !order.cancelledAt).length
    },
    async findOrder(userId, id) {
      return copy(state.orders.find((order) => order.id === id && order.userId === userId) || null)
    },
    async updateOrder(userId, id, patch) {
      const order = state.orders.find((entry) => entry.id === id && entry.userId === userId)
      if (!order) return null
      Object.assign(order, patch)
      commit()
      return copy(order)
    },
  }
}
