import React from 'react';

interface SelectableCardProps {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    selected: boolean;
    onClick: () => void;
    type?: 'radio' | 'checkbox';
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
    value,
    label,
    description,
    icon,
    selected,
    onClick,
    type = 'radio',
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
        relative w-full p-6 rounded-xl border-2 transition-all duration-200
        flex flex-col items-center text-center gap-3
        ${selected
                    ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                    : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }
      `}
        >
            {/* Selection indicator */}
            <div
                className={`
          absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${selected
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-slate-300 bg-white'
                    }
        `}
            >
                {selected && (
                    <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                )}
            </div>

            {/* Icon */}
            {icon && (
                <div
                    className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200
            ${selected
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-slate-100 text-slate-600'
                        }
          `}
                >
                    {icon}
                </div>
            )}

            {/* Label */}
            <div className="flex-1">
                <h3
                    className={`
            text-lg font-semibold transition-colors duration-200
            ${selected ? 'text-primary-900' : 'text-slate-900'}
          `}
                >
                    {label}
                </h3>

                {description && (
                    <p
                        className={`
              text-sm mt-1 transition-colors duration-200
              ${selected ? 'text-primary-700' : 'text-slate-600'}
            `}
                    >
                        {description}
                    </p>
                )}
            </div>
        </button>
    );
};
