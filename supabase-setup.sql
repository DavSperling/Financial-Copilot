-- ============================================
-- Script de configuration Supabase
-- Portfolio Copilot - Gestion d'assets
-- ============================================

-- ATTENTION: Ce script va SUPPRIMER la table assets existante
-- et toutes les données qu'elle contient !

-- 1. Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS public.assets CASCADE;

-- 2. Créer la nouvelle table assets avec user_id
CREATE TABLE public.assets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Stock', 'Crypto', 'ETF', 'Bond')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer des index pour améliorer les performances
CREATE INDEX assets_user_id_idx ON public.assets(user_id);
CREATE INDEX assets_created_at_idx ON public.assets(created_at DESC);

-- 4. Activer Row Level Security (RLS)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS

-- SELECT: Les utilisateurs peuvent voir uniquement leurs propres assets
CREATE POLICY "Users can view own assets" 
  ON public.assets 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: Les utilisateurs peuvent créer des assets pour eux-mêmes
CREATE POLICY "Users can insert own assets" 
  ON public.assets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Les utilisateurs peuvent modifier leurs propres assets
CREATE POLICY "Users can update own assets" 
  ON public.assets 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Les utilisateurs peuvent supprimer leurs propres assets
CREATE POLICY "Users can delete own assets" 
  ON public.assets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour updated_at
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ Configuration terminée avec succès !
-- ============================================

-- Vous pouvez maintenant vérifier avec:
-- SELECT * FROM public.assets;
