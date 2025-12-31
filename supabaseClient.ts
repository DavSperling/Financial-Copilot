import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
// Nous utilisons .trim() pour éviter les erreurs d'espaces lors du copier-coller
export const SUPABASE_URL = 'https://jekzcsurovfptxayjwgn.supabase.co'.trim();
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impla3pjc3Vyb3ZmcHR4YXlqd2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTM5ODgsImV4cCI6MjA4MDQyOTk4OH0.EDDUrJTQ9L9bN7PYkz9iJ8dntlaejzgPjwnqUHUrxzY'.trim();

// Création du client avec configuration explicite pour la persistance de session
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'financial-copilot-auth',
    }
});