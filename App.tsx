import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import RecommendationsPage from './pages/Portfolio/RecommendationsPage';

import { Layout } from './components/Layout';
import { User } from './types';
import { supabase } from './supabaseClient';
import { hasCompletedOnboarding } from './services/onboardingService';

import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Simple router state to avoid external router dependencies in this demo
export type ViewState = 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard' | 'profile' | 'settings' | 'forgot-password' | 'reset-password' | 'recommendations' | 'calculator' | 'transactions';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            avatar: 'https://picsum.photos/200'
          });

          // Check if user has completed onboarding with timeout
          try {
            const completed = await Promise.race([
              hasCompletedOnboarding(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 3000))
            ]);
            setCurrentView(completed ? 'dashboard' : 'onboarding');
          } catch (onboardingError) {
            console.error("Onboarding check failed:", onboardingError);
            setCurrentView('dashboard');
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // On error, go to landing page
        setCurrentView('landing');
      } finally {
        // ALWAYS stop loading
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentView('reset-password');
        return; // EXIT EARLY to prevent session check from overwriting view
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: 'https://picsum.photos/200'
        });

        // Check pathname for reset password
        const path = window.location.pathname;
        const hash = window.location.hash;
        const type = new URLSearchParams(hash.replace('#', '?')).get('type');

        if (path.includes('/reset-password') || type === 'recovery') {
          setCurrentView('reset-password');
        } else {
          // Normal login flow
          try {
            const completed = await hasCompletedOnboarding();
            setCurrentView(completed ? 'dashboard' : 'onboarding');
          } catch (error) {
            console.error("Error checking onboarding status:", error);
            setCurrentView('dashboard');
          }
        }
      } else {
        setUser(null);
        // Check for public routes before forcing landing
        const path = window.location.pathname;
        const hash = window.location.hash;
        if (path.includes('/reset-password') || (hash && hash.includes('type=recovery'))) {
          setCurrentView('reset-password');
        } else {
          setCurrentView('landing');
        }
      }
    });

    // Check URL on initial load for recovery flow
    // IMPORTANT: Check pathname first as our backend redirects to /reset-password
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('/reset-password') || (hash && hash.includes('type=recovery'))) {
      setCurrentView('reset-password');
      // We do NOT want to stop loading here, we want the auth listener to fire too
      // or we just set view and wait.
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (mockUser: User) => {
    setUser(mockUser);
    // Check if user has completed onboarding with error handling
    try {
      const completed = await hasCompletedOnboarding();
      setCurrentView(completed ? 'dashboard' : 'onboarding');
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('landing');
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleOnboardingComplete = () => {
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {currentView === 'landing' && (
        <LandingPage onNavigate={navigateTo} />
      )}

      {(currentView === 'login' || currentView === 'register') && (
        <AuthPage
          view={currentView}
          onNavigate={navigateTo}
          onLogin={handleLogin}
        />
      )}

      {currentView === 'forgot-password' && (
        <ForgotPasswordPage onNavigate={navigateTo} />
      )}

      {currentView === 'reset-password' && (
        <ResetPasswordPage
          token={
            new URLSearchParams(window.location.hash.replace('#', '?')).get('access_token') ||
            new URLSearchParams(window.location.search).get('access_token') ||
            ''
          }
          onNavigate={navigateTo}
        />
      )}

      {currentView === 'onboarding' && (
        <OnboardingPage
          onComplete={handleOnboardingComplete}
          onNavigate={navigateTo}
        />
      )}

      {(currentView === 'dashboard' || currentView === 'profile' || currentView === 'settings' || currentView === 'recommendations' || currentView === 'calculator' || currentView === 'transactions') && user && (
        <DashboardPage
          user={user}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          currentView={currentView}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      )}
    </Layout>
  );
}