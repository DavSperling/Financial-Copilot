import React, { useState, useEffect } from 'react';
import { ProgressBar } from '../components/onboarding/ProgressBar';
import { QuestionContainer } from '../components/onboarding/QuestionContainer';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { SliderInput } from '../components/onboarding/SliderInput';
import { MultiSelect } from '../components/onboarding/MultiSelect';
import { NavigationButtons } from '../components/onboarding/NavigationButtons';
import { Button } from '../components/Button';
import type {
    OnboardingData,
    InvestmentExperience,
    RiskTolerance,
    InvestmentGoal,
    Sector,
    Country,
} from '../types/onboarding';
import {
    getOnboardingStatus,
    saveOnboardingProgress,
    completeOnboarding,
} from '../services/onboardingService';
import type { ViewState } from '../App';

interface OnboardingPageProps {
    onComplete: () => void;
    onNavigate: (view: ViewState) => void;
}

const TOTAL_STEPS = 9;

export function OnboardingPage({ onComplete, onNavigate }: OnboardingPageProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState<OnboardingData>({});

    // Load existing progress on mount
    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        try {
            setIsLoading(true);
            const status = await getOnboardingStatus();

            if (status.completed) {
                // User already completed onboarding, redirect to dashboard
                onComplete();
                return;
            }

            if (status.profile || status.preferences) {
                // Restore saved data
                const restoredData: OnboardingData = {};

                if (status.profile) {
                    if (status.profile.age) restoredData.age = status.profile.age;
                    if (status.profile.investment_experience)
                        restoredData.experience = status.profile.investment_experience;
                    if (status.profile.risk_tolerance)
                        restoredData.riskTolerance = status.profile.risk_tolerance;
                    if (status.profile.risk_tolerance)
                        restoredData.riskTolerance = status.profile.risk_tolerance;
                    if (status.profile.initial_investment)
                        restoredData.initialInvestment = status.profile.initial_investment;
                    if (status.profile.monthly_budget)
                        restoredData.monthlyBudget = status.profile.monthly_budget;
                    if (status.profile.investment_goals)
                        restoredData.investmentGoals = status.profile.investment_goals as InvestmentGoal[];
                }

                if (status.preferences) {
                    if (status.preferences.preferred_sectors)
                        restoredData.sectors = status.preferences.preferred_sectors as Sector[];
                    if (status.preferences.preferred_countries)
                        restoredData.countries = status.preferences.preferred_countries as Country[];
                }

                setData(restoredData);
                // Resume from next step after last saved
                setCurrentStep(Math.min(status.currentStep + 1, TOTAL_STEPS));
            }
        } catch (error) {
            console.error('Failed to load onboarding progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveProgress = async (step: number, stepData: OnboardingData) => {
        try {
            setIsSaving(true);
            await saveOnboardingProgress(step, stepData);
        } catch (error) {
            console.error('Failed to save progress:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        // Save current step data
        await saveProgress(currentStep, data);

        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
        } else {
            // Complete onboarding
            try {
                setIsSaving(true);
                await completeOnboarding();
                onComplete();
            } catch (error: any) {
                console.error('Failed to complete onboarding:', error);
                alert(`Error: ${error.message || JSON.stringify(error) || 'An unknown error occurred'}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const updateData = (updates: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 1:
                return data.age !== undefined && data.age >= 18;
            case 2:
                return data.experience !== undefined;
            case 3:
                return data.riskTolerance !== undefined;
            case 4:
                return data.initialInvestment !== undefined && data.initialInvestment > 0;
            case 5:
                return data.monthlyBudget !== undefined && data.monthlyBudget > 0;
            case 6:
                return data.investmentGoals !== undefined && data.investmentGoals.length > 0;
            case 7:
                return data.sectors !== undefined && data.sectors.length > 0;
            case 8:
                return data.countries !== undefined && data.countries.length > 0;
            case 9:
                return true; // Summary step is always valid
            default:
                return false;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Welcome! 👋
                    </h1>
                    <p className="text-lg text-slate-600">
                        A few questions to personalize your experience
                    </p>
                </div>

                {/* Progress Bar */}
                <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                {/* Question Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 min-h-[400px]">
                    {/* Step 1: Age */}
                    {currentStep === 1 && (
                        <QuestionContainer
                            title="What is your age?"
                            description="You must be at least 18 years old to invest"
                        >
                            <div className="max-w-md mx-auto">
                                <input
                                    type="number"
                                    min="18"
                                    max="120"
                                    value={data.age || ''}
                                    onChange={(e) => updateData({ age: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 text-center text-2xl font-semibold"
                                    placeholder="25"
                                />
                                {data.age !== undefined && data.age < 18 && (
                                    <p className="mt-2 text-red-600 text-sm text-center">
                                        You must be at least 18 years old
                                    </p>
                                )}
                            </div>
                        </QuestionContainer>
                    )}

                    {/* Step 2: Experience */}
                    {currentStep === 2 && (
                        <QuestionContainer
                            title="What is your investment experience?"
                            description="Be honest, this helps us advise you better"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SelectableCard
                                    title="Beginner"
                                    description="I am new to investing"
                                    icon="🌱"
                                    selected={data.experience === 'beginner'}
                                    onClick={() => updateData({ experience: 'beginner' as InvestmentExperience })}
                                />
                                <SelectableCard
                                    title="Intermediate"
                                    description="I have some knowledge"
                                    icon="📈"
                                    selected={data.experience === 'intermediate'}
                                    onClick={() => updateData({ experience: 'intermediate' as InvestmentExperience })}
                                />
                                <SelectableCard
                                    title="Advanced"
                                    description="I am experienced"
                                    icon="🎯"
                                    selected={data.experience === 'advanced'}
                                    onClick={() => updateData({ experience: 'advanced' as InvestmentExperience })}
                                />
                            </div>
                        </QuestionContainer>
                    )}

                    {/* Step 3: Risk Tolerance */}
                    {currentStep === 3 && (
                        <QuestionContainer
                            title="What is your risk tolerance?"
                            description="Are you willing to take risks for potentially higher returns?"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SelectableCard
                                    title="Low"
                                    description="I prefer safety"
                                    icon="🛡️"
                                    selected={data.riskTolerance === 'low'}
                                    onClick={() => updateData({ riskTolerance: 'low' as RiskTolerance })}
                                />
                                <SelectableCard
                                    title="Medium"
                                    description="Balanced risk/reward"
                                    icon="⚖️"
                                    selected={data.riskTolerance === 'medium'}
                                    onClick={() => updateData({ riskTolerance: 'medium' as RiskTolerance })}
                                />
                                <SelectableCard
                                    title="High"
                                    description="I am willing to take risks"
                                    icon="🚀"
                                    selected={data.riskTolerance === 'high'}
                                    onClick={() => updateData({ riskTolerance: 'high' as RiskTolerance })}
                                />
                            </div>
                        </QuestionContainer>
                    )}

                    {/* Step 4: Initial Investment */}
                    {currentStep === 4 && (
                        <QuestionContainer
                            title="What is the initial amount you can invest?"
                            description="Amount you can invest right now"
                        >
                            <SliderInput
                                value={data.initialInvestment || 10000}
                                onChange={(value) => updateData({ initialInvestment: value })}
                                min={1000}
                                max={1000000}
                                step={1000}
                                formatValue={(val) => `$${val.toLocaleString()}`}
                            />
                        </QuestionContainer>
                    )}

                    {/* Step 5: Monthly Budget */}
                    {currentStep === 5 && (
                        <QuestionContainer
                            title="What is your monthly budget for investing?"
                            description="Amount you can invest each month"
                        >
                            <SliderInput
                                value={data.monthlyBudget || 500}
                                onChange={(value) => updateData({ monthlyBudget: value })}
                                min={100}
                                max={10000}
                                step={100}
                                formatValue={(val) => `$${val.toLocaleString()}`}
                            />
                        </QuestionContainer>
                    )}

                    {/* Step 6: Investment Goals */}
                    {currentStep === 6 && (
                        <QuestionContainer
                            title="What are your investment goals?"
                            description="Select all that apply"
                        >
                            <MultiSelect
                                options={[
                                    { value: 'retirement', label: 'Retirement', icon: '🏖️' },
                                    { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
                                    { value: 'savings', label: 'Savings', icon: '💰' },
                                    { value: 'passive_income', label: 'Passive Income', icon: '💸' },
                                    { value: 'education', label: 'Education', icon: '🎓' },
                                ]}
                                selected={data.investmentGoals || []}
                                onChange={(goals) => updateData({ investmentGoals: goals as InvestmentGoal[] })}
                            />
                        </QuestionContainer>
                    )}

                    {/* Step 7: Sectors */}
                    {currentStep === 7 && (
                        <QuestionContainer
                            title="Which sectors do you want to invest in?"
                            description="Select your preferred sectors"
                        >
                            <MultiSelect
                                options={[
                                    { value: 'technology', label: 'Technology', icon: '💻' },
                                    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
                                    { value: 'finance', label: 'Finance', icon: '🏦' },
                                    { value: 'renewable_energy', label: 'Renewable Energy', icon: '🌱' },
                                    { value: 'real_estate', label: 'Real Estate', icon: '🏢' },
                                ]}
                                selected={data.sectors || []}
                                onChange={(sectors) => updateData({ sectors: sectors as Sector[] })}
                            />
                        </QuestionContainer>
                    )}

                    {/* Step 8: Geographic Preferences */}
                    {currentStep === 8 && (
                        <QuestionContainer
                            title="Which regions do you want to invest in?"
                            description="Select your preferred markets"
                        >
                            <MultiSelect
                                options={[
                                    { value: 'israel', label: 'Israel', icon: '🇮🇱' },
                                    { value: 'usa', label: 'USA', icon: '🇺🇸' },
                                    { value: 'europe', label: 'Europe', icon: '🇪🇺' },
                                    { value: 'asia', label: 'Asia', icon: '🌏' },
                                ]}
                                selected={data.countries || []}
                                onChange={(countries) => updateData({ countries: countries as Country[] })}
                            />
                        </QuestionContainer>
                    )}

                    {/* Step 9: Summary */}
                    {currentStep === 9 && (
                        <QuestionContainer
                            title="Profile Summary"
                            description="Verify your information before continuing"
                        >
                            <div className="space-y-4 max-w-2xl mx-auto">
                                <SummaryItem label="Age" value={`${data.age} years`} />
                                <SummaryItem
                                    label="Experience"
                                    value={
                                        data.experience === 'beginner'
                                            ? 'Beginner'
                                            : data.experience === 'intermediate'
                                                ? 'Intermediate'
                                                : 'Advanced'
                                    }
                                />
                                <SummaryItem
                                    label="Risk Tolerance"
                                    value={
                                        data.riskTolerance === 'low'
                                            ? 'Low'
                                            : data.riskTolerance === 'medium'
                                                ? 'Medium'
                                                : 'High'
                                    }
                                />
                                <SummaryItem
                                    label="Initial Investment"
                                    value={`$${data.initialInvestment?.toLocaleString()}`}
                                />
                                <SummaryItem
                                    label="Monthly Budget"
                                    value={`$${data.monthlyBudget?.toLocaleString()}`}
                                />
                                <SummaryItem
                                    label="Goals"
                                    value={data.investmentGoals?.join(', ') || 'Not specified'}
                                />
                                <SummaryItem
                                    label="Preferred Sectors"
                                    value={data.sectors?.join(', ') || 'Not specified'}
                                />
                                <SummaryItem
                                    label="Regions"
                                    value={data.countries?.join(', ') || 'Not specified'}
                                />
                            </div>
                        </QuestionContainer>
                    )}
                </div>

                {/* Navigation */}
                <NavigationButtons
                    onPrevious={handleBack}
                    onNext={handleNext}
                    canGoBack={currentStep > 1}
                    canGoNext={isStepValid() && !isSaving}
                    nextLabel={currentStep === TOTAL_STEPS ? 'Finish' : 'Next'}
                    isLoading={isSaving}
                />
            </div>
        </div>

    );
}

// Helper component for summary items
function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-lg">
            <span className="font-medium text-slate-700">{label}:</span>
            <span className="text-slate-900">{value}</span>
        </div>
    );
}
