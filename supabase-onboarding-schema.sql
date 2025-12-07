-- ============================================
-- Onboarding System - Database Schema
-- Personal Portfolio Copilot
-- ============================================

-- 1. Create user_profiles table
-- Stores core user profile and onboarding progress
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    date_of_birth DATE,
    age INTEGER CHECK (age >= 18 AND age <= 120),
    phone_number VARCHAR(20),
    
    -- Investment Profile
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    investment_experience VARCHAR(20) CHECK (investment_experience IN ('beginner', 'intermediate', 'advanced')),
    initial_investment DECIMAL(10,2) CHECK (initial_investment >= 0),
    monthly_budget DECIMAL(10,2) CHECK (monthly_budget >= 0),
    investment_goals JSONB DEFAULT '[]'::jsonb,
    
    -- Onboarding State
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0 CHECK (onboarding_step >= 0 AND onboarding_step <= 10),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create investment_preferences table
-- Stores detailed investment preferences
CREATE TABLE IF NOT EXISTS public.investment_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sector and Geographic Preferences
    preferred_sectors JSONB DEFAULT '[]'::jsonb,
    preferred_countries JSONB DEFAULT '[]'::jsonb,
    exclude_sectors JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_onboarding_completed_idx ON public.user_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS investment_preferences_user_id_idx ON public.investment_preferences(user_id);

-- 4. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.investment_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.investment_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.investment_preferences;

-- 6. Create RLS Policies for user_profiles

-- SELECT: Users can view only their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Create RLS Policies for investment_preferences

-- SELECT: Users can view only their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.investment_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own preferences
CREATE POLICY "Users can insert own preferences"
    ON public.investment_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.investment_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for automatic updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investment_preferences_updated_at ON public.investment_preferences;
CREATE TRIGGER update_investment_preferences_updated_at
    BEFORE UPDATE ON public.investment_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to initialize profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, onboarding_completed, onboarding_step)
    VALUES (NEW.id, false, 0);
    
    INSERT INTO public.investment_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to auto-create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ✅ Onboarding Schema Created Successfully!
-- ============================================

-- Verify tables created:
-- SELECT * FROM public.user_profiles;
-- SELECT * FROM public.investment_preferences;
