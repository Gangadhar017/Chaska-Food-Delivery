// Restaurant brands. All of them are made up for this project.
// A brand opens one outlet per city it trades in; catalog/index.js places the outlets.
//
// offer: [coupon code, 'percent' | 'flat', value, cap (0 = none), minimum order]

const METROS = ['blr', 'del', 'mum', 'hyd', 'pun']
const NORTH = ['del', 'lko', 'mat', 'ali']

export const BRANDS = [
  {
    id: 'deg-and-dum', name: 'Deg & Dum', tagline: 'Biryani cooked under a dough seal, the slow way',
    cuisines: ['Biryani', 'Mughlai', 'Kebabs'], tags: ['biryani', 'kebabs', 'north-indian'],
    sections: ['biryani', 'kebabs', 'curriesNonveg', 'breads', 'mithai', 'coolers'],
    cover: 'biryani-chicken', rating: 4.4, costForTwo: 600, prep: 24, price: 1,
    offer: ['DEGDUM20', 'percent', 20, 100, 349],
  },
  {
    id: 'nawabs-dastarkhwan', name: 'Nawab\'s Dastarkhwan', tagline: 'Awadhi kebabs, korma and sheermal',
    cuisines: ['Awadhi', 'Kebabs', 'Biryani'], tags: ['kebabs', 'biryani', 'north-indian'],
    sections: ['kebabs', 'biryani', 'curriesNonveg', 'breads', 'mithai'],
    cover: 'seekh', rating: 4.5, costForTwo: 700, prep: 28, price: 1.1,
    offer: ['NAWAB100', 'flat', 100, 0, 599],
  },
  {
    id: 'punjab-rasoi', name: 'Punjab Rasoi', tagline: 'Dal makhani on the fire since morning',
    cuisines: ['North Indian', 'Punjabi', 'Tandoor'], tags: ['north-indian', 'kebabs', 'thali'],
    sections: ['curriesVeg', 'curriesNonveg', 'kebabs', 'breads', 'rice', 'mithai', 'coolers'],
    cover: 'paneer-butter', rating: 4.2, costForTwo: 550, prep: 22, price: 1,
    offer: ['RASOI30', 'percent', 30, 75, 249],
  },
  {
    id: 'dilli-darbar-kitchen', name: 'Purani Dilli Kitchen', tagline: 'Butter chicken, kebabs and chaat from the old city',
    cuisines: ['North Indian', 'Mughlai', 'Chaat'], tags: ['north-indian', 'kebabs', 'chaat'],
    sections: ['curriesNonveg', 'kebabs', 'curriesVeg', 'chaat', 'breads', 'mithai'],
    cover: 'butter-chicken', rating: 4.3, costForTwo: 650, prep: 26, price: 1.05,
  },
  {
    id: 'highway-dhaba', name: 'Highway Dhaba 24', tagline: 'Truck-stop food, big portions, small bills',
    cuisines: ['Dhaba', 'North Indian', 'Parathas'], tags: ['north-indian', 'thali'],
    sections: ['curriesVeg', 'curriesNonveg', 'parathas', 'breads', 'rice', 'coolers'],
    cover: 'kadai', rating: 3.9, costForTwo: 350, prep: 20, price: 0.85,
    offer: ['DHABA50', 'flat', 50, 0, 299],
  },
  {
    id: 'paratha-junction', name: 'Paratha Junction', tagline: 'Stuffed parathas with white butter, any hour',
    cuisines: ['Parathas', 'North Indian', 'Breakfast'], tags: ['north-indian', 'street-food'],
    sections: ['parathas', 'halwai', 'chaiCoffee', 'coolers'],
    cover: 'paratha', rating: 4.1, costForTwo: 300, prep: 16, price: 1,
  },
  {
    id: 'ghar-ka-khana', name: 'Ghar Ka Khana', tagline: 'Simple home food, cooked fresh every afternoon',
    cuisines: ['Home Food', 'Thali', 'North Indian'], tags: ['thali', 'north-indian', 'healthy'],
    sections: ['thali', 'curriesVeg', 'rice', 'breads', 'coolers'],
    cover: 'thali', rating: 4.3, costForTwo: 300, prep: 18, price: 0.85, veg: true,
    offer: ['GHAR40', 'flat', 40, 0, 199],
  },
  {
    id: 'thali-ghar', name: 'Thali Ghar', tagline: 'Regional thalis, refilled till you say stop',
    cuisines: ['Thali', 'Rajasthani', 'Gujarati'], tags: ['thali', 'north-indian'],
    sections: ['thali', 'curriesVeg', 'breads', 'mithai', 'coolers'],
    cover: 'thali-papad', rating: 4.2, costForTwo: 500, prep: 22, price: 1, veg: true,
  },
  {
    id: 'malgudi-tiffin-room', name: 'Malgudi Tiffin Room', tagline: 'Benne dosa and filter coffee, like in the old tiffin rooms',
    cuisines: ['South Indian', 'Dosa', 'Filter Coffee'], tags: ['south-indian', 'coffee'],
    sections: ['tiffin', 'southMeals', 'chaiCoffee', 'coolers'],
    cover: 'dosa', rating: 4.5, costForTwo: 300, prep: 15, price: 1, veg: true,
    offer: ['MALGUDI15', 'percent', 15, 60, 199],
  },
  {
    id: 'udupi-upahar', name: 'Udupi Upahar', tagline: 'Idli, vada and meals on a banana leaf',
    cuisines: ['South Indian', 'Udupi', 'Meals'], tags: ['south-indian', 'thali'],
    sections: ['tiffin', 'southMeals', 'shakes', 'coolers'],
    cover: 'idli', rating: 4.0, costForTwo: 250, prep: 14, price: 0.9, veg: true,
  },
  {
    id: 'andhra-spice-mess', name: 'Andhra Spice Mess', tagline: 'Meals with gongura, podi and a lot of heat',
    cuisines: ['Andhra', 'Biryani', 'South Indian'], tags: ['south-indian', 'biryani', 'thali'],
    sections: ['southMeals', 'biryani', 'tiffin', 'coolers'],
    cover: 'leaf-meals', rating: 4.3, costForTwo: 450, prep: 20, price: 1,
    offer: ['SPICE25', 'percent', 25, 80, 299],
  },
  {
    id: 'coastal-curry-house', name: 'Coastal Curry House', tagline: 'Fish curry and ghee roast from the Konkan and Malabar coast',
    cuisines: ['Seafood', 'Mangalorean', 'Kerala'], tags: ['seafood', 'south-indian'],
    sections: ['coastal', 'rice', 'coolers'],
    cover: 'fish-curry', rating: 4.4, costForTwo: 800, prep: 28, price: 1.1, cities: METROS,
  },
  {
    id: 'bengal-bhoj', name: 'Bengal Bhoj', tagline: 'Kosha mangsho, luchi and mishti doi',
    cuisines: ['Bengali', 'Seafood', 'Rolls'], tags: ['seafood', 'rolls', 'mithai'],
    sections: ['bengali', 'rolls', 'biryani', 'rice'],
    cover: 'curry-red', rating: 4.3, costForTwo: 650, prep: 26, price: 1, cities: METROS,
    offer: ['BHOJ20', 'percent', 20, 120, 399],
  },
  {
    id: 'wok-this-way', name: 'Wok This Way', tagline: 'Indo-Chinese off a very hot wok',
    cuisines: ['Chinese', 'Indo-Chinese', 'Momos'], tags: ['chinese', 'momos'],
    sections: ['chineseStarters', 'noodlesRice', 'soups', 'momos', 'coolers'],
    cover: 'hakka', rating: 4.1, costForTwo: 450, prep: 20, price: 1,
    offer: ['WOK40', 'percent', 40, 80, 199],
  },
  {
    id: 'momo-mandala', name: 'Momo Mandala', tagline: 'Hand-folded momos and thukpa',
    cuisines: ['Momos', 'Tibetan', 'Chinese'], tags: ['momos', 'chinese'],
    sections: ['momos', 'soups', 'noodlesRice'],
    cover: 'momos', rating: 4.3, costForTwo: 300, prep: 15, price: 0.95,
  },
  {
    id: 'slice-society', name: 'Slice Society', tagline: 'Hand-stretched pizza from a stone oven',
    cuisines: ['Pizza', 'Italian', 'Fast Food'], tags: ['pizza', 'pasta'],
    sections: ['pizza', 'italianSides', 'pasta', 'coolers'],
    cover: 'margherita', rating: 4.2, costForTwo: 500, prep: 22, price: 1,
    offer: ['SLICE50', 'percent', 50, 100, 299],
  },
  {
    id: 'nonnas-oven', name: 'Nonna\'s Oven', tagline: 'Fresh pasta, slow sauces and tiramisu',
    cuisines: ['Italian', 'Pasta', 'Pizza'], tags: ['pasta', 'pizza', 'desserts'],
    sections: ['pasta', 'pizza', 'italianSides', 'salads', 'cakes'],
    cover: 'alfredo', rating: 4.5, costForTwo: 900, prep: 26, price: 1.25, cities: METROS,
  },
  {
    id: 'smash-and-bun', name: 'Smash & Bun', tagline: 'Smashed patties, potato buns, nothing fancy',
    cuisines: ['Burgers', 'American', 'Fast Food'], tags: ['burger', 'fried-chicken', 'shakes'],
    sections: ['burgers', 'friesSides', 'shakes', 'coolers'],
    cover: 'burger-classic', rating: 4.3, costForTwo: 450, prep: 18, price: 1,
    offer: ['SMASH99', 'flat', 99, 0, 399],
  },
  {
    id: 'cluck-and-crunch', name: 'Cluck & Crunch', tagline: 'Pressure-fried chicken with a proper crust',
    cuisines: ['Fried Chicken', 'Burgers', 'Fast Food'], tags: ['fried-chicken', 'burger'],
    sections: ['friedChicken', 'burgers', 'friesSides', 'coolers'],
    cover: 'fried-chicken', rating: 4.0, costForTwo: 500, prep: 18, price: 1,
    offer: ['CLUCK30', 'percent', 30, 90, 349],
  },
  {
    id: 'roll-call', name: 'Roll Call', tagline: 'Kathi rolls on flaky parathas',
    cuisines: ['Rolls', 'Kebabs', 'Fast Food'], tags: ['rolls', 'kebabs', 'street-food'],
    sections: ['rolls', 'kebabs', 'coolers'],
    cover: 'wrap', rating: 4.2, costForTwo: 300, prep: 14, price: 1,
  },
  {
    id: 'shawarma-street', name: 'Shawarma Street', tagline: 'Off the spit, with a lot of toum',
    cuisines: ['Shawarma', 'Arabian', 'Grills'], tags: ['rolls', 'kebabs'],
    sections: ['shawarma', 'friesSides', 'coolers'],
    cover: 'shawarma', rating: 4.1, costForTwo: 350, prep: 15, price: 1,
    offer: ['TOUM25', 'percent', 25, 60, 199],
  },
  {
    id: 'kebab-kaarkhana', name: 'Kebab Kaarkhana', tagline: 'Charcoal, skewers and rumali roti',
    cuisines: ['Kebabs', 'Mughlai', 'Rolls'], tags: ['kebabs', 'rolls', 'north-indian'],
    sections: ['kebabs', 'rolls', 'curriesNonveg', 'breads'],
    cover: 'skewers', rating: 4.3, costForTwo: 600, prep: 24, price: 1.05,
  },
  {
    id: 'chaat-chowk', name: 'Chaat Chowk', tagline: 'Pani puri, papdi and tikki, made to order',
    cuisines: ['Chaat', 'Street Food', 'Sweets'], tags: ['chaat', 'street-food', 'mithai'],
    sections: ['chaat', 'bombay', 'mithai', 'coolers'],
    cover: 'chaat', rating: 4.4, costForTwo: 200, prep: 12, price: 1, veg: true,
    offer: ['CHAAT20', 'percent', 20, 50, 149],
  },
  {
    id: 'bombay-tapri', name: 'Bombay Tapri', tagline: 'Pav bhaji, vada pav and cutting chai',
    cuisines: ['Street Food', 'Maharashtrian', 'Chai'], tags: ['street-food', 'sandwich', 'coffee'],
    sections: ['bombay', 'sandwiches', 'chaiCoffee', 'coolers'],
    cover: 'pav-bhaji', rating: 4.3, costForTwo: 250, prep: 14, price: 1, veg: true,
  },
  {
    id: 'braj-mishthan-bhandar', name: 'Braj Mishthan Bhandar', tagline: 'Bedai, kachori and jalebi in desi ghee',
    cuisines: ['Sweets', 'Breakfast', 'Chaat'], tags: ['mithai', 'chaat', 'street-food'],
    sections: ['halwai', 'chaat', 'mithai', 'coolers'],
    cover: 'samosa-tray', rating: 4.6, costForTwo: 200, prep: 12, price: 0.9, veg: true, cities: NORTH,
    offer: ['BRAJ15', 'percent', 15, 40, 149],
  },
  {
    id: 'green-bowl-project', name: 'Green Bowl Project', tagline: 'Bowls and salads that actually fill you up',
    cuisines: ['Healthy', 'Bowls', 'Salads'], tags: ['healthy', 'sandwich', 'shakes'],
    sections: ['bowls', 'salads', 'sandwiches', 'shakes'],
    cover: 'bowl-avocado', rating: 4.4, costForTwo: 600, prep: 16, price: 1.05,
    offer: ['GREEN20', 'percent', 20, 100, 299],
  },
  {
    id: 'sip-station', name: 'Sip Station', tagline: 'Cold-pressed juices, shakes and light bites',
    cuisines: ['Juices', 'Shakes', 'Healthy'], tags: ['shakes', 'healthy', 'sandwich'],
    sections: ['shakes', 'coolers', 'sandwiches', 'salads'],
    cover: 'smoothies', rating: 4.0, costForTwo: 300, prep: 10, price: 0.95, veg: true,
  },
  {
    id: 'the-brownie-bar', name: 'The Brownie Bar', tagline: 'Brownies, waffles and things with too much chocolate',
    cuisines: ['Desserts', 'Waffles', 'Bakery'], tags: ['desserts', 'cakes', 'shakes'],
    sections: ['brownies', 'cakes', 'shakes'],
    cover: 'brownie', rating: 4.5, costForTwo: 350, prep: 12, price: 1, veg: true,
    offer: ['SWEET60', 'flat', 60, 0, 299],
  },
  {
    id: 'bake-lane', name: 'Bake Lane', tagline: 'A neighbourhood bakery with an oven that never rests',
    cuisines: ['Bakery', 'Cakes', 'Cafe'], tags: ['cakes', 'desserts', 'sandwich', 'coffee'],
    sections: ['cakes', 'sandwiches', 'chaiCoffee'],
    cover: 'berry-cake', rating: 4.3, costForTwo: 400, prep: 14, price: 1,
  },
  {
    id: 'scoop-theory', name: 'Scoop Theory', tagline: 'Small-batch ice cream in Indian flavours',
    cuisines: ['Ice Cream', 'Desserts', 'Shakes'], tags: ['ice-cream', 'desserts', 'shakes'],
    sections: ['iceCream', 'brownies', 'shakes'],
    cover: 'cone', rating: 4.6, costForTwo: 300, prep: 8, price: 1, veg: true,
    offer: ['SCOOP20', 'percent', 20, 60, 199],
  },
  {
    id: 'waffle-works', name: 'Waffle Works', tagline: 'Waffles and pancakes, hot off the iron',
    cuisines: ['Waffles', 'Desserts', 'Ice Cream'], tags: ['desserts', 'ice-cream'],
    sections: ['brownies', 'iceCream', 'shakes'],
    cover: 'waffles', rating: 4.2, costForTwo: 350, prep: 12, price: 1.05, veg: true,
  },
  {
    id: 'roast-and-ritual', name: 'Roast & Ritual', tagline: 'Single-estate coffee and an all-day breakfast',
    cuisines: ['Coffee', 'Cafe', 'Breakfast'], tags: ['coffee', 'sandwich', 'cakes'],
    sections: ['chaiCoffee', 'cafePlates', 'sandwiches', 'cakes'],
    cover: 'latte', rating: 4.5, costForTwo: 700, prep: 14, price: 1.15, cities: METROS,
  },
  {
    id: 'kulhad-chai-co', name: 'Kulhad Chai Co.', tagline: 'Chai in clay cups, with something to dip in it',
    cuisines: ['Chai', 'Snacks', 'Street Food'], tags: ['coffee', 'street-food', 'sandwich'],
    sections: ['chaiCoffee', 'sandwiches', 'chaat'],
    cover: 'chai', rating: 4.1, costForTwo: 200, prep: 9, price: 0.9, veg: true,
    offer: ['KULHAD10', 'percent', 10, 30, 99],
  },
  {
    id: 'rustoms-irani-cafe', name: 'Rustom\'s Irani Cafe', tagline: 'Bun maska, akuri and Irani chai since the old days',
    cuisines: ['Irani', 'Parsi', 'Cafe'], tags: ['coffee', 'cakes', 'biryani'],
    sections: ['chaiCoffee', 'cafePlates', 'cakes', 'biryani'],
    cover: 'tea', rating: 4.4, costForTwo: 450, prep: 16, price: 1, cities: ['mum', 'pun', 'hyd'],
  },
  {
    id: 'sushi-sensei', name: 'Sushi Sensei', tagline: 'Sushi, dim sum and ramen bowls',
    cuisines: ['Sushi', 'Japanese', 'Asian'], tags: ['asian', 'momos'],
    sections: ['sushi', 'ramenKorean', 'coolers'],
    cover: 'sushi-platter', rating: 4.3, costForTwo: 1200, prep: 26, price: 1.2, cities: METROS,
    offer: ['SENSEI150', 'flat', 150, 0, 999],
  },
  {
    id: 'seoul-kitchen', name: 'Seoul Kitchen', tagline: 'Bibimbap, tteokbokki and fried chicken',
    cuisines: ['Korean', 'Ramen', 'Asian'], tags: ['asian', 'fried-chicken'],
    sections: ['ramenKorean', 'momos', 'coolers'],
    cover: 'bibimbap', rating: 4.2, costForTwo: 800, prep: 22, price: 1.1, cities: METROS,
  },
  {
    id: 'taco-tapri', name: 'Taco Tapri', tagline: 'Mexican street food with an Indian accent',
    cuisines: ['Mexican', 'Tacos', 'Fast Food'], tags: ['mexican', 'street-food'],
    sections: ['mexican', 'friesSides', 'coolers'],
    cover: 'tacos', rating: 4.1, costForTwo: 500, prep: 16, price: 1,
    offer: ['TACO30', 'percent', 30, 90, 299],
  },
]

/** Platform-wide coupons. Restaurant coupons come from each brand's `offer`. */
export const COUPONS = [
  {
    code: 'WELCOME50', type: 'percent', value: 50, cap: 100, min: 149, firstOrderOnly: true,
    title: '50% off your first order',
    detail: 'Up to ₹100 off on your first order above ₹149.',
  },
  {
    code: 'TASTY20', type: 'percent', value: 20, cap: 120, min: 249,
    title: '20% off up to ₹120',
    detail: 'On any restaurant, for orders above ₹249.',
  },
  {
    code: 'FEAST100', type: 'flat', value: 100, cap: 0, min: 499,
    title: 'Flat ₹100 off',
    detail: 'When your items add up to ₹499 or more.',
  },
  {
    code: 'PARTY250', type: 'flat', value: 250, cap: 0, min: 1199,
    title: 'Flat ₹250 off big orders',
    detail: 'For orders above ₹1,199. Good for a full table.',
  },
  {
    code: 'FREEDEL', type: 'delivery', value: 0, cap: 0, min: 199,
    title: 'Free delivery',
    detail: 'No delivery fee on orders above ₹199.',
  },
]
