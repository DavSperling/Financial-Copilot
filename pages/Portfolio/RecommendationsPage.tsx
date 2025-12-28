import React, { useState, useMemo } from 'react';
import { getPortfolioRecommendation, PortfolioRecommendation } from '../../services/portfolioService';
import AllocationChart from '../../components/Portfolio/AllocationChart';
import { AIProposalCard } from '../../components/Portfolio/AIProposalCard';
import { Loader2, TrendingUp, Shield, Clock, BarChart3, Sparkles, CheckCircle2 } from 'lucide-react';

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
    const [proposalStatuses, setProposalStatuses] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({});

    const handleGetRecommendation = async () => {
        setLoading(true);
        setError(null);
        setProposalStatuses({});
        try {
            const data = await getPortfolioRecommendation(riskProfile);
            setRecommendation(data);
            // Initialize all proposals as pending
            const statuses: Record<string, 'pending' | 'accepted' | 'rejected'> = {};
            data.ai_proposals.forEach(p => { statuses[p.id] = 'pending'; });
            setProposalStatuses(statuses);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch recommendation.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptProposal = (id: string) => {
        setProposalStatuses(prev => ({ ...prev, [id]: 'accepted' }));
    };

    const handleRejectProposal = (id: string) => {
        setProposalStatuses(prev => ({ ...prev, [id]: 'rejected' }));
    };

    // Calculate adjusted metrics based on accepted proposals
    const adjustedMetrics = useMemo(() => {
        if (!recommendation) return null;

        let returnAdjustment = 0;
        let riskAdjustment = 0;

        recommendation.ai_proposals.forEach(proposal => {
            if (proposalStatuses[proposal.id] === 'accepted') {
                returnAdjustment += proposal.impact_return;
                riskAdjustment += proposal.impact_risk;
            }
        });

        return {
            expected_return: recommendation.expected_return + returnAdjustment,
            volatility: Math.max(0, recommendation.volatility + riskAdjustment),
            acceptedCount: Object.values(proposalStatuses).filter(s => s === 'accepted').length,
            rejectedCount: Object.values(proposalStatuses).filter(s => s === 'rejected').length,
            pendingCount: Object.values(proposalStatuses).filter(s => s === 'pending').length,
        };
    }, [recommendation, proposalStatuses]);

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

                            {/* AI Proposals Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <Sparkles className="text-purple-500" size={24} />
                                            AI Investment Proposals
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Review and accept/reject AI-generated optimization suggestions
                                        </p>
                                    </div>
                                    {adjustedMetrics && (
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                                {adjustedMetrics.acceptedCount} accepted
                                            </span>
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                                                {adjustedMetrics.pendingCount} pending
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {recommendation.ai_proposals.map(proposal => (
                                        <AIProposalCard
                                            key={proposal.id}
                                            proposal={proposal}
                                            status={proposalStatuses[proposal.id] || 'pending'}
                                            onAccept={handleAcceptProposal}
                                            onReject={handleRejectProposal}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecommendationsPage;
