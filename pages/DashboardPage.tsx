import React, { useState, useMemo, useEffect } from 'react';
import { User, InvestmentItem } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase, SUPABASE_URL } from '../supabaseClient';
import { getPrices } from '../services/marketService';
import { closePosition, getPortfolioHistory, PortfolioHistoryPoint, getTransactions } from '../services/transactionService';
import { getPortfolioAnalysis, PortfolioAnalysis } from '../services/analyticsService';
import {
  LayoutDashboard,
  PieChart as PieChartIcon,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Menu,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Plus,
  Trash2,
  X,
  RefreshCw,
  DollarSign as SellIcon,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ViewState } from '../App';
import { Profile } from './Profile';
import { Settings } from './Settings';
import RecommendationsPage from './Portfolio/RecommendationsPage';
import CalculatorPage from './Investment/CalculatorPage';
import TransactionsPage from './TransactionsPage';
import { ChatWidget } from '../components/ChatWidget';

interface DashboardPageProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Chart data will be fetched dynamically
interface ChartDataPoint {
  name: string;
  value: number;
  invested: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, onNavigate, currentView, isDarkMode, onToggleTheme }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedAssetForSale, setSelectedAssetForSale] = useState<InvestmentItem | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');
  const [sellingLoading, setSellingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCashInjected, setTotalCashInjected] = useState<number>(0);
  const [totalRealizedGains, setTotalRealizedGains] = useState<number>(0);

  // State for Assets
  const [assets, setAssets] = useState<InvestmentItem[]>([]);
  const [buyingPower, setBuyingPower] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Analytics Modal State
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<PortfolioAnalysis | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'Stock',
    amount: '',
    price: ''
  });

  // Fetch Assets from Supabase
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      await Promise.allSettled([
        fetchAssets(),
        fetchProfileAndCalculateCash(),
        fetchPortfolioHistory()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      // Always stop loading, even if some requests failed
      setLoading(false);
    }
  };

  const fetchPortfolioHistory = async () => {
    if (!user?.id) return;
    try {
      const response = await getPortfolioHistory(user.id);
      console.log('Portfolio history response:', response);
      const chartPoints: ChartDataPoint[] = response.history.map(h => ({
        name: h.month,
        value: h.value,
        invested: h.invested
      }));
      console.log('Chart points:', chartPoints);
      setChartData(chartPoints);
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      // Set default chart data if API fails
      setChartData([]);
    }
  };

  const fetchProfileAndCalculateCash = async () => {
    try {
      // Fetch profile for investment settings
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('initial_investment, monthly_budget, created_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        const initial = profile.initial_investment || 0;
        const monthly = profile.monthly_budget || 0;
        const createdAt = new Date(profile.created_at);
        const now = new Date();

        // Calculate months passed since creation where the 1st of the month has passed
        let monthsPassed = 0;
        let currentCheck = new Date(createdAt);

        // Move to next month's 1st
        if (currentCheck.getDate() > 1) {
          currentCheck.setMonth(currentCheck.getMonth() + 1);
          currentCheck.setDate(1);
        } else {
          // If created on the 1st, does it count immediately? 
          // "Que tous les premier du mois tu rajoute" -> typically means subsequent 1sts.
          // Let's assume on creation you get initial, and then every 1st you get monthly.
          // If created on 1st, maybe wait for next month or count it? 
          // Let's stick to: Initial is Day 0. Monthly is added on 1st of subsequent months.
          currentCheck.setMonth(currentCheck.getMonth() + 1);
          currentCheck.setDate(1);
        }
        currentCheck.setHours(0, 0, 0, 0);

        while (currentCheck <= now) {
          monthsPassed++;
          currentCheck.setMonth(currentCheck.getMonth() + 1);
        }

        const totalCashInjected = initial + (monthly * monthsPassed);

        // We need total invested calculated from assets, which might not be updated in state yet if running in parallel
        // So we will calculate it here or rely on useEffect dependecies. 
        // Better: separate the buying power calc to depend on 'assets' and 'profile' state. 
        // actually, let's just save the injected cash to state and calc buying power in useMemo or useEffect.
        setTotalCashInjected(totalCashInjected);

        // Fetch transactions for realized gains using shared service
        try {
          const { total_realized_gains } = await getTransactions(user.id);
          setTotalRealizedGains(total_realized_gains);
        } catch (txError) {
          console.error("Error fetching realized gains:", txError);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssets = async () => {
    // Basic validation check
    if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
      console.warn("Supabase not configured yet. Using local state.");
      return;
    }

    if (!user?.id) {
      console.warn("No user ID available");
      return;
    }

    // setLoading(true); // Handled in fetchData
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        return;
      }

      if (data && data.length > 0) {
        // Get unique symbols
        const symbols = [...new Set(data.map((item: any) => item.symbol.toUpperCase()))];

        // Fetch current prices from market API
        let currentPrices: Record<string, number | null> = {};
        try {
          currentPrices = await getPrices(symbols);
        } catch (priceError) {
          console.warn("Could not fetch live prices:", priceError);
        }

        const formattedAssets: InvestmentItem[] = data.map((item: any) => {
          const amount = parseFloat(item.amount) || 0;
          const purchasePrice = parseFloat(item.price) || 0;
          const symbol = item.symbol.toUpperCase();
          const currentPrice = currentPrices[symbol] ?? purchasePrice;

          const costBasis = amount * purchasePrice;
          const value = amount * currentPrice;
          const profitLoss = value - costBasis;
          const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

          return {
            id: item.id.toString(),
            symbol: symbol,
            name: item.name,
            type: item.type,
            amount: amount,
            purchasePrice: purchasePrice,
            currentPrice: currentPrice,
            costBasis: costBasis,
            value: value,
            profitLoss: profitLoss,
            profitLossPercent: profitLossPercent,
            change: currentPrices[symbol] ? profitLossPercent : 0,
            allocation: 0
          };
        });
        setAssets(formattedAssets);
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching assets:', error);
    } finally {
      // setLoading(false);
    }
  };

  // Derived Stats
  const stats = useMemo(() => {
    const totalValue = assets.reduce((sum, item) => sum + item.value, 0);
    const totalCostBasis = assets.reduce((sum, item) => sum + (item.costBasis || 0), 0);

    // Total Gain = (Current Value - Cost Basis) + Realized Gains
    const totalGain = (totalValue - totalCostBasis) + totalRealizedGains;

    // Buying Power = Cash Injected - Cost of Open Assets + Realized Gains
    const buyingPower = Math.max(0, totalCashInjected - totalCostBasis + totalRealizedGains);

    // Total Gain Percent = (Total Gain / (Total Cost Basis + (buyingPower? or Injected?))) ?
    // Simplest: Total Gain / Total Cost Basis (of currently held) - inaccurate if realized is huge.
    // Better: Total Gain / Total Cash Injected (Total Capital Deployed + Available) -> Total Yield on Account
    // Let's stick to cost basis for now but realized gain makes it tricky.
    // User wants to see generally how much they are up. 
    // Let's us (Total Gain / Total Cash Injected) * 100 if Injected > 0
    const totalGainPercent = totalCashInjected > 0 ? (totalGain / totalCashInjected) * 100 : 0;

    return {
      totalValue,
      totalCostBasis,
      totalGain,
      totalGainPercent,
      dayChange: totalGain * 0.05, // Approximation
      dayChangePercent: totalGainPercent * 0.05,
      buyingPower
    };
  }, [assets, totalCashInjected, totalRealizedGains]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const price = parseFloat(formData.price);

    if (!formData.symbol || !formData.name || isNaN(amount) || isNaN(price)) return;

    const newAsset: InvestmentItem = {
      id: Date.now().toString(),
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      type: formData.type as any,
      amount: amount,
      purchasePrice: price,
      currentPrice: price, // Will be updated on refresh
      costBasis: amount * price,
      value: amount * price,
      profitLoss: 0,
      profitLossPercent: 0,
      change: 0,
      allocation: 0
    };

    // Optimistic Update
    const prevAssets = [...assets];
    setAssets([newAsset, ...assets]);
    setFormData({ symbol: '', name: '', type: 'Stock', amount: '', price: '' });
    setIsAddModalOpen(false);

    // If Supabase is configured, save to DB
    if (SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID') && user?.id) {
      try {
        const { error } = await supabase.from('assets').insert([{
          symbol: formData.symbol.toUpperCase(),
          name: formData.name,
          type: formData.type,
          amount: amount,
          price: price,
          user_id: user.id
        }]);

        if (error) {
          console.error("Error adding to Supabase:", error);
          setAssets(prevAssets); // Revert on error
          alert("Failed to save to database: " + error.message);
        } else {
          fetchAssets(); // Refresh to get real ID
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const prevAssets = [...assets];
    setAssets(assets.filter(a => a.id !== id));

    // If Supabase is configured
    if (SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Error deleting from Supabase", err);
        setAssets(prevAssets); // Revert
        alert("Failed to delete from database");
      }
    }
  };

  const openSellModal = (asset: InvestmentItem) => {
    setSelectedAssetForSale(asset);
    setSellPrice(asset.currentPrice?.toString() || asset.purchasePrice?.toString() || '');
    setIsSellModalOpen(true);
  };

  const handleSellAsset = async () => {
    if (!user?.id || !selectedAssetForSale || !sellPrice) return;

    setSellingLoading(true);
    try {
      const result = await closePosition({
        user_id: user.id,
        asset_id: parseInt(selectedAssetForSale.id),
        sale_price: parseFloat(sellPrice)
      });

      // Remove asset from local state
      setAssets(assets.filter(a => a.id !== selectedAssetForSale.id));

      // Close modal and reset
      setIsSellModalOpen(false);
      setSelectedAssetForSale(null);
      setSellPrice('');

      // Show success message
      const gainText = result.profit_loss >= 0 ? `+$${result.profit_loss}` : `-$${Math.abs(result.profit_loss)}`;
      alert(`Position closed! ${gainText} (${result.profit_loss_percent.toFixed(2)}%)`);

      // Refresh data
      fetchData();
    } catch (err: any) {
      alert(`Failed to close position: ${err.message}`);
    } finally {
      setSellingLoading(false);
    }
  };

  const handleAnalyzePortfolio = async () => {
    if (!user?.id) return;

    setAnalyticsLoading(true);
    setIsAnalyticsModalOpen(true);

    try {
      const analysis = await getPortfolioAnalysis(user.id);
      setAnalyticsData(analysis);
    } catch (error: any) {
      console.error('Error analyzing portfolio:', error);
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative">

      {/* AI Chat Widget */}
      <ChatWidget userId={user?.id} />

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Add New Asset</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Symbol"
                  placeholder="AAPL"
                  value={formData.symbol}
                  onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                  required
                />
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    id="asset-type-select"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    aria-label="Select asset type"
                  >
                    <option value="Stock">Stock</option>
                    <option value="Crypto">Crypto</option>
                    <option value="ETF">ETF</option>
                    <option value="Bond">Bond</option>
                  </select>
                </div>
              </div>

              <Input
                label="Asset Name"
                placeholder="Apple Inc."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <Input
                  label="Price per Unit"
                  type="number"
                  step="any"
                  placeholder="$0.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" fullWidth>
                  Add Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Asset Modal */}
      {isSellModalOpen && selectedAssetForSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-800 font-display">Sell Position</h3>
              <button
                onClick={() => {
                  setIsSellModalOpen(false);
                  setSelectedAssetForSale(null);
                  setSellPrice('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Asset Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {selectedAssetForSale.symbol.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedAssetForSale.symbol}</p>
                  <p className="text-sm text-slate-500">{selectedAssetForSale.name}</p>
                </div>
              </div>

              {/* Position Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Quantity</p>
                  <p className="font-semibold text-slate-900">{selectedAssetForSale.amount} units</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Purchase Price</p>
                  <p className="font-semibold text-slate-900">${selectedAssetForSale.purchasePrice?.toFixed(2)}</p>
                </div>
              </div>

              {/* Sale Price Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale Price per Unit</label>
                <input
                  type="number"
                  step="any"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>

              {/* Profit/Loss Preview */}
              {sellPrice && (
                <div className={`p-4 rounded-xl ${parseFloat(sellPrice) >= (selectedAssetForSale.purchasePrice || 0)
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Estimated Profit/Loss</span>
                    <span className={`font-bold text-lg ${parseFloat(sellPrice) >= (selectedAssetForSale.purchasePrice || 0)
                      ? 'text-emerald-600'
                      : 'text-red-600'
                      }`}>
                      {parseFloat(sellPrice) >= (selectedAssetForSale.purchasePrice || 0) ? '+' : ''}
                      ${(((parseFloat(sellPrice) || 0) - (selectedAssetForSale.purchasePrice || 0)) * selectedAssetForSale.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">Percentage</span>
                    <span className={`text-sm font-medium ${parseFloat(sellPrice) >= (selectedAssetForSale.purchasePrice || 0)
                      ? 'text-emerald-600'
                      : 'text-red-600'
                      }`}>
                      {selectedAssetForSale.purchasePrice
                        ? (((parseFloat(sellPrice) || 0) - selectedAssetForSale.purchasePrice) / selectedAssetForSale.purchasePrice * 100).toFixed(2)
                        : '0'}%
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setIsSellModalOpen(false);
                    setSelectedAssetForSale(null);
                    setSellPrice('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleSellAsset}
                  disabled={sellingLoading || !sellPrice}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sellingLoading ? 'Selling...' : 'Confirm Sale'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Analytics Modal */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-white" size={24} />
                <h3 className="text-lg font-bold text-white font-display">Portfolio Analysis</h3>
              </div>
              <button
                onClick={() => {
                  setIsAnalyticsModalOpen(false);
                  setAnalyticsData(null);
                }}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {analyticsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                  <p className="text-slate-500 text-lg">Analyzing your portfolio...</p>
                  <p className="text-slate-400 text-sm mt-1">Fetching sector data and calculating metrics</p>
                </div>
              ) : analyticsData ? (
                <div className="space-y-8">
                  {/* Summary Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-slate-800 mb-2">{analyticsData.summary}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Value</p>
                        <p className="text-lg font-bold text-slate-900">${analyticsData.total_value.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Invested</p>
                        <p className="text-lg font-bold text-slate-700">${analyticsData.total_invested.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Gain/Loss</p>
                        <p className={`text-lg font-bold ${analyticsData.total_gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {analyticsData.total_gain >= 0 ? '+' : ''}${analyticsData.total_gain.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Return</p>
                        <p className={`text-lg font-bold ${analyticsData.total_gain_percent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {analyticsData.total_gain_percent >= 0 ? '+' : ''}{analyticsData.total_gain_percent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Sector Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-indigo-500" />
                        Sector Breakdown
                      </h4>
                      <div className="space-y-3">
                        {analyticsData.sectors.map((sector, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-700">{sector.sector}</span>
                              <span className="text-slate-500">{sector.weight}% (${sector.value.toLocaleString()})</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${sector.weight}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Metrics */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        {analyticsData.risk_metrics.concentration_risk === 'High' ? (
                          <AlertTriangle size={18} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        )}
                        Risk Assessment
                      </h4>

                      {/* Diversification Score */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Diversification Score</span>
                          <span className="font-bold text-slate-800">{analyticsData.risk_metrics.diversification_score}/100</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${analyticsData.risk_metrics.diversification_score >= 70 ? 'bg-emerald-500' :
                              analyticsData.risk_metrics.diversification_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${analyticsData.risk_metrics.diversification_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-500">Concentration Risk</p>
                          <p className={`font-bold ${analyticsData.risk_metrics.concentration_risk === 'Low' ? 'text-emerald-600' :
                            analyticsData.risk_metrics.concentration_risk === 'Medium' ? 'text-amber-600' : 'text-red-600'
                            }`}>{analyticsData.risk_metrics.concentration_risk}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-500">Top Holding</p>
                          <p className="font-bold text-slate-800">{analyticsData.risk_metrics.top_holding_weight}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-500">Sectors</p>
                          <p className="font-bold text-slate-800">{analyticsData.risk_metrics.sector_count}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-500">Positions</p>
                          <p className="font-bold text-slate-800">{analyticsData.risk_metrics.asset_count}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      💡 Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {analyticsData.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-amber-900 text-sm flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h4 className="font-semibold text-slate-800 mb-4">📊 Detailed Analysis</h4>
                    <div className="prose prose-sm prose-slate max-w-none">
                      {analyticsData.detailed_analysis.split('\n').map((line, idx) => {
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-md font-semibold text-slate-700 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                        } else if (line.startsWith('- ')) {
                          return <p key={idx} className="text-slate-600 ml-4">{line}</p>;
                        } else if (line.includes('**')) {
                          return <p key={idx} className="text-slate-600" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                        } else if (line.trim()) {
                          return <p key={idx} className="text-slate-600">{line}</p>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <AlertTriangle size={48} className="mb-4" />
                  <p>Could not analyze portfolio. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <img src="/logo-icon.png" alt="BegInvest" className="w-10 h-10 object-contain mr-3" />
          <span className="text-xl font-bold text-slate-900 dark:text-white font-display">BegInvest</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <SidebarItem
            icon={<PieChartIcon size={20} />}
            label="Portfolio"
            active={currentView === 'recommendations'}
            onClick={() => onNavigate('recommendations')}
          />
          <SidebarItem
            icon={<TrendingUp size={20} />}
            label="Calculator"
            active={currentView === 'calculator'}
            onClick={() => onNavigate('calculator')}
          />
          <SidebarItem
            icon={<Wallet size={20} />}
            label="Transactions"
            active={currentView === 'transactions'}
            onClick={() => onNavigate('transactions')}
          />
          <SidebarItem
            icon={<SettingsIcon size={20} />}
            label="Settings"
            active={currentView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors" onClick={() => onNavigate('profile')}>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img src={user?.avatar || "https://picsum.photos/200"} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 max-w-xl ml-4 lg:ml-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search asset, symbol..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button
              className="relative p-2 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentView === 'profile' ? (
            <Profile user={user} />
          ) : currentView === 'settings' ? (
            <Settings user={user} onLogout={onLogout} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
          ) : currentView === 'recommendations' ? (
            <RecommendationsPage />
          ) : currentView === 'calculator' ? (
            <CalculatorPage />
          ) : currentView === 'transactions' ? (
            <TransactionsPage />
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">

              {/* Header Text */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 font-display">Portfolio Overview</h1>
                  <p className="text-slate-500 mt-1">Here is how your investments are performing today.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={fetchAssets} variant="ghost" size="sm" className="hidden sm:flex">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  </Button>
                  <Button onClick={handleAnalyzePortfolio} variant="secondary" size="sm" leftIcon={<BarChart3 size={16} />} disabled={assets.length === 0}>
                    Analyze
                  </Button>
                  <Button onClick={() => setIsAddModalOpen(true)} size="sm" leftIcon={<Plus size={16} />}>
                    Add Asset
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Value"
                  value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  trend={stats.dayChangePercent}
                  icon={<DollarSign className="text-primary-600" size={24} />}
                />
                <StatCard
                  label="Total Gain"
                  value={`+$${stats.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subValue={`${stats.totalGainPercent}% all time`}
                  trend={stats.totalGainPercent}
                  isPositive={true}
                  icon={<TrendingUp className="text-emerald-600" size={24} />}
                />
                <StatCard
                  label="Day Change"
                  value={`+$${stats.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  trend={stats.dayChangePercent}
                  icon={<ArrowUpRight className="text-secondary-600" size={24} />}
                />
                <StatCard
                  label="Buying Power"
                  value={`$${stats.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subValue="Available cash"
                  icon={<Wallet className="text-slate-600" size={24} />}
                />
              </div>

              {/* Main Chart Section */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Asset Performance</h3>
                    <div className="text-sm text-slate-500">
                      {assets.length} assets
                    </div>
                  </div>
                  <div className="h-[300px] w-full overflow-y-auto">
                    {assets.length > 0 ? (
                      <div className="space-y-4">
                        {assets.map((asset, index) => {
                          const purchaseCost = (asset.purchasePrice || 0) * asset.amount;
                          const currentValue = asset.value;
                          const profitLoss = asset.profitLoss || 0;
                          const profitLossPercent = asset.profitLossPercent || 0;
                          const isProfit = profitLoss >= 0;
                          const maxValue = Math.max(purchaseCost, currentValue);
                          const purchaseWidth = maxValue > 0 ? (purchaseCost / maxValue) * 100 : 0;
                          const currentWidth = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;

                          return (
                            <div key={asset.id} className="group">
                              {/* Asset header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">{asset.symbol}</span>
                                  <span className="text-xs text-slate-400">{asset.amount} units</span>
                                </div>
                                <div className={`text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {isProfit ? '+' : ''}${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  <span className="text-xs ml-1">({isProfit ? '+' : ''}{profitLossPercent.toFixed(1)}%)</span>
                                </div>
                              </div>

                              {/* Progress bars */}
                              <div className="space-y-1">
                                {/* Purchase cost bar */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 w-16">Buy</span>
                                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-slate-400 rounded-full transition-all duration-500"
                                      style={{ width: `${purchaseWidth}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-20 text-right">${purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>

                                {/* Current value bar */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 w-16">Now</span>
                                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}
                                      style={{ width: `${currentWidth}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs w-20 text-right font-medium ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Total Summary */}
                        <div className="border-t border-slate-200 pt-4 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">Total Portfolio</span>
                            <div className={`text-lg font-bold ${stats.totalGain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {stats.totalGain >= 0 ? '+' : ''}${stats.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-sm ml-1">({stats.totalGainPercent}%)</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-500 mt-1">
                            <span>Invested: ${(stats.totalValue - stats.totalGain).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            <span>Current: ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-slate-400">
                        <div>
                          <PieChartIcon size={48} className="mx-auto mb-2 opacity-50" />
                          <p>Add assets to see performance</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Asset Allocation */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Allocation</h3>
                  <div className="flex-1 flex items-center justify-center relative">
                    {assets.length > 0 ? (
                      <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 relative">
                        <div className="absolute inset-0 rounded-full border-[16px] border-primary-500 border-r-transparent border-b-transparent -rotate-45"></div>
                        <div className="absolute inset-0 rounded-full border-[16px] border-secondary-500 border-l-transparent border-b-transparent rotate-45 opacity-60"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900">{assets.length}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Assets</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 rounded-full bg-slate-50 flex items-center justify-center border-4 border-slate-100 border-dashed">
                        <span className="text-sm text-slate-400">No data</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 space-y-3">
                    {assets.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary-500"></span>
                          <span className="text-slate-600">Invested</span>
                        </div>
                        <span className="font-semibold text-slate-900">100%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assets List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Your Assets</h3>
                  {assets.length === 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(true)}>Add your first asset</Button>
                  )}
                </div>

                {assets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Asset</th>
                          <th className="px-6 py-4 font-semibold">Purchase Price</th>
                          <th className="px-6 py-4 font-semibold">Current Price</th>
                          <th className="px-6 py-4 font-semibold">Value</th>
                          <th className="px-6 py-4 font-semibold">Gain/Loss</th>
                          <th className="px-6 py-4 font-semibold">Allocation</th>
                          <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assets.map((asset) => {
                          const allocation = stats.totalValue > 0 ? (asset.value / stats.totalValue) * 100 : 0;
                          const isProfit = (asset.profitLoss || 0) >= 0;
                          return (
                            <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                    {asset.symbol.substring(0, 2)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{asset.symbol}</p>
                                    <p className="text-xs text-slate-500">{asset.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-600">
                                  ${asset.purchasePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </p>
                                <p className="text-xs text-slate-400">per unit</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className={`text-sm font-semibold ${asset.currentPrice && asset.currentPrice > (asset.purchasePrice || 0) ? 'text-emerald-600' : asset.currentPrice && asset.currentPrice < (asset.purchasePrice || 0) ? 'text-red-500' : 'text-slate-900'}`}>
                                  ${asset.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </p>
                                <p className="text-xs text-slate-400">live price</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-500">{asset.amount} units</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`inline-flex items-center text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {isProfit ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                  {isProfit ? '+' : ''}${(asset.profitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className={`text-xs font-medium ${isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                                  {isProfit ? '+' : ''}{(asset.profitLossPercent || 0).toFixed(2)}%
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${allocation}%` }}></div>
                                </div>
                                <span className="text-xs text-slate-500 mt-1 block">{allocation.toFixed(1)}%</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openSellModal(asset)}
                                    className="text-slate-400 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                                    aria-label={`Sell ${asset.symbol}`}
                                    title="Sell Position"
                                  >
                                    <SellIcon size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                    aria-label={`Delete ${asset.symbol}`}
                                    title="Delete (No transaction record)"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Plus size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No assets found</h3>
                    <p className="text-slate-500 max-w-sm mb-6">
                      Get started by adding your first investment to your portfolio.
                    </p>
                    <Button onClick={() => setIsAddModalOpen(true)}>Add New Asset</Button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main >
    </div >
  );
};

const SidebarItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className={`
    w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors
    ${active
      ? 'bg-primary-50 text-primary-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'}
  `}>
    <span className={`mr-3 ${active ? 'text-primary-600' : 'text-slate-400'}`}>
      {icon}
    </span>
    {label}
  </button>
);

const StatCard = ({ label, value, subValue, trend, isPositive, icon }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(2)}%
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
  </div>
);