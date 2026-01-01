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

// Helper to detect Vercel environment
const isVercel = () => API_BASE_URL === '/api';

export const closePosition = async (request: ClosePositionRequest): Promise<ClosePositionResponse> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('This feature requires the backend. Please run the Python server locally.');
    }

    try {
        // On Vercel, use /api/transactions with action=close
        // On local FastAPI, use /api/v1/portfolio/close
        const url = isVercel()
            ? `${API_BASE_URL}/transactions`
            : `${API_BASE_URL}/portfolio/close`;

        const body = isVercel()
            ? { ...request, action: 'close' }
            : request;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || error.detail || 'Failed to close position');
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
        // On Vercel, use /api/transactions
        // On local FastAPI, use /api/v1/portfolio/transactions
        const url = isVercel()
            ? `${API_BASE_URL}/transactions?user_id=${userId}`
            : `${API_BASE_URL}/portfolio/transactions?user_id=${userId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Return empty instead of throwing
            return {
                transactions: [],
                total_realized_gains: 0,
                total_transactions: 0
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        // Return empty data instead of throwing
        return {
            transactions: [],
            total_realized_gains: 0,
            total_transactions: 0
        };
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
        const url = isVercel()
            ? `${API_BASE_URL}/portfolio?user_id=${userId}`  // Vercel /api/portfolio
            : `${API_BASE_URL}/portfolio/history?user_id=${userId}`; // FastAPI

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Portfolio history API error:', response.status);
            // Return empty data instead of throwing
            return {
                history: [],
                current_value: 0,
                total_invested: 0,
                total_gain: 0,
                total_gain_percent: 0
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching portfolio history:', error);
        // Return empty data instead of throwing to prevent page hang
        return {
            history: [],
            current_value: 0,
            total_invested: 0,
            total_gain: 0,
            total_gain_percent: 0
        };
    }
};
