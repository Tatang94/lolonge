
export interface Episode {
  id: string;
  episodeNumber: number;
  url: string;
  isLocked: boolean;
  coinCost: number;
}

export interface Drama {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  genre: string;
  rating: number;
  author: string;
  episodes: Episode[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'REWARD' | 'PURCHASE' | 'UNLOCK' | 'DEPOSIT';
  label: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING';
}

export interface UserProfile {
  id: string;
  name: string;
  coins: number;
  isVip: boolean;
  history: string[]; // drama IDs
  favorites: string[]; // drama IDs
  transactions: Transaction[];
  lastCheckIn?: string; // Format YYYY-MM-DD
  ipAddress?: string;
  role: 'USER' | 'ADMIN';
  // Properti baru untuk fitur Referral & Tantangan
  referralCode: string;
  referredBy?: string;
  watchTimeMinutes: number;
  referralCount: number;
  completedMissions: string[]; // IDs of completed missions
}

export interface AdConfig {
  id: string;
  position: 'TOP' | 'BOTTOM' | 'POPUP';
  scriptCode: string;
  isActive: boolean;
}

export interface LolongAnalysis {
  rating: number;
  intensity: 'RENDAH' | 'MENENGAH' | 'TINGGI' | 'EKSTRIM';
  roast: string;
  hype: string;
  suggestedTags: string[];
}
