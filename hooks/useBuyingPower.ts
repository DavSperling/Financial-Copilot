import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface BuyingPowerData {
    buyingPower: number;
    totalCashInjected: number;
    totalCostBasis: number;
    loading: boolean;
    error: string | null;
}

export const useBuyingPower = (userId: string | undefined): BuyingPowerData => {
    const [buyingPower, setBuyingPower] = useState<number>(0);
    const [totalCashInjected, setTotalCashInjected] = useState<number>(0);
    const [totalCostBasis, setTotalCostBasis] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Profile for Cash Injected Calculation
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('initial_investment, monthly_budget, created_at')
                    .eq('user_id', userId)
                    .single();

                if (profileError) throw profileError;

                let calculatedCash = 0;
                if (profile) {
                    const initial = profile.initial_investment || 0;
                    const monthly = profile.monthly_budget || 0;
                    const createdAt = new Date(profile.created_at);
                    const now = new Date();

                    let monthsPassed = 0;
                    let currentCheck = new Date(createdAt);

                    // Logic matching DashboardPage.tsx
                    if (currentCheck.getDate() > 1) {
                        currentCheck.setMonth(currentCheck.getMonth() + 1);
                        currentCheck.setDate(1);
                    } else {
                        currentCheck.setMonth(currentCheck.getMonth() + 1);
                        currentCheck.setDate(1);
                    }
                    currentCheck.setHours(0, 0, 0, 0);

                    while (currentCheck <= now) {
                        monthsPassed++;
                        currentCheck.setMonth(currentCheck.getMonth() + 1);
                    }

                    calculatedCash = initial + (monthly * monthsPassed);
                }
                setTotalCashInjected(calculatedCash);

                // 2. Fetch Assets for Cost Basis
                const { data: assets, error: assetsError } = await supabase
                    .from('assets')
                    .select('amount, price')
                    .eq('user_id', userId);

                if (assetsError) throw assetsError;

                const calculatedCostBasis = assets?.reduce((sum, item) => {
                    const amount = parseFloat(item.amount) || 0;
                    const price = parseFloat(item.price) || 0;
                    return sum + (amount * price);
                }, 0) || 0;

                setTotalCostBasis(calculatedCostBasis);

                // 3. Fetch Realized Gains (closed positions)
                const { data: transactions, error: txError } = await supabase
                    .from('transactions')
                    .select('profit_loss')
                    .eq('user_id', userId);

                if (txError) throw txError;

                const realizedGains = transactions?.reduce((sum, tx) => sum + (tx.profit_loss || 0), 0) || 0;

                // 4. Final Calculation
                // Buying Power = Cash Injected - Cost of Open Assets + Realized Gains
                setBuyingPower(Math.max(0, calculatedCash - calculatedCostBasis + realizedGains));

            } catch (err: any) {
                console.error("Error calculating buying power:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    return {
        buyingPower,
        totalCashInjected,
        totalCostBasis,
        loading,
        error
    };
};
