export const DEMO_PRODUCTS = [
  {
    id: "starter-chicks",
    name: "Day-old Broiler Chicks",
    category: "Chicks",
    description: "Healthy, vaccinated chicks from a trusted hatchery.",
    price: 42,
    unit: "per chick",
    rating: "4.8",
    stock: "In stock",
    icon: "egg-outline",
    color: "#B45309",
    background: "#FEF3C7",
  },
  {
    id: "layer-feed",
    name: "Layer Feed · 50 kg",
    category: "Feed",
    description: "Balanced nutrition for healthy laying flocks.",
    price: 1480,
    unit: "per bag",
    rating: "4.7",
    stock: "In stock",
    icon: "nutrition-outline",
    color: "#15803D",
    background: "#DCFCE7",
  },
  {
    id: "broiler-feed",
    name: "Broiler Starter Feed · 50 kg",
    category: "Feed",
    description: "Starter feed formulated for early flock growth.",
    price: 1625,
    unit: "per bag",
    rating: "4.6",
    stock: "In stock",
    icon: "leaf-outline",
    color: "#0369A1",
    background: "#E0F2FE",
  },
  {
    id: "drinkers",
    name: "Automatic Poultry Drinker",
    category: "Equipment",
    description: "Easy-clean drinker for poultry sheds.",
    price: 320,
    unit: "each",
    rating: "4.5",
    stock: "In stock",
    icon: "water-outline",
    color: "#7E22CE",
    background: "#F3E8FF",
  },
] as const;

export const DEMO_SELLER_LISTINGS = [
  {
    name: "Farm Fresh Layer Eggs",
    category: "Eggs",
    price: 180,
    unit: "per tray",
    available: "46 trays",
    sold: "120 trays this month",
    status: "Active",
  },
  {
    name: "Farm Raised Broiler Birds",
    category: "Live birds",
    price: 115,
    unit: "per kg",
    available: "320 kg",
    sold: "350 kg this month",
    status: "Active",
  },
] as const;

export const DEMO_FLOCKS = [
  {
    shed: "Shed 01",
    batch: "Layer flock · Batch L-2408",
    age: "32 weeks",
    birds: "4,850",
    mortality: "12 birds",
    eggs: "4,210 today",
    status: "Healthy",
  },
  {
    shed: "Shed 02",
    batch: "Broiler flock · Batch B-2410",
    age: "5 weeks",
    birds: "3,920",
    mortality: "18 birds",
    eggs: "Not applicable",
    status: "Needs review",
  },
  {
    shed: "Shed 03",
    batch: "Layer flock · Batch L-2409",
    age: "24 weeks",
    birds: "4,120",
    mortality: "9 birds",
    eggs: "3,480 today",
    status: "Healthy",
  },
] as const;

export const DEMO_BOOKINGS = [
  {
    service: "Vaccination team",
    date: "12 Nov 2026",
    time: "10:30 AM",
    status: "Confirmed",
  },
  {
    service: "Water quality test",
    date: "18 Nov 2026",
    time: "11:00 AM",
    status: "Requested",
  },
] as const;

export const DEMO_WALLET = {
  balance: 2450,
  referralBalance: 750,
  referralCode: "POULTECH10",
  transactions: [
    { title: "Referral reward", detail: "Friend joined Poultech", date: "04 Nov 2026", amount: 250, type: "credit" },
    { title: "Marketplace purchase", detail: "Layer Feed · 50 kg", date: "02 Nov 2026", amount: -1480, type: "debit" },
    { title: "Referral reward", detail: "Friend completed first order", date: "29 Oct 2026", amount: 500, type: "credit" },
  ],
} as const;
