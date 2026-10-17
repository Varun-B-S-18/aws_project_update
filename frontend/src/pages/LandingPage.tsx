import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Brain, ArrowRight, Database, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-100 text-lg tracking-tight">
              Memory Assistant
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center justify-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Amazon Bedrock & DynamoDB</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 max-w-3xl leading-tight">
          An AI assistant that <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">actually remembers</span> you.
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Stateful conversations backed by real Amazon Bedrock Nova Micro intelligence and resilient Amazon DynamoDB persistence. Never repeat your preferences, projects, or context again.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Start Chatting Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In to Your Account
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Automatic Memory Extraction</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Shares facts about yourself naturally. The assistant automatically identifies preferences, names, and details to store for future recall.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">DynamoDB Persistence</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Memories are securely isolated per user account and stored permanently in AWS DynamoDB with sub-millisecond retrieval.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Amazon Bedrock Intelligence</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Driven by Amazon Nova Micro foundational model. Memories are seamlessly supplied through the system context for natural, personalized answers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>AWS Long-Term Memory Assistant &copy; {new Date().getFullYear()} &bull; Built with Bedrock, DynamoDB & Cognito</p>
      </footer>
    </div>
  );
};
