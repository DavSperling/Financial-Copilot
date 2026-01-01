import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import RecommendationsPage from './pages/Portfolio/RecommendationsPage';

import { Layout } from './components/Layout';
import { User } from './types';
import { supabase } from './supabaseClient';
import { hasCompletedOnboarding, clearOnboardingCache } from './services/onboardingService';

import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Simple router state to avoid external router dependencies in this demo
export type ViewState = 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard' | 'profile' | 'settings' | 'forgot-password' | 'reset-password' | 'recommendations' | 'calculator' | 'transactions';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Ref to track if initial auth check is complete (prevents race condition)
  const initialCheckDone = useRef(false);

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
    let isMounted = true;

    // Quick initial check
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("[Auth] Session check error:", error);
          await supabase.auth.signOut();
          initialCheckDone.current = true;
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            avatar: 'https://picsum.photos/200'
          });

          // Quick onboarding check - default to dashboard if slow
          try {
            const completed = await Promise.race([
              hasCompletedOnboarding(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 2000))
            ]);
            if (isMounted) setCurrentView(completed ? 'dashboard' : 'onboarding');
          } catch (e) {
            if (isMounted) setCurrentView('dashboard');
          }
        }
        // If no session, we stay on landing (the default)
      } catch (error) {
        console.error("[Auth] Auth initialization error:", error);
      } finally {
        if (isMounted) {
          initialCheckDone.current = true;
          setIsLoading(false);
        }
      }
    };

    // Check URL for recovery flow first
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('/reset-password') || (hash && hash.includes('type=recovery'))) {
      setCurrentView('reset-password');
    }

    // Start auth check
    initAuth();

    // Fallback: Always stop loading after 5 seconds no matter what
    const fallbackTimer = setTimeout(() => {
      if (isMounted && !initialCheckDone.current) {
        console.warn("[Auth] Fallback: stopping loading after 5s timeout");
        initialCheckDone.current = true;
        setIsLoading(false);
      }
    }, 5000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Handle password recovery event immediately
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentView('reset-password');
        return;
      }

      // CRITICAL FIX: Ignore auth state changes during initial check to prevent race condition
      // This prevents the issue where onAuthStateChange fires with null before getSession() completes
      if (!initialCheckDone.current) {
        return;
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: 'https://picsum.photos/200'
        });

        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        const type = new URLSearchParams(currentHash.replace('#', '?')).get('type');

        if (currentPath.includes('/reset-password') || type === 'recovery') {
          setCurrentView('reset-password');
        } else {
          try {
            // Add timeout to prevent blocking if Supabase is slow
            const completed = await Promise.race([
              hasCompletedOnboarding(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 2000))
            ]);
            if (isMounted) setCurrentView(completed ? 'dashboard' : 'onboarding');
          } catch (error) {
            console.error("[Auth] Error checking onboarding status:", error);
            if (isMounted) setCurrentView('dashboard');
          }
        }
      } else {
        setUser(null);
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        if (currentPath.includes('/reset-password') || (currentHash && currentHash.includes('type=recovery'))) {
          setCurrentView('reset-password');
        } else {
          setCurrentView('landing');
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (mockUser: User) => {
    setUser(mockUser);
    try {
      const completed = await hasCompletedOnboarding();
      setCurrentView(completed ? 'dashboard' : 'onboarding');
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    clearOnboardingCache(); // Clear cached onboarding status
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
            <p className="mt-4 text-slate-600">Loading...</p>
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