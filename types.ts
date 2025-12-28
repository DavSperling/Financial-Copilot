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
  purchasePrice: number; // Price per unit when purchased
  currentPrice?: number; // Current market price per unit
  value: number; // Total value = amount * currentPrice (or purchasePrice if no current)
  costBasis: number; // Total cost = amount * purchasePrice
  profitLoss?: number; // Gain/loss in $ = value - costBasis
  profitLossPercent?: number; // Gain/loss in %
  change: number; // Daily change percentage
  allocation: number; // Percentage of portfolio
}

export interface PortfolioStats {
  totalValue: number;
  totalCostBasis: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}