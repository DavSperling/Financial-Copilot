const API_BASE_URL = 'http://localhost:8000/api/v1';

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
 */
export const getPrice = async (symbol: string): Promise<PriceData> => {
    const response = await fetch(`${API_BASE_URL}/market/price/${symbol}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to fetch price for ${symbol}`);
    }

    return response.json();
};

/**
 * Get current market prices for multiple symbols at once
 */
export const getPrices = async (symbols: string[]): Promise<Record<string, number | null>> => {
    if (symbols.length === 0) return {};

    const response = await fetch(`${API_BASE_URL}/market/prices`, {
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
};

/**
 * Get detailed stock information
 */
export const getStockInfo = async (symbol: string): Promise<StockInfo> => {
    const response = await fetch(`${API_BASE_URL}/market/info/${symbol}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to fetch info for ${symbol}`);
    }

    return response.json();
};
