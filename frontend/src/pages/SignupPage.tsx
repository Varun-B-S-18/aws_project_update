import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { signup, confirmSignup, login, isCognitoLive } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill out all registration fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await signup(email, password, name);

      if (result.userConfirmed) {
        await login(email, password);
        navigate('/chat', { replace: true });
      } else {
        setStep('confirm');
        setInfoMessage(`We've sent a 6-digit verification code to ${email}. Please check your inbox.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode) {
      setError('Please enter the confirmation code sent to your email.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await confirmSignup(email, confirmationCode);
      await login(email, password);
      navigate('/chat', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check the code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8E9DF] text-[#2E3D28] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#2E3D28]/10 border border-[#2E3D28]/20 flex items-center justify-center text-[#2E3D28] shadow-inner group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[#2E3D28] text-xl tracking-tight">
              Memory AI
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-[#2E3D28]">
            {step === 'signup' ? 'Create an account' : 'Verify your email'}
          </h2>
          <p className="text-sm text-[#2E3D28]/70 mt-1">
            {step === 'signup'
              ? 'Get your own dedicated persistent AI assistant'
              : 'Enter the verification code to activate your account'}
          </p>
          <div className="mt-3 flex justify-center">
            <Badge variant={isCognitoLive ? 'sage' : 'amber'} size="sm" dot>
              {isCognitoLive ? 'Amazon Cognito' : 'Local Dev Mode'}
            </Badge>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#E8E9DF] border border-[#2E3D28]/20 rounded-2xl p-6 sm:p-8 shadow-md">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#2E3D28]/10 border border-[#2E3D28]/30 flex items-start gap-3 text-[#2E3D28] text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#A9B887]/20 border border-[#A9B887] flex items-start gap-3 text-[#2E3D28] text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E3D28]" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Varun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                helperText="Must be at least 8 characters long."
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
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.trim())}
                icon={<KeyRound className="w-4 h-4" />}
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Confirm &amp; Proceed
              </Button>

              <button
                type="button"
                onClick={() => setStep('signup')}
                className="w-full text-xs text-[#2E3D28]/70 hover:text-[#2E3D28] text-center mt-2 transition-colors"
              >
                &larr; Back to edit details
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-[#2E3D28]/70 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2E3D28] font-semibold hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};