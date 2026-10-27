import React from 'react';
import { Bot, RefreshCw, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface HeaderProps {
  onClearChat?: () => void;
  messageCount?: number;
  serverStatus?: 'checking' | 'connected' | 'disconnected';
}

export const Header: React.FC<HeaderProps> = ({
  onClearChat,
  messageCount = 0,
  serverStatus = 'connected',
}) => {
  const { activeConversation } = useChat();

  return (
    <header className="border-b border-[#2E3D28]/15 bg-[#E8E9DF]/90 backdrop-blur px-5 py-3 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#A9B887]/30 border border-[#A9B887]/50 flex items-center justify-center text-[#2E3D28] shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-[#2E3D28] text-base md:text-lg tracking-tight truncate">
                {activeConversation?.title || 'Long-Term Memory Assistant'}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#A9B887]/25 text-[#2E3D28] border border-[#A9B887]/40 shrink-0">
                Bedrock + DynamoDB
              </span>
            </div>
            <p className="text-xs text-[#2E3D28]/70 mt-0.5 flex items-center gap-1.5">
              <span>Amazon Nova Micro</span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#2E3D28]/40" />
              <span className="text-[#2E3D28] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#A9B887]" />
                Persistent Memory Active
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Health indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#2E3D28] bg-[#A9B887]/20 px-2.5 py-1 rounded-lg border border-[#A9B887]/30">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === 'connected'
                  ? 'bg-[#2E3D28] animate-pulse'
                  : serverStatus === 'disconnected'
                  ? 'bg-rose-600'
                  : 'bg-amber-600 animate-pulse'
              }`}
            />
            <span className="capitalize font-medium">{serverStatus}</span>
          </div>

          {/* Reset chat button */}
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              title="Clear current session chat"
              className="text-xs flex items-center gap-1.5 text-[#2E3D28] hover:bg-[#A9B887]/20 px-2.5 py-1.5 rounded-lg border border-[#2E3D28]/25 transition-colors font-medium active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
