import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { sendChatMessage, ChatMessage } from '../services/chatService';

interface ChatWidgetProps {
    userId: string | undefined;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([
        "Analyze my portfolio",
        "What is an ETF?",
        "How to diversify?"
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || !userId || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendChatMessage(userId, text, messages);
            const assistantMessage: ChatMessage = { role: 'assistant', content: response.response };
            setMessages(prev => [...prev, assistantMessage]);
            setSuggestions(response.suggestions);
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: "Sorry, I couldn't process your request. Please try again. 😕"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!userId) return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/25 hover:scale-110 transition-all duration-300 group"
                    aria-label="Open chat"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        AI
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Portfolio Copilot AI</h3>
                                <p className="text-xs text-white/70">Your financial assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                            aria-label="Close chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-indigo-600" size={28} />
                                </div>
                                <h4 className="font-semibold text-slate-800 mb-2">Hello! 👋</h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    I'm your AI assistant. Ask me questions about your portfolio or investing in general.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={14} className="text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="bg-slate-300 p-1.5 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0">
                                        <User size={14} className="text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 items-center">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-full h-7 w-7 flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length === 0 || (!isLoading && messages.length > 0) ? (
                        <div className="px-4 py-2 bg-white border-t border-slate-100">
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(suggestion)}
                                        className="text-xs bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask your question..."
                                className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                                aria-label="Send message"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
