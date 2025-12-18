import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface InvestmentChartProps {
    yearlyBreakdown: number[];
    monthlyAmount: number;
}

export const InvestmentChart: React.FC<InvestmentChartProps> = ({ yearlyBreakdown, monthlyAmount }) => {
    const data = yearlyBreakdown.map((value, index) => {
        const year = index + 1;
        const contributed = monthlyAmount * 12 * year;
        return {
            year,
            value: Math.round(value),
            contributed
        };
    });

    // Add initial point (Year 0)
    const chartData = [
        { year: 0, value: 0, contributed: 0 },
        ...data
    ];

    const formatCurrency = (value: number) => {
        return `₪${value.toLocaleString()}`;
    };

    return (
        <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Projected Growth</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="year"
                        label={{ value: 'Years', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis
                        tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="contributed"
                        name="Total Contributed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        name="Total Value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
