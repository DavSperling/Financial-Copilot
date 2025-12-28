import React, { useState, useMemo, useEffect } from 'react';
import { User, InvestmentItem } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase, SUPABASE_URL } from '../supabaseClient';
import { getPrices } from '../services/marketService';
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
  RefreshCw
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

interface DashboardPageProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Mock Chart Data
const CHART_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, onNavigate, currentView, isDarkMode, onToggleTheme }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for Assets
  const [assets, setAssets] = useState<InvestmentItem[]>([]);

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
    fetchAssets();
  }, [user]);

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

    setLoading(true);
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
      setLoading(false);
    }
  };

  // Derived Stats
  const stats = useMemo(() => {
    const totalValue = assets.reduce((sum, item) => sum + item.value, 0);
    const totalCostBasis = assets.reduce((sum, item) => sum + (item.costBasis || 0), 0);
    const totalGain = totalValue - totalCostBasis;
    const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

    return {
      totalValue,
      totalCostBasis,
      totalGain,
      totalGainPercent,
      dayChange: totalGain * 0.05, // Approximation
      dayChangePercent: totalGainPercent * 0.05
    };
  }, [assets]);

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

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative">

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
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white mr-3">
            <TrendingUp size={20} />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-display">Copilot</span>
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
                  value="$0.00"
                  subValue="Available cash"
                  icon={<Wallet className="text-slate-600" size={24} />}
                />
              </div>

              {/* Main Chart Section */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Portfolio Performance</h3>
                    <select
                      className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-primary-500 outline-none p-1"
                      aria-label="Select time range"
                    >
                      <option>Last 6 Months</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    {assets.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHART_DATA}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-400">
                        <PieChartIcon size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Add assets to see performance analytics</p>
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
                                <button
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                  aria-label={`Delete ${asset.symbol}`}
                                >
                                  <Trash2 size={18} />
                                </button>
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
      </main>
    </div>
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