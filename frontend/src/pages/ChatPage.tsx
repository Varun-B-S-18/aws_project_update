import React from 'react';
import { Header } from '../components/Header';
import { ChatWindow } from '../components/ChatWindow';
import { ChatInput } from '../components/ChatInput';
import { useChat } from '../context/ChatContext';

export const ChatPage: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    serverStatus,
    sendMessage,
    clearChat,
    dismissError,
  } = useChat();

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <Header
        onClearChat={clearChat}
        messageCount={messages.length}
        serverStatus={serverStatus}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSelectPrompt={sendMessage}
          onDismissError={dismissError}
        />
      </div>

      {/* Bottom Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        disabled={serverStatus === 'disconnected' && messages.length === 0}
      />
    </div>
  );
};
