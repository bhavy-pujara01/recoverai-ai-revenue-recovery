import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Zap, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@recoverai.in');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      showToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Successfully signed into RecoverAI dashboard.',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError('');
    try {
      await demoLogin(role);
      showToast({
        type: 'success',
        title: `Logged in as ${role}`,
        message: `Active persona: ${role} mode.`,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize demo session.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="text-2xl font-black text-slate-950 tracking-tight">RecoverAI</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          Sign in to your recovery command center
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access deterministic payment recovery intelligence and campaign controls
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-2xl sm:px-10 border border-slate-200/90">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Login Bar */}
          <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Demo Login</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">1-Click Access</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 shadow-subtle hover:bg-slate-50 transition-all text-center"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ANALYST')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 shadow-subtle hover:bg-slate-50 transition-all text-center"
              >
                📊 Analyst
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('SUPPORT')}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 shadow-subtle hover:bg-slate-50 transition-all text-center"
              >
                🎧 Support
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">Or sign in with email</span>
            </div>
          </div>

          {/* Credentials Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@recoverai.in"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="emerald"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Create organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
