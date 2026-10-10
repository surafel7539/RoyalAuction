export const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Fair", "Used"];

export const LOCATIONS = [
  "Addis Ababa",
  "Dire Dawa",
  "Hawassa",
  "Bahir Dar",
  "Mekelle",
  "Adama",
  "Jimma",
  "Gondar",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "ending", label: "Ending soon" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most bids" },
];

export const STATUS_OPTIONS = [
  { value: "live", label: "Live auctions" },
  { value: "ending", label: "Ending soon" },
  { value: "ended", label: "Completed" },
];

export const CATEGORY_META = {
  vehicles: { icon: "🚗", accent: "#078930" },
  "real-estate": { icon: "🏛️", accent: "#0f6a32" },
  "art-antiques": { icon: "🎨", accent: "#fcd116" },
  electronics: { icon: "📱", accent: "#da121a" },
  jewelry: { icon: "💎", accent: "#c9a227" },
  industrial: { icon: "⚙️", accent: "#166534" },
  agriculture: { icon: "🌾", accent: "#078930" },
  collectibles: { icon: "🏺", accent: "#da121a" },
};
