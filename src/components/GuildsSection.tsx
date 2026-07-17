import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Cpu, Zap, Heart, Shield, Users, Plus, X, Check, Sparkles, 
  Coins, HelpCircle, Flame, Edit, Trash2, ArrowRight, Gavel, 
  Terminal, Layers, Globe, Star, BookOpen, Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getUserCivicBadge, formatCivicNumber } from '../lib/civicNumber';

export interface GuildRole {
  id: string;
  name: string;
  cost: number;
  perks: string[];
  assignedUser: string; // e.g. "EcoRoot", "Citizen_M" etc.
  icon: string;
}

export interface GuildCategory {
  id: string;
  name: string;
  theme: string;
  description: string;
  icon: string;
  roles: GuildRole[];
  color: string; // Tailwind color class scheme
}

const INITIAL_GUILDS: GuildCategory[] = [
  {
    id: 'web-app',
    name: 'Web App Building & Updates',
    theme: 'Practical codebase improvements, direct democracy UI upgrades, and server maintenance.',
    description: 'The core practical engine of Agora. Overseeing direct-consensus code deployments and security audits.',
    icon: '💻',
    color: 'indigo',
    roles: [
      {
        id: 'apex-dev',
        name: 'Apex Developer',
        cost: 800,
        perks: [
          'Direct master-branch merge rights',
          'Access to server-side dev container shells',
          '2.5x Consensus Voting Weight boost'
        ],
        assignedUser: 'CivicFlow',
        icon: '⚡'
      },
      {
        id: 'ui-architect',
        name: 'UI Architect',
        cost: 400,
        perks: [
          'Custom visual theme dashboard override',
          'CSS structural auditing and layout signature rights',
          '1.8x voting weight boost on visual updates'
        ],
        assignedUser: 'UrbanistA',
        icon: '🎨'
      },
      {
        id: 'beta-tester',
        name: 'Active Beta Tester',
        cost: 150,
        perks: [
          'Immediate alpha/beta feature flags toggles',
          '+25 Civic Credits awarded per verified bug ticket'
        ],
        assignedUser: 'Citizen_M',
        icon: '🛡️'
      }
    ]
  },
  {
    id: 'ecology-solar',
    name: 'Ecology & Solar Microgrids',
    theme: 'Peer-to-peer electricity sharing, local harvesting arrays, and agricultural distribution.',
    description: 'Powering the physical parallel society. Managing community energy reserves and organic crop channels.',
    icon: '☀️',
    color: 'emerald',
    roles: [
      {
        id: 'grid-dispatcher',
        name: 'Grid Dispatcher',
        cost: 500,
        perks: [
          'P2P microgrid power allocation command keys',
          'Override rights during regional blackouts',
          '2.0x Energy consensus weight'
        ],
        assignedUser: 'EcoRoot',
        icon: '🔋'
      },
      {
        id: 'solar-installer',
        name: 'Solar Installer',
        cost: 300,
        perks: [
          'Certified local array physical layout planner',
          'Free power tokens allowance (120kWh / mo)',
          'Ecology badge styling unlock'
        ],
        assignedUser: 'AthensNode',
        icon: '🛠️'
      }
    ]
  },
  {
    id: 'emergency-relief',
    name: 'Emergency Relief & Logistics',
    theme: 'Immediate family shelter pools, medicine distributions, and disaster response trucks.',
    description: 'Providing mutual aid and civic resilience during severe climate or economic disruptions.',
    icon: '🚑',
    color: 'amber',
    roles: [
      {
        id: 'logistics-captain',
        name: 'Logistics Captain',
        cost: 500,
        perks: [
          'Direct fleet dispatch authorization keys',
          'Consolidated regional food delivery priority',
          'Emergency voting override power'
        ],
        assignedUser: 'BlueAnchor',
        icon: '🚛'
      },
      {
        id: 'medical-responder',
        name: 'First Aid Responder',
        cost: 250,
        perks: [
          'Sanctuary medication inventory distribution rights',
          'Priority wellness check allocations'
        ],
        assignedUser: 'SpartanVoter',
        icon: '🩺'
      }
    ]
  }
];

interface GuildsSectionProps {
  currentUsername: string;
  isSubscribed?: boolean;
  onInspectUser?: (username: string) => void;
}

export const GuildsSection: React.FC<GuildsSectionProps> = ({
  currentUsername = 'Citizen_M',
  isSubscribed = true,
  onInspectUser
}) => {
  const [guilds, setGuilds] = useState<GuildCategory[]>(() => {
    const saved = localStorage.getItem('civic_guild_categories');
    return saved ? JSON.parse(saved) : INITIAL_GUILDS;
  });

  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('civic_user_points');
    return saved ? parseInt(saved) : 1000; // Active citizens start with 1000 CC!
  });

  const [activeGuildId, setActiveGuildId] = useState<string>(guilds[0]?.id || 'web-app');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<{guildId: string, roleId: string} | null>(null);
  const [assigneeName, setAssigneeName] = useState('');

  // New Guild Form State
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTheme, setNewGuildTheme] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [newGuildIcon, setNewGuildIcon] = useState('🧪');
  const [newGuildColor, setNewGuildColor] = useState('purple');
  
  const [newRole1Name, setNewRole1Name] = useState('');
  const [newRole1Cost, setNewRole1Cost] = useState('200');
  const [newRole1Perk, setNewRole1Perk] = useState('');
  
  const [newRole2Name, setNewRole2Name] = useState('');
  const [newRole2Cost, setNewRole2Cost] = useState('400');
  const [newRole2Perk, setNewRole2Perk] = useState('');

  useEffect(() => {
    localStorage.setItem('civic_guild_categories', JSON.stringify(guilds));
  }, [guilds]);

  useEffect(() => {
    localStorage.setItem('civic_user_points', String(points));
  }, [points]);

  const activeGuild = guilds.find(g => g.id === activeGuildId);

  // Claim a role for yourself by spending points
  const handleClaimRole = (guildId: string, roleId: string, cost: number) => {
    if (points < cost) {
      alert("You do not have enough Civic Credits! Earn more by swiping on ideas or proposing upgrades.");
      return;
    }

    setPoints(prev => prev - cost);
    setGuilds(prev => prev.map(g => {
      if (g.id === guildId) {
        return {
          ...g,
          roles: g.roles.map(r => {
            if (r.id === roleId) {
              return { ...r, assignedUser: currentUsername };
            }
            // If user occupied another role in this guild, optionally keep or reset
            return r;
          })
        };
      }
      return g;
    }));
  };

  // Re-assign a role to any user (manually)
  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !assigneeName.trim()) return;

    const { guildId, roleId } = editingRole;
    setGuilds(prev => prev.map(g => {
      if (g.id === guildId) {
        return {
          ...g,
          roles: g.roles.map(r => {
            if (r.id === roleId) {
              return { ...r, assignedUser: assigneeName.trim() };
            }
            return r;
          })
        };
      }
      return g;
    }));

    setEditingRole(null);
    setAssigneeName('');
  };

  // Create custom category/guild with custom roles & perks
  const handleCreateGuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim() || !newGuildTheme.trim()) return;

    const customRoles: GuildRole[] = [];
    
    if (newRole1Name.trim()) {
      customRoles.push({
        id: `role-1-${Date.now()}`,
        name: newRole1Name.trim(),
        cost: parseInt(newRole1Cost) || 200,
        perks: newRole1Perk ? [newRole1Perk.trim()] : ['General coordination access'],
        assignedUser: 'Anonymous',
        icon: '🛡️'
      });
    }

    if (newRole2Name.trim()) {
      customRoles.push({
        id: `role-2-${Date.now()}`,
        name: newRole2Name.trim(),
        cost: parseInt(newRole2Cost) || 400,
        perks: newRole2Perk ? [newRole2Perk.trim()] : ['High level administrative access'],
        assignedUser: 'Anonymous',
        icon: '👑'
      });
    }

    // Default basic role if none specified
    if (customRoles.length === 0) {
      customRoles.push({
        id: `role-def-${Date.now()}`,
        name: 'Associate Steward',
        cost: 100,
        perks: ['Participate in localized workshops'],
        assignedUser: 'Anonymous',
        icon: '🌱'
      });
    }

    const newGuild: GuildCategory = {
      id: `guild-${Date.now()}`,
      name: newGuildName.trim(),
      theme: newGuildTheme.trim(),
      description: newGuildDesc.trim() || 'A custom citizen assembly working group.',
      icon: newGuildIcon,
      color: newGuildColor,
      roles: customRoles
    };

    setGuilds(prev => [...prev, newGuild]);
    setActiveGuildId(newGuild.id);
    setShowCreateModal(false);

    // Reset fields
    setNewGuildName('');
    setNewGuildTheme('');
    setNewGuildDesc('');
    setNewGuildIcon('🧪');
    setNewGuildColor('purple');
    setNewRole1Name('');
    setNewRole1Cost('200');
    setNewRole1Perk('');
    setNewRole2Name('');
    setNewRole2Cost('400');
    setNewRole2Perk('');
  };

  // Reset to initial guilds
  const handleResetGuilds = () => {
    if (window.confirm("Are you sure you want to reset all guilds and roles to the platform default defaults?")) {
      setGuilds(INITIAL_GUILDS);
      setPoints(1000);
      setActiveGuildId(INITIAL_GUILDS[0].id);
    }
  };

  // Get active roles for the current user
  const userRoles = guilds.flatMap(g => 
    g.roles.filter(r => r.assignedUser === currentUsername).map(r => ({
      guildName: g.name,
      roleName: r.name,
      perks: r.perks,
      icon: r.icon,
      color: g.color
    }))
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden w-full select-none">
      
      {/* Top Banner: Subscriber Info & Point Ledger */}
      <div className="bg-slate-950 p-4 border-b border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0 items-center">
        <div className="md:col-span-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Guilds, Roles & Perks</h2>
              <span className="text-[8px] font-mono font-bold bg-amber-900/50 text-amber-400 border border-amber-800/40 rounded px-1.5 py-0.2 uppercase">
                Active Citizen
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
              Claim specialized positions, configure municipal perks, and manage working categories in the parallel society.
            </p>
          </div>
        </div>

        {/* Civic Ledger Points Balance */}
        <div className="md:col-span-5 flex items-center justify-end gap-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-2 px-3.5 flex items-center gap-3.5 shadow-inner">
            <div className="text-right">
              <span className="text-[8px] font-mono tracking-wider text-slate-500 block uppercase font-black">Civic Credits Balance</span>
              <span className="text-sm font-mono font-black text-amber-400 flex items-center gap-1 justify-end">
                <Coins size={14} className="text-amber-500" />
                {points.toLocaleString()} CC
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[8px] font-mono tracking-wider text-slate-500 block uppercase font-black">Participation</span>
              <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                <Sparkles size={11} className="text-emerald-400 fill-emerald-500/30" />
                ACTIVE MEMBER
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 p-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Create Guild</span>
          </button>
        </div>
      </div>

      {/* Main Body Grid Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* Left Side: List of Categories (col-span-4) */}
        <div className="md:col-span-4 bg-slate-950/20 border-r border-slate-850 overflow-y-auto p-3 space-y-2 flex flex-col">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-black">
              Assembly Guilds ({guilds.length})
            </span>
            <button
              onClick={handleResetGuilds}
              className="text-[8px] font-mono uppercase text-slate-500 hover:text-red-400 font-bold"
              title="Reset to default guilds"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            {guilds.map((g) => {
              const isActive = g.id === activeGuildId;
              const accentColor = g.color === 'emerald' ? 'border-emerald-500 text-emerald-400' :
                                  g.color === 'amber' ? 'border-amber-500 text-amber-400' :
                                  g.color === 'indigo' ? 'border-indigo-500 text-indigo-400' :
                                  'border-purple-500 text-purple-400';
                                  
              const bgClass = isActive 
                ? 'bg-slate-950 border-l-4 shadow-md font-bold' 
                : 'bg-transparent border-slate-850 hover:bg-slate-950/20 hover:border-slate-800 text-slate-300';

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGuildId(g.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all duration-200 flex gap-3 cursor-pointer items-start",
                    bgClass,
                    isActive ? accentColor : ''
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shrink-0 shadow-inner">
                    {g.icon}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-xs font-black uppercase tracking-tight truncate leading-tight">
                      {g.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed">
                      {g.theme}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Panel: Your Claimed Positions */}
          <div className="mt-auto pt-4 border-t border-slate-850/60 space-y-2">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-black px-2 block">
              Your Active Positions ({userRoles.length})
            </span>
            
            {userRoles.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl text-center">
                <p className="text-[9px] text-slate-500 italic">No guild positions claimed. Spend your CC below to unlock permissions & voting multipliers!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {userRoles.map((role, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{role.icon}</span>
                      <div>
                        <p className="font-bold text-white leading-tight">{role.roleName}</p>
                        <p className="text-[8px] text-slate-500">{role.guildName}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.2 rounded uppercase">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Guild Detail & Roles Matrix (col-span-8) */}
        <div className="md:col-span-8 flex flex-col h-full bg-slate-900 overflow-y-auto p-4 md:p-6 space-y-5">
          {activeGuild ? (
            <>
              {/* Active Guild Info Header */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shrink-0">
                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeGuild.icon}</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{activeGuild.name}</h3>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                    {activeGuild.description}
                  </p>
                </div>
                
                <span className="text-[8px] font-mono tracking-widest bg-slate-900 text-slate-400 border border-slate-800 rounded-full px-3 py-1 uppercase font-bold shrink-0">
                  Theme Registry Code: #GLD-{activeGuild.id.toUpperCase()}
                </span>
              </div>

              {/* Roles & Perks Matrix */}
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Category Roles & Privileges
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {activeGuild.roles.map((role) => {
                    const isMe = role.assignedUser === currentUsername;
                    const isAnonymous = role.assignedUser === 'Anonymous';

                    return (
                      <div 
                        key={role.id}
                        className={cn(
                          "bg-slate-950 rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-800 relative overflow-hidden",
                          isMe ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-slate-850"
                        )}
                      >
                        {isMe && (
                          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-12 h-12 bg-amber-500/10 rounded-full blur-sm pointer-events-none" />
                        )}

                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Role Icon / Avatar */}
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-base shrink-0 shadow-inner">
                            {role.icon}
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs font-black uppercase tracking-tight text-white">
                                {role.name}
                              </h5>
                              <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-bold">
                                {role.cost} CC Required
                              </span>
                            </div>

                            {/* Perks List */}
                            <div className="space-y-1">
                              <span className="text-[7px] font-mono uppercase text-slate-500 tracking-wider block">Assigned Perks:</span>
                              <ul className="space-y-1 pl-1">
                                {role.perks.map((perk, i) => (
                                  <li key={i} className="text-[10px] text-slate-300 flex items-center gap-1.5 font-medium leading-relaxed">
                                    <Check size={10} className="text-emerald-500 shrink-0" />
                                    <span>{perk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Assignment Control Box */}
                        <div className="flex flex-col items-end gap-2.5 shrink-0 bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 min-w-[150px]">
                          <div>
                            <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block text-right">Current Assignee</span>
                            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <button
                                onClick={() => !isAnonymous && onInspectUser?.(role.assignedUser)}
                                className="text-[10px] font-black uppercase tracking-tight text-slate-200 hover:text-white transition-colors"
                              >
                                {role.assignedUser}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full">
                            {isMe ? (
                              <div className="w-full text-center bg-amber-500/10 border border-amber-500/30 text-amber-400 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                👑 Claimed By You
                              </div>
                            ) : (
                              <>
                                {/* Claim Button for Current User */}
                                <button
                                  onClick={() => handleClaimRole(activeGuild.id, role.id, role.cost)}
                                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-700 cursor-pointer text-center"
                                >
                                  Claim
                                </button>

                                {/* Manual Override Assign Button */}
                                <button
                                  onClick={() => {
                                    setEditingRole({ guildId: activeGuild.id, roleId: role.id });
                                    setAssigneeName(role.assignedUser === 'Anonymous' ? '' : role.assignedUser);
                                  }}
                                  className="py-1.5 px-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-850 text-[9px] font-black uppercase cursor-pointer"
                                  title="Manually assign any citizen"
                                >
                                  Assign
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 text-center space-y-2">
              <Layers size={32} className="opacity-25 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest font-mono">No Active Guild Category.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ASSIGN CITIZEN MANUALLY */}
      <AnimatePresence>
        {editingRole && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setEditingRole(null)}
                className="absolute top-4 right-4 hover:bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2.5 mb-4">
                <Users size={14} className="text-purple-400" /> Manual Assign Role
              </h3>

              <form onSubmit={handleAssignRole} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-black block">Citizen Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EcoRoot, AthensNode, Citizen_X"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                  />
                  <p className="text-[8px] text-slate-500">Assign any civic member to this guild role to delegate its thematic privileges.</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-black uppercase rounded-lg border border-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer"
                  >
                    Authorize Assignment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE CUSTOM GUILD CATEGORY */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 hover:bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-850 pb-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Layers size={16} className="text-purple-400" /> Start Custom Assembly Guild
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  Define a brand new municipal category, assign roles, and construct custom membership privileges.
                </p>
              </div>

              <form onSubmit={handleCreateGuild} className="space-y-4">
                
                {/* Guild Name & Icon */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-1">
                    <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Guild Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Urban Mobility & Cycling Guild"
                      value={newGuildName}
                      onChange={(e) => setNewGuildName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Icon / Emoji</label>
                    <select
                      value={newGuildIcon}
                      onChange={(e) => setNewGuildIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                    >
                      <option value="🧪">🧪 Tech</option>
                      <option value="🚲">🚲 Mobility</option>
                      <option value="🌳">🌳 Ecology</option>
                      <option value="⚖️">⚖️ Legal / Justice</option>
                      <option value="🏫">🏫 Education</option>
                      <option value="🗳️">🗳️ Democracy</option>
                      <option value="🤝">🤝 Social aid</option>
                    </select>
                  </div>
                </div>

                {/* Theme Summary */}
                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Thematic Theme Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Planning non-motorized zones, bike routes, and city center air quality controls."
                    value={newGuildTheme}
                    onChange={(e) => setNewGuildTheme(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                {/* Main description */}
                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Detailed Scope Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the structural goals of this specialized category working circle..."
                    value={newGuildDesc}
                    onChange={(e) => setNewGuildDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                  />
                </div>

                {/* Theme Color selector */}
                <div className="space-y-1">
                  <label className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-black block">Guild Theme Color Accent</label>
                  <div className="flex items-center gap-2">
                    {['indigo', 'emerald', 'amber', 'purple'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewGuildColor(color)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] uppercase font-black border transition-all cursor-pointer",
                          newGuildColor === color 
                            ? "bg-white text-slate-950 border-white font-bold" 
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role 1 Details */}
                <div className="border-t border-slate-850 pt-3 space-y-2.5">
                  <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider block">Role 1 Configuration (Required)</span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[7px] font-mono text-slate-500 uppercase block">Role Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chief Mobility Steward"
                        value={newRole1Name}
                        onChange={(e) => setNewRole1Name(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[7px] font-mono text-slate-500 uppercase block">CC Cost</label>
                      <input
                        type="number"
                        placeholder="300"
                        value={rolePointCost(newRole1Cost)}
                        onChange={(e) => setNewRole1Cost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-mono text-slate-500 uppercase block">Assign Privilege / Perk (Write 1 key perk)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bike lane design approval sign-off authority & 2.0x voting boost"
                      value={newRole1Perk}
                      onChange={(e) => setNewRole1Perk(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role 2 Details */}
                <div className="border-t border-slate-850 pt-3 space-y-2.5">
                  <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider block">Role 2 Configuration (Optional)</span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[7px] font-mono text-slate-500 uppercase block">Role Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Field Cycling Inspector"
                        value={newRole2Name}
                        onChange={(e) => setNewRole2Name(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[7px] font-mono text-slate-500 uppercase block">CC Cost</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={rolePointCost(newRole2Cost)}
                        onChange={(e) => setNewRole2Cost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-mono text-slate-500 uppercase block">Assign Privilege / Perk</label>
                    <input
                      type="text"
                      placeholder="e.g. Access to regional traffic sensors audit logs"
                      value={newRole2Perk}
                      onChange={(e) => setNewRole2Perk(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-850">
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
                    Launch Guild
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

// Helper to keep input type as string safely in state binds
function rolePointCost(val: string): string {
  return val;
}
