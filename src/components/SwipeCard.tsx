import React, { useState, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Idea, Comment } from '../types';
import { ChatSection } from './ChatSection';
import { UpgradesSection } from './UpgradesSection';
import { DelegationSection } from './DelegationSection';
import { Heart, X, ChevronDown, ChevronUp, TrendingUp, GitFork, ClipboardList, Star, Coins, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCivicNumber, getUserCivicBadge } from '../lib/civicNumber';

interface SwipeCardProps {
  idea: Idea;
  onSwipe?: (direction: 'up' | 'down', ratings: any) => void;
  isTop: boolean;
  onIdeaUpdated: (updatedIdea: Idea) => void;
  onIdeaForked: (newIdea: Idea) => void;
  selectedRepresentative: string | null;
  onSelectRepresentative: (repName: string | null) => void;
  delegationHistory?: any[];
  onInspectUser?: (username: string) => void;
  onRewind?: () => void;
  userVote?: 'up' | 'down' | null;
  onVote?: (direction: 'up' | 'down' | null, ratings?: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
  activeUsername?: string;
  civicCoins?: number;
  onSpendCivicCoins?: (amount: number) => boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ 
  idea, 
  onSwipe, 
  isTop, 
  onIdeaUpdated, 
  onIdeaForked,
  selectedRepresentative,
  onSelectRepresentative,
  delegationHistory = [],
  onInspectUser,
  onRewind,
  userVote,
  onVote,
  onNext,
  onPrev,
  activeUsername,
  civicCoins = 100,
  onSpendCivicCoins
  }) => {
  const [showRatings, setShowRatings] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'deliberation' | 'upgrades' | 'delegation'>('deliberation');
  const [comments, setComments] = useState<Comment[]>(idea.comments || []);
  
  const [draftRatings, setDraftRatings] = useState({
    informed: 3,
    effective: 3,
  });
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    setDraftRatings({
      informed: Math.round(idea.stats?.informed || 3),
      effective: Math.round(idea.stats?.effective || 3)
    });
    setRatingError(null);
  }, [idea.id]);

  const handleDraftRateChange = (axis: 'informed' | 'effective', value: number) => {
    setDraftRatings(prev => ({ ...prev, [axis]: value }));
    setRatingError(null);
  };

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [idea.id]);

  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 70;
    const velocityThreshold = 250;

    let dir: 'up' | 'down' | null = null;

    // Swiping vertical UP changes to the next slide
    // Swiping vertical DOWN changes to the previous slide
    if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      dir = 'up';
    } else if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
      dir = 'down';
    }

    if (dir) {
      setSwipeDirection(dir);
      setTimeout(() => {
        if (dir === 'up') {
          if (onNext) onNext();
        } else if (dir === 'down') {
          if (onPrev) onPrev();
        }
      }, 50);
    }
  };

  const triggerSwipe = (direction: 'up' | 'down', ratings?: any) => {
    setSwipeDirection(direction);
    setTimeout(() => {
      if (onVote) {
        onVote(direction, ratings || draftRatings);
      } else {
        onSwipe?.(direction, ratings || draftRatings);
      }
    }, 50);
  };

  const handleAddComment = async (text: string) => {
    try {
      const res = await fetch(`/api/ideas/${idea.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user: activeUsername || 'Citizen_M' })
      });
      const newComment = await res.json();
      setComments(prev => [...prev, newComment]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, zIndex: isTop ? 10 : 0, willChange: 'transform' }}
      drag={isTop && !isInputFocused && !isDescriptionExpanded && !showRatings ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.6}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 28 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: swipeDirection === 'left' ? -400 : (swipeDirection === 'right' ? 400 : 0),
        y: swipeDirection === 'up' ? -600 : (swipeDirection === 'down' ? 600 : 0), 
        opacity: 0
      }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 35 
      }}
      className={cn(
        "absolute inset-0 w-full h-full p-4 flex flex-col gap-4",
        isTop && !isChatFocused && !isDescriptionExpanded && !showRatings && "touch-none"
      )}
    >
      {/* 1. TOP PORTION (IDEA DETAILS) */}
      <motion.div 
        animate={{ 
          flexGrow: isDescriptionExpanded ? 8 : (isChatFocused ? 0.05 : 6),
          height: isDescriptionExpanded ? '100%' : (isChatFocused ? '5%' : '92%'),
          opacity: isChatFocused ? 0.35 : 1
        }}
        className="flex flex-col relative min-h-0"
      >
        <div 
          className={cn(
            "relative flex-1 bg-white rounded-3xl overflow-hidden border border-slate-200 flex flex-col group touch-pan-y shadow-sm h-full",
            isDescriptionExpanded ? "overflow-y-auto" : "cursor-grab active:cursor-grabbing"
          )}
        >
          <div className="absolute inset-0 pointer-events-none">
            {/* 1. Always render the beautiful category-specific gradient as a fallback background */}
            <div className={cn(
              "absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden transition-all duration-500",
              idea.category === 'emergency' && "bg-gradient-to-br from-amber-500/20 via-orange-600/15 to-red-600/10",
              idea.category === 'political' && "bg-gradient-to-br from-purple-500/20 via-indigo-600/15 to-blue-600/10",
              (idea.category === 'main' || !idea.category) && "bg-gradient-to-br from-slate-500/20 via-sky-600/15 to-slate-900/10"
            )}>
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:14px_24px]" />
              
              {/* Giant backdrop icon */}
              <div className="absolute -right-4 -bottom-10 opacity-[0.08] text-slate-950 scale-[4]">
                {idea.category === 'emergency' && <Heart size={120} />}
                {idea.category === 'political' && <TrendingUp size={120} />}
                {idea.category === 'main' && <ClipboardList size={120} />}
              </div>

              {/* Smaller centered pulsing icon */}
              <div className={cn(
                "flex flex-col items-center gap-2 text-slate-400 transition-opacity duration-300",
                isChatFocused && "opacity-20",
                isDescriptionExpanded && "opacity-10"
              )}>
                {idea.category === 'emergency' && <Heart className="text-amber-500/60 animate-pulse" size={42} />}
                {idea.category === 'political' && <TrendingUp className="text-purple-500/60" size={42} />}
                {idea.category === 'main' && <ClipboardList className="text-slate-400/60" size={42} />}
              </div>
            </div>

            {/* 2. Render the image on top if we have one and no error */}
            {idea.image && !imageError && idea.image !== 'null' && idea.image !== 'undefined' && idea.image.trim() !== '' && (
              <img 
                src={idea.image} 
                alt="" 
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover opacity-85 grayscale hover:grayscale-0 transition-all duration-700",
                  isChatFocused && "opacity-20",
                  isDescriptionExpanded && "opacity-15 blur-sm"
                )}
              />
            )}
            
            {/* 3. Gradient bottom overlay */}
            {idea.image && !imageError && idea.image !== 'null' && idea.image !== 'undefined' && idea.image.trim() !== '' && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent" />
            )}
          </div>

          {/* Content Container */}
          <div 
            onClick={(e) => {
              if (isTop) {
                e.stopPropagation();
                if (isChatFocused) {
                  setIsChatFocused(false);
                }
              }
            }}
            className="relative flex-1 flex flex-col justify-between p-4 pb-3 cursor-pointer pointer-events-auto select-none min-h-0 text-slate-800"
          >
            {/* 1. FIXED TOP HEADER */}
            <div className="flex flex-col gap-1.5 shrink-0 pb-2 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[9px] font-mono text-slate-400 tracking-[0.2em] uppercase transition-opacity group-hover:opacity-100 opacity-60">By: @{idea.creator}</span>
                </div>
                {/* Compact Rate & Stats Button at the Top Right (Visible only when expanded) */}
                {isDescriptionExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRatings(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 border border-amber-400 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 z-20"
                    title="View Ratings & Stats"
                  >
                    <Star size={11} className="text-white fill-white animate-pulse" />
                    <span>Rate & Stats</span>
                  </button>
                )}
              </div>

              {idea.parentTitle && (
                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 tracking-wide bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5 w-max">
                  <GitFork size={10} className="rotate-180" /> Derived from: {idea.parentTitle}
                </div>
              )}
            </div>
            
            {/* 2. NON-SCROLLABLE BODY AREA */}
            <div className="flex-1 overflow-hidden pr-1 my-2 space-y-3 min-h-0 text-slate-800">
              <div className="flex justify-between items-start gap-3 pt-1">
                <h2 className={cn(
                  "font-black leading-[0.9] tracking-tighter uppercase text-slate-900 break-words drop-shadow-sm transition-all text-left flex-1",
                  isDescriptionExpanded ? "text-3xl border-b border-slate-100 pb-2" : (isChatFocused ? "text-lg" : "text-2xl")
                )}>
                  {idea.title}
                </h2>
              </div>
              
              <AnimatePresence mode="wait">
                {!isChatFocused && (
                  <motion.div
                    key="normal-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-[12px] text-slate-600 leading-relaxed font-medium drop-shadow-sm text-left">
                      {idea.description}
                    </p>

                    {/* Compact toggle to expand specs, ratings, and funding */}
                    <div className="flex justify-start pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <ChevronUp size={11} className="text-slate-500" />
                            <span>Collapse Stats & Funding</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={11} className="text-slate-500 animate-bounce" />
                            <span>Expand Stats & Funding</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isDescriptionExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="space-y-3 pt-1"
                      >
                        {/* COMMUNITY RATINGS LEDGER */}
                        <div className="flex items-center gap-2 pb-0.5">
                          {userVote ? (
                            <>
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                <span className="text-slate-400">💡 Informed:</span>
                                <div className="flex items-center gap-0.5 font-mono text-slate-900">
                                  <span>{(idea.stats?.informed ?? 5.0).toFixed(1)}</span>
                                  <span className="text-slate-400 font-normal">/5</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                <span className="text-slate-400">⚡ Effective:</span>
                                <div className="flex items-center gap-0.5 font-mono text-slate-900">
                                  <span>{(idea.stats?.effective ?? 5.0).toFixed(1)}</span>
                                  <span className="text-slate-400 font-normal">/5</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-400 w-full justify-between select-none" title="Make a blind swipe prediction (up/down) to reveal these quality ratings!">
                              <span className="flex items-center gap-1.5 text-slate-500 font-black">
                                🔒 RATINGS HIDDEN BEFORE VOTE
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 italic">Predict quality to unlock</span>
                            </div>
                          )}
                        </div>

                        {/* INVESTMENT/FUNDING TRACKER */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Coins size={14} className="text-amber-500 animate-pulse" />
                              <span>Money Invested:</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                              ${(idea.investedAmount || 0).toLocaleString()} / ${(idea.cost || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                (idea.investedAmount >= idea.cost) ? "bg-emerald-500" : "bg-amber-500"
                              )}
                              style={{ width: `${Math.min(100, ((idea.investedAmount || 0) / (idea.cost || 1)) * 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>Start Capital (Seed): ${(idea.startingInvestedAmount || 0).toLocaleString()}</span>
                            <span>Community Pledges: ${Math.max(0, (idea.investedAmount || 0) - (idea.startingInvestedAmount || 0)).toLocaleString()}</span>
                          </div>

                          {/* Quick Pledge Action */}
                          {(idea.investedAmount || 0) < (idea.cost || 0) ? (
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Invest/Pledge Funds:</span>
                              <div className="flex gap-1.5">
                                {[100, 1000, 5000].map((amt) => (
                                  <button
                                    key={amt}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const res = await fetch(`/api/ideas/${idea.id}/invest`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ amount: amt })
                                        });
                                        const data = await res.json();
                                        if (data.success && data.idea) {
                                          onIdeaUpdated(data.idea);
                                        }
                                      } catch (err) {
                                        console.error("Investment failed:", err);
                                      }
                                    }}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-[9px] font-bold font-mono transition-all cursor-pointer shadow-sm active:scale-95"
                                  >
                                    +${amt.toLocaleString()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="pt-1 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 py-1 rounded-lg">
                              <CheckCircle size={10} className="text-emerald-600" /> Fully Funded & Dispatched (Done)
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Star ratings assessment has been moved to a separate distinct floating modal overlay */}

                    {/* SPECIFICATIONS & IMPORTANT INFO SECTION FOR EXPANDED MODE */}
                    {isDescriptionExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Spec Header */}
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                          <ClipboardList size={14} className="text-slate-900" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Proposal Specifications</h3>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-mono uppercase text-[8px] tracking-wider block">Financial Impact</span>
                            <div className="font-black text-slate-800 flex flex-col gap-0.5">
                              <span>${idea.cost.toLocaleString()} <span className="text-[8px] text-slate-400 font-normal">total</span></span>
                              <span className="text-[8px] text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded w-max mt-0.5">{formatCivicNumber(idea.cost)}</span>
                            </div>
                            <div className="text-[8px] text-green-600 font-bold">${(idea.cost / 125000).toFixed(2)} per active user</div>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-mono uppercase text-[8px] tracking-wider block">Governance Scope</span>
                            <div className="font-black text-slate-800">
                              {idea.category === 'political' ? 'Socioeconomics' : idea.category === 'emergency' ? 'Emergencies' : 'Main Pool'}
                            </div>
                            <div className="text-[8px] text-slate-400">Direct vote Consent required</div>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-mono uppercase text-[8px] tracking-wider block">Creator Signature</span>
                            <div className="font-black text-slate-800 font-mono flex items-center gap-1">
                              @{idea.creator}
                              <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2">
                                {getUserCivicBadge(idea.creator)}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400">Verified Parallel Member</div>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-mono uppercase text-[8px] tracking-wider block">Civic Alignment Check</span>
                            <div className="font-black text-slate-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Autonomous Asset</span>
                            </div>
                            <div className="text-[8px] text-slate-400">Kept in direct common property</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. DIRECT VOTING BUTTONS BAR */}
            {!isChatFocused && (
              <div 
                className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 shrink-0 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    🗳️ Direct Vote (Swipe Prediction)
                  </span>
                  {userVote && (
                    <span className="text-[9px] font-black uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse">
                      ● Active Vote Logged
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSwipe('down');
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer border",
                      userVote === 'down'
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
                        : "bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 text-slate-600 hover:border-rose-200"
                    )}
                    id="vote-reject-button"
                  >
                    <ThumbsDown size={14} className={cn(userVote === 'down' ? "fill-white" : "")} />
                    <span>Reject (Down)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSwipe('up');
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer border",
                      userVote === 'up'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                        : "bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 text-slate-600 hover:border-emerald-200"
                    )}
                    id="vote-approve-button"
                  >
                    <ThumbsUp size={14} className={cn(userVote === 'up' ? "fill-white" : "")} />
                    <span>Approve (Up)</span>
                  </button>
                </div>

                {!userVote && (
                  <p className="text-[9px] text-slate-400 font-medium text-center italic mt-0.5">
                    *Approve adds to support index; Reject flags as low quality. Unlocks ratings!
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* 4. CHAT / BOTTOM SECTION (collapses into a sleek bar by default, unrolls to view comments) */}
      <motion.div 
        animate={{ 
          height: isDescriptionExpanded ? 0 : (isChatFocused ? '95%' : '48px'),
          flexGrow: isDescriptionExpanded ? 0 : (isChatFocused ? 6 : 0.05),
          opacity: isDescriptionExpanded ? 0 : 1
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "flex flex-col overflow-hidden min-h-0 transition-shadow rounded-2xl border bg-slate-50/85 shadow-sm",
          !isChatFocused ? "hover:bg-slate-100 hover:border-slate-300 cursor-pointer" : "",
          isDescriptionExpanded && "pointer-events-none hidden"
        )}
      >
        {!isChatFocused ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsChatFocused(true);
            }}
            className="w-full h-full min-h-[46px] flex items-center justify-between px-4 select-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                Comments & Deliberation ({comments.length + (idea.upgrades?.length || 0)})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm active:scale-95 transition-all">
              <span>View Comments</span>
              <ChevronUp size={11} className="text-slate-500 animate-bounce" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full p-1 min-h-0">
            <div 
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center justify-between mb-2 px-2 pt-2 shrink-0 select-none"
            >
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('deliberation');
                  }}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer",
                    activeTab === 'deliberation' 
                      ? "text-slate-900 border-slate-900" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Deliberation ({comments.length})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('upgrades');
                  }}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer",
                    activeTab === 'upgrades' 
                      ? "text-slate-900 border-slate-900" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Upgrades ({idea.upgrades?.length || 0})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('delegation');
                  }}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer",
                    activeTab === 'delegation' 
                      ? "text-slate-900 border-slate-900" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  🗳️ Delegate
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {idea.parentId && (
                  <span className="text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-tighter hidden xs:inline">
                    Forked
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChatFocused(false);
                    setIsInputFocused(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                >
                  <ChevronDown size={11} className="text-slate-600" />
                  <span className="hidden xs:inline">Collapse</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === 'deliberation' ? (
                  <motion.div 
                    key="deliberation"
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChatSection 
                      ideaId={idea.id} 
                      comments={comments} 
                      onAddComment={handleAddComment} 
                      onFocusChange={(focused) => {
                        setIsChatFocused(focused);
                        setIsInputFocused(focused);
                      }}
                      selectedRepresentative={selectedRepresentative}
                      onSelectRepresentative={onSelectRepresentative}
                      onInspectUser={onInspectUser}
                    />
                  </motion.div>
                ) : activeTab === 'upgrades' ? (
                  <motion.div 
                    key="upgrades"
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <UpgradesSection
                      idea={idea}
                      onIdeaUpdated={onIdeaUpdated}
                      onIdeaForked={onIdeaForked}
                      onFocusChange={(focused) => {
                        setIsChatFocused(focused);
                        setIsInputFocused(focused);
                      }}
                      selectedRepresentative={selectedRepresentative}
                      onSelectRepresentative={onSelectRepresentative}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="delegation"
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DelegationSection
                      idea={idea}
                      selectedRepresentative={selectedRepresentative}
                      onSelectRepresentative={onSelectRepresentative}
                      onSwipe={triggerSwipe}
                      delegationHistory={delegationHistory}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* 5. SEPARATE DISTINCT FLOATING RATING POPUP / OVERLAY */}
      <AnimatePresence>
        {showRatings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowRatings(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[340px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 space-y-4 text-left relative overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 text-slate-900">
                  <Star size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">Civic Proposal Rating & Stats</span>
                </div>
                <button 
                  onClick={() => setShowRatings(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {!userVote ? (
                /* Block rating if no swipe prediction has been made yet */
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-200 text-lg">
                    🔒
                  </div>
                  <p className="text-xs font-black uppercase text-slate-900 tracking-wide">Assessments Locked</p>
                  <p className="text-[10.5px] text-slate-500 max-w-[240px] mx-auto leading-normal">
                    You must swipe (Approve or Reject) to make a quality prediction on this proposal before you can view community ratings or submit detailed assessment reports!
                  </p>
                  <button
                    onClick={() => setShowRatings(false)}
                    className="px-5 py-1.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow active:scale-95"
                  >
                    Return to Swiping
                  </button>
                </div>
              ) : (
                /* Let user rate after voting */
                <>
                  {/* Proposal Statistics & Cost Info */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-sm text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Civic Cost</p>
                        <p className="text-xs font-mono font-black text-slate-950 mt-0.5">{formatCivicNumber(idea.cost)}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-sm text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider font-semibold">Spendable Balance</p>
                        <p className="text-xs font-mono font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                          <Coins size={10} className="text-amber-500" />
                          <span>{civicCoins} CC</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/40 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Unlocked Community Score:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/30">
                          💡 Informed: <span className="font-mono text-slate-900">{(idea.stats?.informed ?? 5.0).toFixed(1)}</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/30">
                          ⚡ Effective: <span className="font-mono text-slate-900">{(idea.stats?.effective ?? 5.0).toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    Rate this proposal. Submitting a detailed report costs <strong className="text-amber-600 font-semibold">1 spendable Civic Coin (CC)</strong>.
                  </p>

                  {/* Informed Criterion */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700">Informed & Evidence-Based:</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                        {draftRatings.informed}/5
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleDraftRateChange('informed', star)}
                          className="p-1 cursor-pointer hover:scale-110 transition-all rounded-lg hover:bg-slate-50"
                          title={`Stage ${star}`}
                        >
                          <Star
                            size={20}
                            className={cn(
                              star <= draftRatings.informed
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 hover:text-slate-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium text-left">
                      How well-researched, factual, and logical is this idea?
                    </p>
                  </div>

                  {/* Effective Criterion */}
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700">Effective Cost/Impact:</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                        {draftRatings.effective}/5
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleDraftRateChange('effective', star)}
                          className="p-1 cursor-pointer hover:scale-110 transition-all rounded-lg hover:bg-slate-50"
                          title={`Stage ${star}`}
                        >
                          <Star
                            size={20}
                            className={cn(
                              star <= draftRatings.effective
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 hover:text-slate-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium text-left">
                      Does the expected outcome justify the financial and social costs?
                    </p>
                  </div>

                  {ratingError && (
                    <p className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-200 p-2 rounded-xl text-center">
                      {ratingError}
                    </p>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => {
                      if (onSpendCivicCoins) {
                        const success = onSpendCivicCoins(1);
                        if (!success) {
                          setRatingError("❌ Insufficient Civic Coins! Swipe correctly to earn more.");
                          return;
                        }
                      }
                      
                      if (onVote) {
                        onVote(userVote, {
                          informed: draftRatings.informed,
                          effective: draftRatings.effective
                        });
                      }
                      setShowRatings(false);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Submit Assessment (-1 CC)
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

