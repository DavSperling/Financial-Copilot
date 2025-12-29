import React from 'react';
import { DollarSign, TrendingUp, PiggyBank } from 'lucide-react';

interface SummaryCardsProps {
    totalContributed: number;
    futureValue: number;
    totalEarnings: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
    totalContributed,
    futureValue,
    totalEarnings
}) => {
    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <PiggyBank size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Total You'll Invest</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalContributed)}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Estimated Value</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(futureValue)}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Estimated Earnings</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(totalEarnings)}
                </div>
            </div>
        </div>
    );
};
