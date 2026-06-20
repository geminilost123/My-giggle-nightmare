import React from 'react';
import { Thread } from '../types';
import { Plus, Trash2, Edit2, MessageSquare, Image, Database, X } from 'lucide-react';

interface SidebarProps {
  threads: Thread[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => void;
  onDeleteThreadClick: (id: string, name: string) => void;
  onRenameThreadClick: (id: string, name: string) => void;
  storageSizeMB: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThreadClick,
  onRenameThreadClick,
  storageSizeMB,
  isOpen,
  onClose
}) => {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 w-[280px] bg-[#14142a] border-r border-white/5 flex flex-col z-[50] transition-transform duration-300 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-serif font-semibold text-lg text-[#c9b8e8] tracking-wide flex items-center gap-1.5">
              ✦ Zaor Studio <span className="font-sans text-[10px] text-white/40 font-normal">v1.5</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCreateThread}
              className="p-1 px-2.5 rounded-lg bg-[#c9b8e8]/10 hover:bg-[#c9b8e8]/20 text-[#c9b8e8] text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="New game thread"
            >
              <Plus size={14} /> New
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9a96a8] hover:text-[#c47a8a] md:hidden cursor-pointer"
              title="Close panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List of active Games */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#9a96a8] tracking-widest uppercase px-2 mb-1">
            Creative Threads ({threads.length})
          </span>

          {threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#9a96a8]/50 italic">
              No creative games started yet. Tap 'New' above to begin.
            </div>
          ) : (
            threads.map(t => {
              const isActive = t.id === currentThreadId;
              const hasImages = t.messages?.some(m => m.type === 'image' || m.type === 'storyboard');

              return (
                <div
                  key={t.id}
                  className={`group relative flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#252538] text-[#c9b8e8]'
                      : 'hover:bg-[#2e2e48]/40 text-[#f0ece4] hover:text-[#c9b8e8]'
                  }`}
                  onClick={() => {
                    onSelectThread(t.id);
                    onClose();
                  }}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#c9b8e8]/10' : 'bg-white/5'}`}>
                    {hasImages ? (
                      <Image size={14} className={isActive ? 'text-[#c9b8e8]' : 'text-[#9a96a8]'} />
                    ) : (
                      <MessageSquare size={14} className={isActive ? 'text-[#c9b8e8]' : 'text-[#9a96a8]'} />
                    )}
                  </div>

                  <div className="flex-1 min-width-0 pr-6">
                    <div className="text-xs font-medium truncate leading-tight mb-0.5">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-[#9a96a8]">
                      {formatDate(t.createdAt)}
                    </div>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#14142a] via-[#14142a]/95 to-transparent pl-4 pr-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameThreadClick(t.id, t.name);
                      }}
                      className="p-1 rounded-md text-[#9a96a8] hover:text-[#c9b8e8] hover:bg-white/5 cursor-pointer"
                      title="Rename thread"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThreadClick(t.id, t.name);
                      }}
                      className="p-1 rounded-md text-[#9a96a8] hover:text-[#c47a8a] hover:bg-white/5 cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/5 text-[11px] text-[#9a96a8] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database size={11} /> {storageSizeMB} MB stored local
          </span>
        </div>
      </aside>
    </>
  );
};
