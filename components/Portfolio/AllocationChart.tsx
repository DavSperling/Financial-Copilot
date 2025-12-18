import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AllocationChartProps {
    stocks: number;
    bonds: number;
    cash: number;
}

const COLORS = {
    stocks: '#22c55e', // Green
    bonds: '#3b82f6',  // Blue
    cash: '#6b7280'    // Gray
};

const AllocationChart: React.FC<AllocationChartProps> = ({ stocks, bonds, cash }) => {
    const data = [
        { name: 'Stocks', value: stocks, color: COLORS.stocks },
        { name: 'Bonds', value: bonds, color: COLORS.bonds },
        { name: 'Cash', value: cash, color: COLORS.cash },
    ];

    // Filter out zero values to avoid empty segments/labels
    const activeData = data.filter(item => item.value > 0);

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={activeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {activeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [`${value}%`]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AllocationChart;
