import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Wallet {
  id: number;
  balance: number;
  updated_at: string;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  updated_at: string;
}

export interface Trade {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface GameRecord {
  id: string;
  game_type: string;
  bet_amount: number;
  payout: number;
  result: string;
  created_at: string;
}

export interface OwnedCar {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  purchase_price: number;
  listed_price: number | null;
  image_url: string;
  source: string;
  created_at: string;
}

export interface Investment {
  id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  current_value: number;
  rate: number;
  status: string;
  started_at: string;
  last_update: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  views: number;
  earnings: number;
  posted_at: string;
  last_update: string;
  likes: number;
  is_bot: boolean;
  creator_name: string;
  description: string;
  is_viral: boolean;
  thumbnail_seed: number;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  user_id: string | null;
}

export interface CarOffer {
  id: string;
  car_id: string;
  offer_amount: number;
  buyer_name: string;
  accepted: boolean;
  created_at: string;
}

export interface Gun {
  id: string;
  name: string;
  frame: string;
  barrel: string;
  sight: string;
  damage: number;
  accuracy: number;
  fire_rate: number;
  created_at: string;
}

export interface RangeScore {
  id: string;
  score: number;
  targets_hit: number;
  accuracy_pct: number;
  gun_name: string;
  created_at: string;
}

export interface BackroomBuild {
  id: string;
  name: string;
  layout: number[][];
  theme: string;
  created_at: string;
  updated_at: string;
}
