import React, { useState, useEffect } from 'react';
import { generateInvestmentChart, ChartResponse } from '../../services/investmentService';
import { InvestmentChart } from '../../components/Investment/InvestmentChart';
import { SummaryCards } from '../../components/Investment/SummaryCards';
import { Loader2, Calculator } from 'lucide-react';
import { Button } from '../../components/Button';

const CalculatorPage: React.FC = () => {
    const [initialInvestment, setInitialInvestment] = useState<number>(0);
    const [monthlyAmount, setMonthlyAmount] = useState<number>(1000);
    const [years, setYears] = useState<number>(10);
    const [annualReturn, setAnnualReturn] = useState<number>(7);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ChartResponse | null>(null);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await generateInvestmentChart(monthlyAmount, years, annualReturn, initialInvestment);
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to calculate results');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        <Calculator size={24} />
                    </div>
                    Investment Calculator
                </h1>
                <p className="mt-2 text-slate-600">
                    Visualize the power of compound interest by adjusting your contribution and timeline.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6">Parameters</h2>

                        <div className="space-y-6">
                            {/* Initial Investment */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Initial Investment
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <label htmlFor="initial-investment-input" className="sr-only">Initial Investment Input</label>
                                    <input
                                        id="initial-investment-input"
                                        type="number"
                                        min="0"
                                        max="100000"
                                        value={initialInvestment}
                                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="mt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100000"
                                        step="1000"
                                        value={initialInvestment}
                                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                        aria-label="Initial Investment Slider"
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                            </div>

                            {/* Monthly Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Monthly Investment
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <label htmlFor="monthly-amount-input" className="sr-only">Monthly Amount Input</label>
                                    <input
                                        id="monthly-amount-input"
                                        type="number"
                                        min="100"
                                        max="50000"
                                        value={monthlyAmount}
                                        onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="mt-2">
                                    <input
                                        type="range"
                                        min="100"
                                        max="50000"
                                        step="100"
                                        value={monthlyAmount}
                                        onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                                        aria-label="Monthly Amount Slider"
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                            </div>

                            {/* Years */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">Investment Period</label>
                                    <span className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                        {years} years
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    aria-label="Investment Period Slider"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                            </div>

                            {/* Annual Return */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">Expected Annual Return</label>
                                    <span className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                        {annualReturn}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max="15"
                                    step="0.5"
                                    value={annualReturn}
                                    onChange={(e) => setAnnualReturn(Number(e.target.value))}
                                    aria-label="Annual Return Slider"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleCalculate}
                                    fullWidth
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="mr-2 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        'Calculate Projection'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-8">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100 flex items-center">
                            <span className="font-medium mr-2">Error:</span> {error}
                        </div>
                    )}

                    {result ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SummaryCards
                                futureValue={result.future_value}
                                totalContributed={result.total_contributed}
                                totalEarnings={result.total_earnings}
                            />
                            <InvestmentChart
                                chartImage={result.chart_image}
                                futureValue={result.future_value}
                                totalContributed={result.total_contributed}
                                years={years}
                                monthlyAmount={monthlyAmount}
                                initialInvestment={initialInvestment}
                                annualReturn={annualReturn}
                            />
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            <Calculator size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Ready to calculate</p>
                            <p className="text-sm mt-1">Adjust parameters and click calculate to see your projection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;
