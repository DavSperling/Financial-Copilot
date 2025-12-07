import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { User as UserIcon, Settings, FileText, Save, Loader2, DollarSign } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface ProfileProps {
    user: User | null;
}

type TabType = 'personal' | 'investment' | 'documents';

export const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form States
    const [personalInfo, setPersonalInfo] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        dob: ''
    });

    const [investmentProfile, setInvestmentProfile] = useState({
        riskTolerance: 'medium',
        experience: 'beginner',
        initialInvestment: '',
        monthlyBudget: '',
        goals: [] as string[]
    });

    // Fetch Profile Data
    useEffect(() => {
        if (user?.id) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (profile) {
                setPersonalInfo(prev => ({
                    ...prev,
                    phone: profile.phone_number || '',
                    dob: profile.date_of_birth || ''
                }));

                setInvestmentProfile({
                    riskTolerance: profile.risk_tolerance || 'medium',
                    experience: profile.investment_experience || 'beginner',
                    initialInvestment: profile.initial_investment !== null ? profile.initial_investment.toString() : '',
                    monthlyBudget: profile.monthly_budget !== null ? profile.monthly_budget.toString() : '',
                    goals: profile.investment_goals || []
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        setMessage(null);

        try {
            // Prepare payload
            const initialInv = parseFloat(investmentProfile.initialInvestment);
            const monthlyBud = parseFloat(investmentProfile.monthlyBudget);

            const updates = {
                user_id: user.id,
                phone_number: personalInfo.phone || null,
                date_of_birth: personalInfo.dob || null,
                risk_tolerance: investmentProfile.riskTolerance,
                investment_experience: investmentProfile.experience,
                initial_investment: isNaN(initialInv) ? 0 : initialInv,
                monthly_budget: isNaN(monthlyBud) ? 0 : monthlyBud,
                investment_goals: investmentProfile.goals
            };

            // Perform Upsert
            const { error } = await supabase
                .from('user_profiles')
                .upsert(updates, { onConflict: 'user_id' });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Changes saved successfully' });
        } catch (err) {
            console.error('Error saving profile:', err);
            setMessage({ type: 'error', text: 'Error saving changes' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Personal Profile</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and investment preferences.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto">
                <button
                    className={`
            px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
            ${activeTab === 'personal'
                            ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'}
          `}
                    onClick={() => setActiveTab('personal')}
                >
                    <div className="flex items-center gap-2">
                        <UserIcon size={18} />
                        Personal Details
                    </div>
                </button>
                <button
                    className={`
            px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
            ${activeTab === 'investment'
                            ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'}
          `}
                    onClick={() => setActiveTab('investment')}
                >
                    <div className="flex items-center gap-2">
                        <DollarSign size={18} />
                        Investment Profile
                    </div>
                </button>
                <button
                    className={`
            px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
            ${activeTab === 'documents'
                            ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'}
          `}
                    onClick={() => setActiveTab('documents')}
                >
                    <div className="flex items-center gap-2">
                        <FileText size={18} />
                        Documents
                    </div>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                ) : (
                    <>
                        {activeTab === 'personal' && (
                            <div className="animate-fadeIn">
                                <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Full Name"
                                        value={personalInfo.fullName}
                                        disabled
                                        className="bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
                                    />
                                    <Input
                                        label="Email"
                                        value={personalInfo.email}
                                        disabled
                                        className="bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
                                    />
                                    <Input
                                        label="Phone Number"
                                        value={personalInfo.phone}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                        placeholder="050-0000000"
                                        className="dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                    <Input
                                        label="Date of Birth"
                                        type="date"
                                        value={personalInfo.dob}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                                        className="dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'investment' && (
                            <div className="animate-fadeIn">
                                <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Investment Preferences</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Risk Tolerance</label>
                                        <select
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                                            value={investmentProfile.riskTolerance}
                                            onChange={(e) => setInvestmentProfile({ ...investmentProfile, riskTolerance: e.target.value })}
                                        >
                                            <option value="low">Low (Conservative)</option>
                                            <option value="medium">Medium (Balanced)</option>
                                            <option value="high">High (Aggressive)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Experience Level</label>
                                        <select
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                                            value={investmentProfile.experience}
                                            onChange={(e) => setInvestmentProfile({ ...investmentProfile, experience: e.target.value })}
                                        >
                                            <option value="beginner">Beginner (0-1 years)</option>
                                            <option value="intermediate">Intermediate (2-5 years)</option>
                                            <option value="advanced">Expert (+5 years)</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Initial Investment ($)"
                                        type="number"
                                        value={investmentProfile.initialInvestment}
                                        onChange={(e) => setInvestmentProfile({ ...investmentProfile, initialInvestment: e.target.value })}
                                        className="dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                    <Input
                                        label="Monthly Contribution ($)"
                                        type="number"
                                        value={investmentProfile.monthlyBudget}
                                        onChange={(e) => setInvestmentProfile({ ...investmentProfile, monthlyBudget: e.target.value })}
                                        className="dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="py-12 text-center text-slate-500 dark:text-slate-400 animate-fadeIn">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No documents available at the moment</p>
                            </div>
                        )}

                        {/* Save Button */}
                        {activeTab !== 'documents' && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-4">
                                {message && (
                                    <span className={`text-sm font-medium animate-fadeIn ${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {message.text}
                                    </span>
                                )}
                                <Button
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    leftIcon={<Save size={18} />}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
