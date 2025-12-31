import { API_BASE_URL, isBackendAvailable } from '../config';

export interface PriceData {
    symbol: string;
    price: number;
}

export interface PricesResponse {
    prices: Record<string, number | null>;
}

export interface StockInfo {
    symbol: string;
    name: string | null;
    currency: string | null;
    exchange: string | null;
    sector: string | null;
    marketCap: number | null;
    currentPrice: number | null;
    previousClose: number | null;
    dayHigh: number | null;
    dayLow: number | null;
    volume: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
}

/**
 * Get current market price for a single symbol
 * Falls back to purchase price when backend is unavailable
 */
export const getPrice = async (symbol: string): Promise<PriceData> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return null to indicate no live price available
        throw new Error('Live market data requires the backend. Using purchase prices.');
    }

    // Support both local FastAPI format and Vercel serverless format
    const isVercel = API_BASE_URL === '/api';
    const url = isVercel
        ? `${API_BASE_URL}/market?symbol=${symbol}`  // Vercel uses query params
        : `${API_BASE_URL}/market/price/${symbol}`;  // FastAPI uses path params

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to fetch price for ${symbol}`);
    }

    return response.json();
};

/**
 * Get current market prices for multiple symbols at once
 * Returns empty object when backend is unavailable (uses purchase prices as fallback)
 */
export const getPrices = async (symbols: string[]): Promise<Record<string, number | null>> => {
    if (symbols.length === 0) return {};

    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return empty - the dashboard will use purchase prices as fallback
        console.info('Live prices unavailable (no backend). Using purchase prices.');
        return {};
    }

    try {
        // Support both local FastAPI format and Vercel serverless format
        const isVercel = API_BASE_URL === '/api';
        const url = isVercel
            ? `${API_BASE_URL}/market`       // Vercel /api/market with POST
            : `${API_BASE_URL}/market/prices`; // FastAPI /api/v1/market/prices

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbols }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to fetch prices');
        }

        const data: PricesResponse = await response.json();
        return data.prices;
    } catch (error) {
        console.warn('Could not fetch live prices:', error);
        return {};
    }
};

/**
 * Get detailed stock information
 */
export const getStockInfo = async (symbol: string): Promise<StockInfo> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        throw new Error('Stock info requires the backend.');
    }

    const response = await fetch(`${API_BASE_URL}/market/info/${symbol}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to fetch info for ${symbol}`);
    }

    return response.json();
};
