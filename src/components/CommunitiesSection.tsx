import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, MessageSquare, Send, Hash, Sparkles, User, Globe, Shield, Activity, Landmark, ArrowLeft, Heart } from 'lucide-react';
import { getUserCivicBadge, getUserRealName, formatCivicNumber } from '../lib/civicNumber';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  membersCount: number;
  messages: Message[];
}

const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'solar-coop',
    name: 'Solar Microgrid Cooperative',
    description: 'Autonomous solar harvesting & peer-to-peer load balancing scheduling countrywide.',
    category: 'Energy',
    icon: '⚡',
    membersCount: 1420,
    messages: [
      { id: '1', user: 'EcoRoot', text: 'Just connected the Peloponnese cooperative array. We are now sharing excess battery storage with Sparta direct nodes.', timestamp: '10:14 AM', likes: 18 },
      { id: '2', user: 'AthensNode', text: 'Incredible progress. Are we using the ledger to balance the direct peak-load allocations?', timestamp: '10:20 AM', likes: 7 },
      { id: '3', user: 'SolarSphere', text: 'Yes! The smart contract automatically offsets based on real-time consumption. Zero state grid dependency achieved.', timestamp: '10:32 AM', likes: 12 }
    ]
  },
  {
    id: 'athens-mesh',
    name: 'Athens Mesh Network Grid',
    description: 'Deploying high-frequency long-range wireless nodes to guarantee censorship-free citizen sync.',
    category: 'Infrastructure',
    icon: '📡',
    membersCount: 890,
    messages: [
      { id: '1', user: 'ZKP_Nodes', text: 'Three new 5.8GHz directional mesh antennas mounted in Exarcheia and Syntagma. Path loss is minimal.', timestamp: 'Yesterday', likes: 14 },
      { id: '2', user: 'MeshSkeptic', text: 'What is the absolute packet transit delay to Thessaloniki peer nodes?', timestamp: 'Yesterday', likes: 4 },
      { id: '3', user: 'AthensNode', text: 'Average latency is hovering around 12ms. Excellent for voting block validations.', timestamp: 'Yesterday', likes: 9 }
    ]
  },
  {
    id: 'agri-coop',
    name: 'Thessaly Organic Agriculture',
    description: 'Planning localized food-sharing hubs to supply fresh community harvests directly to Athens & Sparta.',
    category: 'Agriculture',
    icon: '🌾',
    membersCount: 2150,
    messages: [
      { id: '1', user: 'EcoDemos', text: 'Wheat and legume stocks have been logged on the ledger. Direct distribution trucks depart Larisa at 5 AM tomorrow.', timestamp: '9:00 AM', likes: 22 },
      { id: '2', user: 'Koinotis', text: 'We have reserved three pickup depots in northern Athens. Ready to unload and verify via member badges.', timestamp: '9:45 AM', likes: 15 }
    ]
  },
  {
    id: 'med-mutual',
    name: 'Spartan Medical Mutual Aid',
    description: 'Decentralized healthcare pool organizing volunteer physicians and sharing medication ledgers.',
    category: 'Health',
    icon: '🩺',
    membersCount: 630,
    messages: [
      { id: '1', user: 'SpartanVoter', text: 'We have stocked 200 pediatric immunization packages. Available at Sparta Main Sanctuary Aid Office.', timestamp: '2 days ago', likes: 31 },
      { id: '2', user: 'BioLedger', text: 'Logged on the bio-inventory blockchain. Transparency is absolute. Scan your member badge for distribution.', timestamp: '2 days ago', likes: 18 }
    ]
  }
];

interface CommunitiesSectionProps {
  friendsList: string[];
  onInspectUser?: (username: string) => void;
  isEmbedded?: boolean;
}

export const CommunitiesSection: React.FC<CommunitiesSectionProps> = ({ 
  friendsList = [],
  onInspectUser,
  isEmbedded = false
}) => {
  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('civic_communities');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITIES;
  });
  
  const [activeCommunityId, setActiveCommunityId] = useState<string>(communities[0]?.id || 'solar-coop');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [newMessageText, setNewMessageText] = useState('');
  
  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommCategory, setNewCommCategory] = useState('General');
  const [newCommIcon, setNewCommIcon] = useState('💬');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('civic_communities', JSON.stringify(communities));
  }, [communities]);

  const activeCommunity = communities.find(c => c.id === activeCommunityId);

  // Auto Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCommunity?.messages?.length, activeCommunityId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeCommunity) return;

    const newMsg: Message = {
      id: String(Date.now()),
      user: 'Citizen_M', // Current logged-in user
      text: newMessageText,
      timestamp: 'Just now',
      likes: 0
    };

    setCommunities(prev => prev.map(comm => {
      if (comm.id === activeCommunity.id) {
        return {
          ...comm,
          messages: [...comm.messages, newMsg]
        };
      }
      return comm;
    }));

    setNewMessageText('');
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim() || !newCommDesc.trim()) return;

    const newComm: Community = {
      id: `comm-${Date.now()}`,
      name: newCommName,
      description: newCommDesc,
      category: newCommCategory,
      icon: newCommIcon,
      membersCount: 1, // Created by current user
      messages: [
        {
          id: `welcome-${Date.now()}`,
          user: 'System',
          text: `Welcome to the ${newCommName} room! Deliberate, collaborate, and execute directly here.`,
          timestamp: 'Just now',
          likes: 0
        }
      ]
    };

    setCommunities(prev => [...prev, newComm]);
    setActiveCommunityId(newComm.id);
    setShowCreateModal(false);
    
    // Reset fields
    setNewCommName('');
    setNewCommDesc('');
    setNewCommCategory('General');
    setNewCommIcon('💬');
  };

  const handleLikeMessage = (commId: string, msgId: string) => {
    setCommunities(prev => prev.map(comm => {
      if (comm.id === commId) {
        return {
          ...comm,
          messages: comm.messages.map(msg => {
            if (msg.id === msgId) {
              return { ...msg, likes: msg.likes + 1 };
            }
            return msg;
          })
        };
      }
      return comm;
    }));
  };

  return (
    <div 
      id="communities-rooms-layout" 
      className={cn(
        "bg-slate-900 text-slate-100 flex flex-col overflow-hidden w-full h-full",
        isEmbedded 
          ? "min-h-0" 
          : "rounded-3xl border border-slate-800 shadow-xl max-w-5xl mx-auto my-6 h-[600px]"
      )}
    >
      {/* Top Header Panel */}
      <div className="bg-slate-950 p-4 px-6 border-b border-slate-850 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Civic Rooms & Guilds</h2>
              <span className="text-[8px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-900/50 rounded px-1.5 py-0.2 uppercase">Peer Decentrals</span>
            </div>
            <p className="text-[10px] text-slate-400">Directly collaborate on custom local projects, energy distribution, and mutual aid protocols.</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 p-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
        >
          <Plus size={14} />
          <span>Create Room</span>
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
        
        {/* Sidebar: Communities list (col-span-4) */}
        <div className={cn(
          "md:col-span-4 bg-slate-950/40 border-r border-slate-850 overflow-y-auto p-3 space-y-2 flex flex-col",
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        )}>
          <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase px-2 font-bold block mb-1">Active Assembly Rooms ({communities.length})</span>
          {communities.map((comm) => {
            const isActive = comm.id === activeCommunityId;
            return (
              <button
                key={comm.id}
                type="button"
                onClick={() => {
                  setActiveCommunityId(comm.id);
                  setMobileView('chat');
                }}
                className={cn(
                  "w-full text-left p-2.5 px-3.5 rounded-xl border transition-all duration-200 flex gap-3 cursor-pointer items-center",
                  isActive 
                    ? 'bg-slate-950 border-purple-500 text-purple-400 shadow-md font-bold' 
                    : 'bg-transparent border-slate-850 hover:bg-slate-950/40 hover:border-slate-800 text-slate-300'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0 select-none">
                  {comm.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold truncate leading-tight">
                    {comm.name}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat Stream Panel: (col-span-8) */}
        <div className={cn(
          "md:col-span-8 flex flex-col h-full bg-slate-900 min-h-0 relative",
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        )}>
          {activeCommunity ? (
            <>
              {/* Room Header Info */}
              <div className="bg-slate-950/40 border-b border-slate-850 p-4 px-5 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Back to Room List"
                  >
                    <ArrowLeft size={14} />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg select-none">{activeCommunity.icon}</span>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">{activeCommunity.name}</h3>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 leading-relaxed">{activeCommunity.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden xs:block">
                  <span className="text-[8px] font-mono tracking-wider text-slate-500 block uppercase font-bold">Consensus Weight</span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    {formatCivicNumber(activeCommunity.membersCount * 12)} Σ
                  </span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeCommunity.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                    <MessageSquare size={24} className="opacity-30" />
                    <p className="text-[10px] uppercase tracking-widest font-mono">No messages yet. Be the first to start the consensus debate!</p>
                  </div>
                ) : (
                  activeCommunity.messages.map((msg) => {
                    const isSystem = msg.user === 'System';
                    const isCurrentUser = msg.user === 'Citizen_M';
                    const isFriend = friendsList.includes(msg.user);
                    const realName = getUserRealName(msg.user);

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="text-[8px] font-mono bg-purple-950/60 border border-purple-900/40 text-purple-300 px-3 py-1 rounded-full text-center max-w-sm">
                            📢 {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex items-start gap-2.5 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : ''}`}>
                        {/* Custom Avatar container */}
                        <button
                          onClick={() => onInspectUser?.(msg.user)}
                          className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 hover:border-purple-500 shrink-0 select-none cursor-pointer"
                        >
                          {msg.user.substring(0, 2).toUpperCase()}
                        </button>
                        
                        <div className="space-y-1 min-w-0">
                          <div className={`flex items-center gap-1.5 text-[9px] ${isCurrentUser ? 'justify-end' : ''}`}>
                            <button
                              onClick={() => onInspectUser?.(msg.user)}
                              className="font-black text-slate-200 hover:text-purple-400 transition-colors"
                            >
                              @{msg.user}
                            </button>
                            <span className="text-[7px] font-mono px-1 py-0.2 bg-slate-950 border border-slate-800 text-slate-400 rounded">
                              {getUserCivicBadge(msg.user)}
                            </span>
                            {isFriend && (
                              <span className="text-[8px] font-bold text-emerald-400">
                                ({realName})
                              </span>
                            )}
                            <span className="text-[8px] text-slate-500 font-mono">{msg.timestamp}</span>
                          </div>

                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                            isCurrentUser 
                              ? 'bg-purple-600/95 text-white rounded-tr-none' 
                              : 'bg-slate-950/80 border border-slate-850 text-slate-200 rounded-tl-none'
                          }`}>
                            <p>{msg.text}</p>
                          </div>

                          {/* Reaction bar */}
                          <div className={`flex items-center gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                            <button
                              onClick={() => handleLikeMessage(activeCommunity.id, msg.id)}
                              className="flex items-center gap-1 p-1 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[8px] font-mono font-bold text-slate-400 hover:text-red-400 border border-slate-850/60 transition-all select-none cursor-pointer"
                            >
                              <Heart size={8} className="fill-current text-slate-500" />
                              <span>{msg.likes} Support</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-850 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={`Deliberate in #${activeCommunity.name}...`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Send size={11} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center space-y-2">
              <Users size={32} className="opacity-25" />
              <p className="text-xs font-bold uppercase tracking-widest font-mono">No active community selected.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE COMMUNITY */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl relative"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2 mb-4">
                <Landmark size={16} className="text-purple-400" /> Start Community Room
              </h3>
              
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Room Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Athens Solar Guild"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Room Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the direct action initiative or common resource to plan..."
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Category Tag</label>
                    <select
                      value={newCommCategory}
                      onChange={(e) => setNewCommCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                    >
                      <option value="Energy">⚡ Energy</option>
                      <option value="Infrastructure">📡 Infrastructure</option>
                      <option value="Agriculture">🌾 Agriculture</option>
                      <option value="Health">🩺 Health</option>
                      <option value="General">💬 General</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Icon / Emoji</label>
                    <select
                      value={newCommIcon}
                      onChange={(e) => setNewCommIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                    >
                      <option value="💬">💬 Chat Bubble</option>
                      <option value="⚡">⚡ Lightning Bolt</option>
                      <option value="📡">📡 Satellite Dish</option>
                      <option value="🌾">🌾 Grain / Wheat</option>
                      <option value="🩺">🩺 Medical Scope</option>
                      <option value="🛠️">🛠️ Tools</option>
                      <option value="🌳">🌳 Tree / Ecology</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Launch Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
