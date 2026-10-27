import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as content grows up to max-height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading && !disabled) {
      onSendMessage(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (unless Shift is pressed for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = !input.trim() || isLoading || disabled;

  return (
    <div className="border-t border-[#2E3D28]/15 bg-[#E8E9DF] p-4">
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 bg-[#E8E9DF] border border-[#2E3D28]/25 rounded-2xl p-2 focus-within:border-[#A9B887] focus-within:ring-2 focus-within:ring-[#A9B887]/30 transition-all shadow-sm"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? 'Thinking...'
                : 'Type your message... (Shift + Enter for newline)'
            }
            disabled={isLoading || disabled}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-[#2E3D28] placeholder-[#2E3D28]/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed max-h-44 leading-relaxed font-sans"
          />

          <button
            type="submit"
            disabled={isSendDisabled}
            className={`p-2.5 rounded-xl font-semibold text-xs flex items-center justify-center transition-all shrink-0 ${
              isSendDisabled
                ? 'bg-[#2E3D28]/10 text-[#2E3D28]/35 cursor-not-allowed'
                : 'bg-[#A9B887] text-[#2E3D28] hover:bg-[#9bb074] active:scale-95 shadow-sm border border-[#2E3D28]/20'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
          </button>
        </form>

        <p className="text-[11px] text-center text-[#2E3D28]/50 mt-2 font-medium">
          Long-Term Memory Assistant &bull; Relevant facts automatically remembered across conversations
        </p>
      </div>
    </div>
  );
};
