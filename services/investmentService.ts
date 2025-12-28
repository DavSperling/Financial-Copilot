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

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const calculateInvestment = async (
    monthlyAmount: number,
    years: number,
    annualReturn: number,
    initialInvestment: number = 0
): Promise<InvestmentResponse> => {
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
        console.error('Error calculating investment:', error);
        throw error;
    }
};

export const generateInvestmentChart = async (
    monthlyAmount: number,
    years: number,
    annualReturn: number,
    initialInvestment: number = 0
): Promise<ChartResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/investment/chart`, {
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
            throw new Error(errorData.detail || 'Failed to generate chart');
        }

        return await response.json();
    } catch (error) {
        console.error('Error generating chart:', error);
        throw error;
    }
};
