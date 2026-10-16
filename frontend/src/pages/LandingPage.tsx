import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Shield, Database, Sparkles, ArrowRight, CheckCircle2, Lock, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-100">
              Long-Term Memory Assistant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950/50 to-slate-950 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AWS Bedrock & DynamoDB Powered AI Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
            An AI Assistant That Actually{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Remembers You.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop repeating your preferences, projects, and facts every conversation. The Long-Term Memory
            Assistant securely stores your persistent memories in AWS DynamoDB and weaves them into
            Amazon Bedrock foundation model prompts.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-4 h-4" />}>
                Create Free Account
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          {/* Architecture Trust Highlights */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Amazon Bedrock Intelligence</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Powered by Amazon Nova foundation models via official AWS SDK Converse API.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Persistent DynamoDB Storage</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                User facts, preferences, and project codes are durable and isolated per user ID.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Cognito Identity & Privacy</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Server-side JWT signature verification. You inspect, edit, and delete your memories at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              How the Memory Engine Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              A transparent, privacy-first pipeline from user input to Bedrock foundation models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-2xl font-bold text-indigo-500/40 absolute top-4 right-4">01</span>
              <h3 className="text-base font-semibold text-slate-200 mb-2">1. Memory Retrieval</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you send a message, the server verifies your Cognito JWT and fetches your personal memories from DynamoDB.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-2xl font-bold text-indigo-500/40 absolute top-4 right-4">02</span>
              <h3 className="text-base font-semibold text-slate-200 mb-2">2. Context Augmentation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relevant memories are woven into the prompt sent to Amazon Bedrock so the model answers with full awareness of your preferences.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-2xl font-bold text-indigo-500/40 absolute top-4 right-4">03</span>
              <h3 className="text-base font-semibold text-slate-200 mb-2">3. Selective Learning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you share new project names, preferences, or personal facts, the backend saves them into DynamoDB for future conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy and Control Messaging */}
      <section className="py-14 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100">
            You Own Your Data & Control Every Memory
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
            Unlike closed models that retain data without transparency, you can view your full memory vault, edit any fact, delete individual memories, or clear all data instantly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credentials in browser
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> User-isolated DynamoDB partition
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Amazon Cognito token verification
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
        <p>Long-Term Memory Assistant • Built with React, Node.js, Amazon Bedrock & AWS DynamoDB.</p>
      </footer>
    </div>
  );
};

