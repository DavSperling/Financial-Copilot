import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import {
    User as UserIcon,
    TrendingUp,
    Globe,
    Save,
    Loader2,
    Shield,
    Target,
    Briefcase,
    Ban,
    ChevronDown,
    X,
    Check
} from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface ProfileProps {
    user: User | null;
}

type TabType = 'personal' | 'strategy' | 'preferences';

// --- Options Constants ---
const INVESTMENT_GOALS = [
    'Retirement', 'Wealth Generation', 'Home Purchase', 'Education', 'Travel', 'Emergency Fund'
];

const SECTORS = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods', 'Real Estate', 'Utilities', 'Industrial'
];

const COUNTRIES = [
    'USA', 'Europe', 'Emerging Markets', 'China', 'Japan', 'UK', 'Global'
];

// --- Simple MultiSelect Component ---
interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    icon?: React.ReactNode;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                {icon}
                {label}
            </label>
            <div
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white cursor-pointer min-h-[46px] flex flex-wrap gap-2 items-center hover:border-primary-400 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected.length === 0 ? (
                    <span className="text-slate-400">Select options...</span>
                ) : (
                    selected.map(item => (
                        <span key={item} className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                            {item}
                            <X
                                size={12}
                                className="cursor-pointer hover:text-primary-900 dark:hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(item);
                                }}
                            />
                        </span>
                    ))
                )}
                <div className="ml-auto">
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {options.map(option => (
                            <div
                                key={option}
                                className={`
                                    px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm transition-colors
                                    ${selected.includes(option)
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                `}
                                onClick={() => toggleOption(option)}
                            >
                                {option}
                                {selected.includes(option) && <Check size={16} />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // --- Form States ---
    const [formData, setFormData] = useState({
        // Personal
        phone: '',
        dob: '',
        // Strategy
        riskTolerance: 'medium',
        experience: 'beginner',
        initialInvestment: '',
        monthlyBudget: '',
        goals: [] as string[],
        // Preferences
        sectors: [] as string[],
        countries: [] as string[],
        excludedSectors: [] as string[]
    });

    // --- Fetch Data ---
    useEffect(() => {
        if (user?.id) fetchProfileData();
    }, [user]);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch User Profile
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            // 2. Fetch Investment Preferences
            const { data: prefs, error: prefsError } = await supabase
                .from('investment_preferences')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (prefsError && prefsError.code !== 'PGRST116') throw prefsError;

            // 3. Merge Data
            setFormData({
                phone: profile?.phone_number || '',
                dob: profile?.date_of_birth || '',
                riskTolerance: profile?.risk_tolerance || 'medium',
                experience: profile?.investment_experience || 'beginner',
                initialInvestment: profile?.initial_investment?.toString() || '',
                monthlyBudget: profile?.monthly_budget?.toString() || '',
                goals: profile?.investment_goals || [],

                sectors: prefs?.preferred_sectors || [],
                countries: prefs?.preferred_countries || [],
                excludedSectors: prefs?.exclude_sectors || []
            });

        } catch (err) {
            console.error('Error fetching profile:', err);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Save Data ---
    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const initialInv = parseFloat(formData.initialInvestment);
            const monthlyBud = parseFloat(formData.monthlyBudget);

            // 1. Update user_profiles
            const profileUpdates = {
                user_id: user.id,
                phone_number: formData.phone || null,
                date_of_birth: formData.dob || null,
                risk_tolerance: formData.riskTolerance,
                investment_experience: formData.experience,
                initial_investment: isNaN(initialInv) ? 0 : initialInv,
                monthly_budget: isNaN(monthlyBud) ? 0 : monthlyBud,
                investment_goals: formData.goals
            };

            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert(profileUpdates, { onConflict: 'user_id' });

            if (profileError) throw profileError;

            // 2. Update investment_preferences
            const prefsUpdates = {
                user_id: user.id,
                preferred_sectors: formData.sectors,
                preferred_countries: formData.countries,
                exclude_sectors: formData.excludedSectors
            };

            const { error: prefsError } = await supabase
                .from('investment_preferences')
                .upsert(prefsUpdates, { onConflict: 'user_id' });

            if (prefsError) throw prefsError;

            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            console.error('Error saving profile:', err);
            setMessage({ type: 'error', text: 'Error saving changes' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const TabButton = ({ id, label, icon }: { id: TabType, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex justify-center items-center gap-2
                ${activeTab === id
                    ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400 bg-primary-50/10'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'}
            `}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn pb-24">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    Your Profile
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    Customize your personal details and investment strategy.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabButton id="personal" label="Personal" icon={<UserIcon size={18} />} />
                    <TabButton id="strategy" label="Strategy" icon={<TrendingUp size={18} />} />
                    <TabButton id="preferences" label="Preferences" icon={<Globe size={18} />} />
                </div>

                {/* Content Area */}
                <div className="p-6 sm:p-10 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Loader2 className="animate-spin mb-4 text-primary-500" size={40} />
                            <p>Loading profile...</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto">
                            {/* --- Personal Tab --- */}
                            {activeTab === 'personal' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Phone Number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 234 567 890"
                                            className="dark:bg-slate-900"
                                        />
                                        <Input
                                            label="Date of Birth"
                                            type="date"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            className="dark:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- Strategy Tab --- */}
                            {activeTab === 'strategy' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                                <Shield size={16} className="text-primary-500" /> Risk Tolerance
                                            </label>
                                            <select
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                value={formData.riskTolerance}
                                                onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                                            >
                                                <option value="low">Low (Conservative)</option>
                                                <option value="medium">Medium (Balanced)</option>
                                                <option value="high">High (Aggressive)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                                <Briefcase size={16} className="text-primary-500" /> Experience
                                            </label>
                                            <select
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                value={formData.experience}
                                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                            >
                                                <option value="beginner">Beginner (0-2 years)</option>
                                                <option value="intermediate">Intermediate (2-5 years)</option>
                                                <option value="advanced">Expert (5+ years)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Initial Investment ($)"
                                            type="number"
                                            value={formData.initialInvestment}
                                            onChange={(e) => setFormData({ ...formData, initialInvestment: e.target.value })}
                                            className="dark:bg-slate-900"
                                            placeholder="10000"
                                        />
                                        <Input
                                            label="Monthly Contribution ($)"
                                            type="number"
                                            value={formData.monthlyBudget}
                                            onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                                            className="dark:bg-slate-900"
                                            placeholder="500"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <MultiSelect
                                            label="Investment Goals"
                                            icon={<Target size={16} className="text-primary-500" />}
                                            options={INVESTMENT_GOALS}
                                            selected={formData.goals}
                                            onChange={(newGoals) => setFormData({ ...formData, goals: newGoals })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- Preferences Tab --- */}
                            {activeTab === 'preferences' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <MultiSelect
                                        label="Preferred Sectors"
                                        icon={<TrendingUp size={16} className="text-emerald-500" />}
                                        options={SECTORS}
                                        selected={formData.sectors}
                                        onChange={(val) => setFormData({ ...formData, sectors: val })}
                                    />

                                    <MultiSelect
                                        label="Preferred Countries/Regions"
                                        icon={<Globe size={16} className="text-blue-500" />}
                                        options={COUNTRIES}
                                        selected={formData.countries}
                                        onChange={(val) => setFormData({ ...formData, countries: val })}
                                    />

                                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                                        <MultiSelect
                                            label="Excluded Sectors (Restrictions)"
                                            icon={<Ban size={16} className="text-red-500" />}
                                            options={SECTORS}
                                            selected={formData.excludedSectors}
                                            onChange={(val) => setFormData({ ...formData, excludedSectors: val })}
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
                                            We will avoid recommending assets in these sectors.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Save Bar */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-sm">
                        {message && (
                            <span className={`inline-flex items-center gap-2 font-medium animate-fadeIn ${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                                {message.text}
                            </span>
                        )}
                    </div>
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        leftIcon={<Save size={18} />}
                        className="btn-primary shadow-lg shadow-primary-500/20"
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};
