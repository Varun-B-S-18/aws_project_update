import React from 'react';
import { Bot, User, Brain } from 'lucide-react';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 w-full my-3.5 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold border ${
          isUser
            ? 'bg-[#A9B887] text-[#2E3D28] border-[#2E3D28]/20 shadow-xs'
            : 'bg-[#2E3D28] text-[#E8E9DF] border-[#2E3D28] shadow-xs'
        }`}
        aria-label={isUser ? 'User Avatar' : 'Assistant Avatar'}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-[#A9B887] text-[#2E3D28] font-medium rounded-tr-sm shadow-xs border border-[#2E3D28]/15'
              : 'bg-[#E8E9DF] border border-[#2E3D28]/20 text-[#2E3D28] rounded-tl-sm shadow-xs'
          }`}
        >
          {message.content}
        </div>

        {/* Footer with Timestamp and Memory Indicator */}
        <div className="flex items-center gap-2 mt-1 px-1 select-none">
          <span className="text-[11px] text-[#2E3D28]/60 font-medium">
            {message.timestamp}
          </span>
          {!isUser && message.memoriesUsed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E3D28] bg-[#A9B887]/25 px-1.5 py-0.5 rounded-md border border-[#A9B887]/50">
              <Brain className="w-3 h-3 text-[#2E3D28]" />
              <span>Memory applied ({message.memoryCount || 1})</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
