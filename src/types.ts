export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface PotatoPlotState {
  planted_at: number;
  growth_duration: number;
  count: number;
  max_count: number;
  ready?: boolean;
  growth_progress?: number;
  seconds_left?: number;
}

export interface ChickensState {
  count: number;
  chicks: number;
  roosters: number;
  eggs: number;
  max_capacity: number;
  feed_level: number;
  last_feed_time: number;
}

export interface PigsState {
  count: number;
  piglets: number;
  meat: number;
  feed_level: number;
  last_feed_time: number;
}

export interface CowsState {
  count: number;
  milk: number;
  cheese: number;
  feed_level: number;
  last_feed_time: number;
}

export interface OstrichesState {
  count: number;
  feathers: number;
  eggs: number;
  feed_level: number;
  last_feed_time: number;
}

export interface FarmState {
  potato: PotatoPlotState;
  chickens: ChickensState;
  pigs: PigsState;
  cows: CowsState;
  ostriches: OstrichesState;
}

export interface EconomyPrices {
  potato: number;
  egg: number;
  milk: number;
  cheese: number;
  meat: number;
  ostrich_feather: number;
  ostrich_egg: number;
  wheat: number;
}

export interface FeedStock {
  grain: number;
  hay: number;
  premium: number;
}

export interface SeedStock {
  potato: number;
  wheat: number;
}

export interface StorageState {
  used: number;
  max: number;
}

export interface EconomyState {
  balance: number;
  gems: number;
  storage: StorageState;
  prices: EconomyPrices;
  feed_stock: FeedStock;
  seed_stock: SeedStock;
}

export interface WheatPlot {
  id: number;
  planted_at: number;
  duration: number;
  stage?: number; // 0: empty, 1: sprouting, 2: growing, 3: ripening, 4: ready
  ready?: boolean;
  progress?: number;
  harvest_yield?: number;
}

export interface WheatState {
  plots: WheatPlot[];
  granary_used: number;
  granary_max: number;
  total_harvested: number;
}

export interface WorkerState {
  hired: number;
  speed_boost: number;
  auto_collector: boolean;
  slots: number;
  cost_per_hour: number;
}

export interface BusinessContract {
  id: string;
  title: string;
  description: string;
  req_item: string;
  req_count: number;
  reward_coins: number;
  reward_xp: number;
  fulfilled: boolean;
}

export interface BusinessUpgrades {
  sprinkler: number;
  auto_feeder: number;
  tractor: number;
}

export interface BusinessState {
  level_name: string;
  contracts: BusinessContract[];
  upgrades: BusinessUpgrades;
}

export interface LevelState {
  current: number;
  xp: number;
  next_level_xp: number;
  title: string;
}

export interface GameState {
  farm: FarmState;
  economy: EconomyState;
  wheat: WheatState;
  workers: WorkerState;
  business: BusinessState;
  tag: string;
  level: LevelState;
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  balance: number;
  rank: number;
  tag?: string;
  isSelf?: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface AuthResponse {
  ok: boolean;
  chat_id: number;
  user_id: number;
  user_name?: string;
}

export interface ActionResponse {
  ok: boolean;
  message: string;
  state?: GameState;
}

export type TabType = "farm" | "wheat" | "market" | "shop" | "business" | "casino" | "leaderboard" | "profile";

export interface ToastItem {
  id: string;
  message: string;
  type?: "success" | "info" | "warning" | "level_up";
  timestamp: number;
}
