import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Layout } from '../components/Layout';

interface ForgotPasswordPageProps {
    onNavigate: (view: any) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Communication error with the server');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'If the email exists, a reset link has been sent.');
            } else {
                setStatus('error');
                setMessage(data.detail || 'Something went wrong.');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Communication error with the server');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
                        <p className="text-slate-600">Enter your email and we will send you a reset link</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <p>{message}</p>
                            </div>
                            <button
                                onClick={() => onNavigate('login')}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{message}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-900"
                                        placeholder="name@example.com"
                                    />
                                    <Mail className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {status === 'loading' ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => onNavigate('login')}
                                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-colors py-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Login</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
