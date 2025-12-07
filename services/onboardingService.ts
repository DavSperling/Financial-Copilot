import { supabase } from '../supabaseClient';
import type {
    UserProfile,
    InvestmentPreferences,
    OnboardingData,
    OnboardingStatus,
} from '../types/onboarding';

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
    if (data.monthlyBudget !== undefined) profileData.monthly_budget = data.monthlyBudget;
    if (data.investmentGoals !== undefined) profileData.investment_goals = data.investmentGoals as any;

    // Upsert profile
    const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    // Prepare preferences data (if applicable)
    if (data.sectors || data.countries !== undefined || data.esgPreference !== undefined) {
        const preferencesData: Partial<InvestmentPreferences> = {
            user_id: user.id,
        };

        if (data.sectors !== undefined) preferencesData.preferred_sectors = data.sectors as any;
        if (data.countries !== undefined) preferencesData.preferred_countries = data.countries as any;
        if (data.esgPreference !== undefined) preferencesData.esg_preference = data.esgPreference;

        // Upsert preferences
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
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Retry logic to handle race condition with profile creation trigger
    let retries = 3;
    let delay = 200; // Start with 200ms delay

    while (retries > 0) {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single();

        // If we got data, return the onboarding status
        if (data) {
            return data.onboarding_completed ?? false;
        }

        // If error is not "no rows found", something went wrong
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking onboarding status:', error);
            return false;
        }

        // Profile doesn't exist yet, wait and retry
        retries--;
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }

    // After all retries, assume not completed
    return false;
}

