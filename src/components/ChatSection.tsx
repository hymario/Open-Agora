import React, { useState } from 'react';
import { Comment } from '../types';
import { Send, User, ThumbsUp, ThumbsDown, Brain, HelpCircle, Target, ShieldAlert, Reply, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getUserCivicBadge } from '../lib/civicNumber';

interface ChatSectionProps {
  ideaId: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
  selectedRepresentative?: string | null;
  onSelectRepresentative?: (repName: string | null) => void;
  onInspectUser?: (username: string) => void;
}

interface ReactionButtonProps {
  type: string;
  icon: any;
  count: number;
  commentId: string;
  activeColor: string;
  onReaction: (commentId: string, type: string) => void;
  isActive?: boolean;
}

const ReactionButton = ({ 
  type, 
  icon: Icon, 
  count, 
  commentId,
  activeColor,
  onReaction,
  isActive = false
}: ReactionButtonProps) => (
  <button
    onClick={() => onReaction(commentId, type)}
    className={cn(
      "flex items-center gap-1.5 p-1.5 rounded-md border transition-all active:scale-95 cursor-pointer",
      isActive 
        ? "bg-slate-900 text-amber-400 border-slate-900 shadow-md scale-105 font-bold font-mono" 
        : count > 0 
          ? "bg-slate-100 text-slate-700 border-slate-300" 
          : "bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-200"
    )}
  >
    <Icon size={12} className={cn(isActive ? "text-amber-400 fill-amber-400" : (count > 0 && activeColor))} />
    {count > 0 && <span className="text-[10px] font-mono font-bold">{count}</span>}
  </button>
);

interface CommentNodeProps {
  comment: Comment;
  depth?: number;
  onReaction: (commentId: string, type: string) => void;
  onReply: (comment: Comment) => void;
  selectedRepresentative?: string | null;
  onSelectRepresentative?: (repName: string | null) => void;
  onInspectUser?: (username: string) => void;
  userReactionsMap?: Record<string, string[]>;
  key?: string | number;
}

const CommentNode = ({ 
  comment, 
  depth = 0, 
  onReaction, 
  onReply,
  selectedRepresentative,
  onSelectRepresentative,
  onInspectUser,
  userReactionsMap = {}
}: CommentNodeProps) => {
  const isRep = selectedRepresentative === comment.user;
  const canDelegate = comment.user !== 'System' && comment.user !== 'Anonymous' && onSelectRepresentative;
  const activeReactions = userReactionsMap[comment.id] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col gap-2", depth > 0 && "pl-4 border-l border-slate-200 mt-2")}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => onInspectUser?.(comment.user)}
            className="text-[10px] font-black text-slate-500 hover:text-slate-900 transition-colors tracking-tight flex items-center gap-1.5 cursor-pointer"
          >
            {comment.user}
            <span className="text-[8px] font-bold px-1.5 py-0.2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-mono">
              {getUserCivicBadge(comment.user)}
            </span>
          </button>
          <span className="text-[8px] text-slate-400 font-mono">{comment.timestamp}</span>
        </div>
        
        {canDelegate && (
          <button
            onClick={() => onSelectRepresentative(isRep ? null : comment.user)}
            className={cn(
              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-sm border",
              isRep 
                ? "bg-green-600 border-green-700 text-white" 
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800"
            )}
          >
            {isRep ? "🗳️ Active Rep" : "🗳️ Delegate"}
          </button>
        )}
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          "{comment.text}"
        </p>
      </div>

      <div className="flex flex-wrap gap-1 pl-1 pt-1 ml-0.5">
        <ReactionButton type="like" icon={ThumbsUp} count={comment.reactions.like} commentId={comment.id} activeColor="text-blue-600" onReaction={onReaction} isActive={activeReactions.includes('like')} />
        <ReactionButton type="dislike" icon={ThumbsDown} count={comment.reactions.dislike} commentId={comment.id} activeColor="text-red-600" onReaction={onReaction} isActive={activeReactions.includes('dislike')} />
        <ReactionButton type="informed" icon={Brain} count={comment.reactions.informed} commentId={comment.id} activeColor="text-green-600" onReaction={onReaction} isActive={activeReactions.includes('informed')} />
        <ReactionButton type="uninformed" icon={HelpCircle} count={comment.reactions.uninformed} commentId={comment.id} activeColor="text-amber-600" onReaction={onReaction} isActive={activeReactions.includes('uninformed')} />
        <ReactionButton type="effective" icon={Target} count={comment.reactions.effective} commentId={comment.id} activeColor="text-purple-600" onReaction={onReaction} isActive={activeReactions.includes('effective')} />
        <ReactionButton type="ineffective" icon={ShieldAlert} count={comment.reactions.ineffective} commentId={comment.id} activeColor="text-orange-600" onReaction={onReaction} isActive={activeReactions.includes('ineffective')} />
        
        <button 
          onClick={() => onReply(comment)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 ml-1 border border-slate-200 shadow-sm cursor-pointer"
        >
          <Reply size={10} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Reply</span>
        </button>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              depth={depth + 1} 
              onReaction={onReaction} 
              onReply={onReply}
              selectedRepresentative={selectedRepresentative}
              onSelectRepresentative={onSelectRepresentative}
              onInspectUser={onInspectUser}
              userReactionsMap={userReactionsMap}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const ChatSection: React.FC<ChatSectionProps> = ({ 
  ideaId, 
  comments, 
  onAddComment, 
  onFocusChange,
  selectedRepresentative,
  onSelectRepresentative,
  onInspectUser
}) => {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  
  // Track reactions of the user: commentId -> reactionType[]
  const [userReactionsMap, setUserReactionsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('idea_swipe_comment_user_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('idea_swipe_comment_user_reactions', JSON.stringify(userReactionsMap));
    } catch (e) {
      console.error(e);
    }
  }, [userReactionsMap]);

  // Sync with props and sort by community score
  React.useEffect(() => {
    const sorted = [...comments].sort((a, b) => {
      const scoreA = (a.reactions.like + a.reactions.informed + a.reactions.effective) - 
                    (a.reactions.dislike + a.reactions.uninformed + a.reactions.ineffective);
      const scoreB = (b.reactions.like + b.reactions.informed + b.reactions.effective) - 
                    (b.reactions.dislike + b.reactions.uninformed + b.reactions.ineffective);
      return scoreB - scoreA;
    });
    setLocalComments(sorted);
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (replyingTo) {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/comments/${replyingTo.id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newComment, user: 'Citizen_M' })
        });
        const reply = await res.json();
        
        // Update local state to show reply immediately
        setLocalComments(prev => {
          const addReply = (nodes: Comment[]): Comment[] => {
            return nodes.map(node => {
              if (node.id === replyingTo.id) {
                return { ...node, replies: [...(node.replies || []), reply] };
              }
              if (node.replies) {
                return { ...node, replies: addReply(node.replies) };
              }
              return node;
            });
          };
          return addReply(prev);
        });
        
        setReplyingTo(null);
        setNewComment('');
        onFocusChange?.(false);
      } catch (error) {
        console.error('Reply failed:', error);
      }
    } else {
      onAddComment(newComment);
      setNewComment('');
      onFocusChange?.(false);
    }
  };

  const handleReaction = async (commentId: string, reaction: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction, user: 'Citizen_M' })
      });
      const data = await res.json();
      if (data.success) {
        // Update user reactions map from server response
        setUserReactionsMap(prev => ({
          ...prev,
          [commentId]: data.userReactions || []
        }));

        setLocalComments(prev => {
          const updateNodes = (nodes: Comment[]): Comment[] => {
            return nodes.map(node => {
              if (node.id === commentId) {
                return { ...node, reactions: data.reactions };
              }
              if (node.replies) {
                return { ...node, replies: updateNodes(node.replies) };
              }
              return node;
            });
          };
          
          const updated = updateNodes(prev);
          // Only sort top level
          return updated.sort((a, b) => {
            const scorePlus = (c: Comment) => (c.reactions.like + c.reactions.informed + c.reactions.effective);
            const scoreMinus = (c: Comment) => (c.reactions.dislike + c.reactions.uninformed + c.reactions.ineffective);
            return (scorePlus(b) - scoreMinus(b)) - (scorePlus(a) - scoreMinus(a));
          });
        });
      }
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {localComments.length === 0 ? (
          <p className="text-center text-slate-300 text-[10px] uppercase tracking-widest py-8">
            Start the discussion
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {localComments.map((comment) => (
              <CommentNode 
                key={comment.id} 
                comment={comment} 
                onReaction={handleReaction} 
                onReply={(c) => { setReplyingTo(c); onFocusChange?.(true); }}
                selectedRepresentative={selectedRepresentative}
                onSelectRepresentative={onSelectRepresentative}
                onInspectUser={onInspectUser}
                userReactionsMap={userReactionsMap}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 flex items-center justify-between border-t border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Replying to <span className="text-slate-900">{replyingTo.user}</span>
          </p>
          <button onClick={() => { setReplyingTo(null); onFocusChange?.(false); }} className="text-slate-400 hover:text-slate-900">
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
        <div className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => onFocusChange?.(true)}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            className="w-full bg-slate-100 rounded-full pl-4 pr-12 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center font-bold"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
};
