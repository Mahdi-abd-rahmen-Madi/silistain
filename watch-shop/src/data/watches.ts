import { Watch } from '../types';

const watches: Watch[] = [
  {
    id: 1,
    name: "Submariner Date",
    brand: "Rolex",
    price: 9100,
    image: "/images/watches/rolex-submariner.jpg",
    images: [
      "/images/watches/rolex-submariner-1.jpg",
      "/images/watches/rolex-submariner-2.jpg",
      "/images/watches/rolex-submariner-3.jpg"
    ],
    category: "Diver",
    description: "The Rolex Submariner is the reference among divers' watches and was the first wristwatch waterproof to a depth of 100 meters (330 feet). This model features a unidirectional rotatable bezel and luminescent hour markers for optimal readability underwater.",
    specifications: {
      movement: "Automatic, Perpetual",
      caseMaterial: "Oystersteel",
      caseDiameter: "41 mm",
      waterResistance: "300 meters / 1000 feet",
      powerReserve: "Approximately 70 hours",
      functions: "Time, Date, Unidirectional Rotating Bezel"
    },
    features: [
      "Chronometer-certified movement",
      "Ceramic unidirectional rotatable bezel",
      "Chromalight display for optimal visibility",
      "Oyster bracelet with Oysterlock safety clasp"
    ],
    inStock: 5,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 124,
    onSale: false
  },
  {
    id: 2,
    name: "Speedmaster Professional Moonwatch",
    brand: "Omega",
    price: 6300,
    image: "/images/watches/omega-speedmaster.jpg",
    images: [
      "/images/watches/omega-speedmaster-1.jpg",
      "/images/watches/omega-speedmaster-2.jpg"
    ],
    category: "Chronograph",
    description: "The Omega Speedmaster Professional Moonwatch is a true icon, having been part of all six lunar missions. This chronograph is powered by the manual-winding Calibre 3861 and features a hesalite crystal and stainless steel bracelet.",
    specifications: {
      movement: "Manual-winding",
      caseMaterial: "Stainless Steel",
      caseDiameter: "42 mm",
      waterResistance: "50 meters / 167 feet",
      powerReserve: "50 hours",
      functions: "Chronograph, Tachymeter, Small Seconds"
    },
    features: [
      "Moonwatch Professional Chronograph",
      "Hesalite crystal",
      "Tachymeter scale",
      "Lunar surface tested"
    ],
    inStock: 8,
    isFeatured: true
  },
  {
    id: 3,
    name: "Royal Oak Selfwinding",
    brand: "Audemars Piguet",
    price: 22000,
    image: "/images/watches/ap-royal-oak.jpg",
    images: [
      "/images/watches/ap-royal-oak-1.jpg",
      "/images/watches/ap-royal-oak-2.jpg"
    ],
    category: "Luxury Sports",
    description: "The Royal Oak Selfwinding combines cutting-edge technology with timeless aesthetics. Featuring a blue 'Grande Tapisserie' dial, this luxury sports watch is a true icon of horological design.",
    specifications: {
      movement: "Selfwinding mechanical",
      caseMaterial: "Stainless Steel",
      caseDiameter: "41 mm",
      waterResistance: "50 meters / 165 feet",
      powerReserve: "60 hours",
      functions: "Hours, Minutes, Center Seconds, Date"
    },
    features: [
      "Octagonal bezel with 8 hexagonal screws",
      "Integrated bracelet",
      "Sapphire crystal caseback",
      "'Grande Tapisserie' dial"
    ],
    inStock: 2,
    isFeatured: true
  },
  {
    id: 4,
    name: "Santos de Cartier",
    brand: "Cartier",
    price: 6900,
    image: "/images/watches/cartier-santos.jpg",
    images: [
      "/images/watches/cartier-santos-1.jpg"
    ],
    category: "Dress",
    description: "The Santos de Cartier watch is a symbol of bold design and innovation. Created in 1904, it was one of the first wristwatches for men and remains an icon of the Cartier collection.",
    specifications: {
      movement: "Automatic",
      caseMaterial: "Stainless Steel",
      caseDiameter: "39.8 mm",
      waterResistance: "100 meters / 330 feet",
      powerReserve: "42 hours",
      functions: "Hours, Minutes, Seconds, Date"
    },
    features: [
      "QuickSwitch system for strap changing",
      "Sapphire crystal",
      "Screw-down crown set with a blue cabochon",
      "Roman numerals"
    ],
    inStock: 4,
    isFeatured: false
  },
  {
    id: 5,
    name: "Nautilus",
    brand: "Patek Philippe",
    price: 34500,
    image: "/images/watches/patek-nautilus.jpg",
    images: [
      "/images/watches/patek-nautilus-1.jpg",
      "/images/watches/patek-nautilus-2.jpg"
    ],
    category: "Luxury Sports",
    description: "The Patek Philippe Nautilus is one of the most coveted luxury sports watches in the world. With its distinctive porthole design and horizontal embossed dial, it represents the perfect blend of elegance and sportiness.",
    specifications: {
      movement: "Automatic",
      caseMaterial: "Stainless Steel",
      caseDiameter: "40 mm",
      waterResistance: "120 meters / 400 feet",
      powerReserve: "45 hours",
      functions: "Hours, Minutes, Seconds, Date"
    },
    features: [
      "Oscillating weight in 21K gold",
      "Sapphire crystal caseback",
      "Horizontal embossed dial",
      "Integrated bracelet"
    ],
    inStock: 1,
    isFeatured: true
  },
  {
    id: 6,
    name: "Portugieser Chronograph",
    brand: "IWC",
    price: 8100,
    image: "/images/watches/iwc-portugieser.jpg",
    images: [
      "/images/watches/iwc-portugieser-1.jpg"
    ],
    category: "Chronograph",
    description: "The Portugieser Chronograph combines precision engineering with elegant design. With its clean dial layout and distinctive case shape, it's a true classic in the world of fine watchmaking.",
    specifications: {
      movement: "Automatic",
      caseMaterial: "Stainless Steel",
      caseDiameter: "41 mm",
      waterResistance: "30 meters / 100 feet",
      powerReserve: "46 hours",
      functions: "Chronograph, Small Seconds, Date"
    },
    features: [
      "Sapphire glass, convex, antireflective coating",
      "Sapphire glass back",
      "Ardillon buckle",
      "Convenient date display"
    ],
    inStock: 3,
    isFeatured: false
  },
  {
    id: 7,
    name: "Reverso Classic Medium",
    brand: "Jaeger-LeCoultre",
    price: 6700,
    image: "/images/watches/jaeger-reverso.jpg",
    images: [
      "/images/watches/jaeger-reverso-1.jpg"
    ],
    category: "Dress",
    description: "The Reverso Classic Medium is a tribute to the Art Deco era, featuring a reversible case that was originally designed to protect the watch face during polo matches. Today, it's a timeless classic of horological design.",
    specifications: {
      movement: "Manual-winding",
      caseMaterial: "Stainless Steel",
      caseDiameter: "27.4 x 42.9 mm",
      waterResistance: "30 meters / 100 feet",
      powerReserve: "42 hours",
      functions: "Hours, Minutes"
    },
    features: [
      "Reversible case",
      "Art Deco design",
      "Hand-wound mechanical movement",
      "Personalizable case back"
    ],
    inStock: 4,
    isFeatured: false
  },
  {
    id: 8,
    name: "El Primero Chronomaster",
    brand: "Zenith",
    price: 9500,
    image: "/images/watches/zenith-el-primero.jpg",
    images: [
      "/images/watches/zenith-el-primero-1.jpg"
    ],
    category: "Chronograph",
    description: "The El Primero Chronomaster is a high-frequency automatic chronograph that combines precision, performance, and elegance. It features the legendary El Primero movement, the world's first integrated automatic chronograph caliber.",
    specifications: {
      movement: "Automatic, El Primero 3600",
      caseMaterial: "Stainless Steel",
      caseDiameter: "38 mm",
      waterResistance: "100 meters / 330 feet",
      powerReserve: "60 hours",
      functions: "Chronograph, Small Seconds, Date"
    },
    features: [
      "1/10th of a second chronograph",
      "Column-wheel mechanism",
      "Oscillating weight with Côtes de Genève motif",
      "Transparent caseback"
    ],
    inStock: 3,
    isFeatured: true
  }
];

export default watches;
