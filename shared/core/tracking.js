// Order lifecycle. An order's timetable is fixed when it is placed; its status at any
// moment is worked out from the clock. Nothing has to run in the background, which is
// why the same code can drive tracking on the server and in the browser-only demo.

import { clamp, seededRandom } from './util.js'

export const STAGES = ['placed', 'confirmed', 'preparing', 'picked_up', 'arriving', 'delivered']

const RIDERS = ['Ramesh K.', 'Imran S.', 'Suresh P.', 'Arjun M.', 'Vikram T.', 'Deepak R.', 'Santosh B.', 'Faizan A.', 'Manoj Y.', 'Karthik N.', 'Sunil D.', 'Asif M.']

/**
 * Lay out the timetable for a new order.
 * Times on screen are in minutes; `secondsPerMinute` says how many real seconds one of
 * those minutes lasts. 60 is real time, the default of 4 plays a delivery back at 15x.
 */
export function planOrder({ placedAt, etaMinutes, prepMinutes, secondsPerMinute }) {
  const minute = secondsPerMinute * 1000
  const eta = Math.max(12, etaMinutes)
  const pickedUp = clamp(prepMinutes + 2, 6, eta - 5)
  return {
    confirmedAt: placedAt + 1 * minute,
    preparingAt: placedAt + 2.5 * minute,
    pickedUpAt: placedAt + pickedUp * minute,
    arrivingAt: placedAt + (eta - 3) * minute,
    deliveredAt: placedAt + eta * minute,
  }
}

export function assignRider(orderId) {
  const random = seededRandom(`rider:${orderId}`)
  const name = RIDERS[Math.floor(random() * RIDERS.length)]
  const state = ['KA', 'DL', 'MH', 'TS', 'UP'][Math.floor(random() * 5)]
  const plate = `${state} ${String(Math.floor(random() * 90) + 10)} ${'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(random() * 23)]}${'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(random() * 23)]} ${String(Math.floor(random() * 9000) + 1000)}`
  return {
    name,
    vehicle: plate,
    rating: Math.round((4.4 + random() * 0.5) * 10) / 10,
    deliveries: Math.round(400 + random() * 5200),
  }
}

const COPY = {
  placed: ['Order placed', (o) => `We have sent your order to ${o.outlet.name}.`],
  confirmed: ['Restaurant confirmed', (o) => `${o.outlet.name} has accepted your order.`],
  preparing: ['Being prepared', () => 'Your food is on the fire.'],
  picked_up: ['Out for delivery', (o) => `${o.rider.name} has picked up your order.`],
  arriving: ['Almost there', (o) => `${o.rider.name} is a couple of minutes away.`],
  delivered: ['Delivered', () => 'Enjoy your meal.'],
}

/** Where an order stands at time `now` (milliseconds since the epoch). */
export function trackOrder(order, now, secondsPerMinute) {
  const { schedule, placedAt } = order
  const times = [placedAt, schedule.confirmedAt, schedule.preparingAt, schedule.pickedUpAt, schedule.arrivingAt, schedule.deliveredAt]

  const cancelled = Boolean(order.cancelledAt)
  const clock = cancelled ? order.cancelledAt : now
  let stageIndex = 0
  for (let i = 0; i < times.length; i++) if (clock >= times[i]) stageIndex = i

  const status = cancelled ? 'cancelled' : STAGES[stageIndex]
  const minute = secondsPerMinute * 1000
  const remainingMs = Math.max(0, schedule.deliveredAt - now)
  const ride = clamp((now - schedule.pickedUpAt) / (schedule.deliveredAt - schedule.pickedUpAt), 0, 1)

  return {
    status,
    stageIndex,
    headline: cancelled ? 'Order cancelled' : COPY[status][0],
    detail: cancelled ? 'This order was cancelled before the kitchen started on it.' : COPY[status][1](order),
    etaMinutes: cancelled || status === 'delivered' ? 0 : Math.max(1, Math.ceil(remainingMs / minute)),
    progress: cancelled ? 0 : clamp((now - placedAt) / (schedule.deliveredAt - placedAt), 0, 1),
    riderProgress: cancelled ? 0 : ride,
    riderAssigned: !cancelled && stageIndex >= 2,
    cancellable: !cancelled && stageIndex < 2,
    active: !cancelled && status !== 'delivered',
    steps: STAGES.map((key, index) => ({
      key,
      label: COPY[key][0],
      at: times[index],
      inMinutes: Math.max(1, Math.ceil((times[index] - now) / minute)),
      done: !cancelled ? index <= stageIndex : index <= stageIndex && times[index] <= order.cancelledAt,
      current: !cancelled && index === stageIndex,
    })),
  }
}
