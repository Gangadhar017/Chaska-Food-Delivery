// Cities and the localities we deliver to.
// Positions are kilometres on a flat local grid (x east, y north) centred on each city.
// That is all the distance and ETA maths needs, and it keeps the catalog free of map keys.

function city(id, name, state, localities) {
  return {
    id,
    name,
    state,
    localities: localities.map(([slug, label, x, y]) => ({
      id: `${id}-${slug}`,
      name: label,
      cityId: id,
      cityName: name,
      x,
      y,
    })),
  }
}

export const CITIES = [
  city('blr', 'Bengaluru', 'Karnataka', [
    ['koramangala', 'Koramangala', 0, 0],
    ['indiranagar', 'Indiranagar', 1.6, 3.4],
    ['hsr-layout', 'HSR Layout', 1.3, -2.8],
    ['jayanagar', 'Jayanagar', -3.2, -1.1],
    ['btm-layout', 'BTM Layout', -1.0, -2.4],
    ['mg-road', 'MG Road', -1.4, 3.0],
  ]),
  city('del', 'Delhi NCR', 'Delhi', [
    ['connaught-place', 'Connaught Place', 0, 0],
    ['hauz-khas', 'Hauz Khas', -0.8, -3.6],
    ['saket', 'Saket', 0.4, -4.4],
    ['lajpat-nagar', 'Lajpat Nagar', 2.4, -2.6],
    ['karol-bagh', 'Karol Bagh', -2.6, 1.4],
    ['greater-kailash', 'Greater Kailash', 2.2, -4.0],
  ]),
  city('mum', 'Mumbai', 'Maharashtra', [
    ['bandra-west', 'Bandra West', 0, 0],
    ['andheri-west', 'Andheri West', 0.6, 4.0],
    ['juhu', 'Juhu', -0.6, 2.6],
    ['lower-parel', 'Lower Parel', 0.4, -4.2],
    ['dadar', 'Dadar', 1.0, -2.6],
    ['khar', 'Khar', 0.3, 1.2],
  ]),
  city('hyd', 'Hyderabad', 'Telangana', [
    ['banjara-hills', 'Banjara Hills', 0, 0],
    ['jubilee-hills', 'Jubilee Hills', -1.8, 0.6],
    ['madhapur', 'Madhapur', -3.8, 1.8],
    ['gachibowli', 'Gachibowli', -4.4, -0.4],
    ['begumpet', 'Begumpet', 2.2, 1.6],
    ['himayatnagar', 'Himayatnagar', 3.2, -0.6],
  ]),
  city('pun', 'Pune', 'Maharashtra', [
    ['koregaon-park', 'Koregaon Park', 0, 0],
    ['viman-nagar', 'Viman Nagar', 2.4, 2.6],
    ['camp', 'Camp', -1.2, -1.6],
    ['kothrud', 'Kothrud', -4.2, -2.2],
    ['aundh', 'Aundh', -3.6, 2.8],
    ['baner', 'Baner', -4.4, 3.6],
  ]),
  city('lko', 'Lucknow', 'Uttar Pradesh', [
    ['hazratganj', 'Hazratganj', 0, 0],
    ['gomti-nagar', 'Gomti Nagar', 3.8, 0.4],
    ['aliganj', 'Aliganj', -0.4, 3.6],
    ['indira-nagar', 'Indira Nagar', 2.6, 3.0],
    ['aminabad', 'Aminabad', -1.4, -0.8],
    ['alambagh', 'Alambagh', -2.2, -3.8],
  ]),
  city('mat', 'Mathura', 'Uttar Pradesh', [
    ['krishna-nagar', 'Krishna Nagar', 0, 0],
    ['dampier-nagar', 'Dampier Nagar', 0.8, 1.2],
    ['holi-gate', 'Holi Gate', 1.4, 0.2],
    ['govind-nagar', 'Govind Nagar', -0.6, 1.8],
    ['township', 'Refinery Township', -3.2, -2.4],
    ['vrindavan', 'Vrindavan', 1.6, 4.4],
  ]),
  city('ali', 'Aligarh', 'Uttar Pradesh', [
    ['civil-lines', 'Civil Lines', 0, 0],
    ['marris-road', 'Marris Road', 0.8, 0.9],
    ['ramghat-road', 'Ramghat Road', 2.6, 1.4],
    ['centre-point', 'Centre Point', 0.4, -0.8],
    ['quarsi', 'Quarsi', 3.4, 2.6],
    ['sasni-gate', 'Sasni Gate', -1.2, -2.8],
  ]),
]

export const DEFAULT_LOCALITY_ID = 'blr-koramangala'

/** Cuisine tags shown in the "what are you craving" rail and used as list filters. */
export const CUISINES = [
  ['biryani', 'Biryani', 'biryani-chicken'],
  ['pizza', 'Pizza', 'margherita'],
  ['burger', 'Burgers', 'burger-classic'],
  ['north-indian', 'North Indian', 'paneer-butter'],
  ['south-indian', 'South Indian', 'dosa'],
  ['chinese', 'Chinese', 'hakka'],
  ['rolls', 'Rolls', 'wrap'],
  ['momos', 'Momos', 'steamer'],
  ['chaat', 'Chaat', 'chaat'],
  ['kebabs', 'Kebabs', 'seekh'],
  ['thali', 'Thali', 'thali'],
  ['desserts', 'Desserts', 'brownie'],
  ['cakes', 'Cakes', 'choc-cake'],
  ['ice-cream', 'Ice Cream', 'cone'],
  ['healthy', 'Healthy', 'bowl-avocado'],
  ['pasta', 'Pasta', 'alfredo'],
  ['coffee', 'Coffee & Chai', 'latte'],
  ['shakes', 'Shakes & Juices', 'oreo-shake'],
  ['seafood', 'Seafood', 'prawns'],
  ['asian', 'Sushi & Asian', 'sushi-rolls'],
  ['mexican', 'Mexican', 'tacos'],
  ['street-food', 'Street Food', 'pav-bhaji'],
  ['fried-chicken', 'Fried Chicken', 'fried-chicken'],
  ['sandwich', 'Sandwiches', 'club-sandwich'],
  ['mithai', 'Mithai', 'halwa'],
].map(([id, name, photo]) => ({ id, name, photo }))
