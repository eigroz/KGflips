export interface Bundle {
  id: string;
  name: string;
  category: 'streamer' | 'vintage' | 'branded' | 'womens' | 'kids';
  weightKg: number;
  estPieces: number;
  pricePerKg: number;
  totalPrice: number;
  grade: 'Grade A (Top Tier)' | 'Grade A/B (Reseller Mix)' | 'Cream Vintage';
  description: string;
  highlights: string[];
  bestFor: string;
  badge?: string;
}

export const KG_BUNDLES: Bundle[] = [
  {
    id: 'bundle-whatnot-bale',
    name: 'Whatnot Live Streamer Mystery Bale',
    category: 'streamer',
    weightKg: 10,
    estPieces: 30,
    pricePerKg: 9.0,
    totalPrice: 90,
    grade: 'Grade A/B (Reseller Mix)',
    description: 'High-density curated apparel specifically gathered for high-energy Whatnot live sales and rapid-fire £5–£15 starts.',
    highlights: ['Mix of tees, sweatshirts, and outerwear', 'Ready-to-steam inventory', 'Estimated £220+ stream revenue'],
    bestFor: 'Whatnot & TikTok Live Sellers',
    badge: 'Popular for Streamers'
  },
  {
    id: 'bundle-vintage-streetwear',
    name: 'Vintage Streetwear & Skate Box',
    category: 'vintage',
    weightKg: 5,
    estPieces: 14,
    pricePerKg: 14.0,
    totalPrice: 70,
    grade: 'Cream Vintage',
    description: '90s & 2000s skate, hip-hop, and graphic tees, boxy hoodies, and retro windbreakers.',
    highlights: ['Single-stitch graphic tees', 'Retro brand spell-outs', 'High margin vintage reselling'],
    bestFor: 'Depop & Vinted Vintage Curators',
    badge: 'High Margin'
  },
  {
    id: 'bundle-sportswear-pro',
    name: 'Branded Sportswear Track & Gym Pack',
    category: 'branded',
    weightKg: 10,
    estPieces: 25,
    pricePerKg: 12.5,
    totalPrice: 125,
    grade: 'Grade A (Top Tier)',
    description: 'Track pants, training jackets, athletic sweatshirts and jersey pieces from iconic sportswear labels.',
    highlights: ['Iconic sports brands', 'High daily search volume on eBay', 'Fast turnover rates'],
    bestFor: 'eBay & Marketplace Power Sellers'
  },
  {
    id: 'bundle-womens-y2k',
    name: 'Women’s Y2K & Retro Fashion Lot',
    category: 'womens',
    weightKg: 8,
    estPieces: 28,
    pricePerKg: 11.0,
    totalPrice: 88,
    grade: 'Grade A (Top Tier)',
    description: 'Feminine Y2K cardigans, baby tees, denim skirts, slip dresses, and lightweight aesthetic outerwear.',
    highlights: ['Trending TikTok aesthetics', 'Lightweight pieces = more items per kg', 'Instant wardrobe refresh'],
    bestFor: 'Vinted & Depop Boutiques',
    badge: 'Trending'
  },
  {
    id: 'bundle-ebay-bulk-bale',
    name: '15kg Live Reseller Mega Bale',
    category: 'streamer',
    weightKg: 15,
    estPieces: 45,
    pricePerKg: 7.8,
    totalPrice: 117,
    grade: 'Grade A/B (Reseller Mix)',
    description: 'Bulk wholesale sack for sellers needing serious volume at maximum wholesale margin.',
    highlights: ['Lowest price per kilo', 'Diverse mix across categories', 'Ideal for show fillers & bundle deals'],
    bestFor: 'Bulk Liquidators & High-Volume Sellers'
  },
  {
    id: 'bundle-kids-lot',
    name: 'Kids & Junior Essentials Kilo Sacks',
    category: 'kids',
    weightKg: 6,
    estPieces: 32,
    pricePerKg: 6.5,
    totalPrice: 39,
    grade: 'Grade A (Top Tier)',
    description: 'Clean, gently worn everyday kids clothing, hoodies, shorts, and seasonal wear.',
    highlights: ['High piece count per kilo', 'Budget friendly entry level', 'High parent demand on Vinted'],
    bestFor: 'Family & Parent Resellers'
  }
];
