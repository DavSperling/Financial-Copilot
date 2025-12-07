import React, { useState } from 'react';
import { User } from '../types';
import { Globe, Bell, Shield, Trash2, AlertTriangle, Moon, Sun, Loader2, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface SettingsProps {
    user: User | null;
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, isDarkMode, onToggleTheme }) => {
    const [language, setLanguage] = useState('en');
    const [notifications, setNotifications] = useState({
        priceUpdates: true,
        recommendations: true,
        weeklyReports: false,
        accountUpdates: true
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsLoading(true);

        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        if (passwords.new.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error updating password' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsLoading(true);
        try {
            // In a real app, you would call a cloud function or backend API
            // await supabase.functions.invoke('delete-account');

            await onLogout();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => (
        <button
            className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}
      `}
            onClick={() => onChange(!checked)}
        >
            <span
                className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
            />
        </button>
    );

    return (
        <div className="max-w-[800px] mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your preferences and security settings.</p>
            </div>

            {/* Appearance Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-lg font-semibold text-slate-900 dark:text-white">
                    {isDarkMode ? <Moon size={20} className="text-primary-500" /> : <Sun size={20} className="text-primary-500" />}
                    Appearance
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300">Dark Mode</span>
                    <Toggle checked={isDarkMode} onChange={onToggleTheme} />
                </div>
            </section>

            {/* Language Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-lg font-semibold text-slate-900 dark:text-white">
                    <Globe size={20} className="text-primary-500" />
                    Language
                </div>
                <div className="flex justify-between items-center py-4">
                    <span className="text-slate-700 dark:text-slate-300">Interface Language</span>
                    <select
                        className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-primary-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="en">English</option>
                        <option value="he">Hebrew (עברית)</option>
                        <option value="fr">French (Français)</option>
                    </select>
                </div>
            </section>

            {/* Notifications Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-lg font-semibold text-slate-900 dark:text-white">
                    <Bell size={20} className="text-secondary-500" />
                    Notifications
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300">Price Updates</span>
                        <Toggle
                            checked={notifications.priceUpdates}
                            onChange={(c) => setNotifications({ ...notifications, priceUpdates: c })}
                        />
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300">Investment Recommendations</span>
                        <Toggle
                            checked={notifications.recommendations}
                            onChange={(c) => setNotifications({ ...notifications, recommendations: c })}
                        />
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300">Weekly Reports</span>
                        <Toggle
                            checked={notifications.weeklyReports}
                            onChange={(c) => setNotifications({ ...notifications, weeklyReports: c })}
                        />
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="text-slate-700 dark:text-slate-300">Account Updates</span>
                        <Toggle
                            checked={notifications.accountUpdates}
                            onChange={(c) => setNotifications({ ...notifications, accountUpdates: c })}
                        />
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-lg font-semibold text-slate-900 dark:text-white">
                    <Shield size={20} className="text-emerald-500" />
                    Security
                </div>

                <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4 mb-6">
                        <Input
                            label="Current Password"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
                        />

                        <Input
                            label="New Password"
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Last login: {new Date().toLocaleDateString()}
                        </div>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                        >
                            Update Password
                        </Button>
                    </div>

                    {message && (
                        <div className={`mt-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </section>

            {/* Delete Account Section */}
            <section className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-red-600 dark:text-red-400">
                    <Trash2 size={20} />
                    Delete Account
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    This action will permanently delete your account and all associated data. This cannot be undone.
                </p>

                <Button
                    variant="ghost"
                    className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    onClick={() => setDeleteModalOpen(true)}
                >
                    Delete Account Permanently
                </Button>
            </section>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Are you sure?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            This action is irreversible. Please type "DELETE" to confirm.
                        </p>

                        <input
                            type="text"
                            className="w-full p-3 text-center border border-slate-200 dark:border-slate-600 rounded-xl mb-6 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-red-500"
                            placeholder='Type "DELETE"'
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isLoading}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Account'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
