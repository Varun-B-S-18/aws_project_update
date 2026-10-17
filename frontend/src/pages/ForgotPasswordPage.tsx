import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await forgotPassword(email);
      setStep('reset');
      setSuccess(`A password reset verification code has been sent to ${email}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to request password reset. Check the email.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setError('Please provide the reset code and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await confirmForgotPassword(email, code, newPassword);
      setSuccess('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password. Please check the code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-100 text-xl tracking-tight">
              Memory Assistant
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">
            {step === 'request' ? 'Reset password' : 'Enter new password'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'request'
              ? 'Enter your email to receive a password reset code'
              : 'Enter the verification code and your new password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                icon={<KeyRound className="w-4 h-4" />}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                helperText="Must be at least 8 characters long."
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Update Password
              </Button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-xs text-slate-400 hover:text-slate-200 text-center mt-2 transition-colors"
              >
                &larr; Resend or change email
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

