import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Memory } from '../types/memory';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

export const MemoryDashboard: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentMemory, setCurrentMemory] = useState<Memory | null>(null);
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryCategory, setMemoryCategory] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear all confirmation
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMemories();
      setMemories(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load memories from DynamoDB.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [memories]);

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesSearch =
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || m.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [memories, searchQuery, selectedCategory]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentMemory(null);
    setMemoryContent('');
    setMemoryCategory('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mem: Memory) => {
    setModalMode('edit');
    setCurrentMemory(mem);
    setMemoryContent(mem.content);
    setMemoryCategory(mem.category || 'general');
    setIsModalOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryContent.trim()) return;

    try {
      setIsSaving(true);
      if (modalMode === 'create') {
        const newMem = await api.createMemory(memoryContent.trim(), memoryCategory);
        setMemories((prev) => [newMem, ...prev]);
      } else if (modalMode === 'edit' && currentMemory) {
        const updated = await api.updateMemory(currentMemory.recordId, memoryContent.trim());
        setMemories((prev) =>
          prev.map((m) => (m.recordId === currentMemory.recordId ? updated : m))
        );
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save memory to DynamoDB.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemory = async () => {
    if (!memoryToDelete) return;

    try {
      setIsDeleting(true);
      await api.deleteMemory(memoryToDelete.recordId);
      setMemories((prev) => prev.filter((m) => m.recordId !== memoryToDelete.recordId));
      setDeleteModalOpen(false);
      setMemoryToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete memory.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsDeleting(true);
      await api.clearAllMemories();
      setMemories([]);
      setClearAllModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear memories.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadgeVariant = (cat?: string): 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' => {
    switch (cat?.toLowerCase()) {
      case 'preference':
        return 'emerald';
      case 'project':
        return 'indigo';
      case 'identity':
        return 'amber';
      case 'education':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-100 text-lg">Memory Dashboard</h1>
                <Badge variant="indigo" size="sm">
                  {memories.length} {memories.length === 1 ? 'Fact' : 'Facts'} Stored
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time DynamoDB persistence &bull; Retrieved dynamically during chat sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMemories}
              isLoading={isLoading}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Memory
            </Button>
            {memories.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setClearAllModalOpen(true)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error accessing DynamoDB</p>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors shrink-0 ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Items Grid */}
        {isLoading && memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Retrieving memories from Amazon DynamoDB...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-medium text-slate-200">
              {searchQuery || selectedCategory !== 'all' ? 'No matching memories found' : 'No memories saved yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try broadening your search or resetting category filters.'
                : 'Chat with the assistant to have facts automatically extracted, or add one manually above.'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateModal}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Your First Memory
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMemories.map((mem) => (
              <div
                key={mem.recordId}
                className="group p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-750 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge variant={getCategoryBadgeVariant(mem.category)} size="sm">
                      {mem.category || 'General'}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(mem)}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                        title="Edit Memory"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setMemoryToDelete(mem);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                    {mem.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(mem.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">
                    ID: {mem.recordId.substring(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Memory' : 'Edit Memory'}
        description="This memory will be stored in Amazon DynamoDB and made available to Amazon Bedrock."
      >
        <form onSubmit={handleSaveMemory} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Memory Content
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none min-h-[100px]"
              placeholder="e.g. My favorite programming language is TypeScript."
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Category</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
              value={memoryCategory}
              onChange={(e) => setMemoryCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="preference">Preference</option>
              <option value="project">Project</option>
              <option value="identity">Identity</option>
              <option value="education">Education</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {modalMode === 'create' ? 'Save Memory' : 'Update Memory'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Memory"
        description="Are you sure you want to permanently delete this memory from DynamoDB?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteMemory}
              isLoading={isDeleting}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
          &ldquo;{memoryToDelete?.content}&rdquo;
        </p>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        title="Clear All Memories"
        description="Warning: This will permanently delete ALL stored memories for your account from Amazon DynamoDB."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearAllModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAll}
              isLoading={isDeleting}
            >
              Yes, Delete All Memories
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This action cannot be undone. Bedrock will no longer recall any previously saved facts during subsequent conversations.
        </p>
      </Modal>
    </div>
  );
};

