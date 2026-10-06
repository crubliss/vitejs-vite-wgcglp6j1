export interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  price: number;
  image_url: string;
  source: 'market' | 'blackmarket';
  description: string;
}

export const MARKET_CARS: CarListing[] = [
  {
    id: 'm1',
    make: 'Veloce',
    model: 'Strato GT',
    year: 2024,
    color: 'Red',
    price: 89500,
    image_url: 'https://images.pexels.com/photos/34243853/pexels-photo-34243853.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Track-bred sports coupe with a red leather interior and 620hp twin-turbo flat-six.',
  },
  {
    id: 'm2',
    make: 'Marchetti',
    model: 'Fiorano',
    year: 2023,
    color: 'Red',
    price: 245000,
    image_url: 'https://images.pexels.com/photos/11931440/pexels-photo-11931440.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Italian exotic with carbon monocoque chassis and a screaming V12.',
  },
  {
    id: 'm3',
    make: 'Veloce',
    model: 'Corsa R',
    year: 2022,
    color: 'Red',
    price: 178000,
    image_url: 'https://images.pexels.com/photos/33074675/pexels-photo-33074675.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Vintage-inspired race car with modern underpinnings. Limited production run.',
  },
  {
    id: 'm4',
    make: 'Onyx',
    model: 'Phantom S',
    year: 2024,
    color: 'Black',
    price: 132000,
    image_url: 'https://images.pexels.com/photos/37047563/pexels-photo-37047563.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Sleek executive coupe with matte black finish and adaptive air suspension.',
  },
  {
    id: 'm5',
    make: 'Sterling',
    model: 'Empress Line',
    year: 2023,
    color: 'Black',
    price: 98000,
    image_url: 'https://images.pexels.com/photos/18029637/pexels-photo-18029637.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Luxury sedan with hand-stitched interior and whisper-quiet cabin.',
  },
  {
    id: 'm6',
    make: 'Onyx',
    model: 'Nighthawk',
    year: 2024,
    color: 'Black',
    price: 156000,
    image_url: 'https://images.pexels.com/photos/4756885/pexels-photo-4756885.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Industrial-grade sports car with a raw, aggressive stance.',
  },
  {
    id: 'm7',
    make: 'Kestrel',
    model: 'Viper 440',
    year: 1970,
    color: 'Black',
    price: 165000,
    image_url: 'https://images.pexels.com/photos/34071036/pexels-photo-34071036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Classic American muscle car with chrome detailing and a 440 Magnum V8.',
  },
  {
    id: 'm8',
    make: 'Kestrel',
    model: 'Bel Air',
    year: 1969,
    color: 'Red',
    price: 72000,
    image_url: 'https://images.pexels.com/photos/30090368/pexels-photo-30090368.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Restored classic with original chrome bumpers and vintage red paint.',
  },
  {
    id: 'm9',
    make: 'Voltaic',
    model: 'Model T',
    year: 2024,
    color: 'White',
    price: 48000,
    image_url: 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Best-selling electric sedan with 400-mile range and autopilot.',
  },
  {
    id: 'm10',
    make: 'Voltaic',
    model: 'Charge Pro',
    year: 2023,
    color: 'White',
    price: 52000,
    image_url: 'https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Electric daily driver with fast-charging capability and premium interior.',
  },
  {
    id: 'm11',
    make: 'Aurelio',
    model: 'Diablo',
    year: 2024,
    color: 'Yellow',
    price: 395000,
    image_url: 'https://images.pexels.com/photos/8105721/pexels-photo-8105721.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Lamborghini-style supercar with scissor doors and a 640hp V10.',
  },
  {
    id: 'm12',
    make: 'Aurelio',
    model: 'Stellar',
    year: 2023,
    color: 'Yellow',
    price: 280000,
    image_url: 'https://images.pexels.com/photos/9399193/pexels-photo-9399193.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Bold supercar with carbon fiber body and racing-grade brakes.',
  },
  {
    id: 'm13',
    make: 'Grizzly',
    model: 'Rover X',
    year: 2024,
    color: 'Black',
    price: 87000,
    image_url: 'https://images.pexels.com/photos/9283116/pexels-photo-9283116.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Rugged off-road SUV with locking differentials and trail-rated suspension.',
  },
  {
    id: 'm14',
    make: 'Grizzly',
    model: 'Desert Runner',
    year: 2023,
    color: 'Orange',
    price: 65000,
    image_url: 'https://images.pexels.com/photos/9545551/pexels-photo-9545551.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'market',
    description: 'Trophy truck built for high-speed desert running with long-travel suspension.',
  },
];

export const BLACK_MARKET_CARS: CarListing[] = [
  {
    id: 'b1',
    make: 'Onyx',
    model: 'Ghost Custom',
    year: 2024,
    color: 'Matte Black',
    price: 45000,
    image_url: 'https://images.pexels.com/photos/4756885/pexels-photo-4756885.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'No VIN, no registration, no questions. Tinted windows and untraceable plates.',
  },
  {
    id: 'b2',
    make: 'Kestrel',
    model: 'Interceptor',
    year: 1969,
    color: 'Black',
    price: 28000,
    image_url: 'https://images.pexels.com/photos/34071036/pexels-photo-34071036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'Restored police interceptor. Engine swapped with a supercharged V8. No papers.',
  },
  {
    id: 'b3',
    make: 'Aurelio',
    model: 'Stellar "Hot"',
    year: 2023,
    color: 'Yellow',
    price: 75000,
    image_url: 'https://images.pexels.com/photos/9399193/pexels-photo-9399193.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'Liberated supercar at half price. Serialized numbers filed off. Buyer assumes all risk.',
  },
  {
    id: 'b4',
    make: 'Veloce',
    model: 'Strato "Off Book"',
    year: 2024,
    color: 'Red',
    price: 35000,
    image_url: 'https://images.pexels.com/photos/34243853/pexels-photo-34243853.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'Brand new, never registered. Walked off the factory floor. 60% off retail.',
  },
  {
    id: 'b5',
    make: 'Voltaic',
    model: 'Ghost EV',
    year: 2024,
    color: 'White',
    price: 18000,
    image_url: 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'Electric sedan with GPS tracker removed. Silent, fast, and completely untraceable.',
  },
  {
    id: 'b6',
    make: 'Marchetti',
    model: 'Fiorano "Export"',
    year: 2023,
    color: 'Red',
    price: 95000,
    image_url: 'https://images.pexels.com/photos/11931440/pexels-photo-11931440.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    source: 'blackmarket',
    description: 'Exotic import with no import duties paid. Salvage title washed. Deal of a lifetime.',
  },
];

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  rate: number;
  minAmount: number;
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  color: string;
}

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'savings',
    name: 'Savings Bond',
    description: 'Slow and steady growth. Government-backed, virtually no risk.',
    rate: 0.002,
    minAmount: 1000,
    risk: 'Low',
    color: 'emerald',
  },
  {
    id: 'index',
    name: 'Index Fund',
    description: 'Broad market index. Reliable long-term growth with moderate volatility.',
    rate: 0.006,
    minAmount: 5000,
    risk: 'Medium',
    color: 'blue',
  },
  {
    id: 'crypto',
    name: 'Crypto Basket',
    description: 'Diversified crypto portfolio. High upside, high volatility.',
    rate: 0.015,
    minAmount: 2000,
    risk: 'High',
    color: 'amber',
  },
  {
    id: 'options',
    name: 'Options Trading',
    description: 'Leveraged options strategies. Extreme risk, extreme reward.',
    rate: 0.04,
    minAmount: 10000,
    risk: 'Extreme',
    color: 'red',
  },
];

export type DrugQuality = 'low' | 'medium' | 'high' | 'premium';

export interface DrugListing {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  qualities: {
    quality: DrugQuality;
    price: number;
    luckBonus: number;
    durationMin: number;
    label: string;
  }[];
}

export const DRUGS: DrugListing[] = [
  {
    id: 'weed',
    name: 'Green Crack',
    category: 'Cannabis',
    icon: 'Leaf',
    description: 'Energetic sativa strain. Mild euphoria, keeps you sharp at the tables.',
    qualities: [
      { quality: 'low', price: 80, luckBonus: 2, durationMin: 5, label: 'Shake' },
      { quality: 'medium', price: 150, luckBonus: 4, durationMin: 8, label: 'Mids' },
      { quality: 'high', price: 300, luckBonus: 7, durationMin: 12, label: 'Top Shelf' },
      { quality: 'premium', price: 600, luckBonus: 10, durationMin: 15, label: 'Exotic' },
    ],
  },
  {
    id: 'lean',
    name: 'Purple Drank',
    category: 'Syrup',
    icon: 'FlaskConical',
    description: 'Codeine cough syrup mixed with soda. Slow burn, smooth high.',
    qualities: [
      { quality: 'low', price: 120, luckBonus: 3, durationMin: 6, label: 'Light Pour' },
      { quality: 'medium', price: 250, luckBonus: 5, durationMin: 10, label: 'Double Cup' },
      { quality: 'high', price: 500, luckBonus: 8, durationMin: 15, label: 'Mud' },
      { quality: 'premium', price: 900, luckBonus: 12, durationMin: 20, label: 'Texas Tea' },
    ],
  },
  {
    id: 'pills',
    name: 'Blue Chillers',
    category: 'Pharmaceutical',
    icon: 'Pill',
    description: 'Pressed blues. Calm nerves, steady hands, cold focus.',
    qualities: [
      { quality: 'low', price: 200, luckBonus: 4, durationMin: 8, label: 'Half Press' },
      { quality: 'medium', price: 400, luckBonus: 7, durationMin: 12, label: 'Full Press' },
      { quality: 'high', price: 750, luckBonus: 11, durationMin: 18, label: 'Pharma Grade' },
      { quality: 'premium', price: 1400, luckBonus: 16, durationMin: 25, label: 'Medical Clean' },
    ],
  },
  {
    id: 'coke',
    name: 'White Lightning',
    category: 'Stimulant',
    icon: 'Zap',
    description: 'Powder stimulant. Intense burst of confidence and energy at the tables.',
    qualities: [
      { quality: 'low', price: 500, luckBonus: 6, durationMin: 5, label: 'Cut' },
      { quality: 'medium', price: 1000, luckBonus: 10, durationMin: 8, label: 'Fish Scale' },
      { quality: 'high', price: 2000, luckBonus: 15, durationMin: 12, label: 'Brick' },
      { quality: 'premium', price: 4000, luckBonus: 22, durationMin: 18, label: 'Flake' },
    ],
  },
  {
    id: 'molly',
    name: 'Pink Panthers',
    category: 'Empathogen',
    icon: 'Heart',
    description: 'Pressed ecstasy pills. Everything feels possible. Peak casino energy.',
    qualities: [
      { quality: 'low', price: 300, luckBonus: 5, durationMin: 10, label: 'Single Stack' },
      { quality: 'medium', price: 600, luckBonus: 9, durationMin: 15, label: 'Double Stack' },
      { quality: 'high', price: 1200, luckBonus: 14, durationMin: 22, label: 'Triple Stack' },
      { quality: 'premium', price: 2500, luckBonus: 20, durationMin: 30, label: 'Superman' },
    ],
  },
  {
    id: 'shrooms',
    name: 'Golden Teachers',
    category: 'Psychedelic',
    icon: 'Sparkles',
    description: 'Dried caps. Reality bends, numbers dance, luck becomes a feeling.',
    qualities: [
      { quality: 'low', price: 250, luckBonus: 5, durationMin: 15, label: 'Microdose' },
      { quality: 'medium', price: 500, luckBonus: 9, durationMin: 25, label: 'Threshold' },
      { quality: 'high', price: 1000, luckBonus: 15, durationMin: 40, label: 'Trip' },
      { quality: 'premium', price: 2200, luckBonus: 24, durationMin: 60, label: 'Heroic' },
    ],
  },
  {
    id: 'acid',
    name: 'Sunshine Tabs',
    category: 'Psychedelic',
    icon: 'Eye',
    description: 'Blotter LSD. The roulette wheel speaks to you. Extended vision.',
    qualities: [
      { quality: 'low', price: 350, luckBonus: 6, durationMin: 20, label: 'Half Tab' },
      { quality: 'medium', price: 700, luckBonus: 11, durationMin: 35, label: 'Single' },
      { quality: 'high', price: 1500, luckBonus: 18, durationMin: 50, label: 'Double' },
      { quality: 'premium', price: 3000, luckBonus: 28, durationMin: 75, label: 'Vial Wash' },
    ],
  },
  {
    id: 'dmt',
    name: 'Spirit Molecule',
    category: 'Psychedelic',
    icon: 'Orbit',
    description: 'The strongest trip on the market. Breakthrough luck, but it hits fast and hard.',
    qualities: [
      { quality: 'low', price: 800, luckBonus: 10, durationMin: 3, label: 'Changa' },
      { quality: 'medium', price: 1600, luckBonus: 16, durationMin: 5, label: 'Freebase' },
      { quality: 'high', price: 3200, luckBonus: 25, durationMin: 8, label: 'Crystal' },
      { quality: 'premium', price: 6500, luckBonus: 40, durationMin: 12, label: 'Breakthrough' },
    ],
  },
  {
    id: 'meth',
    name: 'Blue Sky',
    category: 'Stimulant',
    icon: 'FlaskConical',
    description: '99.1% pure crystal. The king of stimulants. God-tier luck that lasts for hours. Not for the faint of heart.',
    qualities: [
      { quality: 'low', price: 50000, luckBonus: 30, durationMin: 60, label: 'Batch Sample' },
      { quality: 'medium', price: 150000, luckBonus: 45, durationMin: 90, label: 'Lab Grade' },
      { quality: 'high', price: 300000, luckBonus: 65, durationMin: 120, label: 'Crystal Pure' },
      { quality: 'premium', price: 500000, luckBonus: 100, durationMin: 180, label: 'Heisenberg' },
    ],
  },
];

export const QUALITY_COLORS: Record<DrugQuality, string> = {
  low: 'text-zinc-400',
  medium: 'text-blue-400',
  high: 'text-purple-400',
  premium: 'text-amber-400',
};

export const QUALITY_BORDER: Record<DrugQuality, string> = {
  low: 'border-zinc-700',
  medium: 'border-blue-800/50',
  high: 'border-purple-800/50',
  premium: 'border-amber-800/50',
};

export const VIDEO_CATEGORIES = [
  'Gaming',
  'Finance',
  'Cars',
  'Tech Reviews',
  'Vlogs',
  'Comedy',
  'Education',
  'Music',
] as const;
