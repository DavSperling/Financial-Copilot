// API Configuration - detects environment and sets appropriate URLs
// In production (GitHub Pages), we don't have a backend, so we use Supabase directly
// In development, we use the local FastAPI backend

const isDevelopment = import.meta.env.DEV;
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Backend API URL - only available in development
export const API_BASE_URL = isDevelopment || isLocalhost
    ? 'http://localhost:8000/api/v1'
    : null; // No backend in production (GitHub Pages)

// Helper to check if backend is available
export const isBackendAvailable = (): boolean => {
    return isDevelopment || isLocalhost;
};

// Feature flags based on environment
export const features = {
    // These features require the FastAPI backend
    chatbot: isBackendAvailable(),      // AI chatbot needs Gemini API through backend
    liveMarketData: isBackendAvailable(), // Live stock prices from yfinance
    portfolioAnalytics: isBackendAvailable(), // Advanced analytics

    // These features work with Supabase only (available everywhere)
    auth: true,
    portfolioManagement: true,
    transactions: true,
};

export default {
    API_BASE_URL,
    isBackendAvailable,
    features,
};
