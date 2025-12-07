import React, { useState } from 'react';

interface SliderInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    suffix?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    suffix = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="w-full">
            {/* Label and value display */}
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-600">{value}</span>
                    {suffix && <span className="text-sm text-slate-600">{suffix}</span>}
                </div>
            </div>

            {/* Slider track */}
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="slider-input w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                    style={{
                        background: `linear-gradient(to right, 
              #3b82f6 0%, 
              #3b82f6 ${percentage}%, 
              #e2e8f0 ${percentage}%, 
              #e2e8f0 100%)`
                    }}
                />

                {/* Value indicator */}
                <div
                    className={`
            absolute -top-12 left-0 bg-primary-600 text-white text-sm font-semibold px-3 py-1 rounded-lg
            transition-all duration-200 ${isDragging ? 'scale-110' : 'scale-100'}
          `}
                    style={{
                        left: `calc(${percentage}% - 20px)`,
                        opacity: isDragging ? 1 : 0,
                    }}
                >
                    {value}{suffix}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary-600" />
                </div>
            </div>

            {/* Min/Max labels */}
            <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{min}{suffix}</span>
                <span>{max}{suffix}</span>
            </div>
        </div>
    );
};
