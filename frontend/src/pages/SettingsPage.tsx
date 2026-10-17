import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BedrockHealthResponse } from '../types/chat';

export const SettingsPage: React.FC = () => {
  const { user, logout, isCognitoLive } = useAuth();
  const [bedrockHealth, setBedrockHealth] = useState<BedrockHealthResponse | null>(null);
  const [isTestingBedrock, setIsTestingBedrock] = useState(false);
  const [bedrockError, setBedrockError] = useState<string | null>(null);

  const testBedrockConnection = async () => {
    try {
      setIsTestingBedrock(true);
      setBedrockError(null);
      const res = await api.checkBedrockHealth(true);
      setBedrockHealth(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to invoke Amazon Bedrock test.';
      setBedrockError(msg);
    } finally {
      setIsTestingBedrock(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-lg">Settings &amp; Architecture</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your account credentials and inspect AWS infrastructure status
              </p>
            </div>
          </div>

          <Button variant="danger" size="sm" onClick={logout} icon={<LogOut className="w-3.5 h-3.5" />}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Account Details Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">User Profile</h2>
              <p className="text-xs text-slate-400">Your active session identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Full Name</span>
              <span className="font-medium text-slate-200">{user?.name || 'Not provided'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Email Address</span>
              <span className="font-medium text-slate-200">{user?.email || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
              <span className="text-slate-500 block mb-1">User ID (Partition Key)</span>
              <span className="font-mono text-slate-300 break-all">{user?.userId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Amazon Bedrock Integration Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Amazon Bedrock Intelligence</h2>
                <p className="text-xs text-slate-400">Model runtime and invocation status</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={testBedrockConnection}
              isLoading={isTestingBedrock}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Live Invocation
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Model ID</span>
              <span className="font-mono text-indigo-300">amazon.nova-micro-v1:0</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">AWS Region</span>
              <span className="font-mono text-slate-200">ap-southeast-2 (Sydney)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Memory Injection</span>
              <span className="text-emerald-400 font-medium">System Context API</span>
            </div>
          </div>

          {/* Test results */}
          {bedrockHealth && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-200">Bedrock Invocation Succeeded</p>
                <p className="mt-0.5 text-emerald-300">
                  Latency: {bedrockHealth.latencyMs}ms &bull; Model: {bedrockHealth.modelId} &bull; Status: {bedrockHealth.status}
                </p>
              </div>
            </div>
          )}

          {bedrockError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-300">Bedrock Diagnostic Notice</p>
                <p className="mt-0.5 text-rose-400">{bedrockError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Amazon DynamoDB Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Amazon DynamoDB Memory Store</h2>
              <p className="text-xs text-slate-400">Schema layout and partition key details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Table Name</span>
              <span className="font-mono text-slate-200">LongTermMemory</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Partition Key</span>
              <span className="font-mono text-indigo-300">userId (String)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Sort Key</span>
              <span className="font-mono text-indigo-300">recordId (String)</span>
            </div>
          </div>
        </div>

        {/* Authentication Provider Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Authentication Configuration</h2>
                <p className="text-xs text-slate-400">Amazon Cognito or Local Development token mode</p>
              </div>
            </div>

            <Badge variant={isCognitoLive ? 'emerald' : 'amber'} size="md" dot>
              {isCognitoLive ? 'Amazon Cognito Live' : 'Dev Mode Active'}
            </Badge>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            {isCognitoLive ? (
              <p>
                Amazon Cognito User Pool is connected. All tokens are verified cryptographically via AWS JWT verifier.
              </p>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <p className="font-medium text-amber-200 mb-1">Cognito User Pool Not Configured</p>
                <p className="text-[11px] leading-relaxed">
                  The application is running in local development mode. User tokens use deterministic base64 payloads to emulate real Cognito tokens. To switch to production Cognito, provide <code className="bg-amber-950/80 px-1 py-0.5 rounded">VITE_COGNITO_USER_POOL_ID</code> and <code className="bg-amber-950/80 px-1 py-0.5 rounded">VITE_COGNITO_CLIENT_ID</code> in the frontend environment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
