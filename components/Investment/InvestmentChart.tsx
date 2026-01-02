'use client';

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface InvestmentChartProps {
    chartImage?: string;
    futureValue?: number;
    totalContributed?: number;
    years?: number;
    monthlyAmount?: number;
    initialInvestment?: number;
    annualReturn?: number;
}

export const InvestmentChart: React.FC<InvestmentChartProps> = ({
    chartImage,
    futureValue = 0,
    totalContributed = 0,
    years = 10,
    monthlyAmount = 1000,
    initialInvestment = 0,
    annualReturn = 7
}) => {
    // Generate chart data client-side
    const chartData = useMemo(() => {
        const monthlyRate = annualReturn / 100 / 12;
        const data = [];

        let balance = initialInvestment;
        let invested = initialInvestment;

        data.push({
            year: 0,
            balance: Math.round(balance),
            invested: Math.round(invested),
            earnings: 0
        });

        for (let year = 1; year <= years; year++) {
            for (let month = 0; month < 12; month++) {
                balance = balance * (1 + monthlyRate) + monthlyAmount;
                invested += monthlyAmount;
            }

            data.push({
                year: year,
                balance: Math.round(balance),
                invested: Math.round(invested),
                earnings: Math.round(balance - invested)
            });
        }

        return data;
    }, [years, monthlyAmount, initialInvestment, annualReturn]);

    // If we have a chart image, use it (for backward compatibility)
    if (chartImage) {
        return (
            <div className="mt-6">
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                    <img
                        src={chartImage}
                        alt="Investment Growth Chart"
                        className="w-full h-auto rounded-lg"
                    />
                </div>
            </div>
        );
    }

    // Otherwise render with Recharts
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    return (
        <div className="mt-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Investment Growth Over Time</h3>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="year"
                                tickFormatter={(value) => `Year ${value}`}
                                stroke="#94a3b8"
                                fontSize={12}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                stroke="#94a3b8"
                                fontSize={12}
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `$${value.toLocaleString()}`,
                                    name === 'balance' ? 'Total Value' : name === 'invested' ? 'Amount Invested' : 'Earnings'
                                ]}
                                labelFormatter={(label) => `Year ${label}`}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend
                                formatter={(value) => {
                                    if (value === 'balance') return 'Total Value';
                                    if (value === 'invested') return 'Amount Invested';
                                    return value;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="invested"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorInvested)"
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-slate-600">Total Value (with compound interest)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">Amount Invested</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
