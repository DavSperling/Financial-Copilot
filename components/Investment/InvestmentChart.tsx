'use client';

import React from 'react';

interface InvestmentChartProps {
    chartImage?: string;
}

export const InvestmentChart: React.FC<InvestmentChartProps> = ({ chartImage }) => {
    if (!chartImage) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                <p className="text-slate-600">No chart available. Click "Calculate Projection" to generate the chart.</p>
            </div>
        );
    }

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
};
