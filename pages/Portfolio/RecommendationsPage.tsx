import React, { useState, useMemo, useEffect } from 'react';
import { getPortfolioRecommendation, PortfolioRecommendation } from '../../services/portfolioService';
import AllocationChart from '../../components/Portfolio/AllocationChart';
import { StockRecommendationCard } from '../../components/Portfolio/StockRecommendationCard';
import { AddAssetModal } from '../../components/Portfolio/AddAssetModal';
import { Loader2, TrendingUp, Shield, Clock, BarChart3, Sparkles, CheckCircle2, Wallet, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { addAssetToPortfolio, getStockRecommendations, StockRecommendation } from '../../services/portfolioService';
import { User } from '@supabase/supabase-js';
import { useBuyingPower } from '../../hooks/useBuyingPower';

const PROFILE_NAMES: Record<number, string> = {
    1: "Conservative",
    2: "Balanced",
    3: "Dynamic",
    4: "Aggressive"
};

const PROFILE_DESCRIPTIONS: Record<number, string> = {
    1: "Low risk, focus on capital preservation",
    2: "Moderate risk, balanced growth and stability",
    3: "Higher risk, growth-oriented strategy",
    4: "Maximum risk, aggressive growth focus"
};

const RecommendationsPage: React.FC = () => {
    const [riskProfile, setRiskProfile] = useState<number>(2);
    const [loading, setLoading] = useState<boolean>(false);
    const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New state for stocks
    const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
    const [stockStatuses, setStockStatuses] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({});
    const [user, setUser] = useState<User | null>(null);

    // Budget & Modal state
    const { buyingPower, loading: buyingPowerLoading } = useBuyingPower(user?.id);
    const [remainingBudget, setRemainingBudget] = useState<number>(-1); // -1 means unknown/unlimited

    // Sync local budget with shared buying power hook
    useEffect(() => {
        if (!buyingPowerLoading && buyingPower !== undefined) {
            setRemainingBudget(buyingPower);
        }
    }, [buyingPower, buyingPowerLoading]);

    const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    const handleGetRecommendation = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPortfolioRecommendation(riskProfile);
            setRecommendation(data);

            // Fetch Stock recommendations with user context for budget
            const currentUserId = user?.id;
            const stockResponse = await getStockRecommendations(riskProfile, currentUserId);

            setStockRecommendations(stockResponse.recommendations);

            // If hook hasn't loaded yet or failed, fall back to API (though API might convert to -1 now)
            // But we prefer the hook's live value if available
            if (!buyingPowerLoading && buyingPower !== undefined) {
                setRemainingBudget(buyingPower);
            } else {
                setRemainingBudget(stockResponse.remaining_budget);
            }

            const sStatuses: Record<string, 'pending' | 'accepted' | 'rejected'> = {};
            stockResponse.recommendations.forEach(s => { sStatuses[s.ticker] = 'pending'; });
            setStockStatuses(sStatuses);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch recommendation.');
        } finally {
            setLoading(false);
        }
    };

    // Open Modal instead of direct add
    const onStockSelectInfo = (stock: StockRecommendation) => {
        if (!user) {
            alert("Please sign in to add assets.");
            return;
        }
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleConfirmAddStock = async (quantity: number) => {
        if (!user || !selectedStock) return;

        try {
            await addAssetToPortfolio({
                user_id: user.id,
                ticker: selectedStock.ticker,
                name: selectedStock.name,
                price: selectedStock.current_price,
                amount: quantity,
                type: 'Stock'
            });
            setStockStatuses(prev => ({ ...prev, [selectedStock.ticker]: 'accepted' }));

            // Update local budget optimistically
            if (remainingBudget !== -1) {
                setRemainingBudget(prev => prev - (selectedStock.current_price * quantity));
            }

            setIsModalOpen(false);
            setSelectedStock(null);
        } catch (err: any) {
            alert(`Failed to add asset: ${err.message}`);
        }
    };

    const handleRejectStock = (ticker: string) => {
        setStockStatuses(prev => ({ ...prev, [ticker]: 'rejected' }));
    };

    // Calculate adjusted metrics based solely on theoretical recommendation for now, since we removed proposals
    const adjustedMetrics = useMemo(() => {
        if (!recommendation) return null;

        return {
            expected_return: recommendation.expected_return,
            volatility: recommendation.volatility,
        };
    }, [recommendation]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
                        <Sparkles size={28} />
                    </div>
                    AI Portfolio Recommendations
                </h1>
                <p className="mt-2 text-slate-600">
                    Get personalized investment recommendations powered by AI analysis
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column - Input & Analysis */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Risk Profile Selector */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Risk Profile</h2>

                        <div className="space-y-3 mb-6">
                            {[1, 2, 3, 4].map(profile => (
                                <button
                                    key={profile}
                                    onClick={() => setRiskProfile(profile)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${riskProfile === profile
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={`font-semibold ${riskProfile === profile ? 'text-blue-700' : 'text-slate-800'}`}>
                                                {PROFILE_NAMES[profile]}
                                            </span>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {PROFILE_DESCRIPTIONS[profile]}
                                            </p>
                                        </div>
                                        {riskProfile === profile && (
                                            <CheckCircle2 className="text-blue-500" size={24} />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGetRecommendation}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Get AI Analysis
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Financial Metrics */}
                    {recommendation && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Portfolio Metrics</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="text-green-600" size={24} />
                                        <div>
                                            <p className="text-sm text-slate-600">Expected Return</p>
                                            <p className="font-bold text-green-700">
                                                {adjustedMetrics?.expected_return.toFixed(1)}% / year
                                            </p>
                                        </div>
                                    </div>
                                    {adjustedMetrics && adjustedMetrics.expected_return !== recommendation.expected_return && (
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                            +{(adjustedMetrics.expected_return - recommendation.expected_return).toFixed(1)}%
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Shield className="text-orange-600" size={24} />
                                        <div>
                                            <p className="text-sm text-slate-600">Volatility (Risk)</p>
                                            <p className="font-bold text-orange-700">
                                                {adjustedMetrics?.volatility.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                    <BarChart3 className="text-blue-600" size={24} />
                                    <div>
                                        <p className="text-sm text-slate-600">Sharpe Ratio</p>
                                        <p className="font-bold text-blue-700">{recommendation.sharpe_ratio.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                    <Clock className="text-purple-600" size={24} />
                                    <div>
                                        <p className="text-sm text-slate-600">Min. Horizon</p>
                                        <p className="font-bold text-purple-700">{recommendation.min_horizon_years} years</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Results */}
                <div className="lg:col-span-8">
                    {!recommendation ? (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Sparkles size={48} className="text-slate-300 mb-4" />
                            <p className="text-lg font-medium text-slate-400">Select a profile and click "Get AI Analysis"</p>
                            <p className="text-sm text-slate-400 mt-1">to receive personalized recommendations</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Allocation Section */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Asset Allocation</h3>
                                    <AllocationChart
                                        stocks={recommendation.stocks}
                                        bonds={recommendation.bonds}
                                        cash={recommendation.cash}
                                    />
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Strategy Overview</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                                Stocks
                                            </span>
                                            <span className="font-bold text-slate-800">{recommendation.stocks}%</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                                Bonds
                                            </span>
                                            <span className="font-bold text-slate-800">{recommendation.bonds}%</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                                Cash
                                            </span>
                                            <span className="font-bold text-slate-800">{recommendation.cash}%</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                                        <p className="text-sm text-slate-600 leading-relaxed">{recommendation.explanation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommended Stocks Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <TrendingUp className="text-blue-600" size={24} />
                                            Recommended Stocks
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-sm text-slate-500">
                                                Top individual stock picks aligned with your {PROFILE_NAMES[riskProfile]} profile
                                            </p>
                                        </div>
                                    </div>
                                    {remainingBudget !== -1 && (
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                            <Wallet size={16} className="text-slate-500" />
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-slate-500 font-medium">Remaining Budget</span>
                                                <span className={`text-sm font-bold ${remainingBudget < 1000 ? 'text-orange-600' : 'text-slate-800'}`}>
                                                    ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {stockRecommendations.map(stock => (
                                        <StockRecommendationCard
                                            key={stock.ticker}
                                            stock={stock}
                                            status={stockStatuses[stock.ticker] || 'pending'}
                                            onAccept={onStockSelectInfo}
                                            onReject={handleRejectStock}
                                        />
                                    ))}
                                    {stockRecommendations.length === 0 && (
                                        <div className="col-span-2 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <AlertTriangle className="mx-auto text-slate-400 mb-2" size={24} />
                                            {remainingBudget !== -1 && remainingBudget < 100 ? (
                                                <p className="text-slate-500 font-medium">
                                                    No stocks found within your remaining budget of ${remainingBudget.toFixed(2)}.
                                                    <br />
                                                    <span className="text-sm font-normal">Consider increasing your initial investment profile settings.</span>
                                                </p>
                                            ) : (
                                                <p className="text-slate-500">Loading recommendations or no stocks match your criteria...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal */}
                            <AddAssetModal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                stock={selectedStock}
                                remainingBudget={remainingBudget !== -1 ? remainingBudget : 9999999}
                                onConfirm={handleConfirmAddStock}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecommendationsPage;
