import React from 'react';
import { ViewState } from '../App';
import { Button } from '../components/Button';
import { TrendingUp, Shield, Smartphone, ArrowRight, PieChart, Activity } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: ViewState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <TrendingUp size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900 font-display">Portfolio Copilot</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-primary-600 font-medium text-sm transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-primary-600 font-medium text-sm transition-colors">Pricing</a>
              <a href="#about" className="text-slate-600 hover:text-primary-600 font-medium text-sm transition-colors">About</a>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('login')}
                className="text-slate-600 hover:text-primary-600 font-medium text-sm hidden sm:block"
              >
                Log In
              </button>
              <Button onClick={() => onNavigate('register')} size="sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-8 border border-primary-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              AI-Powered Investment Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6 font-display">
              Master Your Financial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Future with Confidence
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
              The smart portfolio tracker designed for modern investors. 
              Get real-time analytics, personalized insights, and simplified wealth management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button onClick={() => onNavigate('register')} size="lg" className="shadow-xl shadow-primary-500/20">
                Start Investing Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={() => {}} variant="outline" size="lg">
                View Live Demo
              </Button>
            </div>

            {/* Dashboard Preview Image Placeholder */}
            <div className="mt-20 relative mx-auto max-w-5xl">
              <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl p-2 shadow-2xl">
                 <div className="rounded-xl overflow-hidden bg-slate-50 aspect-[16/9] relative flex items-center justify-center group">
                    <img 
                      src="https://picsum.photos/1200/675?grayscale" 
                      alt="Dashboard Preview" 
                      className="object-cover w-full h-full opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">Why Choose Copilot?</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                We combine professional-grade tools with beginner-friendly design to help you make smarter decisions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<PieChart className="w-6 h-6 text-primary-600" />}
                title="Smart Diversification"
                description="Visualize your asset allocation instantly. We help you balance your portfolio across stocks, crypto, and bonds."
              />
              <FeatureCard 
                icon={<Activity className="w-6 h-6 text-secondary-600" />}
                title="Real-time Tracking"
                description="Connect your accounts and track performance in real-time. Never miss a market movement that matters."
              />
              <FeatureCard 
                icon={<Shield className="w-6 h-6 text-emerald-600" />}
                title="Bank-Level Security"
                description="Your data is encrypted and secure. We use industry-leading standards to protect your financial information."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white">
              <TrendingUp size={14} />
            </div>
            <span className="font-bold text-slate-900">Portfolio Copilot</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2024 Portfolio Copilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-100 hover:shadow-soft hover:shadow-primary-500/10 transition-all duration-300">
    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);