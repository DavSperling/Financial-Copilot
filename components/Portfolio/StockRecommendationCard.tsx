import React from 'react';
import { StockRecommendation } from '../../services/portfolioService';
import { Check, X, TrendingUp, Info } from 'lucide-react';

interface StockRecommendationCardProps {
    stock: StockRecommendation;
    onAccept: (stock: StockRecommendation) => void;
    onReject: (ticker: string) => void;
    status: 'pending' | 'accepted' | 'rejected';
}

export const StockRecommendationCard: React.FC<StockRecommendationCardProps> = ({
    stock,
    onAccept,
    onReject,
    status
}) => {
    return (
        <div className={`
            bg-white rounded-xl border-2 p-5 transition-all duration-300
            ${status === 'accepted' ? 'border-green-400 bg-green-50/30' : ''}
            ${status === 'rejected' ? 'border-red-300 bg-red-50/30 opacity-60' : ''}
            ${status === 'pending' ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' : ''}
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-blue-700 text-sm">
                        {stock.ticker}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800">{stock.name}</h4>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {stock.sector}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-slate-900">${stock.current_price.toFixed(2)}</span>
                    <span className="text-xs text-slate-500">Live Price</span>
                </div>
            </div>

            {/* Explanation */}
            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex gap-2 items-start">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {stock.explanation}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            {status === 'pending' && (
                <div className="flex gap-3">
                    <button
                        onClick={() => onAccept(stock)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                        <Check size={18} />
                        Add to Portfolio
                    </button>
                    <button
                        onClick={() => onReject(stock.ticker)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
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
                    Added to Portfolio
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
