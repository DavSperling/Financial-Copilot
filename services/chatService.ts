import { API_BASE_URL, isBackendAvailable } from '../config';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
    suggestions: string[];
}

export const sendChatMessage = async (
    userId: string,
    message: string,
    history: ChatMessage[]
): Promise<ChatResponse> => {
    // Check if backend is available
    if (!isBackendAvailable() || !API_BASE_URL) {
        // Return a helpful message when running on GitHub Pages
        return {
            response: "🚀 Le chatbot IA n'est disponible qu'en mode local avec le backend Python. Déployez le backend FastAPI pour activer cette fonctionnalité!",
            suggestions: [
                "Comment lancer le backend?",
                "Voir la documentation",
            ]
        };
    }

    try {
        // Support both local FastAPI format and Vercel serverless format
        const isVercel = API_BASE_URL === '/api';
        const url = isVercel
            ? `${API_BASE_URL}/chat`        // Vercel /api/chat
            : `${API_BASE_URL}/chat/message`; // FastAPI /api/v1/chat/message

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                message,
                history
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.error || 'Failed to send message');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const checkChatHealth = async (): Promise<boolean> => {
    if (!isBackendAvailable() || !API_BASE_URL) {
        return false;
    }

    try {
        // Support both local FastAPI format and Vercel serverless format
        const isVercel = API_BASE_URL === '/api';
        const url = isVercel
            ? `${API_BASE_URL}/chat`        // Vercel /api/chat GET
            : `${API_BASE_URL}/chat/health`; // FastAPI /api/v1/chat/health

        const response = await fetch(url);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
};
