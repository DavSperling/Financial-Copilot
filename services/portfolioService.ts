export interface AIProposal {
    id: string;
    title: string;
    description: string;
    impact_return: number;
    impact_risk: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
}

export interface PortfolioRecommendation {
    profile_type: string;
    stocks: number;
    bonds: number;
    cash: number;
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    min_horizon_years: number;
    explanation: string;
    ai_proposals: AIProposal[];
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const getPortfolioRecommendation = async (profile: number): Promise<PortfolioRecommendation> => {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations?profile=${profile}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
        }

        const data: PortfolioRecommendation = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch portfolio recommendation:', error);
        throw error;
    }
};
