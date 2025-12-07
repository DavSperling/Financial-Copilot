import React from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../Button';

interface NavigationButtonsProps {
    onPrevious?: () => void;
    onNext: () => void;
    canGoBack: boolean;
    canGoNext: boolean;
    isLoading?: boolean;
    nextLabel?: string;
    previousLabel?: string;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
    onPrevious,
    onNext,
    canGoBack,
    canGoNext,
    isLoading = false,
    nextLabel = 'Next',
    previousLabel = 'Previous',
}) => {
    return (
        <div className="flex items-center justify-between gap-4 mt-8">
            {/* Previous button */}
            {canGoBack && onPrevious ? (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onPrevious}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    {previousLabel}
                </Button>
            ) : (
                <div /> // Spacer
            )}

            {/* Next button */}
            <Button
                type="button"
                onClick={onNext}
                disabled={!canGoNext || isLoading}
                className="flex items-center gap-2 ml-auto"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        {nextLabel}
                        <ArrowRight size={18} />
                    </>
                )}
            </Button>
        </div>
    );
};
