import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  Bot,
  Sparkles,
  User,
  ShieldCheck,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Conversation } from '../../types/chat';

export const AppLayout: React.FC = () => {
  const { user, logout, isCognitoLive } = useAuth();
  const {
    conversations,
    activeConversationId,
    createNewChat,
    selectConversation,
    renameConversation,
    deleteConversation,
    isConversationsLoading,
  } = useChat();

  const navigate = useNavigate();
  const location = useLocation();

  // Menu and modal states for conversation actions
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingConv, setRenamingConv] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewChat = () => {
    createNewChat();
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  };

  const handleOpenRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingConv(conv);
    setNewTitle(conv.title);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingConv || !newTitle.trim()) return;

    try {
      setIsRenaming(true);
      await renameConversation(renamingConv.conversationId, newTitle.trim());
      setRenamingConv(null);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOpenDelete = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeletingConv(conv);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConv) return;

    try {
      setIsDeleting(true);
      await deleteConversation(deletingConv.conversationId);
      setDeletingConv(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#E8E9DF] text-[#2E3D28] overflow-hidden font-sans select-none">
      {/* Sidebar: Deep Green Background (#2E3D28) */}
      <aside className="w-72 bg-[#2E3D28] text-[#E8E9DF] flex flex-col justify-between shrink-0 border-r border-[#2E3D28]/60 shadow-xl z-20">
        <div className="flex flex-col h-[calc(100vh-140px)]">
          {/* 1. Application Logo and Name: Memory AI */}
          <div className="p-4 border-b border-[#A9B887]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#A9B887]/20 border border-[#A9B887]/30 flex items-center justify-center text-[#A9B887] shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-[#E8E9DF] text-base tracking-tight flex items-center gap-1.5">
                  Memory AI
                  <span className="text-[10px] bg-[#A9B887]/20 text-[#A9B887] border border-[#A9B887]/30 px-1.5 py-0.2 rounded font-mono">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-[#A9B887]/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#A9B887]" />
                  Bedrock &bull; Long-Term Memory
                </p>
              </div>
            </div>
          </div>

          {/* 2. New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#A9B887] hover:bg-[#b5c494] text-[#2E3D28] font-semibold text-sm transition-all shadow-md shadow-black/10 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Chat</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#2E3D28]/15 font-mono text-[#2E3D28]/80">
                ⌘N
              </span>
            </button>
          </div>

          {/* 3. Conversation History Section */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#A9B887]/70">
              Conversations
            </div>

            {isConversationsLoading && conversations.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#A9B887]/60">
                Loading history...
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-[#A9B887]/60 leading-relaxed border border-dashed border-[#A9B887]/20 rounded-xl m-1">
                No past conversations yet. Start a chat above!
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversationId === conv.conversationId;
                const isMenuOpen = menuOpenId === conv.conversationId;

                return (
                  <div
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv.conversationId)}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#A9B887] text-[#2E3D28] font-medium shadow-sm'
                        : 'text-[#E8E9DF]/85 hover:bg-[#A9B887]/15 hover:text-[#E8E9DF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#2E3D28]' : 'text-[#A9B887]'
                        }`}
                      />
                      <span className="truncate">{conv.title || 'New Chat'}</span>
                    </div>

                    {/* Three-dots menu trigger */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : conv.conversationId);
                        }}
                        className={`p-1 rounded-md transition-opacity ${
                          isActive
                            ? 'text-[#2E3D28]/80 hover:bg-[#2E3D28]/10'
                            : 'text-[#E8E9DF]/60 hover:text-[#E8E9DF] hover:bg-[#2E3D28]/40'
                        } ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        title="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                            }}
                          />
                          <div
                            className="absolute right-0 mt-1 w-36 bg-[#2E3D28] border border-[#A9B887]/30 rounded-xl shadow-xl py-1 z-40 text-xs text-[#E8E9DF]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleOpenRename(conv, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#A9B887]/20 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#A9B887]" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={(e) => handleOpenDelete(conv, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Settings & 5. Authentication Status at Bottom */}
        <div className="p-3 border-t border-[#A9B887]/20 bg-[#2E3D28] space-y-2">
          {/* Settings Nav Item */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-[#A9B887] text-[#2E3D28] font-medium shadow-sm'
                  : 'text-[#E8E9DF]/85 hover:bg-[#A9B887]/15 hover:text-[#E8E9DF]'
              }`
            }
          >
            <Settings className="w-4 h-4 text-[#A9B887]" />
            <span>Settings</span>
          </NavLink>

          {/* Auth status badge */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#A9B887]/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A9B887]" />
              <span>Auth Status</span>
            </div>
            <Badge variant="emerald" size="sm" dot>
              {isCognitoLive ? 'Cognito Live' : 'Dev Mode'}
            </Badge>
          </div>

          {/* User profile card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#24311f] border border-[#A9B887]/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#A9B887]/20 border border-[#A9B887]/30 flex items-center justify-center text-[#A9B887] shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#E8E9DF] truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[10px] text-[#A9B887]/70 truncate" title={user?.email}>
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-[#A9B887]/70 hover:text-rose-300 hover:bg-[#2E3D28] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area: Soft White Background (#E8E9DF) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#E8E9DF] relative">
        <Outlet />
      </main>

      {/* Rename Conversation Modal */}
      <Modal
        isOpen={Boolean(renamingConv)}
        onClose={() => setRenamingConv(null)}
        title="Rename Conversation"
        description="Provide a concise, meaningful title for this chat."
      >
        <form onSubmit={handleSaveRename} className="space-y-4">
          <Input
            label="Conversation Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. OpenSearch Memory Retrieval"
            autoFocus
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRenamingConv(null)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isRenaming}>
              Save Title
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Conversation Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingConv)}
        onClose={() => setDeletingConv(null)}
        title="Delete Conversation"
        description="Are you sure you want to permanently delete this conversation?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingConv(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete Conversation
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-[#2E3D28]">
          <p>
            This will permanently remove the conversation &ldquo;
            <span className="font-semibold text-[#2E3D28]">{deletingConv?.title}</span>
            &rdquo; and its messages.
          </p>
          <div className="p-3 bg-[#A9B887]/15 rounded-xl border border-[#A9B887]/30 text-xs text-[#2E3D28]/90">
            <strong>Note:</strong> Your persistent long-term memories stored in Amazon
            OpenSearch and DynamoDB will NOT be deleted.
          </div>
        </div>
      </Modal>
    </div>
  );
};
