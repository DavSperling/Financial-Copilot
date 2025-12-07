import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="w-full mb-8">
            {/* Step counter */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-semibold text-primary-600">
                    {Math.round(progress)}% Complete
                </span>
            </div>

            {/* Progress bar track */}
            <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                {/* Progress bar fill */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-between mt-2">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                    <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${step <= currentStep
                                ? 'bg-primary-600 scale-110'
                                : 'bg-slate-300'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
