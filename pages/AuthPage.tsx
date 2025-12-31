import React, { useState } from 'react';
import { ViewState } from '../App';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  view: 'login' | 'register';
  onNavigate: (view: ViewState) => void;
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ view, onNavigate, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (view === 'register') {
        // Sign up with Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              name: name,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Supabase's onAuthStateChange in App.tsx will handle navigation automatically
          // No need to call onLogin() here as it would cause duplicate state updates
        }
      } else {
        // Sign in with Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Supabase's onAuthStateChange in App.tsx will handle navigation automatically
          // No need to call onLogin() here as it would cause duplicate state updates
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = view === 'register';

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-slate-900 opacity-90"></div>
        <img
          src="https://picsum.photos/1000/1000?grayscale"
          alt="Finance"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Trusted by 10,000+ Investors
          </div>
          <h2 className="text-4xl font-bold mb-6 font-display leading-tight">
            Start your journey to financial freedom today.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Join the community of smart investors who use Portfolio Copilot to track, analyze, and optimize their wealth.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          <button
            onClick={() => onNavigate('landing')}
            className="mb-8 flex items-center text-slate-500 hover:text-primary-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Home
          </button>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">
              {isRegister ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500">
              {isRegister
                ? 'Enter your details to get started with your free account.'
                : 'Please enter your details to access your dashboard.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon size={18} />}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                required
              />
              {!isRegister && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2"
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => onNavigate(isRegister ? 'login' : 'register')}
              className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};