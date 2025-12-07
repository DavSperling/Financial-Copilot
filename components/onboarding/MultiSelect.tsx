import React from 'react';
import { X } from 'lucide-react';

interface MultiSelectProps<T extends string> {
    options: Array<{
        value: T;
        label: string;
        icon?: React.ReactNode;
    }>;
    selected: T[];
    onChange: (selected: T[]) => void;
    minSelection?: number;
    maxSelection?: number;
}

export function MultiSelect<T extends string>({
    options,
    selected,
    onChange,
    minSelection,
    maxSelection,
}: MultiSelectProps<T>) {
    const toggleOption = (value: T) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            if (maxSelection && selected.length >= maxSelection) {
                return; // Max selection reached
            }
            onChange([...selected, value]);
        }
    };

    const isSelected = (value: T) => selected.includes(value);

    return (
        <div className="space-y-4">
            {/* Selected items as tags */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg">
                    {selected.map((value) => {
                        const option = options.find((opt) => opt.value === value);
                        return (
                            <div
                                key={value}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                            >
                                {option?.icon && <span className="w-4 h-4">{option.icon}</span>}
                                <span>{option?.label}</span>
                                <button
                                    onClick={() => toggleOption(value)}
                                    className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className={`
              flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
              ${isSelected(option.value)
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-slate-200 bg-white hover:border-primary-300'
                            }
            `}
                    >
                        {/* Checkbox */}
                        <div
                            className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                ${isSelected(option.value)
                                    ? 'border-primary-600 bg-primary-600'
                                    : 'border-slate-300 bg-white'
                                }
              `}
                        >
                            {isSelected(option.value) && (
                                <svg
                                    className="w-3 h-3 text-white"
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
                        {option.icon && (
                            <div
                                className={`
                  w-8 h-8 flex items-center justify-center transition-colors duration-200
                  ${isSelected(option.value)
                                        ? 'text-primary-600'
                                        : 'text-slate-600'
                                    }
                `}
                            >
                                {option.icon}
                            </div>
                        )}

                        {/* Label */}
                        <span
                            className={`
                text-left font-medium transition-colors duration-200
                ${isSelected(option.value)
                                    ? 'text-primary-900'
                                    : 'text-slate-900'
                                }
              `}
                        >
                            {option.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Selection hint */}
            {(minSelection || maxSelection) && (
                <p className="text-sm text-slate-500 text-center">
                    {minSelection && selected.length < minSelection && (
                        <span className="text-orange-600 font-medium">
                            Please select at least {minSelection} option{minSelection > 1 ? 's' : ''}
                        </span>
                    )}
                    {maxSelection && selected.length >= maxSelection && (
                        <span className="text-slate-600">
                            Maximum {maxSelection} selections reached
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}
