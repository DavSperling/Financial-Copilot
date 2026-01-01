import { API_BASE_URL, isBackendAvailable } from '../config';

export interface InvestmentRequest {
    monthly_amount: number;
    years: number;
    annual_return: number;
    initial_investment: number;
}

export interface InvestmentResponse {
    future_value: number;
    total_contributed: number;
    total_earnings: number;
    yearly_breakdown: number[];
}

export interface ChartResponse {
    chart_image: string;
    future_value: number;
    total_contributed: number;
    total_earnings: number;
}

// Client-side calculation when backend is not available
const calculateInvestmentLocally = (
    monthlyAmount: number,
    years: number,
    annualReturn: number,
    initialInvestment: number
): InvestmentResponse => {
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;

    let balance = initialInvestment;
    const yearlyBreakdown: number[] = [initialInvestment];

    for (let month = 1; month <= months; month++) {
        balance = balance * (1 + monthlyRate) + monthlyAmount;
        if (month % 12 === 0) {
            yearlyBreakdown.push(Math.round(balance * 100) / 100);
        }
    }

    const totalContributed = initialInvestment + (monthlyAmount * months);

    return {
        future_value: Math.round(balance * 100) / 100,
        total_contributed: totalContributed,
        total_earnings: Math.round((balance - totalContributed) * 100) / 100,
        yearly_breakdown: yearlyBreakdown
    };
};

export const calculateInvestment = async (
    monthlyAmount: number,
    years: number,
    annualReturn: number,
    initialInvestment: number = 0
): Promise<InvestmentResponse> => {
    // Use local calculation if backend is not available
    if (!isBackendAvailable() || !API_BASE_URL) {
        return calculateInvestmentLocally(monthlyAmount, years, annualReturn, initialInvestment);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/investment/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                monthly_amount: monthlyAmount,
                years: years,
                annual_return: annualReturn,
                initial_investment: initialInvestment,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to calculate investment');
        }

        return await response.json();
    } catch (error) {
        console.error('Error calculating investment, falling back to local:', error);
        // Fallback to local calculation
        return calculateInvestmentLocally(monthlyAmount, years, annualReturn, initialInvestment);
    }
};

export const generateInvestmentChart = async (
    monthlyAmount: number,
    years: number,
    annualReturn: number,
    initialInvestment: number = 0
): Promise<ChartResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return calculation without chart image
        const calc = calculateInvestmentLocally(monthlyAmount, years, annualReturn, initialInvestment);
        return {
            chart_image: '',
            future_value: calc.future_value,
            total_contributed: calc.total_contributed,
            total_earnings: calc.total_earnings
        };
    }

    try {
        // On Vercel, use /api/investment (no sub-routes)
        // On local FastAPI, use /api/v1/investment/chart
        const isVercel = API_BASE_URL === '/api';
        const url = isVercel
            ? `${API_BASE_URL}/investment`
            : `${API_BASE_URL}/investment/chart`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initial_amount: initialInvestment,
                monthly_contribution: monthlyAmount,
                years: years,
                annual_return: annualReturn,
            }),
        });

        if (!response.ok) {
            // Fallback to local calculation
            const calc = calculateInvestmentLocally(monthlyAmount, years, annualReturn, initialInvestment);
            return {
                chart_image: '',
                future_value: calc.future_value,
                total_contributed: calc.total_contributed,
                total_earnings: calc.total_earnings
            };
        }

        const data = await response.json();

        // Transform Vercel response to match expected format
        if (isVercel && data.summary) {
            return {
                chart_image: '',
                future_value: data.summary.final_balance,
                total_contributed: data.summary.total_invested,
                total_earnings: data.summary.total_gains
            };
        }

        return data;
    } catch (error) {
        console.error('Error generating chart:', error);
        // Fallback to local calculation instead of throwing
        const calc = calculateInvestmentLocally(monthlyAmount, years, annualReturn, initialInvestment);
        return {
            chart_image: '',
            future_value: calc.future_value,
            total_contributed: calc.total_contributed,
            total_earnings: calc.total_earnings
        };
    }
};

