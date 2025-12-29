import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';

interface AddAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    stock: {
        ticker: string;
        name: string;
        current_price: number;
    } | null;
    remainingBudget: number;
    onConfirm: (quantity: number) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
    isOpen,
    onClose,
    stock,
    remainingBudget,
    onConfirm
}) => {
    const [quantity, setQuantity] = useState<string>('1');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setQuantity('1');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen || !stock) return null;

    const price = stock.current_price;
    const maxAffordable = Math.floor(remainingBudget / price);
    const cost = parseFloat(quantity) * price;
    const isAffordable = cost <= remainingBudget;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(quantity);

        if (isNaN(qty) || qty <= 0) {
            setError("Please enter a valid quantity.");
            return;
        }
        if (!isAffordable) {
            setError(`Insufficient budget. Max you can buy is ${maxAffordable}.`);
            return;
        }

        onConfirm(qty);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Add to Portfolio</h3>
                    <button onClick={onClose} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800">{stock.ticker}</span>
                            <span className="text-slate-500 text-sm">{stock.name}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center">
                            <span className="text-sm text-slate-600">Current Price</span>
                            <span className="font-bold text-slate-900">${price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Quantity to Buy
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0.0001"
                                    step="any"
                                    title="Quantity"
                                    placeholder="Amount to purchase"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className={`w-full pl-3 pr-12 py-2.5 rounded-xl border ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`}
                                />
                                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">units</span>
                            </div>
                            {/* Budget Context */}
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <span className="text-slate-500">Max affordable: {maxAffordable} units</span>
                                <span className={`${isAffordable ? 'text-green-600' : 'text-red-500'} font-medium`}>
                                    Remaining: $${(remainingBudget - cost).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-600 font-medium">Total Cost</span>
                                <span className={`text-xl font-bold ${isAffordable ? 'text-slate-900' : 'text-red-600'}`}>
                                    ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg text-center">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={!isAffordable || parseFloat(quantity) <= 0}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm"
                            >
                                Confirm Purchase
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
