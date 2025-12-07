import React from 'react';

interface QuestionContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export const QuestionContainer: React.FC<QuestionContainerProps> = ({
    title,
    description,
    children,
}) => {
    return (
        <div className="w-full max-w-2xl mx-auto animate-fadeIn">
            {/* Question header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display mb-3">
                    {title}
                </h2>
                {description && (
                    <p className="text-lg text-slate-600 max-w-xl mx-auto">
                        {description}
                    </p>
                )}
            </div>

            {/* Question content */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
                {children}
            </div>
        </div>
    );
};
