import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';

import { Layout } from './components/Layout';
import { User } from './types';
import { supabase } from './supabaseClient';
import { hasCompletedOnboarding } from './services/onboardingService';

// Simple router state to avoid external router dependencies in this demo
export type ViewState = 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard' | 'profile' | 'settings';

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: 'https://picsum.photos/200'
        });

        // Check if user has completed onboarding
        const completed = await hasCompletedOnboarding();
        setCurrentView(completed ? 'dashboard' : 'onboarding');
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          avatar: 'https://picsum.photos/200'
        });

        // Check if user has completed onboarding with error handling
        try {
          const completed = await hasCompletedOnboarding();
          setCurrentView(completed ? 'dashboard' : 'onboarding');
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          // Fallback to dashboard if check fails to avoid infinite loop
          setCurrentView('dashboard');
        }
      } else {
        setUser(null);
        setCurrentView('landing');
      }
    });

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

      {currentView === 'onboarding' && (
        <OnboardingPage
          onComplete={handleOnboardingComplete}
          onNavigate={navigateTo}
        />
      )}

      {(currentView === 'dashboard' || currentView === 'profile' || currentView === 'settings') && user && (
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