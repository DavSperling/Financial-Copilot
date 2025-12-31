import { supabase } from '../supabaseClient';
import type {
    UserProfile,
    InvestmentPreferences,
    OnboardingData,
    OnboardingStatus,
} from '../types/onboarding';

// Cache for onboarding status to avoid repeated checks
let onboardingCache: { userId: string; completed: boolean; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get the current onboarding status for the authenticated user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
    }

    // Fetch preferences
    const { data: preferences, error: preferencesError } = await supabase
        .from('investment_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
    }

    return {
        completed: profile?.onboarding_completed ?? false,
        currentStep: profile?.onboarding_step ?? 0,
        profile: profile as UserProfile | null,
        preferences: preferences as InvestmentPreferences | null,
    };
}

/**
 * Save onboarding progress for a specific step
 */
export async function saveOnboardingProgress(
    step: number,
    data: OnboardingData
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    // Prepare profile data
    const profileData: Partial<UserProfile> = {
        user_id: user.id,
        onboarding_step: step,
    };

    // Map onboarding data to profile fields
    if (data.age !== undefined) profileData.age = data.age;
    if (data.experience !== undefined) profileData.investment_experience = data.experience;
    if (data.riskTolerance !== undefined) profileData.risk_tolerance = data.riskTolerance;
    if (data.initialInvestment !== undefined) profileData.initial_investment = data.initialInvestment;
    if (data.monthlyBudget !== undefined) profileData.monthly_budget = data.monthlyBudget;
    if (data.investmentGoals !== undefined) profileData.investment_goals = data.investmentGoals as any;

    // Upsert profile
    const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    // Invalidate cache after saving
    onboardingCache = null;

    // Prepare preferences data (if applicable)
    if (data.sectors || data.countries !== undefined) {
        const preferencesData: Partial<InvestmentPreferences> = {
            user_id: user.id,
        };

        if (data.sectors !== undefined) preferencesData.preferred_sectors = data.sectors as any;
        if (data.countries !== undefined) preferencesData.preferred_countries = data.countries as any;

        const { error: preferencesError } = await supabase
            .from('investment_preferences')
            .upsert(preferencesData, { onConflict: 'user_id' });

        if (preferencesError) throw preferencesError;
    }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('user_profiles')
        .update({
            onboarding_completed: true,
            onboarding_step: 10,
        })
        .eq('user_id', user.id);

    if (error) throw error;

    // Update cache
    onboardingCache = { userId: user.id, completed: true, timestamp: Date.now() };
}

/**
 * Check if user has completed onboarding - OPTIMIZED
 * Uses caching to avoid repeated slow checks
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
    try {
        // Get current user from session (faster than getUser())
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return false;
        }

        const userId = session.user.id;

        // Check cache first
        if (onboardingCache &&
            onboardingCache.userId === userId &&
            Date.now() - onboardingCache.timestamp < CACHE_TTL) {
            return onboardingCache.completed;
        }

        // Single query - no retries (faster for normal cases)
        const { data, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', userId)
            .single();

        // If we got data, cache and return
        if (data) {
            const completed = data.onboarding_completed ?? false;
            onboardingCache = { userId, completed, timestamp: Date.now() };
            return completed;
        }

        // If error is "no rows found", user hasn't started onboarding
        if (error && error.code === 'PGRST116') {
            onboardingCache = { userId, completed: false, timestamp: Date.now() };
            return false;
        }

        // Other errors - log and return false (don't block the UI)
        if (error) {
            console.error('Error checking onboarding status:', error);
            return false;
        }

        return false;
    } catch (error) {
        console.error('Unexpected error in hasCompletedOnboarding:', error);
        return false; // Don't block UI on errors
    }
}

/**
 * Clear the onboarding cache (useful on logout)
 */
export function clearOnboardingCache(): void {
    onboardingCache = null;
}
