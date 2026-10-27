import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isCognitoLive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
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
          <h2 className="text-2xl font-bold text-[#2E3D28]">Welcome back</h2>
          <p className="text-sm text-[#2E3D28]/70 mt-1">
            Sign in to access your persistent memory chat
          </p>
          <div className="mt-3 flex justify-center">
            <Badge variant={isCognitoLive ? 'sage' : 'amber'} size="sm" dot>
              {isCognitoLive ? 'Amazon Cognito Active' : 'Dev Mode Active'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#2E3D28]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2E3D28] font-medium hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Dev Mode Autofill Helper */}
          {!isCognitoLive && (
            <div className="mt-6 pt-5 border-t border-[#2E3D28]/15">
              <p className="text-xs text-[#2E3D28]/70 mb-2">Dev Quick Login:</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setEmail('test@example.com');
                    setPassword('password123');
                  }}
                >
                  Fill test@example.com
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-[#2E3D28]/70 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-[#2E3D28] font-semibold hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};