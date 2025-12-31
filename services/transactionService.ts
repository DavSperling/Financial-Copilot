import { API_BASE_URL, isBackendAvailable } from '../config';

export interface Transaction {
    id: number;
    symbol: string;
    name: string;
    type: string;
    quantity: number;
    purchase_price: number;
    sale_price: number;
    total_cost: number;
    total_revenue: number;
    profit_loss: number;
    profit_loss_percent: number;
    purchase_date: string;
    sale_date: string;
}

export interface TransactionsResponse {
    transactions: Transaction[];
    total_realized_gains: number;
    total_transactions: number;
}

export interface ClosePositionRequest {
    user_id: string;
    asset_id: number;
    sale_price: number;
}

export interface ClosePositionResponse {
    message: string;
    transaction: Transaction;
    profit_loss: number;
    profit_loss_percent: number;
}

export const closePosition = async (request: ClosePositionRequest): Promise<ClosePositionResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('This feature requires the backend. Please run the Python server locally.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/portfolio/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to close position');
        }

        return await response.json();
    } catch (error) {
        console.error('Error closing position:', error);
        throw error;
    }
};

export const getTransactions = async (userId: string): Promise<TransactionsResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return empty transactions in demo mode
        return {
            transactions: [],
            total_realized_gains: 0,
            total_transactions: 0
        };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/portfolio/transactions?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch transactions');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

export interface PortfolioHistoryPoint {
    month: string;
    value: number;
    invested: number;
    gain: number;
}

export interface PortfolioHistoryResponse {
    history: PortfolioHistoryPoint[];
    current_value: number;
    total_invested: number;
    total_gain: number;
    total_gain_percent: number;
}

export const getPortfolioHistory = async (userId: string): Promise<PortfolioHistoryResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return empty history in demo mode
        return {
            history: [],
            current_value: 0,
            total_invested: 0,
            total_gain: 0,
            total_gain_percent: 0
        };
    }

    try {
        // Support both local FastAPI and Vercel serverless
        const isVercel = API_BASE_URL === '/api';
        const url = isVercel
            ? `${API_BASE_URL}/portfolio?user_id=${userId}`  // Vercel /api/portfolio
            : `${API_BASE_URL}/portfolio/history?user_id=${userId}`; // FastAPI

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.error || 'Failed to fetch portfolio history');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching portfolio history:', error);
        throw error;
    }
};
