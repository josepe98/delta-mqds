export interface MQDEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  category: string;
  description: string;
  origin?: string;
  destination?: string;
  flightNumber?: string;
  baseMiles: number;
  bonusMiles: number;
  totalMiles: number;
  baseMQDs: number;
  bonusMQDs: number;
  totalMQDs: number;
  ticketNumber?: string;
  postedDate?: string;
  trip?: string;
  status: 'Complete' | 'Pending';
}

export interface CardConfig {
  id: string;
  name: string;
  monthlySpend: number;
  mqdRate: number; // dollars spent per $1 MQD (e.g., 10 for Reserve, 20 for Platinum)
}

export type StatusLevel = 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Custom';

export interface UserSettings {
  targetLevel: StatusLevel;
  customTarget?: number;
  cards: CardConfig[];
  customCategories: string[];
}

export const STATUS_THRESHOLDS: Record<Exclude<StatusLevel, 'Custom'>, number> = {
  Silver: 6000,
  Gold: 12000,
  Platinum: 18000,
  Diamond: 28000,
};

export const DEFAULT_CATEGORIES = [
  'Flight',
  'MQD Boost',
  'MQD Headstart',
  'Delta Cars & Stays',
];

export type Tab = 'dashboard' | 'activity' | 'import' | 'settings';
