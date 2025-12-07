// Onboarding Types
// Type definitions for the onboarding system

export type RiskTolerance = 'low' | 'medium' | 'high';

export type InvestmentExperience = 'beginner' | 'intermediate' | 'advanced';

export type InvestmentGoal =
    | 'retirement'
    | 'real_estate'
    | 'savings'
    | 'passive_income'
    | 'education';

export type Sector =
    | 'technology'
    | 'healthcare'
    | 'finance'
    | 'renewable_energy'
    | 'real_estate';

export type Country = 'israel' | 'usa' | 'europe' | 'asia';

export interface UserProfile {
    id: string;
    user_id: string;
    date_of_birth?: string;
    age?: number;
    phone_number?: string;
    risk_tolerance?: RiskTolerance;
    investment_experience?: InvestmentExperience;
    initial_investment?: number;
    monthly_budget?: number;
    investment_goals: InvestmentGoal[];
    onboarding_completed: boolean;
    onboarding_step: number;
    created_at: string;
    updated_at: string;
}

export interface InvestmentPreferences {
    id: string;
    user_id: string;
    preferred_sectors: Sector[];
    preferred_countries: Country[];
    exclude_sectors: Sector[];
    created_at: string;
    updated_at: string;
}

// Onboarding step data interfaces
export interface OnboardingData {
    age?: number;
    experience?: InvestmentExperience;
    riskTolerance?: RiskTolerance;
    initialInvestment?: number;
    monthlyBudget?: number;
    investmentGoals?: InvestmentGoal[];
    sectors?: Sector[];
    countries?: Country[];
}

export interface OnboardingStatus {
    completed: boolean;
    currentStep: number;
    profile: UserProfile | null;
    preferences: InvestmentPreferences | null;
}

// Step configuration
export interface OnboardingStep {
    step: number;
    title: string;
    description?: string;
    isValid: (data: OnboardingData) => boolean;
}
