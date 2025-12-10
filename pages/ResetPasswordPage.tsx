import React, { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordPageProps {
    token: string;
    onNavigate: (view: any) => void;
}

import { supabase } from '../supabaseClient';

export function ResetPasswordPage({ token, onNavigate }: ResetPasswordPageProps) {
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [sessionReady, setSessionReady] = useState(false);

    React.useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
                setStatus('idle');
            }
        });

        // Listen for auth changes (like the magic link completing login)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setSessionReady(true);
                setStatus('idle');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sessionReady) {
            setStatus('error');
            setMessage('Session not ready. Please wait a moment or click the link again.');
            return;
        }

        setStatus('loading');
        setMessage('');

        // Basic frontend validation
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setStatus('error');
            setMessage('Password must be at least 8 characters, include uppercase, lowercase, and a number.');
            return;
        }

        try {
            // Note: We use the client-side session which should be established by the magic link
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            setStatus('success');
            setMessage('Password reset successfully.');

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(error.message || 'Failed to reset password.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Set New Password</h2>
                        <p className="text-slate-600">Enter your new password below</p>
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
                                <label className="text-sm font-medium text-slate-700 block">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 pl-11 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-900"
                                        placeholder="Enter new password"
                                        minLength={8}
                                    />
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mr-1">
                                    At least 8 characters, one uppercase, one lowercase and one number
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {status === 'loading' ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
