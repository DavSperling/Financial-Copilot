const API_BASE_URL = 'http://localhost:8000/api/v1';

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
    try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
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
            throw new Error(error.detail || 'Failed to send message');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const checkChatHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
};
