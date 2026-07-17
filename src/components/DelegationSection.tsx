import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Idea, Representative, DelegationHistory } from '../types';
import { POPULAR_REPRESENTATIVES } from '../data/representatives';
import { Check, User, Users, ChevronRight, Sparkles, AlertCircle, RefreshCw, Star, ArrowUpRight, ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';
import { getUserCivicBadge, formatCivicNumber } from '../lib/civicNumber';

interface DelegationSectionProps {
  idea: Idea;
  selectedRepresentative: string | null;
  onSelectRepresentative: (repName: string | null) => void;
  onSwipe: (direction: 'up' | 'down', ratings: { informed: number; effective: number; informedComment?: string; effectiveComment?: string }) => void;
  delegationHistory?: DelegationHistory[];
  onInspectUser?: (username: string) => void;
}

export const DelegationSection: React.FC<DelegationSectionProps> = ({
  idea,
  selectedRepresentative,
  onSelectRepresentative,
  onSwipe,
  delegationHistory = [],
  onInspectUser
 }) => {
  const [autoPilot, setAutoPilot] = useState(false);
  const [sweepInProgress, setSweepInProgress] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [repsState, setRepsState] = useState<Representative[]>(POPULAR_REPRESENTATIVES);

  // Helper to dynamically construct OP as a temporary representative
  const opRepresentative: Representative = {
    name: idea.creator,
    avatar: idea.creator.substring(0, 2).toUpperCase(),
    bio: `Author and original designer of "${idea.title}". Evaluating community feedback and steering project upgrades directly.`,
    alignment: "Original Proposer (OP)",
    matchScore: 95,
    followersCount: idea.votes ? Math.floor(idea.votes * 0.12) : 45,
    recommendations: {
      [idea.id]: {
        vote: "up",
        informed: Math.round(idea.stats.informed) || 4,
        effective: Math.round(idea.stats.effective) || 4,
        comment: "As the original designer, I strongly stand behind this baseline proposal to optimize our municipal services."
      }
    }
  };

  // Helper to dynamically update a representative's delegation target
  const handleUpdateRepresentativeDelegate = (repName: string, delegateTo: string | null) => {
    setRepsState(prev => prev.map(r => {
      if (r.name === repName) {
        return {
          ...r,
          delegatedTo: delegateTo === repName ? undefined : (delegateTo || undefined)
        };
      }
      return r;
    }));
  };

  // Compute the recursive delegation chain starting from selectedRepresentative
  const getDelegationChain = (startName: string | null): string[] => {
    if (!startName) return [];
    const chain: string[] = [startName];
    let current = startName;
    const seen = new Set<string>([startName]);
    
    while (current) {
      const rep = repsState.find(r => r.name === current);
      if (rep?.delegatedTo && !seen.has(rep.delegatedTo)) {
        chain.push(rep.delegatedTo);
        seen.add(rep.delegatedTo);
        current = rep.delegatedTo;
      } else {
        break;
      }
    }
    return chain;
  };

  const chain = getDelegationChain(selectedRepresentative);
  const isChained = chain.length > 1;

  // Find the currently selected representative or construct a dynamic one
  let activeRep = repsState.find(r => r.name === selectedRepresentative);
  if (!activeRep && selectedRepresentative) {
    if (selectedRepresentative === idea.creator) {
      activeRep = opRepresentative;
    } else {
      activeRep = {
        name: selectedRepresentative,
        avatar: selectedRepresentative.substring(0, 2).toUpperCase(),
        bio: `Community member active in deliberation. You have designated them as your direct proxy representative.`,
        alignment: "Delegated Community Voice",
        matchScore: 82,
        followersCount: 1,
        recommendations: {
          [idea.id]: {
            vote: "up",
            informed: 4,
            effective: 4,
            comment: `I stand behind this community proposal. Replicating direct civic consensus.`
          }
        }
      };
    }
  }

  // Resolve recommendation down the chain (the terminal node or closest node in the chain that has custom recommendations)
  const getResolvedRecommendation = () => {
    if (chain.length === 0) return null;
    
    // Traverse backwards to find the recommendation
    for (let i = chain.length - 1; i >= 0; i--) {
      const name = chain[i];
      let repObj = repsState.find(r => r.name === name);
      if (name === idea.creator) {
        repObj = opRepresentative;
      }
      const recObj = repObj?.recommendations[idea.id];
      if (recObj) {
        return {
          resolvedBy: name,
          rec: recObj
        };
      }
    }
    return null;
  };

  const resolved = getResolvedRecommendation();
  const rec = resolved?.rec;
  const resolvedBy = resolved?.resolvedBy;
  
  const handleCopyVote = () => {
    if (!rec) return;
    
    onSwipe(rec.vote, {
      informed: rec.informed,
      effective: rec.effective,
      informedComment: `Delegated auto-copy vote via proxy cascade (${selectedRepresentative} -> resolved by ${resolvedBy}). Comment: "${rec.comment}"`,
      effectiveComment: `Delegated auto-copy vote via proxy cascade (${selectedRepresentative}).`
    });
  };

  const handleOPCopyVote = () => {
    onSwipe("up", {
      informed: Math.round(idea.stats.informed) || 4,
      effective: Math.round(idea.stats.effective) || 4,
      informedComment: `Delegated auto-copy vote to the Original Proposer (OP): ${idea.creator}.`,
      effectiveComment: `Delegated auto-copy vote to OP.`
    });
  };

  const triggerSweep = () => {
    if (!selectedRepresentative) return;
    setSweepInProgress(true);
    setSweepProgress(0);

    // Simulate elegant voting sweep across ideas
    const interval = setInterval(() => {
      setSweepProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSweepInProgress(false);
            // Complete swipe for the current card to proceed
            if (rec) {
              onSwipe(rec.vote, {
                informed: rec.informed,
                effective: rec.effective,
                informedComment: `Auto-Pilot Delegation sweep completed via ${selectedRepresentative}.`,
                effectiveComment: `Auto-pilot ratings submitted.`
              });
            } else {
              onSwipe("up", { informed: 4, effective: 4 });
            }
          }, 800);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header Panel */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Users size={12} className="text-slate-400" /> Proxy Voting & Copy-Trading
        </span>
        {selectedRepresentative && (
          <button
            onClick={() => onSelectRepresentative(null)}
            className="text-[8px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 px-2 py-1 rounded-md bg-red-50 border border-red-100 transition-all cursor-pointer"
          >
            Revoke Delegation
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence mode="wait">
          {sweepInProgress ? (
            <motion.div
              key="sweep"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-4"
            >
              <div className="relative flex items-center justify-center">
                <RefreshCw size={36} className="text-slate-900 animate-spin" />
                <Sparkles size={16} className="text-amber-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Auto-Pilot Sweep Active</h4>
                <p className="text-[10px] text-slate-500 max-w-[220px]">
                  Delegating remaining votes to <strong className="text-slate-900">{selectedRepresentative}</strong>. Replicating expert ratings...
                </p>
              </div>
              
              <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-slate-950 h-full transition-all duration-300"
                  style={{ width: `${sweepProgress}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400">{sweepProgress}% Evaluated</span>
            </motion.div>
          ) : activeRep ? (
            <motion.div
              key="active-delegation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Active Rep Card */}
              <div className="bg-slate-950 text-white rounded-2xl p-4 border border-slate-900 shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 bg-slate-800 rounded-full opacity-20 blur-sm pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-white">
                      {activeRep?.avatar || "CF"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 
                          onClick={() => activeRep && onInspectUser?.(activeRep.name)}
                          className="text-xs font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors"
                        >
                          {activeRep?.name}
                          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 rounded px-1.5 py-0.2 font-mono">
                            {activeRep ? getUserCivicBadge(activeRep.name) : ""}
                          </span>
                        </h4>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md">Primary Proxy</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">{activeRep?.alignment}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-slate-300 block">{activeRep?.matchScore}% Match</span>
                    <span className="text-[8px] font-mono text-slate-500 block">{activeRep ? formatCivicNumber(activeRep.followersCount) : 0} Delegators</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed font-medium italic">
                  "{activeRep?.bio}"
                </p>

                {activeRep?.delegatedTo && (
                  <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-[9px] text-slate-400">
                    <span>Delegated their own proxy to: <strong className="text-amber-400">{activeRep.delegatedTo}</strong></span>
                    <span className="text-amber-500 font-black animate-pulse">● CASCADE IN EFFECT</span>
                  </div>
                )}
              </div>

              {/* Democratic Pyramid of Consensus Visualizer */}
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-4 border border-slate-850 space-y-4 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Users size={13} className="text-amber-400" /> Liquid Democratic Pyramid
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-900">
                    Consensus Cascade
                  </span>
                </div>

                {/* THE PYRAMID DRAWING */}
                <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
                  {/* Tier 1: Peak (Terminal Decision Maker) */}
                  <div className="w-full max-w-[140px] flex flex-col items-center">
                    <div className={cn(
                      "w-full bg-slate-950 border text-center p-2 rounded-xl transition-all shadow-md relative",
                      isChained ? "border-amber-500/80 shadow-amber-950/20" : "border-slate-800"
                    )}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded uppercase tracking-tighter">
                        Tier 1: APEX (Apex Node)
                      </div>
                      <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-tighter mt-1">~100s-1000s of Leaders</span>
                      <span className="text-[11px] font-black text-amber-400 truncate block max-w-full px-1">
                        👑 {chain[chain.length - 1]}
                      </span>
                    </div>
                  </div>

                  <div className="w-1.5 h-3 bg-gradient-to-b from-amber-500/50 to-slate-800" />

                  {/* Tier 2: Middle (Intermediate Curator Nodes) */}
                  <div className="w-full max-w-[240px] flex flex-col items-center">
                    <div className={cn(
                      "w-full bg-slate-950/70 border text-center p-2 rounded-2xl transition-all shadow-sm relative",
                      isChained ? "border-slate-800" : "border-slate-800"
                    )}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded uppercase tracking-tighter border border-slate-700">
                        Tier 2: PROXY CURATORS
                      </div>
                      <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-tighter mt-1">~Thousands of Experts</span>
                      <span className="text-[10px] font-black text-slate-300 truncate block max-w-full px-1">
                        {isChained ? `🗳️ ${selectedRepresentative} (Delegates to ${chain[chain.length - 1]})` : `🗳️ ${selectedRepresentative}`}
                      </span>
                    </div>
                  </div>

                  <div className="w-1.5 h-3 bg-slate-800" />

                  {/* Tier 3: Base (The Populace of Agreers - Symfwnous) */}
                  <div className="w-full max-w-[340px] flex flex-col items-center">
                    <div className="w-full bg-slate-950/40 border border-slate-850 text-center p-3 rounded-3xl relative">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black bg-blue-500 text-white px-2 py-0.2 rounded uppercase tracking-tighter">
                        Tier 3: THE POPULACE (Σύμφωνοι)
                      </div>
                      <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-tighter mt-1">Millions of Citizens</span>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-black text-white">YOU (as a Σύμφωνος/Agreer)</span>
                        <span className="text-[9px] text-slate-400 font-medium">and other supporters</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CASCADE EXPLANATION & INTERACTION */}
                {isChained ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-100 leading-normal">
                          Cascade Agreement Audit
                        </p>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          Your representative <strong className="text-white">{selectedRepresentative}</strong> has delegated their proxy to <strong className="text-white">{chain[chain.length - 1]}</strong>. 
                        </p>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          As a <strong>Σύμφωνος (Agreer)</strong>, your support flows automatically up the pyramid. Do you still want to represent them?
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900">
                      <div className="text-[8px] font-black uppercase tracking-wider bg-green-950 text-green-400 border border-green-900 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Check size={10} /> Keeping delegation Active
                      </div>
                      <button
                        onClick={() => onSelectRepresentative(chain[chain.length - 1])}
                        className="text-[8px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800 transition-all cursor-pointer"
                      >
                        Bypass Directly to {chain[chain.length - 1]}
                      </button>
                      <button
                        onClick={() => onSelectRepresentative(null)}
                        className="text-[8px] font-black uppercase tracking-wider bg-red-950 hover:bg-red-900 text-red-400 px-2 py-1 rounded-md border border-red-900 transition-all cursor-pointer ml-auto"
                      >
                        Revoke Proxy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3 text-[9px] text-slate-400 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 text-green-400 font-bold">
                      <Check size={11} /> <span>Direct Representation Link</span>
                    </div>
                    <p>
                      You are representing directly through <strong>{selectedRepresentative}</strong>. No multi-tier cascade is active right now.
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Liquid Routing Simulator */}
              {selectedRepresentative !== idea.creator && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <span>🔧 Dynamic Liquid Routing Simulator</span>
                  </h5>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Change who <strong>{selectedRepresentative}</strong> delegates their voice to. Watch the Σύμφωνος cascade re-route and adapt in real-time:
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <span className="text-[9px] text-slate-600 font-black uppercase shrink-0">Delegated To:</span>
                    <select
                      value={repsState.find(r => r.name === selectedRepresentative)?.delegatedTo || ''}
                      onChange={(e) => handleUpdateRepresentativeDelegate(selectedRepresentative!, e.target.value || null)}
                      className="flex-1 text-[10px] font-black bg-white border border-slate-200 rounded-xl p-2 px-2.5 text-slate-700 outline-none shadow-sm"
                    >
                      <option value="">None (Vote Direct)</option>
                      {POPULAR_REPRESENTATIVES.filter(r => r.name !== selectedRepresentative).map(r => (
                        <option key={r.name} value={r.name}>
                          {r.name} ({r.alignment})
                        </option>
                      ))}
                      <option value={idea.creator}>
                        {idea.creator} (Original Proposer)
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* Specific Idea Assessment */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                    {isChained ? `Resolved Cascade Recommendation (from ${resolvedBy})` : `Representative's Assessment`}
                  </span>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    rec?.vote === 'up' 
                      ? "bg-green-50 text-green-700 border-green-100" 
                      : "bg-red-50 text-red-700 border-red-100"
                  )}>
                    Recommends: {rec ? (rec.vote === 'up' ? 'SUPPORT (SWIPE UP)' : 'REJECT (SWIPE DOWN)') : 'SUPPORT'}
                  </span>
                </div>

                {rec ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                      "{rec.comment}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white rounded-xl p-2 border border-slate-100">
                      <div className="text-center border-r border-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Informed Rating</p>
                        <p className="font-mono font-bold text-slate-800 text-sm">{rec.informed} / 5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Effective Rating</p>
                        <p className="font-mono font-bold text-slate-800 text-sm">{rec.effective} / 5</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCopyVote}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer mt-1"
                    >
                      <Check size={12} />
                      Copy Vote & Swipe Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      Your representative has not reviewed this specific customized idea copy yet, but generally supports baseline civic enhancements.
                    </p>
                    <button
                      onClick={handleOPCopyVote}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                    >
                      <Check size={12} />
                      Default Support & Swipe
                    </button>
                  </div>
                )}
              </div>

              {/* Auto Pilot Trigger */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-800">Auto-Pilot Voting Sweep</h5>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Let {selectedRepresentative} automatically evaluate all other ideas in this category on your behalf.
                  </p>
                </div>
                <button
                  onClick={triggerSweep}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 border border-slate-200 shadow-sm"
                >
                  <ArrowUpRight size={11} className="text-slate-500" />
                  Sweep Pool
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="choose-delegation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Introduction */}
              <div className="bg-slate-900 text-white border border-slate-850 rounded-2xl p-4 space-y-2.5 text-center relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-12 h-12 bg-amber-500/10 rounded-full blur-md pointer-events-none" />
                <Sparkles size={16} className="text-amber-400 mx-auto animate-pulse" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
                  Σύμφωνος Mode <span className="text-[9px] text-slate-400 font-medium lowercase">("The one who agrees")</span>
                </h4>
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium max-w-[280px] mx-auto">
                  Don't want to spend time reading every single proposal and detail? Here, <strong>anyone can be your representative</strong>. 
                </p>
                <div className="text-[9px] text-slate-400 border-t border-slate-800 pt-2 text-left space-y-1 bg-slate-950/50 p-2 rounded-xl">
                  <p className="font-bold text-slate-300 uppercase tracking-wide">How it works:</p>
                  <p>1. Find any community member, expert, or the <strong>Original Proposer (OP)</strong> whose reasoning you like.</p>
                  <p>2. Tap their <strong className="text-white font-black">🗳️ Delegate</strong> button on any comment, upgrade, or card.</p>
                  <p>3. You become the <strong>Σύμφωνος</strong>—replicating their votes, ratings, and active civic choices instantly!</p>
                </div>
              </div>

              {/* OP / Card Author Delegation option */}
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-between hover:border-slate-300 transition-all">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-700">OP</span>
                    <h5 
                      onClick={() => onInspectUser?.(idea.creator)}
                      className="text-[10px] font-black uppercase tracking-tight text-slate-800 hover:text-slate-600 cursor-pointer transition-colors"
                    >
                      Delegate to OP ({idea.creator})
                    </h5>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Auto-support the author's vision and copy all their upgrade acceptance decisions for this card.
                  </p>
                </div>
                <button
                  onClick={() => onSelectRepresentative(idea.creator)}
                  className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
                >
                  Delegate to OP
                </button>
              </div>

              {/* List of general representatives */}
              <div className="space-y-2.5">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Popular Community Experts</h4>
                <div className="space-y-3">
                  {POPULAR_REPRESENTATIVES.map((rep) => (
                    <div 
                      key={rep.name}
                      className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col gap-2.5 hover:border-slate-200 hover:bg-slate-50/80 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                            {rep.avatar}
                          </div>
                          <div>
                            <h5 
                              onClick={() => onInspectUser?.(rep.name)}
                              className="text-[10px] font-black uppercase tracking-tight text-slate-800 flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors"
                            >
                              {rep.name}
                              <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2 font-mono">
                                {getUserCivicBadge(rep.name)}
                              </span>
                            </h5>
                            <span className="text-[8px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                              {rep.alignment}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-bold text-slate-700 block">{rep.matchScore}% Match</span>
                          <span className="text-[8px] font-mono text-slate-400 block">{formatCivicNumber(rep.followersCount)} copy-voters</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        "{rep.bio}"
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span className="text-[9px] text-slate-400 font-mono">Expert in this Category</span>
                        </div>
                        <button
                          onClick={() => onSelectRepresentative(rep.name)}
                          className="flex items-center gap-0.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                        >
                          Choose Representative
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {delegationHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <ClipboardList size={11} className="text-slate-400" /> Copied Voting Ledger ({delegationHistory.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {delegationHistory.map((item, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[10px] gap-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 leading-tight line-clamp-1">{item.ideaTitle}</p>
                          <p className="text-[8px] text-slate-400">
                            Copied <strong className="text-slate-600">{item.representative}</strong> • {item.timestamp}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                            item.vote === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {item.vote === 'up' ? 'SUPPORT' : 'REJECT'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
