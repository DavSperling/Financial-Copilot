export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface InvestmentItem {
  id: string;
  symbol: string;
  name: string;
  type: 'Stock' | 'Crypto' | 'ETF' | 'Bond';
  amount: number;
  value: number;
  change: number; // Percentage
  allocation: number; // Percentage of portfolio
}

export interface PortfolioStats {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}