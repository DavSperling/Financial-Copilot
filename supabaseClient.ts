import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
// Nous utilisons .trim() pour éviter les erreurs d'espaces lors du copier-coller
export const SUPABASE_URL = 'https://jekzcsurovfptxayjwgn.supabase.co'.trim();
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impla3pjc3Vyb3ZmcHR4YXlqd2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTM5ODgsImV4cCI6MjA4MDQyOTk4OH0.EDDUrJTQ9L9bN7PYkz9iJ8dntlaejzgPjwnqUHUrxzY'.trim();

// Création du client
// Note: createClient est généralement synchrone, mais s'il échoue, cela peut bloquer l'app.
// Les clés ci-dessus semblent valides pour le projet jekzcsurovfptxayjwgn.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);