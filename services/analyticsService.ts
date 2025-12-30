const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AssetAnalysis {
    symbol: string;
    name: string;
    sector: string | null;
    weight: number;
    value: number;
    profit_loss: number;
    profit_loss_percent: number;
}

export interface SectorBreakdown {
    sector: string;
    weight: number;
    value: number;
    count: number;
}

export interface RiskMetrics {
    diversification_score: number;
    concentration_risk: string;
    top_holding_weight: number;
    sector_count: number;
    asset_count: number;
}

export interface PortfolioAnalysis {
    summary: string;
    total_value: number;
    total_invested: number;
    total_gain: number;
    total_gain_percent: number;
    assets: AssetAnalysis[];
    sectors: SectorBreakdown[];
    risk_metrics: RiskMetrics;
    recommendations: string[];
    detailed_analysis: string;
}

export const getPortfolioAnalysis = async (userId: string): Promise<PortfolioAnalysis> => {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/portfolio?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to analyze portfolio');
        }

        return await response.json();
    } catch (error) {
        console.error('Error analyzing portfolio:', error);
        throw error;
    }
};
