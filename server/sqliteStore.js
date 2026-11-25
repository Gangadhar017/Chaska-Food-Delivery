// SQLite storage for the API, using the driver built into Node (node:sqlite).
// Implements the same interface as shared/memoryStore.js.

import { DatabaseSync } from 'node:sqlite'

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label         TEXT NOT NULL,
    line1         TEXT NOT NULL,
    landmark      TEXT NOT NULL DEFAULT '',
    locality_id   TEXT NOT NULL,
    locality_name TEXT NOT NULL,
    city_name     TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS addresses_by_user ON addresses (user_id, created_at);

  CREATE TABLE IF NOT EXISTS favourites (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    outlet_id  TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, outlet_id)
  );

  -- The order document is stored whole; the columns beside it are the ones we query on.
  CREATE TABLE IF NOT EXISTS orders (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    number       TEXT NOT NULL,
    outlet_id    TEXT NOT NULL,
    total        INTEGER NOT NULL,
    placed_at    INTEGER NOT NULL,
    cancelled_at INTEGER,
    document     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_by_user ON orders (user_id, placed_at DESC);
`

const toUser = (row) => row && {
  id: row.id, name: row.name, email: row.email, phone: row.phone, passwordHash: row.password_hash, createdAt: row.created_at,
}

const toAddress = (row) => row && {
  id: row.id, userId: row.user_id, label: row.label, line1: row.line1, landmark: row.landmark,
  localityId: row.locality_id, localityName: row.locality_name, cityName: row.city_name, createdAt: row.created_at,
}

export function createSqliteStore(file) {
  const db = new DatabaseSync(file)
  db.exec(SCHEMA)

  const sql = {
    insertUser: db.prepare('INSERT INTO users (id, name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    updateUser: db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?'),

    addresses: db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at'),
    address: db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?'),
    insertAddress: db.prepare('INSERT INTO addresses (id, user_id, label, line1, landmark, locality_id, locality_name, city_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    updateAddress: db.prepare('UPDATE addresses SET label = ?, line1 = ?, landmark = ?, locality_id = ?, locality_name = ?, city_name = ? WHERE id = ? AND user_id = ?'),
    deleteAddress: db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?'),

    favourites: db.prepare('SELECT outlet_id FROM favourites WHERE user_id = ? ORDER BY created_at DESC'),
    addFavourite: db.prepare('INSERT OR IGNORE INTO favourites (user_id, outlet_id, created_at) VALUES (?, ?, ?)'),
    removeFavourite: db.prepare('DELETE FROM favourites WHERE user_id = ? AND outlet_id = ?'),

    insertOrder: db.prepare('INSERT INTO orders (id, user_id, number, outlet_id, total, placed_at, cancelled_at, document) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
    orders: db.prepare('SELECT document FROM orders WHERE user_id = ? ORDER BY placed_at DESC LIMIT 100'),
    order: db.prepare('SELECT document FROM orders WHERE id = ? AND user_id = ?'),
    countOrders: db.prepare('SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND cancelled_at IS NULL'),
    updateOrder: db.prepare('UPDATE orders SET cancelled_at = ?, document = ? WHERE id = ? AND user_id = ?'),
  }

  return {
    close: () => db.close(),

    async insertUser(user) {
      sql.insertUser.run(user.id, user.name, user.email, user.phone || '', user.passwordHash, user.createdAt)
    },
    async findUserByEmail(email) {
      return toUser(sql.userByEmail.get(email)) || null
    },
    async findUserById(id) {
      return toUser(sql.userById.get(id)) || null
    },
    async updateUser(id, patch) {
      const current = toUser(sql.userById.get(id))
      const next = { ...current, ...patch }
      sql.updateUser.run(next.name, next.phone || '', id)
      return next
    },

    async listAddresses(userId) {
      return sql.addresses.all(userId).map(toAddress)
    },
    async insertAddress(a) {
      sql.insertAddress.run(a.id, a.userId, a.label, a.line1, a.landmark || '', a.localityId, a.localityName, a.cityName, a.createdAt)
    },
    async updateAddress(userId, id, a) {
      const done = sql.updateAddress.run(a.label, a.line1, a.landmark || '', a.localityId, a.localityName, a.cityName, id, userId)
      return done.changes ? toAddress(sql.address.get(id, userId)) : null
    },
    async deleteAddress(userId, id) {
      return sql.deleteAddress.run(id, userId).changes > 0
    },

    async listFavourites(userId) {
      return sql.favourites.all(userId).map((row) => row.outlet_id)
    },
    async setFavourite(userId, outletId, on) {
      if (on) sql.addFavourite.run(userId, outletId, Date.now())
      else sql.removeFavourite.run(userId, outletId)
    },

    async insertOrder(order) {
      sql.insertOrder.run(order.id, order.userId, order.number, order.outlet.id, order.bill.total, order.placedAt, order.cancelledAt, JSON.stringify(order))
    },
    async listOrders(userId) {
      return sql.orders.all(userId).map((row) => JSON.parse(row.document))
    },
    async countOrders(userId) {
      return sql.countOrders.get(userId).n
    },
    async findOrder(userId, id) {
      const row = sql.order.get(id, userId)
      return row ? JSON.parse(row.document) : null
    },
    async updateOrder(userId, id, patch) {
      const row = sql.order.get(id, userId)
      if (!row) return null
      const next = { ...JSON.parse(row.document), ...patch }
      sql.updateOrder.run(next.cancelledAt, JSON.stringify(next), id, userId)
      return next
    },
  }
}
