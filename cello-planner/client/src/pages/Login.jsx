import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Music2, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Decorative Background Blobs ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-200/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cream-300/20 blur-3xl" />
      </div>

      {/* ── Login Card ── */}
      <div className="relative w-full max-w-md">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sage-300/30 to-gold-300/30 blur-xl scale-105" />

        <div className="relative glass-card rounded-3xl p-8 md:p-10 shadow-glass-lg border border-white/60">
          {/* ── Header ── */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-sage-gradient flex items-center justify-center shadow-glass mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-glow">
                <Music2 size={22} className="text-sage-900" />
              </div>
            </div>
            <h1 className="font-display font-bold text-3xl text-sage-900 text-center">
              Welcome Back
            </h1>
            <p className="text-sage-500 mt-1.5 text-center text-sm">
              Sign in to your Cello Planner account
            </p>
          </div>

          {/* ── Error Alert ── */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-sage-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sage-400 pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-sage-700"
                >
                  Password
                </label>
                {/* Forgot password – Phase 4 */}
                <span className="text-xs text-sage-400 cursor-not-allowed" title="Coming soon">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sage-400 pointer-events-none"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-sage-200" />
            <span className="text-xs text-sage-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-sage-200" />
          </div>

          {/* ── Demo Credentials ── */}
          <div className="bg-cream-100 border border-cream-300 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wide">
              Quick Demo
            </p>
            <button
              type="button"
              onClick={() => setForm({ email: 'demo@celloplanner.com', password: 'demo123' })}
              className="text-xs text-sage-700 hover:text-sage-900 underline decoration-dotted underline-offset-2 transition-colors"
            >
              Fill demo credentials
            </button>
            <p className="text-xs text-sage-400 mt-1">
              Register that email first if it doesn't exist yet.
            </p>
          </div>

          {/* ── Register Link ── */}
          <p className="text-center text-sm text-sage-600">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-sage-700 hover:text-sage-900 underline decoration-dotted underline-offset-2 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
