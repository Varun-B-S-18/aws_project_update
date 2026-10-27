import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { Bot, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSelectPrompt?: (prompt: string) => void;
  onDismissError?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  onSelectPrompt,
  onDismissError,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterPrompts = [
    'What is my secret project code name?',
    'Which university am I studying at?',
    'Explain machine learning in simple terms',
    'What are the key principles of clean code?',
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#E8E9DF]">
      <div className="max-w-4xl mx-auto flex flex-col min-h-full">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-[#A9B887]/30 border border-[#A9B887]/50 flex items-center justify-center text-[#2E3D28] mb-5 shadow-sm">
              <Bot className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-[#2E3D28] tracking-tight mb-2">
              Welcome to Long-Term Memory Assistant
            </h2>

            <p className="text-sm text-[#2E3D28]/75 max-w-md leading-relaxed mb-6">
              Powered by <span className="text-[#2E3D28] font-semibold">Amazon Bedrock</span> with persistent recall powered by <span className="text-[#2E3D28] font-semibold">Amazon DynamoDB &amp; OpenSearch</span>.
            </p>

            <div className="p-4 rounded-2xl bg-[#A9B887]/15 border border-[#A9B887]/30 text-xs text-[#2E3D28] max-w-lg mb-8 flex items-start gap-3 text-left">
              <Sparkles className="w-4 h-4 text-[#2E3D28] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#2E3D28]">Long-Term Memory Active:</span>
                <p className="mt-0.5 leading-relaxed text-[#2E3D28]/85">
                  Personal facts, preferences, and project details mentioned during conversations are automatically indexed and recalled in subsequent chats.
                </p>
              </div>
            </div>

            {/* Suggested starters */}
            <div className="w-full max-w-lg">
              <p className="text-xs font-semibold text-[#2E3D28]/60 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Suggested Conversation Starters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSelectPrompt?.(prompt)}
                    className="p-3 text-left text-xs font-medium text-[#2E3D28] bg-[#E8E9DF] hover:bg-[#A9B887]/25 border border-[#2E3D28]/20 hover:border-[#A9B887] rounded-xl transition-all shadow-xs active:scale-[0.99]"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 w-full my-3.5 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-lg bg-[#2E3D28] text-[#E8E9DF] flex items-center justify-center shrink-0 text-sm font-medium border border-[#2E3D28]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#E8E9DF] border border-[#2E3D28]/20 shadow-xs flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A9B887] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#A9B887] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#A9B887] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="my-4 p-4 rounded-xl bg-rose-100 border border-rose-300 flex items-start justify-between gap-3 text-rose-900 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-rose-700 hover:text-rose-900 underline font-semibold ml-2 shrink-0"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};
