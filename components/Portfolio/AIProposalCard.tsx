import React from 'react';
import { AIProposal } from '../../services/portfolioService';
import { Check, X, TrendingUp, TrendingDown, AlertCircle, Zap, Shield, Target, Leaf } from 'lucide-react';

interface AIProposalCardProps {
    proposal: AIProposal;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    status: 'pending' | 'accepted' | 'rejected';
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'growth': return <TrendingUp size={18} />;
        case 'protection': return <Shield size={18} />;
        case 'diversification': return <Target size={18} />;
        case 'sustainability': return <Leaf size={18} />;
        case 'optimization': return <Zap size={18} />;
        default: return <AlertCircle size={18} />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
        case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
        case 'low': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'growth': return 'text-green-600 bg-green-50';
        case 'protection': return 'text-blue-600 bg-blue-50';
        case 'diversification': return 'text-purple-600 bg-purple-50';
        case 'sustainability': return 'text-emerald-600 bg-emerald-50';
        case 'optimization': return 'text-orange-600 bg-orange-50';
        case 'income': return 'text-cyan-600 bg-cyan-50';
        case 'alternative': return 'text-pink-600 bg-pink-50';
        case 'thematic': return 'text-indigo-600 bg-indigo-50';
        case 'sector': return 'text-amber-600 bg-amber-50';
        default: return 'text-gray-600 bg-gray-50';
    }
};

export const AIProposalCard: React.FC<AIProposalCardProps> = ({
    proposal,
    onAccept,
    onReject,
    status
}) => {
    const priorityColors = getPriorityColor(proposal.priority);
    const categoryColor = getCategoryColor(proposal.category);

    const isPositiveReturn = proposal.impact_return > 0;
    const isPositiveRisk = proposal.impact_risk > 0;

    return (
        <div className={`
            bg-white rounded-xl border-2 p-5 transition-all duration-300
            ${status === 'accepted' ? 'border-green-400 bg-green-50/30' : ''}
            ${status === 'rejected' ? 'border-red-300 bg-red-50/30 opacity-60' : ''}
            ${status === 'pending' ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' : ''}
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${categoryColor}`}>
                        {getCategoryIcon(proposal.category)}
                    </span>
                    <div>
                        <h4 className="font-semibold text-slate-800">{proposal.title}</h4>
                        <span className={`text-xs font-medium capitalize ${categoryColor} px-2 py-0.5 rounded-full`}>
                            {proposal.category}
                        </span>
                    </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${priorityColors.bg} ${priorityColors.text}`}>
                    {proposal.priority.toUpperCase()}
                </span>
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {proposal.description}
            </p>

            {/* Impact Metrics */}
            <div className="flex gap-4 mb-4">
                <div className={`flex-1 p-3 rounded-lg ${isPositiveReturn ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                        {isPositiveReturn ? (
                            <TrendingUp size={14} className="text-green-600" />
                        ) : (
                            <TrendingDown size={14} className="text-red-600" />
                        )}
                        <span className="text-xs font-medium text-slate-500">Return Impact</span>
                    </div>
                    <span className={`text-lg font-bold ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositiveReturn ? '+' : ''}{proposal.impact_return.toFixed(1)}%
                    </span>
                </div>
                <div className={`flex-1 p-3 rounded-lg ${isPositiveRisk ? 'bg-orange-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                        <AlertCircle size={14} className={isPositiveRisk ? 'text-orange-600' : 'text-green-600'} />
                        <span className="text-xs font-medium text-slate-500">Risk Impact</span>
                    </div>
                    <span className={`text-lg font-bold ${isPositiveRisk ? 'text-orange-600' : 'text-green-600'}`}>
                        {isPositiveRisk ? '+' : ''}{proposal.impact_risk.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            {status === 'pending' && (
                <div className="flex gap-3">
                    <button
                        onClick={() => onAccept(proposal.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                        <Check size={18} />
                        Accept
                    </button>
                    <button
                        onClick={() => onReject(proposal.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                    >
                        <X size={18} />
                        Reject
                    </button>
                </div>
            )}

            {/* Status Badge */}
            {status === 'accepted' && (
                <div className="flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 font-medium rounded-lg">
                    <Check size={18} />
                    Accepted - Will be applied
                </div>
            )}
            {status === 'rejected' && (
                <div className="flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-500 font-medium rounded-lg">
                    <X size={18} />
                    Rejected
                </div>
            )}
        </div>
    );
};

export default AIProposalCard;
