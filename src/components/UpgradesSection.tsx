import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Idea, UpgradeSuggestion } from '../types';
import { GitFork, Check, Plus, X, DollarSign, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getUserCivicBadge } from '../lib/civicNumber';

interface UpgradesSectionProps {
  idea: Idea;
  onIdeaUpdated: (updatedIdea: Idea) => void;
  onIdeaForked: (newIdea: Idea) => void;
  onFocusChange?: (focused: boolean) => void;
  selectedRepresentative?: string | null;
  onSelectRepresentative?: (repName: string | null) => void;
}

export const UpgradesSection: React.FC<UpgradesSectionProps> = ({
  idea,
  onIdeaUpdated,
  onIdeaForked,
  onFocusChange,
  selectedRepresentative,
  onSelectRepresentative
}) => {
  const [upgrades, setUpgrades] = useState<UpgradeSuggestion[]>(idea.upgrades || []);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Form State
  const [user, setUser] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(idea.cost.toString());
  const [error, setError] = useState('');

  const handleProposeClick = () => {
    setShowProposeForm(true);
    onFocusChange?.(true);
  };

  const handleCancelClick = () => {
    setShowProposeForm(false);
    setError('');
    onFocusChange?.(false);
  };

  const handleProposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setProposing(true);
    setError('');

    try {
      const res = await fetch(`/api/ideas/${idea.id}/upgrades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.trim() || 'Citizen Poster',
          title: title.trim(),
          description: description.trim(),
          cost: parseInt(cost) || idea.cost
        })
      });

      if (!res.ok) throw new Error('Failed to submit proposal');
      const data = await res.json();

      if (data.success && data.upgrade) {
        const updatedUpgrades = [...upgrades, data.upgrade];
        setUpgrades(updatedUpgrades);
        onIdeaUpdated({
          ...idea,
          upgrades: updatedUpgrades
        });

        // Reset form
        setTitle('');
        setDescription('');
        setCost(idea.cost.toString());
        setShowProposeForm(false);
        onFocusChange?.(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setProposing(false);
    }
  };

  const handleAcceptUpgrade = async (upgradeId: string) => {
    setAcceptingId(upgradeId);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/upgrades/${upgradeId}/accept`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to accept upgrade');
      const data = await res.json();

      if (data.success && data.idea) {
        // Find and update the upgrade status locally
        const updatedUpgrades = upgrades.map(u => 
          u.id === upgradeId ? { ...u, status: 'accepted' as const } : u
        );
        setUpgrades(updatedUpgrades);
        
        // Update main idea card data (Title, Desc, Cost, and list of upgrades)
        onIdeaUpdated({
          ...data.idea,
          upgrades: updatedUpgrades
        });
      }
    } catch (err) {
      console.error('Accept failed:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleForkUpgrade = async (upgradeId: string) => {
    setForkingId(upgradeId);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/upgrades/${upgradeId}/fork`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to fork');
      const data = await res.json();

      if (data.success && data.newIdea) {
        onIdeaForked(data.newIdea);
        // Alert user
        alert(`Successfully forked! The copy "${data.newIdea.title}" has been inserted as the next card in your deck.`);
      }
    } catch (err) {
      console.error('Fork failed:', err);
    } finally {
      setForkingId(null);
    }
  };

  const costDifference = (proposedCost: number) => {
    const diff = proposedCost - idea.cost;
    if (diff === 0) return 'No budget change';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${(diff / 1000).toFixed(0)}k (${diff > 0 ? 'Increase' : 'Savings'})`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header Panel */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <GitFork size={12} className="text-slate-400" /> Upgrades & Forks
        </span>
        {!showProposeForm && (
          <button
            onClick={handleProposeClick}
            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 rounded-full transition-all active:scale-95 shadow-sm"
          >
            <Plus size={10} /> Propose Update
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence mode="wait">
          {showProposeForm ? (
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              onSubmit={handleProposeSubmit}
              className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Propose Upgrade
                </span>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 text-xs p-2.5 rounded-xl border border-red-100 font-medium">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Proposer Identity</label>
                <input
                  type="text"
                  placeholder="Your Name / Handle (e.g., PulseFix)"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Upgrade Title</label>
                <input
                  type="text"
                  placeholder="e.g., Solar Glass Skylights Integration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Detailed Description of Improvements</label>
                <textarea
                  placeholder="Explain what has been optimized, added, or solved..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Proposed Adjusted Budget ($)</label>
                <div className="relative">
                  <DollarSign size={12} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    placeholder="Total adjusted cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-white rounded-xl border border-slate-200 pl-7 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={proposing}
                  className="flex-1 bg-slate-900 text-white rounded-xl py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  {proposing ? 'Submitting...' : 'Post Proposal'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="px-4 border border-slate-200 text-slate-500 rounded-xl py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          ) : upgrades.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-2"
            >
              <GitFork size={24} className="mx-auto text-slate-300" />
              <p className="text-slate-400 text-xs font-medium">No upgrade suggestions yet.</p>
              <p className="text-[10px] text-slate-400/80 max-w-[200px] mx-auto">
                Be the first to suggest optimizations or fork this idea to spin off your own version!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {upgrades.map((upgrade) => (
                <motion.div
                  key={upgrade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-all space-y-3"
                >
                  {/* Proposal Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        {upgrade.user}
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2 font-mono">
                          {getUserCivicBadge(upgrade.user)}
                        </span>
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1"><Clock size={10}/> {upgrade.timestamp}</span>
                      {upgrade.user !== 'Citizen Poster' && upgrade.user !== 'System' && onSelectRepresentative && (
                        <button
                          onClick={() => onSelectRepresentative(selectedRepresentative === upgrade.user ? null : upgrade.user)}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-sm border",
                            selectedRepresentative === upgrade.user 
                              ? "bg-green-600 border-green-700 text-white" 
                              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {selectedRepresentative === upgrade.user ? "🗳️ Active Rep" : "🗳️ Delegate"}
                        </button>
                      )}
                    </div>
                    <div>
                      {upgrade.status === 'accepted' ? (
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          Accepted
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-slate-900 tracking-tight uppercase">{upgrade.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {upgrade.description}
                    </p>
                  </div>

                  {/* Budget adjust info */}
                  <div className="flex items-center gap-4 text-[10px] bg-white rounded-xl p-2 border border-slate-100">
                    <div className="space-y-0.5">
                      <p className="text-[8px] uppercase font-black text-slate-300">Proposed Budget</p>
                      <p className="font-mono text-slate-700 font-bold">${(upgrade.cost / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="border-l border-slate-100 pl-3 space-y-0.5">
                      <p className="text-[8px] uppercase font-black text-slate-300">Adjustment</p>
                      <p className={cn(
                        "font-mono font-bold",
                        upgrade.cost === idea.cost ? "text-slate-500" : upgrade.cost > idea.cost ? "text-amber-600" : "text-green-600"
                      )}>
                        {costDifference(upgrade.cost)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {upgrade.status !== 'accepted' && (
                    <div className="flex gap-2 pt-1 border-t border-slate-100/50">
                      {/* OP Action (Simulated Creator) */}
                      <button
                        onClick={() => handleAcceptUpgrade(upgrade.id)}
                        disabled={acceptingId !== null}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        <Check size={11} />
                        {acceptingId === upgrade.id ? 'Accepting...' : 'Accept Upgrade (OP)'}
                      </button>

                      {/* Peer Copy/Fork Action */}
                      <button
                        onClick={() => handleForkUpgrade(upgrade.id)}
                        disabled={forkingId !== null}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                      >
                        <GitFork size={10} className="text-slate-400" />
                        {forkingId === upgrade.id ? 'Forking...' : 'Fork & Create Copy'}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
