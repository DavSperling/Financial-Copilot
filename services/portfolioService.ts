import { API_BASE_URL, isBackendAvailable } from '../config';

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

export interface StockRecommendation {
    ticker: string;
    name: string;
    sector: string;
    current_price: number;
    explanation: string;
}

export interface RecommendationResponse {
    remaining_budget: number;
    recommendations: StockRecommendation[];
}

export interface AcceptAssetRequest {
    user_id: string;
    ticker: string;
    name: string;
    price: number;
    amount?: number;
    type?: string;
}

export const getPortfolioRecommendation = async (profile: number): Promise<PortfolioRecommendation> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('Recommendations require the backend. Please run it locally.');
    }

    try {
        // Both FastAPI and Vercel use the same path format
        const response = await fetch(`${API_BASE_URL}/recommendations?profile=${profile}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `Error: ${response.status}`);
        }

        const data: PortfolioRecommendation = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch portfolio recommendation:', error);
        throw error;
    }
};

export const getStockRecommendations = async (profile: number, userId?: string): Promise<RecommendationResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('Stock recommendations require the backend.');
    }

    try {
        const url = `${API_BASE_URL}/recommendations/stocks?profile=${profile}${userId ? `&user_id=${userId}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching stock recommendations:', error);
        throw error;
    }
};

export const addAssetToPortfolio = async (assetRequest: AcceptAssetRequest): Promise<void> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('Adding assets requires the backend.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assetRequest)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add asset');
        }
    } catch (error) {
        console.error('Error adding asset:', error);
        throw error;
    }
};
