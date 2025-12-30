-- ============================================
-- Transactions History Schema
-- Portfolio Copilot - Track closed positions
-- ============================================

-- 1. Create transactions table for closed positions
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Asset Information
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Stock', 'Crypto', 'ETF', 'Bond')),
    
    -- Position Details
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
    sale_price NUMERIC NOT NULL CHECK (sale_price >= 0),
    
    -- Calculated Fields
    total_cost NUMERIC GENERATED ALWAYS AS (quantity * purchase_price) STORED,
    total_revenue NUMERIC GENERATED ALWAYS AS (quantity * sale_price) STORED,
    profit_loss NUMERIC GENERATED ALWAYS AS ((quantity * sale_price) - (quantity * purchase_price)) STORED,
    profit_loss_percent NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN purchase_price > 0 THEN ((sale_price - purchase_price) / purchase_price) * 100
            ELSE 0 
        END
    ) STORED,
    
    -- Dates
    purchase_date TIMESTAMPTZ NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Original asset reference (for tracking)
    original_asset_id BIGINT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_sale_date_idx ON public.transactions(sale_date DESC);
CREATE INDEX IF NOT EXISTS transactions_symbol_idx ON public.transactions(symbol);

-- 3. Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Users can view only their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create transactions for themselves
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own transactions (if needed)
CREATE POLICY "Users can delete own transactions"
    ON public.transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- ✅ Transactions Schema Created Successfully!
-- ============================================

-- Verify with:
-- SELECT * FROM public.transactions;
