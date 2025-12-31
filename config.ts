// API Configuration - detects environment and sets appropriate URLs
// In production on Vercel, we use /api serverless functions
// In development, we use the local FastAPI backend

const isDevelopment = import.meta.env.DEV;
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const isVercel = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('.vercel.app') ||
    import.meta.env.VITE_VERCEL === '1'
);

// Backend API URL
// - Development/localhost: use local FastAPI backend
// - Vercel: use /api serverless functions
// - GitHub Pages: no backend
export const API_BASE_URL = isDevelopment || isLocalhost
    ? 'http://localhost:8000/api/v1'
    : isVercel
        ? '/api'  // Vercel serverless functions
        : null;   // GitHub Pages - no backend

// Helper to check if backend is available
export const isBackendAvailable = (): boolean => {
    return isDevelopment || isLocalhost || isVercel;
};

// Feature flags based on environment
export const features = {
    // These features require the backend (FastAPI or Vercel serverless)
    chatbot: isBackendAvailable(),      // AI chatbot needs Gemini API through backend
    liveMarketData: isBackendAvailable(), // Stock prices (mock data on Vercel)
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
