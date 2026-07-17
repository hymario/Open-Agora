import React, { useState, useEffect } from 'react';
import { ForumThread, Comment } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, Star, Send, Plus, ArrowUpRight, Shield, RefreshCw, Edit2, History, Reply, Check, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { VersionHistoryModal } from './VersionHistoryModal';

interface ForumSectionProps {
  currentUsername: string;
  onInspectUser?: (username: string) => void;
  onElevatedSuccess?: (message: string) => void;
  onRefreshIdeas?: () => void;
}

export const FORUM_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌐' },
  { id: 'app-building', name: 'App Building', icon: '💻' },
  { id: 'health', name: 'Health', icon: '❤️' },
  { id: 'transportation', name: 'Transportation', icon: '🚗' },
  { id: 'aesthetics', name: 'Aesthetics', icon: '🎨' },
  { id: 'philosophy', name: 'Philosophy', icon: '🏛️' },
  { id: 'other', name: 'Other', icon: '📁' }
];

export function ForumSection({ currentUsername, onInspectUser, onElevatedSuccess, onRefreshIdeas }: ForumSectionProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDesc, setNewThreadDesc] = useState('');
  const [newThreadForumCategory, setNewThreadForumCategory] = useState('app-building');
  const [selectedForumCategory, setSelectedForumCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  // Elevation form state
  const [elevatingThreadId, setElevatingThreadId] = useState<string | null>(null);
  const [elevationCost, setElevationCost] = useState('150000');
  const [elevationCategory, setElevationCategory] = useState<'main' | 'emergency' | 'political'>('main');

  // Interactive edit & version history states
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [editThreadDesc, setEditThreadDesc] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyCommentId, setReplyCommentId] = useState<string | null>(null);
  const [replyCommentText, setReplyCommentText] = useState('');
  
  const [openThreadRatings, setOpenThreadRatings] = useState<Record<string, boolean>>({});
  const [openCommentRatings, setOpenCommentRatings] = useState<Record<string, boolean>>({});
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{ title: string; versions: any[]; currentValue: any } | null>(null);

  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/forum?user=${currentUsername}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (e) {
      console.error("Error loading forum:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [currentUsername]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadDesc.trim()) return;

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThreadTitle,
          description: newThreadDesc,
          creator: currentUsername,
          forumCategory: newThreadForumCategory
        })
      });
      if (res.ok) {
        const newT = await res.json();
        setThreads(prev => [newT, ...prev]);
        setNewThreadTitle('');
        setNewThreadDesc('');
        setNewThreadForumCategory('app-building');
        setShowCreateForm(false);
        setExpandedThreadId(newT.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateThread = async (
    threadId: string, 
    direction: 'like' | 'dislike' | null, 
    ratings?: { informed: number, effective: number }
  ) => {
    try {
      const thread = threads.find(t => t.id === threadId);
      const defaultRatings = ratings || thread?.userRatings || { informed: 3, effective: 3 };

      const res = await fetch(`/api/forum/${threadId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          ratings: defaultRatings,
          user: currentUsername
        })
      });

      if (res.ok) {
        const data = await res.json();
        setThreads(prev => prev.map(t => t.id === threadId ? {
          ...t,
          likes: data.likes,
          dislikes: data.dislikes,
          stats: data.stats,
          userVote: data.userVote,
          userRatings: data.userRatings
        } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditThreadSubmit = async (threadId: string) => {
    if (!editThreadTitle.trim() || !editThreadDesc.trim()) return;
    try {
      const res = await fetch(`/api/forum/${threadId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editThreadTitle,
          description: editThreadDesc,
          user: currentUsername
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreads(prev => prev.map(t => t.id === threadId ? {
            ...t,
            title: data.thread.title,
            description: data.thread.description,
            versions: data.thread.versions,
            timestamp: data.thread.timestamp
          } : t));
          setEditingThreadId(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (threadId: string) => {
    const text = commentInputs[threadId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/forum/${threadId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          user: currentUsername
        })
      });

      if (res.ok) {
        const newC = await res.json();
        setThreads(prev => prev.map(t => {
          if (t.id === threadId) {
            return {
              ...t,
              comments: [...t.comments, newC]
            };
          }
          return t;
        }));
        setCommentInputs(prev => ({ ...prev, [threadId]: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCommentSubmit = async (threadId: string, commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`/api/forum/${threadId}/comment/${commentId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editCommentText,
          user: currentUsername
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreads(prev => prev.map(t => {
            if (t.id === threadId) {
              const updateCommentRecursive = (list: any[]): any[] => {
                return list.map(c => {
                  if (c.id === commentId) {
                    return { 
                      ...c, 
                      text: data.comment.text, 
                      versions: data.comment.versions, 
                      timestamp: data.comment.timestamp 
                    };
                  }
                  if (c.replies && c.replies.length > 0) {
                    return { ...c, replies: updateCommentRecursive(c.replies) };
                  }
                  return c;
                });
              };
              return { ...t, comments: updateCommentRecursive(t.comments) };
            }
            return t;
          }));
          setEditingCommentId(null);
          setEditCommentText('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplyCommentSubmit = async (threadId: string, commentId: string) => {
    if (!replyCommentText.trim()) return;
    try {
      const res = await fetch(`/api/forum/${threadId}/comment/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyCommentText,
          user: currentUsername
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreads(prev => prev.map(t => {
            if (t.id === threadId) {
              const addReplyRecursive = (list: any[]): any[] => {
                return list.map(c => {
                  if (c.id === commentId) {
                    return { ...c, replies: [...(c.replies || []), data.reply] };
                  }
                  if (c.replies && c.replies.length > 0) {
                    return { ...c, replies: addReplyRecursive(c.replies) };
                  }
                  return c;
                });
              };
              return { ...t, comments: addReplyRecursive(t.comments) };
            }
            return t;
          }));
          setReplyCommentId(null);
          setReplyCommentText('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRateCommentSubmit = async (
    threadId: string, 
    commentId: string, 
    direction: 'like' | 'dislike' | null, 
    ratings?: any
  ) => {
    try {
      const res = await fetch(`/api/forum/${threadId}/comment/${commentId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          ratings,
          user: currentUsername
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreads(prev => prev.map(t => {
            if (t.id === threadId) {
              const rateRecursive = (list: any[]): any[] => {
                return list.map(c => {
                  if (c.id === commentId) {
                    return { ...c, reactions: data.comment.reactions };
                  }
                  if (c.replies && c.replies.length > 0) {
                    return { ...c, replies: rateRecursive(c.replies) };
                  }
                  return c;
                });
              };
              return { ...t, comments: rateRecursive(t.comments) };
            }
            return t;
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleElevateToProposal = async (threadId: string) => {
    try {
      const res = await fetch(`/api/forum/${threadId}/elevate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: elevationCategory,
          cost: Number(elevationCost) || 100000
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update thread state locally to show elevated status
          setThreads(prev => prev.map(t => t.id === threadId ? {
            ...t,
            elevatedToProposalId: data.idea.id,
            category: elevationCategory
          } : t));

          setElevatingThreadId(null);
          
          if (onElevatedSuccess) {
            onElevatedSuccess(`🚀 Thread elevated! "${data.idea.title}" added to the ${elevationCategory.toUpperCase()} proposal pool!`);
          }
          if (onRefreshIdeas) {
            onRefreshIdeas();
          }
        }
      } else {
        const err = await res.json();
        alert(err.error || "Elevation failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-mono text-xs uppercase tracking-widest gap-2">
        <RefreshCw className="animate-spin text-slate-500" size={20} />
        <span>Loading Deliberation Board...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-12">
      {/* Header and Start Discussion Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            💬 Pre-Proposal Deliberation Forum
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mt-1">
            Reddit-style open sandbox. Brainstorm, debate, and rate initial ideas on <strong>Informed</strong> & <strong>Effective</strong> indices. When an idea reaches consensus, click <strong>Elevate</strong> to instantly deploy it into the live Swipe stack!
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          {showCreateForm ? 'Close Form' : 'Start Discussion'}
        </button>
      </div>

      {/* Start Discussion Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-lg"
          >
            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                ✍️ Publish a Forum Thread
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discussion Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory community solar battery banks on larger Cyclades islands"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-950 bg-slate-50/50 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detailed Description & Context</label>
                <textarea
                  placeholder="Describe your vision, approximate logistics, and why this deserves to be elevated to a real public vote proposal..."
                  rows={4}
                  value={newThreadDesc}
                  onChange={(e) => setNewThreadDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-950 bg-slate-50/50 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discussion Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {FORUM_CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                    const isSel = newThreadForumCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewThreadForumCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1.5 p-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider border text-left transition-all cursor-pointer justify-center",
                          isSel
                            ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Post Thread
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          📁 Filter Forum Categories
        </span>
        <div className="flex flex-wrap gap-2">
          {FORUM_CATEGORIES.map((cat) => {
            const isSelected = selectedForumCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedForumCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border select-none",
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.01]"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {threads.filter(t => selectedForumCategory === 'all' || t.forumCategory === selectedForumCategory).map((thread) => {
          const isExpanded = expandedThreadId === thread.id;
          return (
            <div 
              key={thread.id}
              className={cn(
                "bg-white border rounded-3xl overflow-hidden transition-all duration-200",
                isExpanded ? "border-slate-300 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              )}
            >
              {/* Main row */}
              <div 
                className="p-5 flex gap-4 items-start cursor-pointer select-none"
                onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
              >
                {/* Reddit style vote pane */}
                <div 
                  className="flex flex-col items-center gap-1.5 p-1 px-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 select-none text-slate-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleRateThread(thread.id, thread.userVote === 'like' ? null : 'like')}
                    className={cn(
                      "p-1 rounded-lg transition-colors cursor-pointer",
                      thread.userVote === 'like' ? "text-emerald-600 bg-emerald-50" : "hover:bg-slate-200 text-slate-400"
                    )}
                    title="Like Thread"
                  >
                    <ThumbsUp size={14} className={thread.userVote === 'like' ? "fill-emerald-600" : ""} />
                  </button>
                  <span className="text-[11px] font-black font-mono text-slate-700">{thread.likes}</span>
                  <button
                    onClick={() => handleRateThread(thread.id, thread.userVote === 'dislike' ? null : 'dislike')}
                    className={cn(
                      "p-1 rounded-lg transition-colors cursor-pointer",
                      thread.userVote === 'dislike' ? "text-rose-600 bg-rose-50" : "hover:bg-slate-200 text-slate-400"
                    )}
                    title="Dislike Thread"
                  >
                    <ThumbsDown size={14} className={thread.userVote === 'dislike' ? "fill-rose-600" : ""} />
                  </button>
                </div>

                {/* Content summary */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      By u/{thread.creator}
                    </span>
                    <span className="text-[9px] text-slate-300">•</span>
                    <span className="text-[9px] font-semibold text-slate-400 font-mono">{thread.timestamp}</span>

                    {thread.forumCategory && (
                      <>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/50 rounded px-2 py-0.5">
                          {FORUM_CATEGORIES.find(c => c.id === thread.forumCategory)?.icon || '📁'} {FORUM_CATEGORIES.find(c => c.id === thread.forumCategory)?.name || thread.forumCategory}
                        </span>
                      </>
                    )}

                    {thread.versions && thread.versions.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHistoryItem({
                            title: thread.title,
                            versions: thread.versions,
                            currentValue: { title: thread.title, description: thread.description }
                          });
                        }}
                        className="inline-flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded px-1.5 py-0.2 cursor-pointer transition-colors"
                        title="View thread edit logs"
                      >
                        <History size={10} />
                        <span>v{thread.versions.length + 1} (Edited)</span>
                      </button>
                    )}
                    
                    {thread.elevatedToProposalId && (
                      <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-0.5 animate-pulse ml-auto">
                        ⚡ Elevated to {thread.category === 'political' ? 'Socioeconomics' : thread.category === 'emergency' ? 'Emergencies' : 'Main Pool'}
                      </span>
                    )}
                  </div>

                  {editingThreadId === thread.id ? (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Title</label>
                        <input
                          type="text"
                          value={editThreadTitle}
                          onChange={(e) => setEditThreadTitle(e.target.value)}
                          className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-xl bg-white text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                        <textarea
                          value={editThreadDesc}
                          onChange={(e) => setEditThreadDesc(e.target.value)}
                          className="w-full text-xs font-medium p-2 border border-slate-200 rounded-xl bg-white text-slate-900"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingThreadId(null)}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditThreadSubmit(thread.id)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1"
                        >
                          <Check size={11} />
                          Save Revision
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                          {thread.title}
                        </h3>
                        {thread.creator === currentUsername && !isExpanded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingThreadId(thread.id);
                              setEditThreadTitle(thread.title);
                              setEditThreadDesc(thread.description);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Thread"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>

                      <p className={cn(
                        "text-xs text-slate-600 leading-relaxed",
                        isExpanded ? "" : "line-clamp-2"
                      )}>
                        {thread.description}
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-4 pt-1 text-[10px] font-bold text-slate-400 select-none uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {thread.comments.length} comments
                    </span>

                    {/* ONLY likes count is visible publicly - other elements hidden from other users */}
                    <span className="text-emerald-600 font-bold">
                      👍 {thread.likes} Upvotes
                    </span>

                    {thread.userRatings && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] border border-slate-200">
                        My ratings: I: {thread.userRatings.informed} ★ / E: {thread.userRatings.effective} ★
                      </span>
                    )}

                    {thread.creator === currentUsername && isExpanded && !editingThreadId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingThreadId(thread.id);
                          setEditThreadTitle(thread.title);
                          setEditThreadDesc(thread.description);
                        }}
                        className="text-[9px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded px-1.5 py-0.5 flex items-center gap-0.5 ml-auto cursor-pointer"
                      >
                        <Edit2 size={9} />
                        Edit Thread Content
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible expanded section */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-6">
                  
                  {/* Rating Dimension Widget Collapsible */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setOpenThreadRatings(prev => ({ ...prev, [thread.id]: !prev[thread.id] }))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                      {openThreadRatings[thread.id] ? "Hide Deliberation Ratings Form" : "Rate this Deliberation Idea (Expand)"}
                    </button>

                    <AnimatePresence>
                      {openThreadRatings[thread.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                📊 Rate this Deliberation Idea
                              </h4>
                              <p className="text-[9px] text-slate-500 italic">
                                *Ratings represent consensus projections. Only likes count is publicly visible!
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Informed */}
                              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                                    💡 Informed Rating
                                  </span>
                                  <span className="text-[10px] font-bold font-mono text-slate-400">
                                    (Base of draft accuracy)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => {
                                        const currentRatings = thread.userRatings || { informed: 3, effective: 3 };
                                        handleRateThread(thread.id, null, { ...currentRatings, informed: star });
                                      }}
                                      className="text-amber-400 hover:scale-110 active:scale-95 transition-all p-0.5 cursor-pointer"
                                    >
                                      <Star 
                                        size={18} 
                                        className={cn(
                                          (thread.userRatings?.informed || 0) >= star 
                                            ? "fill-amber-400 text-amber-400" 
                                            : "text-slate-300"
                                        )} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Effective */}
                              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                                    ⚡ Effective Rating
                                  </span>
                                  <span className="text-[10px] font-bold font-mono text-slate-400">
                                    (Operational impact)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => {
                                        const currentRatings = thread.userRatings || { informed: 3, effective: 3 };
                                        handleRateThread(thread.id, null, { ...currentRatings, effective: star });
                                      }}
                                      className="text-amber-400 hover:scale-110 active:scale-95 transition-all p-0.5 cursor-pointer"
                                    >
                                      <Star 
                                        size={18} 
                                        className={cn(
                                          (thread.userRatings?.effective || 0) >= star 
                                            ? "fill-amber-400 text-amber-400" 
                                            : "text-slate-300"
                                        )} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Elevate to proposal banner */}
                  {!thread.elevatedToProposalId ? (
                    <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-4 text-white shadow-md border border-amber-500 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-900">
                            👑 Elevate this Idea to Proposal
                          </h4>
                          <p className="text-[10px] text-amber-95/90 mt-0.5">
                            Satisfied with the forum comments? Move this discussion directly into the swipe queue!
                          </p>
                        </div>
                        <button
                          onClick={() => setElevatingThreadId(elevatingThreadId === thread.id ? null : thread.id)}
                          className="px-4 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          {elevatingThreadId === thread.id ? 'Cancel Elevation' : 'Deploy Proposal'}
                        </button>
                      </div>

                      {/* Elevation Configuration Form */}
                      <AnimatePresence>
                        {elevatingThreadId === thread.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-950/90 text-white rounded-xl p-4 space-y-3 text-xs overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Pool Registry</label>
                                <select
                                  value={elevationCategory}
                                  onChange={(e) => setElevationCategory(e.target.value as any)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="main">Main Pool</option>
                                  <option value="emergency">Emergencies</option>
                                  <option value="political">Socioeconomics</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requested Budget (€)</label>
                                <input
                                  type="number"
                                  placeholder="Approx. cost"
                                  value={elevationCost}
                                  onChange={(e) => setElevationCost(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => handleElevateToProposal(thread.id)}
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5"
                            >
                              <ArrowUpRight size={13} />
                              Confirm Proposal Live Deployment
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-emerald-600" />
                        <span>This idea has been elevated to the live proposal database!</span>
                      </div>
                      <span className="bg-emerald-600 text-white font-mono text-[9px] font-black uppercase rounded-lg px-2.5 py-0.5">
                        Active in {thread.category === 'political' ? 'Socioeconomics' : thread.category === 'emergency' ? 'Emergencies' : 'Main Pool'} Pool
                      </span>
                    </div>
                  )}

                  {/* Comments section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      💬 Deliberation Comments ({thread.comments.length})
                    </h4>

                    {/* New comment form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Join the sandbox debate..."
                        value={commentInputs[thread.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [thread.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(thread.id);
                        }}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                      />
                      <button
                        onClick={() => handleAddComment(thread.id)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </div>

                    {/* Recursive Comments list */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {thread.comments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No deliberation comments yet. Be the first to express feedback!</p>
                      ) : (
                        thread.comments.map((comment) => {
                          // Recursive comment rendering
                          const renderComment = (comment: any, depth = 0) => {
                            const isEditing = editingCommentId === comment.id;
                            const isReplying = replyCommentId === comment.id;
                            const hasVersions = comment.versions && comment.versions.length > 0;
                            const isRatingsOpen = !!openCommentRatings[comment.id];

                            return (
                              <div key={comment.id} className={cn(
                                "bg-white border border-slate-100 p-3 rounded-2xl space-y-2.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
                                depth > 0 ? "ml-4 border-l-2 border-indigo-100 pl-3.5" : ""
                              )}>
                                {/* Author / Timestamp / History */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      onClick={() => onInspectUser?.(comment.user)}
                                      className="text-[9px] font-black uppercase text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      u/{comment.user}
                                    </span>
                                    <span className="text-[8px] text-slate-300 font-mono">{comment.timestamp}</span>
                                    {hasVersions && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedHistoryItem({
                                            title: `Comment by ${comment.user}`,
                                            versions: comment.versions,
                                            currentValue: { text: comment.text }
                                          });
                                        }}
                                        className="inline-flex items-center gap-0.5 text-[8px] font-black text-amber-600 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 cursor-pointer"
                                        title="View edited history log"
                                      >
                                        <History size={9} />
                                        <span>v{comment.versions.length + 1} (Edited)</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Edit / Reply Actions */}
                                  <div className="flex items-center gap-2">
                                    {comment.user === currentUsername && !isEditing && (
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditCommentText(comment.text);
                                        }}
                                        className="text-[9px] font-black text-slate-400 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer"
                                        title="Edit Comment"
                                      >
                                        <Edit2 size={9} />
                                        <span>Edit</span>
                                      </button>
                                    )}
                                    {!isReplying && (
                                      <button
                                        onClick={() => {
                                          setReplyCommentId(comment.id);
                                          setReplyCommentText('');
                                        }}
                                        className="text-[9px] font-black text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                                        title="Reply to comment"
                                      >
                                        <Reply size={9} />
                                        <span>Reply</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Comment text or Edit Box */}
                                {isEditing ? (
                                  <div className="space-y-1.5 pt-1">
                                    <textarea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      className="w-full text-xs font-medium p-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                                      rows={2}
                                    />
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-2.5 py-1 text-[9px] font-bold uppercase text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleEditCommentSubmit(thread.id, comment.id)}
                                        className="px-2.5 py-1 text-[9px] font-black uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Check size={9} />
                                        Save Revision
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">{comment.text}</p>
                                )}

                                {/* Comment Expandable Star Rating + Likes */}
                                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-50 select-none">
                                  {/* Like/Dislike Comment */}
                                  <div className="flex items-center gap-1.5 text-[9px] font-black font-mono">
                                    <button
                                      onClick={() => handleRateCommentSubmit(thread.id, comment.id, 'like')}
                                      className={cn(
                                        "hover:scale-110 active:scale-95 transition-all p-0.5 cursor-pointer rounded",
                                        comment.userReactions?.includes('like') 
                                          ? "text-emerald-600 bg-emerald-50 scale-105" 
                                          : "text-slate-400 hover:text-emerald-600"
                                      )}
                                      title="Upvote Comment"
                                    >
                                      <ThumbsUp 
                                        size={11} 
                                        className={cn(
                                          comment.userReactions?.includes('like') 
                                            ? "fill-emerald-600 text-emerald-600" 
                                            : "text-slate-400"
                                        )} 
                                      />
                                    </button>
                                    <span className={cn(
                                      comment.userReactions?.includes('like') ? "text-emerald-600 font-bold font-mono" : "text-slate-600 font-mono"
                                    )}>
                                      {comment.reactions?.like || 0}
                                    </span>
                                    
                                    <button
                                      onClick={() => handleRateCommentSubmit(thread.id, comment.id, 'dislike')}
                                      className={cn(
                                        "hover:scale-110 active:scale-95 transition-all p-0.5 cursor-pointer ml-1 rounded",
                                        comment.userReactions?.includes('dislike') 
                                          ? "text-rose-600 bg-rose-50 scale-105" 
                                          : "text-slate-400 hover:text-rose-600"
                                      )}
                                      title="Downvote Comment"
                                    >
                                      <ThumbsDown 
                                        size={11} 
                                        className={cn(
                                          comment.userReactions?.includes('dislike') 
                                            ? "fill-rose-600 text-rose-600" 
                                            : "text-slate-400"
                                        )} 
                                      />
                                    </button>
                                  </div>

                                  {/* Expandable Rating Button */}
                                  <div className="relative">
                                    <button
                                      onClick={() => setOpenCommentRatings(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                      className="text-[9px] font-black text-slate-500 hover:text-amber-600 flex items-center gap-0.5 bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                                    >
                                      <Star size={10} className="text-amber-500 fill-amber-500" />
                                      <span>{isRatingsOpen ? "Close Audit" : "Rate Insight"}</span>
                                    </button>

                                    {isRatingsOpen && (
                                      <div className="absolute top-6 left-0 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl z-25 w-44 space-y-2 text-[10px] animate-in fade-in zoom-in-95 duration-100">
                                        <div className="font-black text-[9px] uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                                          Rate Comment Quality
                                        </div>
                                        
                                        {/* Informed reaction */}
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-slate-600">Informed?</span>
                                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded p-0.5">
                                            <button
                                              onClick={() => handleRateCommentSubmit(thread.id, comment.id, null, { informed: 'informed' })}
                                              className={cn(
                                                "px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer",
                                                comment.userReactions?.includes('informed')
                                                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                              )}
                                              title="Mark as deeply informed"
                                            >
                                              Yes ({comment.reactions?.informed || 0})
                                            </button>
                                            <button
                                              onClick={() => handleRateCommentSubmit(thread.id, comment.id, null, { informed: 'uninformed' })}
                                              className={cn(
                                                "px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer",
                                                comment.userReactions?.includes('uninformed')
                                                  ? "bg-rose-600 text-white shadow-sm font-bold"
                                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                              )}
                                              title="Mark as uninformed"
                                            >
                                              No ({comment.reactions?.uninformed || 0})
                                            </button>
                                          </div>
                                        </div>

                                        {/* Effective reaction */}
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-slate-600">Effective?</span>
                                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded p-0.5">
                                            <button
                                              onClick={() => handleRateCommentSubmit(thread.id, comment.id, null, { effective: 'effective' })}
                                              className={cn(
                                                "px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer",
                                                comment.userReactions?.includes('effective')
                                                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                              )}
                                              title="Mark as highly constructive"
                                            >
                                              Yes ({comment.reactions?.effective || 0})
                                            </button>
                                            <button
                                              onClick={() => handleRateCommentSubmit(thread.id, comment.id, null, { effective: 'ineffective' })}
                                              className={cn(
                                                "px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer",
                                                comment.userReactions?.includes('ineffective')
                                                  ? "bg-rose-600 text-white shadow-sm font-bold"
                                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                              )}
                                              title="Mark as ineffective/off-topic"
                                            >
                                              No ({comment.reactions?.ineffective || 0})
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Sub-comment Reply box */}
                                {isReplying && (
                                  <div className="flex gap-1.5 pt-1.5 border-t border-slate-50 pl-2">
                                    <CornerDownRight size={14} className="text-slate-300 mt-2.5 shrink-0" />
                                    <div className="flex-1 space-y-1">
                                      <input
                                        type="text"
                                        placeholder={`Reply to u/${comment.user}...`}
                                        value={replyCommentText}
                                        onChange={(e) => setReplyCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleReplyCommentSubmit(thread.id, comment.id);
                                        }}
                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                                      />
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setReplyCommentId(null)}
                                          className="px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400 hover:bg-slate-100 rounded"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleReplyCommentSubmit(thread.id, comment.id)}
                                          className="px-2 py-0.5 text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm"
                                        >
                                          Send Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Recursive replies render */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100/65">
                                    {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
                                  </div>
                                )}
                              </div>
                            );
                          };

                          return renderComment(comment, 0);
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Version History Modal */}
      {selectedHistoryItem && (
        <VersionHistoryModal
          isOpen={!!selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          title={selectedHistoryItem.title}
          versions={selectedHistoryItem.versions}
          currentValue={selectedHistoryItem.currentValue}
        />
      )}
    </div>
  );
}
