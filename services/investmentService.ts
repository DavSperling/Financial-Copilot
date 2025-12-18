export interface InvestmentRequest {
    monthly_amount: number;
    years: number;
    annual_return: number;
}

export interface InvestmentResponse {
    future_value: number;
    total_contributed: number;
    total_earnings: number;
    yearly_breakdown: number[];
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const calculateInvestment = async (
    monthlyAmount: number,
    years: number,
    annualReturn: number
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
