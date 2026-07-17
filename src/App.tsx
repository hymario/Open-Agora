/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Idea, FundingStats, DelegationHistory, CitizenCredential } from './types';
import { SwipeCard } from './components/SwipeCard';
import { FundingSummary } from './components/FundingSummary';
import { GreeceMapSection } from './components/GreeceMapSection';
import { CommunitiesSection } from './components/CommunitiesSection';
import { LayoutGrid, TrendingUp, User, Bell, AlertTriangle, Gavel, Map, Heart, HelpCircle, X, Shield, Globe, Landmark, Wifi, CheckCircle, Leaf, Utensils, Home, Coins, Users, Vote, Plus, PlusCircle, MessageSquare, Settings, Send, Mail, Github, Twitter, Linkedin, ExternalLink, Copy, Check, Instagram, Award, ChevronDown, ChevronUp, LogOut, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserCivicBadge, formatCivicNumber, getUserRealName, getUserCivicNumber } from './lib/civicNumber';
import { auth, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { cn } from './lib/utils';
import { GuildsSection } from './components/GuildsSection';
import { ForumSection } from './components/ForumSection';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const activeUsername = currentUser 
    ? (currentUser.displayName?.replace(/\s+/g, '') || currentUser.email?.split('@')[0] || 'Citizen_M')
    : 'Citizen_M';
  const [blockHeight, setBlockHeight] = useState(() => {
    const baseBlock = 8412952;
    const elapsedSeconds = Math.floor((Date.now() - 1783584000000) / 10000);
    return baseBlock + Math.max(0, elapsedSeconds);
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'main' | 'emergency' | 'political' | 'forum'>('forum');
  const [categoryIndices, setCategoryIndices] = useState<Record<'main' | 'emergency' | 'political', number>>(() => {
    try {
      const saved = localStorage.getItem('idea_swipe_category_indices');
      return saved ? JSON.parse(saved) : { main: 0, emergency: 0, political: 0 };
    } catch {
      return { main: 0, emergency: 0, political: 0 };
    }
  });

  const [votedIdeas, setVotedIdeas] = useState<Record<string, 'up' | 'down'>>(() => {
    try {
      const saved = localStorage.getItem('idea_swipe_votes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('idea_swipe_category_indices', JSON.stringify(categoryIndices));
  }, [categoryIndices]);
  const [fundingStats, setFundingStats] = useState<FundingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRepresentative, setSelectedRepresentative] = useState<string | null>(null);
  const [delegationHistory, setDelegationHistory] = useState<DelegationHistory[]>([]);
  
  // Custom states for interactive widgets and goals modal
  const [activeView, setActiveView] = useState<'cards' | 'map' | 'done' | 'guilds'>('cards');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?user=${activeUsername}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [activeUsername]);

  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: activeUsername })
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [showGoals, setShowGoals] = useState(false);
  const [friends, setFriends] = useState<string[]>(['EcoRoot', 'AthensNode']);
  const [inspectingUser, setInspectingUser] = useState<string | null>(null);

  // Prediction, Intuition and Civic Point states
  const [intuitionPoints, setIntuitionPoints] = useState<number>(() => {
    const saved = localStorage.getItem('idea_swipe_intuition_points');
    return saved ? Number(saved) : 50; // starts at 50 IP (balanced midpoint)
  });
  const [civicCoins, setCivicCoins] = useState<number>(() => {
    const saved = localStorage.getItem('idea_swipe_civic_coins');
    return saved ? Number(saved) : 100; // starts at 100 Civic Coins (CC)
  });
  const [credentials, setCredentials] = useState<CitizenCredential[]>(() => {
    try {
      const saved = localStorage.getItem('idea_swipe_credentials');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readPostIds, setReadPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`idea_swipe_read_posts_${activeUsername}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showReadPosts, setShowReadPosts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`idea_swipe_show_read_${activeUsername}`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(`idea_swipe_read_posts_${activeUsername}`, JSON.stringify(readPostIds));
  }, [readPostIds, activeUsername]);

  useEffect(() => {
    localStorage.setItem(`idea_swipe_show_read_${activeUsername}`, String(showReadPosts));
  }, [showReadPosts, activeUsername]);

  const markAsRead = (ideaId: string) => {
    if (!ideaId) return;
    setReadPostIds(prev => {
      if (prev.includes(ideaId)) return prev;
      return [...prev, ideaId];
    });
  };

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSpendCivicCoins = (amount: number): boolean => {
    if (civicCoins < amount) return false;
    setCivicCoins(prev => {
      const updated = prev - amount;
      localStorage.setItem('idea_swipe_civic_coins', String(updated));
      return updated;
    });
    return true;
  };

  // Credential Modal State & File handlers
  const [showUploadModal, setShowUploadModal] = useState(false); // keep the original for proposals
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showPointsExplanation, setShowPointsExplanation] = useState<'intuition' | 'civic' | null>(null);
  const [credType, setCredType] = useState<'degree' | 'achievement'>('degree');
  const [credTitle, setCredTitle] = useState('');
  const [credInstitution, setCredInstitution] = useState('');
  const [credYear, setCredYear] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleAddCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credTitle || !credInstitution || !credYear) {
      alert("Please fill in all fields.");
      return;
    }

    const newCred: CitizenCredential = {
      id: Math.random().toString(36).substring(2, 9),
      type: credType,
      title: credTitle,
      institution: credInstitution,
      year: credYear,
      fileName: fileName || "scanned_credential.pdf",
      status: 'verified'
    };

    const updatedCreds = [...credentials, newCred];
    setCredentials(updatedCreds);
    localStorage.setItem('idea_swipe_credentials', JSON.stringify(updatedCreds));

    // Award +100 Intuition Points
    setIntuitionPoints(prev => {
      const updated = prev + 100;
      localStorage.setItem('idea_swipe_intuition_points', String(updated));
      return updated;
    });

    triggerToast(`🎉 Credential verified! +100 Intuition Points added for academic excellence.`, 'success');
    
    // Reset states
    setCredTitle('');
    setCredInstitution('');
    setCredYear('');
    setFileName(null);
    setShowCredentialModal(false);
  };

  // Profile Customization, Settings and Direct Messages
  const [profileTab, setProfileTab] = useState<'id' | 'rooms' | 'chat' | 'settings'>('rooms');
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [customRealName, setCustomRealName] = useState(() => {
    return localStorage.getItem('idea_swipe_custom_real_name') || '';
  });
  const [profileAccentColor, setProfileAccentColor] = useState(() => {
    return localStorage.getItem('idea_swipe_profile_accent') || 'emerald';
  });
  const [offlineSync, setOfflineSync] = useState(() => {
    return localStorage.getItem('idea_swipe_offline_sync') === 'true';
  });
  const [privateMessages, setPrivateMessages] = useState<Record<string, Array<{id: string, sender: string, text: string, timestamp: string}>>>(() => {
    try {
      const saved = localStorage.getItem('idea_swipe_private_messages');
      return saved ? JSON.parse(saved) : {
        'EcoRoot': [
          { id: '1', sender: 'EcoRoot', text: 'Hello citizen! Thank you for supporting the direct democracy nodes in Athens.', timestamp: '10:15 AM' },
          { id: '2', sender: 'Citizen_M', text: 'Of course! It is highly important for our community.', timestamp: '10:18 AM' }
        ],
        'AthensNode': [
          { id: '1', sender: 'AthensNode', text: 'Hi, are you attending the physical direct-assembly in Greece next Saturday?', timestamp: 'Yesterday' }
        ]
      };
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('idea_swipe_custom_real_name', customRealName);
  }, [customRealName]);

  useEffect(() => {
    localStorage.setItem('idea_swipe_profile_accent', profileAccentColor);
  }, [profileAccentColor]);

  useEffect(() => {
    localStorage.setItem('idea_swipe_offline_sync', String(offlineSync));
  }, [offlineSync]);

  useEffect(() => {
    localStorage.setItem('idea_swipe_private_messages', JSON.stringify(privateMessages));
  }, [privateMessages]);
  
   // Upload modal state variables
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [showSignInHint, setShowSignInHint] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    return localStorage.getItem('civic_swipe_welcome_dismissed') !== 'true';
  });
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hazizimarios98@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCreator, setNewCreator] = useState('');
  const [newCategory, setNewCategory] = useState<'main' | 'emergency' | 'political'>('main');

  const openUploadModal = () => {
    setNewCategory(selectedCategory);
    setNewTitle('');
    setNewDescription('');
    setNewCost('');
    setNewCreator('');
    setShowUploadModal(true);
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          cost: Number(newCost) || 0,
          creator: newCreator || 'Anonymous',
          category: newCategory
        })
      });

      if (response.ok) {
        const newlyCreated = await response.json();
        setIdeas(prev => [newlyCreated, ...prev]);
        setCategoryIndices(prev => ({
          ...prev,
          [newCategory]: 0
        }));
        setSelectedCategory(newCategory);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [ideasRes, statsRes] = await Promise.all([
          fetch('/api/ideas'),
          fetch('/api/funding-stats')
        ]);
        const ideasData = await ideasRes.json();
        const statsData = await statsRes.json();
        setIdeas(ideasData);
        setFundingStats(statsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter ideas by category, and by read/seen status unless showReadPosts is enabled
  const allCategoryIdeas = ideas.filter(idea => idea.category === selectedCategory);
  const filteredIdeas = allCategoryIdeas.filter(idea => {
    if (selectedCategory === 'forum') return true;
    if (showReadPosts) return true;
    return !readPostIds.includes(idea.id);
  });
  const activeIndex = Math.min(categoryIndices[selectedCategory] || 0, Math.max(0, filteredIdeas.length - 1));

  const handleSendPrivateMessage = (text: string) => {
    if (!text.trim() || !activeChatUser) return;
    const newMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender: activeUsername,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setPrivateMessages(prev => {
      const updated = { ...prev };
      if (!updated[activeChatUser]) updated[activeChatUser] = [];
      updated[activeChatUser] = [...updated[activeChatUser], newMsg];
      return updated;
    });

    // Simulated reactive responses from system nodes to make the chat feel alive and authentic!
    if (activeChatUser === 'EcoRoot' || activeChatUser === 'AthensNode') {
      const replyText = activeChatUser === 'EcoRoot' 
        ? "Acknowledged, friend! Direct communication makes our collective voice stronger. Let's draft an eco-proposal!"
        : "Ledger status check complete. Your private message has been verified and stored in my node's secure local pool.";
      
      setTimeout(() => {
        setPrivateMessages(prev => {
          const up = { ...prev };
          if (!up[activeChatUser!]) up[activeChatUser!] = [];
          up[activeChatUser!] = [
            ...up[activeChatUser!], 
            {
              id: Math.random().toString(36).substring(2, 9),
              sender: activeChatUser!,
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
          return up;
        });
      }, 1200);
    }
  };

  const handleVote = async (ideaId: string, direction: 'up' | 'down' | null, ratings?: any, advance: boolean = false) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    markAsRead(ideaId);

    if (advance) {
      // Optimistically advance to the next card immediately so the swipe is instant, buttery smooth, and lag-free!
      handleNextCard();
    }

    try {
      const res = await fetch(`/api/ideas/${idea.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, ratings: ratings || { informed: 3, effective: 3 }, user: activeUsername, intuitionPoints })
      });
      const data = await res.json();
      if (data.success) {
        // Update the local votes and stats/ratings state for this idea
        setIdeas(prevIdeas => prevIdeas.map(i => i.id === idea.id ? { 
          ...i, 
          votes: data.votes, 
          stats: data.stats || i.stats 
        } : i));
        
        // Evaluate Prediction Payout
        if (direction) {
          const stats = data.stats || idea.stats || { informed: 3, effective: 3 };
          const avgScore = (stats.informed + stats.effective) / 2;
          const isLiked = direction === 'up';
          const isHighQuality = avgScore >= 3.0;

          let ipChange = 0;
          let ccChange = 0;
          let message = '';

          if (isLiked) {
            if (isHighQuality) {
              ipChange = 10;
              ccChange = 2;
              message = "🔮 Correct prediction! You backed a high-quality civic idea. +10 Intuition, +2 Civic Coins!";
            } else {
              ipChange = -5;
              message = "⚠️ Proletariat vote! You approved an idea rated poorly by expert analysis. -5 Intuition.";
            }
          } else { // 'down'
            if (!isHighQuality) {
              ipChange = 10;
              ccChange = 2;
              message = "🔮 Correct prediction! You filtered out a low-quality, ineffective proposal. +10 Intuition, +2 Civic Coins!";
            } else {
              ipChange = -5;
              message = "⚠️ Incorrect reject! You opposed a highly effective civic proposal. -5 Intuition.";
            }
          }

          if (ipChange !== 0 || ccChange !== 0) {
            setIntuitionPoints(prev => {
              const updated = Math.max(0, prev + ipChange);
              localStorage.setItem('idea_swipe_intuition_points', String(updated));
              return updated;
            });
            if (ccChange > 0) {
              setCivicCoins(prev => {
                const updated = prev + ccChange;
                localStorage.setItem('idea_swipe_civic_coins', String(updated));
                return updated;
              });
            }
            triggerToast(message, ipChange > 0 ? 'success' : 'error');
          }
        }

        // Update the votedIdeas list (remove if userVote is null/toggled-off)
        setVotedIdeas(prev => {
          const updated = { ...prev };
          if (data.userVote) {
            updated[idea.id] = data.userVote;
          } else {
            delete updated[idea.id];
          }
          try {
            localStorage.setItem('idea_swipe_votes', JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
          return updated;
        });

        if (selectedRepresentative && direction) {
          setDelegationHistory(prev => [
            {
              ideaId: idea.id,
              ideaTitle: idea.title,
              vote: direction,
              ratings: ratings || { informed: 3, effective: 3 },
              representative: selectedRepresentative,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            ...prev
          ]);
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleNextCard = () => {
    const currentCard = filteredIdeas[activeIndex];
    if (currentCard) {
      markAsRead(currentCard.id);
    }

    if (showReadPosts) {
      setCategoryIndices(prev => {
        const currentIdx = prev[selectedCategory] || 0;
        if (currentIdx < filteredIdeas.length - 1) {
          return {
            ...prev,
            [selectedCategory]: currentIdx + 1
          };
        }
        return prev;
      });
    } else {
      setCategoryIndices(prev => {
        const currentIdx = prev[selectedCategory] || 0;
        const nextLen = Math.max(0, filteredIdeas.length - 1);
        const nextIdx = Math.min(currentIdx, Math.max(0, nextLen - 1));
        return {
          ...prev,
          [selectedCategory]: nextIdx
        };
      });
    }
  };

  const handlePrevCard = () => {
    const currentCard = filteredIdeas[activeIndex];
    if (currentCard) {
      markAsRead(currentCard.id);
    }

    if (showReadPosts) {
      setCategoryIndices(prev => {
        const currentIdx = prev[selectedCategory] || 0;
        if (currentIdx > 0) {
          return {
            ...prev,
            [selectedCategory]: currentIdx - 1
          };
        }
        return prev;
      });
    } else {
      triggerToast("ℹ️ To view previously read proposals, turn on the 'Show Read' toggle!", 'info');
    }
  };

  const handleRewind = () => {
    handlePrevCard();
  };

  const handleIdeaUpdated = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea));
    markAsRead(updatedIdea.id);
  };

  const handleIdeaForked = (newIdea: Idea) => {
    const currentCard = filteredIdeas[activeIndex];
    if (currentCard) {
      markAsRead(currentCard.id);
    }
    setIdeas(prev => {
      const copy = [...prev];
      const ideaIndex = copy.findIndex(i => i.id === (currentCard?.id));
      if (ideaIndex !== -1) {
        copy.splice(ideaIndex + 1, 0, newIdea);
      } else {
        copy.push(newIdea);
      }
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white font-mono uppercase tracking-widest text-xs">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Synchronizing Ledger...
        </motion.div>
      </div>
    );
  }

  const currentIdea = filteredIdeas[activeIndex];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] font-sans selection:bg-slate-900 selection:text-white overflow-y-auto overflow-x-hidden w-full max-w-full relative">
      {/* Top Navbar */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-30 sticky top-0 gap-2">
        <button 
          onClick={() => setShowGoals(true)}
          className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-95 transition-all group cursor-pointer shrink-0"
          title="Click to view Organization Goals & Mission"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp size={18} className="text-white sm:w-5 sm:h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-lg font-black tracking-tighter uppercase leading-none text-slate-900">Agora</h1>
              <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200 group-hover:bg-amber-100 group-hover:text-amber-800 group-hover:border-amber-200 transition-colors">Goals</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Public Domain Ledger</p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Submit Request Button */}
          <button
            onClick={openUploadModal}
            className="p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border bg-amber-600 hover:bg-amber-500 border-amber-500 text-white flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-amber-950/25 shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Submit Request</span>
          </button>

          {/* Proposal Cards Switcher */}
          <button 
            onClick={() => setActiveView('cards')}
            className={`p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shrink-0 ${
              activeView === 'cards' 
                ? 'bg-slate-900 border-slate-800 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">Proposal Swiper</span>
          </button>

          {/* Greece Network Map Switcher */}
          <button 
            onClick={() => setActiveView('map')}
            className={`p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shrink-0 ${
              activeView === 'map' 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/20' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Map size={15} />
            <span className="hidden sm:inline">Greece Map</span>
          </button>

          {/* Integrated Profile Button with Expandable Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              className={`p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shrink-0 ${
                isProfileExpanded || showProfile || activeView === 'done' || activeView === 'guilds'
                  ? 'bg-slate-900 border-slate-850 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Identity & Integrated Tools Menu"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                {currentUser && currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={activeUsername} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={12} className="text-slate-500" />
                )}
              </div>
              <span className="hidden sm:inline">My Profile</span>
              {isProfileExpanded ? <ChevronUp size={12} className="text-current opacity-70" /> : <ChevronDown size={12} className="text-current opacity-70" />}
            </button>

            {/* Click Catcher to close the dropdown on click outside */}
            {isProfileExpanded && (
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileExpanded(false)} />
            )}

            {/* Compact Expandable Popover containing all consolidated tools */}
            <AnimatePresence>
              {isProfileExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl p-4 shadow-2xl z-50 text-left space-y-3"
                >
                  {/* CITIZEN IDENTITY HEADER */}
                  <div className="border-b border-slate-100 pb-3">
                    {!currentUser ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                            <User size={12} className="text-slate-500" />
                          </div>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Anonymous Voter</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">Sign in to sync your local vote signatures and join assembly rooms.</p>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsProfileExpanded(false);
                            try {
                              await signInWithPopup(auth, googleProvider);
                            } catch (err) {
                              console.error("Sign-in failed:", err);
                              alert("Sign-in failed. Open this preview in a new tab to bypass iframe popup blocking!");
                            }
                          }}
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          Sign In with Google
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={currentUser.photoURL || ''} 
                            alt={activeUsername} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[11px] font-black uppercase text-slate-800 truncate">{currentUser.displayName || activeUsername}</h4>
                            <p className="text-[8px] font-mono text-slate-400 truncate">{currentUser.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProfileExpanded(false);
                              setShowProfile(true);
                              setProfileTab('id');
                            }}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center font-bold"
                          >
                            My Citizen ID
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setIsProfileExpanded(false);
                              try {
                                await signOut(auth);
                                setActiveChatUser(null);
                              } catch (err) {
                                console.error("Sign-out failed:", err);
                              }
                            }}
                            className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center"
                            title="Disconnect Account"
                          >
                            <LogOut size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NAVIGATION & INTEGRATED WIDGETS */}
                  <div className="space-y-1">
                    {/* Done Projects Switcher */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setActiveView(activeView === 'done' ? 'cards' : 'done');
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        activeView === 'done'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className={activeView === 'done' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>Done Projects</span>
                      </div>
                      {activeView === 'done' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>

                    {/* Guilds & Perks Switcher */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setActiveView(activeView === 'guilds' ? 'cards' : 'guilds');
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        activeView === 'guilds'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Award size={14} className={activeView === 'guilds' ? 'text-purple-600' : 'text-slate-400'} />
                        <span>Guilds & Perks</span>
                      </div>
                      {activeView === 'guilds' && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                    </button>

                    {/* Mesh Rooms */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowProfile(true);
                        setProfileTab('rooms');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <span>Mesh Discussion Rooms</span>
                      </div>
                    </button>

                    {/* Secure Direct Chat */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowProfile(true);
                        setProfileTab('chat');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-slate-400" />
                        <span>Mesh Direct Chat</span>
                      </div>
                    </button>

                    {/* Active Society Bulletins / Notifications */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowNotifications(true);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Bell size={14} className={notifications.length > 0 ? 'text-amber-500' : 'text-slate-400'} />
                          {notifications.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[7px] px-1 rounded-full border border-white flex items-center justify-center min-w-[12px] h-[12px] scale-90">
                              {notifications.length}
                            </span>
                          )}
                        </div>
                        <span>Society Bulletins</span>
                      </div>
                    </button>

                    {/* Info and Notice */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowWelcomeModal(true);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle size={14} className="text-slate-400" />
                        <span>Information Guide</span>
                      </div>
                    </button>
                  </div>

                  {/* COMPACT LEDGER CONNECTION STATUS */}
                  <div className="bg-slate-950 text-white rounded-2xl p-3.5 space-y-2.5 select-none text-[9px] font-mono uppercase tracking-wider border border-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-400 font-bold">Ledger Connection</span>
                      </div>
                      <span className="text-emerald-400 font-black text-[8px]">SYNCHRONIZED</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowPointsExplanation('intuition');
                      }}
                      className="w-full flex items-center justify-between border-b border-slate-900 pb-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer group text-left"
                      title="What are Intuition Points? Click to learn more"
                    >
                      <div className="flex items-center gap-1">
                        <span>🔮 Intuition (IP):</span>
                        <span className="text-[7px] text-slate-500 group-hover:text-blue-400 font-bold">(click info)</span>
                      </div>
                      <span className="text-blue-400 font-black text-[9px] font-mono group-hover:underline">{intuitionPoints} IP</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowPointsExplanation('civic');
                      }}
                      className="w-full flex items-center justify-between border-b border-slate-900 pb-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer group text-left"
                      title="What are Civic Coins? Click to learn more"
                    >
                      <div className="flex items-center gap-1">
                        <span>🪙 Civic Coins (CC):</span>
                        <span className="text-[7px] text-slate-500 group-hover:text-amber-400 font-bold">(click info)</span>
                      </div>
                      <span className="text-amber-400 font-black text-[9px] font-mono group-hover:underline">{civicCoins} CC</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowCredentialModal(true);
                      }}
                      className="w-full flex items-center justify-between border-b border-slate-900 pb-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer group text-left"
                      title="View or upload University Credentials"
                    >
                      <div className="flex items-center gap-1">
                        <span>🎓 Credentials:</span>
                        <span className="text-[7px] text-slate-500 group-hover:text-purple-400 font-bold">(verify now)</span>
                      </div>
                      <span className="text-purple-400 font-black text-[9px] font-mono group-hover:underline">{credentials.length} Verified</span>
                    </button>

                    <div className="space-y-1.5 text-slate-300 pt-1 border-t border-slate-900">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Block Height:</span>
                        <span className="text-slate-300 font-bold">#{blockHeight.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Proposals:</span>
                        <span className="text-slate-300 font-bold">{ideas.length}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileExpanded(false);
                        setShowCredentialModal(true);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-850 border border-slate-800 rounded-xl text-[8px] font-black uppercase text-slate-300 tracking-wider transition-all cursor-pointer text-center"
                    >
                      🎓 Upload University Degree
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Google Sign-in Help Banner for Unsigned Users */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border-b border-indigo-900/40 p-3 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs z-20">
          <div className="flex items-start gap-3">
            <span className="flex h-2 w-2 items-center justify-center rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse mt-1 shrink-0" />
            <div className="text-left">
              <p className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide text-[9px] font-sans">
                <Globe size={11} className="text-blue-400" /> UNLOCK CIVIC LEDGER & BADGES
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Connect your Google account to secure a verified citizen signature. <strong>Popup Blocked?</strong> Click the <strong>"Open in New Tab"</strong> button in the top right of this preview panel to bypass iframe sandbox restrictions!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithPopup(auth, googleProvider);
                } catch (err) {
                  console.error("Sign-in failed:", err);
                  setShowSignInHint(true);
                }
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95 shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>
          </div>
        </div>
      )}

      {selectedRepresentative && (
        <div className="bg-amber-500 text-slate-950 text-[10px] uppercase font-black py-2.5 px-6 flex items-center justify-between gap-2 shadow-md shrink-0 border-b border-amber-600 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse shrink-0" />
            <span className="tracking-wide">
              🗳️ Σύμφωνος (Agreer) Mode Active: You are represented by <strong className="font-black underline">{selectedRepresentative}</strong>
            </span>
          </div>
          <button 
            onClick={() => setSelectedRepresentative(null)} 
            className="text-[9px] tracking-widest font-black uppercase text-slate-950 bg-amber-600/30 hover:bg-slate-950 hover:text-amber-400 px-3 py-1 rounded-md transition-all ml-4 cursor-pointer"
          >
            Revoke Proxy
          </button>
        </div>
      )}

      {/* Category Tabs Section - Hidden if viewing Map */}
      {activeView === 'cards' && (
        <div className="bg-white border-b border-slate-200 py-3 px-4 flex items-center justify-center gap-2 z-20 shadow-sm overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedCategory('forum')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'forum'
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <MessageSquare size={12} />
            Deliberation Forum
          </button>
          <button
            onClick={() => setSelectedCategory('main')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'main'
                ? "bg-slate-950 text-white shadow-md shadow-slate-300"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid size={12} />
            Main Pool
          </button>
          <button
            onClick={() => setSelectedCategory('emergency')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'emergency'
                ? "bg-amber-600 text-white shadow-md shadow-amber-100"
                : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
            }`}
          >
            <AlertTriangle size={12} />
            Emergencies
          </button>
          <button
            onClick={() => setSelectedCategory('political')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'political'
                ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                : "text-slate-500 hover:text-purple-600 hover:bg-purple-50"
            }`}
          >
            <Gavel size={12} />
            Socioeconomics
          </button>
        </div>
      )}

      {/* Main Swipe Area or Greece Network Map */}
      <main className="flex-1 relative p-4 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {activeView === 'guilds' ? (
            <motion.div
              key="guilds-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <GuildsSection 
                currentUsername={activeUsername}
                isSubscribed={true}
                onInspectUser={setInspectingUser}
              />
            </motion.div>
          ) : activeView === 'map' ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <GreeceMapSection />
            </motion.div>
          ) : activeView === 'done' ? (
            <motion.div
              key="done-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl mx-auto space-y-6"
            >
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/20 shadow-xl space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Completed & Funded Projects</h2>
                    <p className="text-[11px] text-emerald-300/80 font-mono">DIRECT DEMOCRACY LEDGER • RECORD OF DISPATCHED MUTUAL AID</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  These community initiatives have successfully met 100% of their investment targets. Capital has been fully released into decentralized, multi-sig community accounts to execute work overseen by direct-assembly tracking.
                </p>
              </div>

              {/* Grid of completed ideas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.filter(idea => (idea.investedAmount || 0) >= (idea.cost || 0)).length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl">
                    <p className="text-slate-400 text-sm">No completed projects found yet. Help fund one in the Proposal Swiper!</p>
                  </div>
                ) : (
                  ideas.filter(idea => (idea.investedAmount || 0) >= (idea.cost || 0)).map(idea => (
                    <div key={idea.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col text-left">
                      <div className="h-44 relative overflow-hidden">
                        <img 
                          src={idea.image} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <CheckCircle size={10} className="fill-current" /> 100% Funded
                          </span>
                          <span className="text-[9px] font-mono text-white/70 uppercase">By @{idea.creator}</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-snug">
                            {idea.title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                            {idea.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">Total Investment:</span>
                            <span className="font-mono font-black text-slate-800 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">${idea.cost?.toLocaleString()}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px]">
                              <span className="text-slate-400 block text-[8px] uppercase">Starting Capital</span>
                              <span className="font-mono font-bold text-slate-700">${idea.startingInvestedAmount?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px]">
                              <span className="text-slate-400 block text-[8px] uppercase font-bold text-emerald-800">Community Pledges</span>
                              <span className="font-mono font-bold text-green-600">+${Math.max(0, (idea.investedAmount || 0) - (idea.startingInvestedAmount || 0)).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                            <span>Author: @{idea.creator}</span>
                            <span>Category: <span className="capitalize font-bold text-slate-500">{idea.category}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : selectedCategory === 'forum' ? (
            <motion.div
              key="forum-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ForumSection 
                currentUsername={activeUsername}
                onInspectUser={setInspectingUser}
                onElevatedSuccess={(msg) => triggerToast(msg, 'success')}
                onRefreshIdeas={async () => {
                  try {
                    const res = await fetch('/api/ideas');
                    if (res.ok) {
                      const data = await res.json();
                      setIdeas(data);
                    }
                  } catch (err) {
                    console.error("Error refreshing ideas:", err);
                  }
                }}
              />
            </motion.div>
          ) : (filteredIdeas.length > 0 && activeIndex < filteredIdeas.length) ? (
            <div className="w-full h-[calc(100vh-140px)] max-w-xl mx-auto relative flex flex-col gap-3 overflow-hidden">
              {/* Relocated Seen / Show Read Posts Control */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-white border border-slate-200 rounded-3xl text-[10px] uppercase font-bold text-slate-500 shadow-sm shrink-0">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span>Viewing {selectedCategory === 'main' ? 'Main Pool' : selectedCategory === 'emergency' ? 'Emergencies' : 'Socioeconomics'} Proposals</span>
                </div>
                <button
                  onClick={() => {
                    setShowReadPosts(prev => {
                      const next = !prev;
                      triggerToast(next ? "👁️ Showing read proposals" : "👁️ Off: Showing only unread proposals", "info");
                      return next;
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border select-none ${
                    showReadPosts
                      ? "bg-slate-900 border-slate-950 text-white shadow-sm font-black"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850 hover:bg-slate-100 font-bold"
                  }`}
                  title={showReadPosts ? "Hiding posts you've seen" : "Showing all posts, including seen ones"}
                >
                  {showReadPosts ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{showReadPosts ? "Seen Posts: SHOWN" : "Seen Posts: HIDDEN"}</span>
                </button>
              </div>

              <div className="flex-1 relative min-h-0 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <SwipeCard
                    key={filteredIdeas[activeIndex].id}
                    idea={filteredIdeas[activeIndex]}
                    isTop={true}
                    activeUsername={activeUsername}
                    onIdeaUpdated={handleIdeaUpdated}
                    onIdeaForked={handleIdeaForked}
                    selectedRepresentative={selectedRepresentative}
                    onSelectRepresentative={setSelectedRepresentative}
                    delegationHistory={delegationHistory}
                    onInspectUser={setInspectingUser}
                    userVote={votedIdeas[filteredIdeas[activeIndex].id]}
                    onVote={(direction, ratings) => handleVote(filteredIdeas[activeIndex].id, direction, ratings)}
                    civicCoins={civicCoins}
                    onSpendCivicCoins={handleSpendCivicCoins}
                    onNext={handleNextCard}
                    onPrev={handlePrevCard}
                  />
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <motion.div 
              key="no-cards"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full min-h-[420px] p-4 text-center"
            >
              <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-xl space-y-6">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
                  <span className="text-3xl animate-bounce">🏁</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Queue Fully Scrolled
                  </h2>
                  <p className="text-slate-500 text-[11px] leading-relaxed max-w-[260px] mx-auto">
                    You have deliberated on all active proposals in the <span className="font-bold text-slate-800 uppercase">{selectedCategory === 'main' ? 'Main Pool' : selectedCategory === 'emergency' ? 'Emergencies' : 'Socioeconomics'}</span> registry.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button 
                    onClick={() => {
                      const idsInThisCategory = ideas.filter(idea => idea.category === selectedCategory).map(idea => idea.id);
                      setReadPostIds(prev => prev.filter(id => !idsInThisCategory.includes(id)));
                      setCategoryIndices(prev => ({ ...prev, [selectedCategory]: 0 }));
                      triggerToast(`🔄 Returned to start and refreshed the ${selectedCategory} proposal pool!`, 'success');
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    🔄 Return to Start & Refresh Queue
                  </button>

                  {!showReadPosts && (
                    <button 
                      onClick={() => {
                        setShowReadPosts(true);
                        setCategoryIndices(prev => ({ ...prev, [selectedCategory]: 0 }));
                        triggerToast(`👁️ Enabled 'Show Read' and returned to start!`, 'success');
                      }}
                      className="w-full py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-950 border border-sky-200 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
                    >
                      👁️ Show Read Posts Instead
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setVotedIdeas({});
                      setReadPostIds([]);
                      setCategoryIndices({ main: 0, emergency: 0, political: 0 });
                      triggerToast("🧹 Cleared all vote & read history! Swipe stack initialized.", 'success');
                    }}
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
                  >
                    🧹 Reset All Votes & Start Fresh
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dynamic and Beautiful Public-Domain Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-auto py-8 px-4 sm:px-6 z-20 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1.5 max-w-md">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-sans font-black tracking-tighter uppercase text-slate-950 text-base">Agora</span>
              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">Beta Version</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              A decentralized public-domain ledger and forum for civic alignment, project funding, and consensus-driven direct democracy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
            {/* Main GitHub Contributor Call to Action */}
            <a
              href="https://github.com/hazizimarios98/agora"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/15 group hover:-translate-y-0.5"
            >
              <Github size={15} className="text-slate-200 group-hover:text-white group-hover:scale-110 transition-all" />
              <span>Contribute on GitHub</span>
              <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-200" />
            </a>
            
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider text-center md:text-right">
              Public Ledger • MIT License
            </p>
          </div>
        </div>
      </footer>

      {/* OVERLAY: ORGANIZATION GOALS & ROADMAP (LIDERSWIPE LOGO ONCLICK) */}
      <AnimatePresence>
        {showGoals && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowGoals(false)}
                className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-2 border-b border-slate-100 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Mission Constitution v1.0
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">DIRECT DEMOCRACY SOCIETY GOALS</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  We are organizing a highly competent, self-sustained parallel mini-society that acts as a blueprint for the direct-democratic organization of our entire country.
                </p>
              </div>

              {/* Grid of the 4 core pillars of the independent society */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                      <Landmark size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">1. Direct Assembly Consensus</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Local citizen councils meet physically and digitally to deliberate, vote on proposals, and directly manage municipal community assets.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                      <Users size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">2. Liquid Proxy Cascade</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Empowering citizens to cast direct votes on any proposal, or delegate their voting weight to specialized trusted representatives, with instant revocation.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                      <Globe size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">3. Self-Sustained Mini-Society</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Operating a parallel civic structure within current system bounds to prove that direct citizen consensus is robust and highly competent.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                      <Vote size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">4. National Democratic Expansion</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Scaling our direct-democratic model countrywide to replace outdated representative systems with real-time, continuous direct citizen consensus.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-100 rounded-lg text-yellow-700">
                    <Coins size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-yellow-800">5. Collaborative Resource Ledgers</h3>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Transparent, public-domain ledgers secure shared community resources and coordinate member-backed projects. Citizens decide directly how collective assets are prioritized.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Shield size={12} className="text-emerald-500" /> Authorized Network Node: Active
                </span>
                <button 
                  onClick={() => setShowGoals(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  I Understand, Join Civic Flow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: CIVIC PROFILE DASHBOARD (USER BUTTON ONCLICK) */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "bg-slate-900 text-white rounded-3xl p-6 w-full border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300",
                profileTab === 'rooms' 
                  ? "max-w-4xl h-[85vh] md:h-[650px]" 
                  : "max-w-lg max-h-[90vh]"
              )}
            >
              {/* Dynamic Theme Background flare */}
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-2xl pointer-events-none transition-all duration-350 ${
                profileAccentColor === 'emerald' ? 'bg-emerald-500' :
                profileAccentColor === 'sapphire' ? 'bg-sky-500' :
                profileAccentColor === 'amber' ? 'bg-amber-500' :
                profileAccentColor === 'rose' ? 'bg-rose-500' :
                'bg-purple-500'
              }`} />

              {/* Close Button */}
              <button 
                onClick={() => {
                  setShowProfile(false);
                  setActiveChatUser(null);
                }}
                className="absolute top-5 right-5 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Header Title */}
              <div className="mb-4 shrink-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Ledger Identity Center</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {profileTab === 'id' ? 'Citizen ID Registry' : profileTab === 'chat' ? 'Private Mesh Chat' : 'Node Settings'}
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Compute Accent Color Classes */}
              {(() => {
                const accentClasses = {
                  emerald: {
                    text: 'text-emerald-400',
                    bg: 'bg-emerald-950/80',
                    border: 'border-emerald-900',
                    fill: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950',
                    badge: 'bg-emerald-950/60 border-emerald-900 text-emerald-400',
                    hoverText: 'hover:text-emerald-400'
                  },
                  sapphire: {
                    text: 'text-sky-400',
                    bg: 'bg-sky-950/80',
                    border: 'border-sky-900',
                    fill: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
                    badge: 'bg-sky-950/60 border-sky-900 text-sky-400',
                    hoverText: 'hover:text-sky-400'
                  },
                  amber: {
                    text: 'text-amber-400',
                    bg: 'bg-amber-950/80',
                    border: 'border-amber-900',
                    fill: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
                    badge: 'bg-amber-950/60 border-amber-900 text-amber-400',
                    hoverText: 'hover:text-amber-400'
                  },
                  rose: {
                    text: 'text-rose-400',
                    bg: 'bg-rose-950/80',
                    border: 'border-rose-900',
                    fill: 'bg-rose-500 hover:bg-rose-400 text-white',
                    badge: 'bg-rose-950/60 border-rose-900 text-rose-400',
                    hoverText: 'hover:text-rose-400'
                  },
                  amethyst: {
                    text: 'text-purple-400',
                    bg: 'bg-purple-950/80',
                    border: 'border-purple-900',
                    fill: 'bg-purple-500 hover:bg-purple-400 text-slate-950',
                    badge: 'bg-purple-950/60 border-purple-900 text-purple-400',
                    hoverText: 'hover:text-purple-400'
                  }
                }[profileAccentColor as 'emerald' | 'sapphire' | 'amber' | 'rose' | 'amethyst'] || {
                  text: 'text-emerald-400',
                  bg: 'bg-emerald-950/80',
                  border: 'border-emerald-900',
                  fill: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950',
                  badge: 'bg-emerald-950/60 border-emerald-900 text-emerald-400',
                  hoverText: 'hover:text-emerald-400'
                };

                return (
                  <>
                    {/* Tab Navigation Menu */}
                    <div className="flex gap-1 bg-slate-950/60 p-1.5 rounded-2xl mb-4 border border-slate-800 shrink-0 select-none z-10">
                      <button
                        type="button"
                        onClick={() => { setProfileTab('id'); setActiveChatUser(null); }}
                        className={cn(
                          "flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          profileTab === 'id' 
                            ? `${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} shadow-sm font-bold` 
                            : "text-slate-400 hover:text-slate-100"
                        )}
                      >
                        <User size={12} />
                        <span>Citizen ID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setProfileTab('rooms'); setActiveChatUser(null); }}
                        className={cn(
                          "flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          profileTab === 'rooms' 
                            ? `${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} shadow-sm font-bold` 
                            : "text-slate-400 hover:text-slate-100"
                        )}
                      >
                        <Users size={12} />
                        <span>Rooms</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setProfileTab('chat'); setActiveChatUser(null); }}
                        className={cn(
                          "flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer relative",
                          profileTab === 'chat' 
                            ? `${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} shadow-sm font-bold` 
                            : "text-slate-400 hover:text-slate-100"
                        )}
                      >
                        <MessageSquare size={12} />
                        <span>Direct Chat</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${profileAccentColor === 'emerald' ? 'bg-emerald-500' : profileAccentColor === 'sapphire' ? 'bg-sky-500' : profileAccentColor === 'amber' ? 'bg-amber-500' : profileAccentColor === 'rose' ? 'bg-rose-500' : 'bg-purple-500'} animate-pulse`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setProfileTab('settings'); setActiveChatUser(null); }}
                        className={cn(
                          "flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          profileTab === 'settings' 
                            ? `${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} shadow-sm font-bold` 
                            : "text-slate-400 hover:text-slate-100"
                        )}
                      >
                        <Settings size={12} />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* ID TAB */}
                    {profileTab === 'id' && (
                      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
                        {!currentUser ? (
                          <div className="text-center py-4 space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                            <div className="w-14 h-14 bg-slate-850 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-slate-750">
                              <User size={28} />
                            </div>
                            <div className="space-y-1 px-4">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Anonymous Access Mode</h3>
                              <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                Connect your Google Account to claim a unique verified Citizen ID, exchange Real Names, and log your votes securely on the public ledger.
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await signInWithPopup(auth, googleProvider);
                                } catch (err) {
                                  console.error("Sign-in failed:", err);
                                  alert("Sign-in failed or popup was blocked by the browser. Try opening the app in a new tab!");
                                }
                              }}
                              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                <path
                                  fill="currentColor"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                              </svg>
                              Sign In with Google
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
                            {currentUser.photoURL ? (
                              <img 
                                src={currentUser.photoURL} 
                                alt={activeUsername} 
                                referrerPolicy="no-referrer"
                                className={`w-12 h-12 rounded-2xl border ${accentClasses.border} object-cover`}
                              />
                            ) : (
                              <div className={`w-12 h-12 ${accentClasses.bg} ${accentClasses.text} rounded-2xl flex items-center justify-center text-xs font-black font-mono`}>
                                {getUserCivicBadge(activeUsername)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 truncate">
                                {currentUser.displayName || activeUsername}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                              <span className={`inline-block text-[8px] font-black uppercase tracking-widest ${accentClasses.text} ${accentClasses.bg} border ${accentClasses.border} px-1.5 py-0.5 rounded mt-1`}>
                                ● VERIFIED CITIZEN
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Society Digital Member Card */}
                        <div className={`bg-gradient-to-br from-slate-950 to-slate-900 border ${accentClasses.border} rounded-2xl p-4 relative overflow-hidden space-y-4 shadow-xl`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[7px] font-mono tracking-widest text-slate-500 uppercase block">Independent Society ID</span>
                              <span className="text-xs font-mono font-bold text-slate-300">ID-{getUserCivicNumber(activeUsername)}-GR</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[7px] font-mono tracking-widest text-slate-500 uppercase block">Civic Entry Code</span>
                              <span className={`text-xs font-mono font-bold ${accentClasses.text}`}>{getUserCivicBadge(activeUsername)}</span>
                            </div>
                            <Globe size={16} className={`${accentClasses.text} opacity-30`} />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[7px] font-mono tracking-widest text-slate-500 uppercase block">Active Assembly Status</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-mono font-bold ${accentClasses.text}`}>MEM-VOTE-{getUserCivicNumber(activeUsername)}-GR</span>
                              <span className={`text-[8px] ${accentClasses.bg} border ${accentClasses.border} ${accentClasses.text} px-1.5 py-0.2 rounded uppercase`}>Voter Verified</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-800/60 pt-3">
                            ✔ Valid for casting assessments, proposing legislation, and attending regional physical and digital assemblies countrywide. Registered real name: <strong className="text-white">{customRealName.trim() || getUserRealName(activeUsername)}</strong>
                          </div>
                        </div>

                        {/* Current Delegation Summary */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Delegation Settings</h4>
                          {selectedRepresentative ? (
                            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Represented by <strong className="text-amber-400">{selectedRepresentative}</strong></span>
                              <button 
                                onClick={() => {
                                  setSelectedRepresentative(null);
                                  setShowProfile(false);
                                }}
                                className="text-[9px] uppercase tracking-wider bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Revoke Proxy
                              </button>
                            </div>
                          ) : (
                            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
                              <CheckCircle size={13} className={`${accentClasses.text}`} />
                              <span>Direct Democracy Mode: Casting assessments yourself without representative proxy cascade.</span>
                            </div>
                          )}
                        </div>

                        {/* Friends & Transparency */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-800">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
                            <span>Transparency Friends ({friends.length})</span>
                            <span className="text-[8px] font-mono lowercase text-slate-500">Real Name Exchange</span>
                          </h4>
                          
                          {/* Search & Add Friend Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter Username or Badge ID..."
                              id="add-friend-input"
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 transition-all font-medium"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val && !friends.includes(val)) {
                                    setFriends(prev => [...prev, val]);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById('add-friend-input') as HTMLInputElement;
                                const val = input?.value.trim();
                                if (val && !friends.includes(val)) {
                                  setFriends(prev => [...prev, val]);
                                  input.value = '';
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-950`}
                            >
                              Add
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {friends.length === 0 ? (
                              <p className="text-[10px] text-slate-500 italic">No friends added yet. Add users to exchange Real Name transparency!</p>
                            ) : (
                              friends.map(friend => (
                                <div key={friend} className="flex items-center justify-between bg-slate-950 border border-slate-850 p-2 rounded-xl text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => {
                                        setInspectingUser(friend);
                                        setShowProfile(false);
                                      }}
                                      className={`font-bold text-slate-200 ${accentClasses.hoverText} transition-colors`}
                                    >
                                      {friend}
                                    </button>
                                    <span className="text-[8px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">
                                      {getUserCivicBadge(friend)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">({getUserRealName(friend)})</span>
                                  </div>
                                  <button
                                    onClick={() => setFriends(prev => prev.filter(f => f !== friend))}
                                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CIVIC ASSEMBLY ROOMS TAB */}
                    {profileTab === 'rooms' && (
                      <div className="flex-1 flex flex-col min-h-0 -mx-6 -mb-6 border-t border-slate-800 bg-slate-900">
                        <CommunitiesSection 
                          friendsList={friends}
                          onInspectUser={setInspectingUser}
                          isEmbedded={true}
                        />
                      </div>
                    )}

                    {/* DIRECT MESSAGE CHAT TAB */}
                    {profileTab === 'chat' && (
                      <div className="flex-1 flex flex-col min-h-0">
                        {!activeChatUser ? (
                          <div className="space-y-4 flex-1 flex flex-col overflow-y-auto">
                            <div className="space-y-1 shrink-0">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Direct Message Channels</h4>
                              <p className="text-[10px] text-slate-500">Select an active community node or friend to open a secure chat link.</p>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                              {friends.length === 0 ? (
                                <div className="text-center p-8 bg-slate-950/20 border border-slate-850 rounded-2xl space-y-2 mt-4">
                                  <MessageSquare size={24} className="text-slate-600 mx-auto" />
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">No Channels Available</p>
                                  <p className="text-[9px] text-slate-500 leading-normal max-w-xs mx-auto">
                                    You need to add peers as friends in the Citizen ID registry first to initiate private, authenticated encrypted chat links.
                                  </p>
                                </div>
                              ) : (
                                friends.map(friendName => {
                                  const userMsgs = privateMessages[friendName] || [];
                                  const lastMsg = userMsgs[userMsgs.length - 1];
                                  return (
                                    <button
                                      key={friendName}
                                      onClick={() => setActiveChatUser(friendName)}
                                      className="w-full text-left bg-slate-950 border border-slate-850 hover:border-slate-700 p-3 rounded-2xl flex items-center justify-between transition-colors group cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 ${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} rounded-xl flex items-center justify-center font-bold font-mono text-[11px]`}>
                                          {getUserCivicBadge(friendName)}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{friendName}</span>
                                            <span className="text-[9px] text-slate-500">({getUserRealName(friendName)})</span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                            {lastMsg ? lastMsg.text : "No messages yet. Open secure link."}
                                          </p>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] ${accentClasses.text} font-bold group-hover:translate-x-0.5 transition-all`}>
                                        Chat →
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Conversation Thread View */
                          <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setActiveChatUser(null)}
                                  className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  ← Back
                                </button>
                                <div className="h-4 w-px bg-slate-800 mx-1" />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-200">{activeChatUser}</span>
                                  <span className="text-[8px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-1 py-0.2 rounded">
                                    {getUserCivicBadge(activeChatUser)}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Peer Sync
                              </span>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col scrollbar-hide min-h-0">
                              {(privateMessages[activeChatUser] || []).length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                                  <MessageSquare className="text-slate-800" size={32} />
                                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">End-to-End Secure Channel</p>
                                  <p className="text-[10px] text-slate-600 max-w-[220px] leading-relaxed mx-auto">
                                    Messages are signed locally and synchronized over regional authenticated P2P consensus links.
                                  </p>
                                </div>
                              ) : (
                                (privateMessages[activeChatUser] || []).map(msg => {
                                  const isMe = msg.sender === activeUsername;
                                  return (
                                    <div
                                      key={msg.id}
                                      className={cn(
                                        "max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed flex flex-col shadow-sm",
                                        isMe
                                          ? `self-end ${accentClasses.bg} text-white border ${accentClasses.border}`
                                          : "self-start bg-slate-900 text-slate-200 border border-slate-800"
                                      )}
                                    >
                                      <p className="font-medium text-slate-100">{msg.text}</p>
                                      <span className="text-[8px] text-slate-400/80 self-end mt-1 font-mono">{msg.timestamp}</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Chat Input */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const input = (e.target as HTMLFormElement).elements.namedItem('chat-msg') as HTMLInputElement;
                                const val = input.value.trim();
                                if (val) {
                                  handleSendPrivateMessage(val);
                                  input.value = '';
                                }
                              }}
                              className="p-2 bg-slate-900 border-t border-slate-850 flex gap-2 shrink-0"
                            >
                              <input
                                name="chat-msg"
                                type="text"
                                autoComplete="off"
                                placeholder={`Write secure message to ${activeChatUser}...`}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700"
                              />
                              <button
                                type="submit"
                                className={`px-4 py-1.5 ${accentClasses.bg} ${accentClasses.text} border ${accentClasses.border} rounded-xl flex items-center justify-center transition-all cursor-pointer font-black text-[10px] uppercase`}
                              >
                                Send
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SETTINGS TAB */}
                    {profileTab === 'settings' && (
                      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Theme Personalization</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Choose your decentralized voter network identity accent.</p>
                          <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-850 p-3 rounded-2xl">
                            {(['emerald', 'sapphire', 'amber', 'rose', 'amethyst'] as const).map(color => {
                              const bgMap = {
                                emerald: 'bg-emerald-500',
                                sapphire: 'bg-sky-500',
                                amber: 'bg-amber-500',
                                rose: 'bg-rose-500',
                                amethyst: 'bg-purple-500'
                              }[color];
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setProfileAccentColor(color)}
                                  className={cn(
                                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer relative",
                                    profileAccentColor === color 
                                      ? "border-white ring-2 ring-slate-700 scale-110" 
                                      : "border-slate-800 hover:scale-105"
                                  )}
                                >
                                  <span className={cn("w-5 h-5 rounded-full shadow-inner", bgMap)} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decentralized Profile</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Update your civic name. Visible strictly to verified friends.</p>
                          <div className="space-y-3 bg-slate-950 border border-slate-850 p-3 rounded-2xl">
                            <div>
                              <label className="text-[8px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Voter Real Name</label>
                              <input
                                type="text"
                                value={customRealName}
                                onChange={(e) => setCustomRealName(e.target.value)}
                                placeholder={getUserRealName(activeUsername)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-700"
                              />
                            </div>
                            <div className="pt-2.5 border-t border-slate-850/60">
                              <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Preview of Identity Card</span>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${accentClasses.bg} border ${accentClasses.border}`} />
                                <span className="text-xs font-bold text-slate-200">{activeUsername}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({customRealName.trim() || getUserRealName(activeUsername)})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                            <Github size={12} className="text-slate-400" />
                            Agora Open Source Core
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">Agora is built entirely in the public domain for direct-consensus project funding and civic alignment.</p>
                          <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl space-y-2.5 text-left">
                            <p className="text-[10.5px] text-slate-300 leading-normal">
                              We welcome all contributions! Review our codebase, report bugs, suggest features, or audit the decentralized algorithms on GitHub.
                            </p>
                            <a
                              href="https://github.com/hazizimarios98/agora"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-md"
                            >
                              <Github size={13} className="text-slate-400 group-hover:text-white transition-colors" />
                              <span>View GitHub Repository</span>
                              <ExternalLink size={11} className="text-slate-500" />
                            </a>
                            <p className="text-[8.5px] text-slate-500 font-mono italic leading-normal">
                              Tip: You can export this AI Studio workspace as a fully functional ZIP file or push it directly to your GitHub via the Settings icon in the top-right toolbar.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Sync Settings</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Configure how this browser client communicates with regional nodes.</p>
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">Offline Mesh Sync</span>
                                <span className="text-[9px] text-slate-500 block">Sync vote ledger packages over local wireless hotspots</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={offlineSync} 
                                  onChange={(e) => setOfflineSync(e.target.checked)} 
                                  className="sr-only peer" 
                                />
                                <div className={cn(
                                  "w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"
                                )} />
                              </label>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-850/60">
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">Local Ledger Backup</span>
                                <span className="text-[9px] text-slate-500 block">Automatically export encrypted backup logs to device storage</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
                              </label>
                            </div>
                          </div>
                        </div>

                        {currentUser && (
                          <div className="pt-2">
                            <button
                              onClick={async () => {
                                try {
                                  await signOut(auth);
                                  setShowProfile(false);
                                  setActiveChatUser(null);
                                } catch (err) {
                                  console.error("Sign out failed:", err);
                                }
                              }}
                              className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Disconnect Account
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[8px] text-slate-500 font-mono shrink-0 select-none z-10">
                <span>Synchronized via Public Ledger</span>
                <span>Version 1.3-Mesh</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: INSPECT USER PROFILE */}
      <AnimatePresence>
        {inspectingUser && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setInspectingUser(null)}
                className="absolute top-5 right-5 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xs font-black font-mono">
                  {getUserCivicBadge(inspectingUser)}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                    Citizen Profile
                  </h3>
                  <p className="text-xs text-indigo-400 font-mono font-bold">{inspectingUser}</p>
                </div>
              </div>

              {/* Real Name Privacy Protection Block */}
              <div className="my-5 space-y-4">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase block">Civic Real Name Transparency</span>
                  {friends.includes(inspectingUser) ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wide font-mono">Friend Connection Active</span>
                      </div>
                      <p className="text-base font-black text-white">{getUserRealName(inspectingUser)}</p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        You have mutual real-name transparency enabled with this user.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wide font-mono">Real Name Protected</span>
                      </div>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 bg-slate-900 border border-slate-850 p-3 rounded-xl">
                        🔒 Hidden (Friends Only)
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        To protect citizen privacy, real names on the consensus platform are only visible to confirmed friends.
                      </p>
                    </div>
                  )}
                </div>

                {/* Friend Management Button */}
                <div className="flex gap-2.5">
                  {friends.includes(inspectingUser) ? (
                    <button
                      onClick={() => setFriends(prev => prev.filter(f => f !== inspectingUser))}
                      className="flex-1 py-3 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 hover:text-red-300 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
                    >
                      Revoke Friend Connection
                    </button>
                  ) : (
                    <button
                      onClick={() => setFriends(prev => [...prev, inspectingUser])}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-emerald-950/20"
                    >
                      🤝 Add Friend (Reveal Real Name)
                    </button>
                  )}
                </div>
              </div>

              {/* Representative Proxy Button */}
              {inspectingUser !== 'System' && inspectingUser !== 'Anonymous' && (
                <div className="border-t border-slate-800 pt-4 mt-4 space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Direct Action</h4>
                  <div className="flex items-center justify-between text-[11px] bg-slate-950 p-3 rounded-xl">
                    <span className="text-slate-300">Delegate assessments to this citizen:</span>
                    <button
                      onClick={() => {
                        setSelectedRepresentative(selectedRepresentative === inspectingUser ? null : inspectingUser);
                        setInspectingUser(null);
                      }}
                      className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition-all cursor-pointer ${
                        selectedRepresentative === inspectingUser 
                          ? 'bg-amber-600 text-white hover:bg-amber-500' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {selectedRepresentative === inspectingUser ? 'Revoke Proxy' : 'Delegate Voice'}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Voter ID: #{getUserCivicNumber(inspectingUser)}</span>
                <span>Type: {inspectingUser === 'EcoRoot' || inspectingUser === 'CivicFlow' || inspectingUser === 'BlueAnchor' || inspectingUser === 'UrbanistA' ? 'COMMUNITY REPRESENTATIVE' : 'CITIZEN'}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: NOTIFICATION BULLETIN (BELL BUTTON ONCLICK) */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowNotifications(false)}
                className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Bell size={15} className="text-emerald-600" /> Active Society Bulletins
              </h3>

              <div className="my-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <p className="text-xs font-semibold">📭 No active bulletins or alerts</p>
                    <p className="text-[10px] text-slate-400 font-medium">All caught up! You will see alerts here when people elevate your forum discussions or interact with your suggestions.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-3.5 rounded-2xl border space-y-1 transition-all",
                        notif.read 
                          ? "bg-slate-50 border-slate-100/70 opacity-75" 
                          : "bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          notif.type === 'elevation' 
                            ? "bg-amber-100 text-amber-700" 
                            : notif.type === 'comment' 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-slate-100 text-slate-700"
                        )}>
                          {notif.type === 'elevation' ? '👑 Core Proposal Elevated' : notif.type === 'comment' ? '💬 Reply/Comment Alert' : '📢 System Bulletin'}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">{notif.timestamp || 'Just Now'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 leading-snug">{notif.title}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button 
                  onClick={handleClearNotifications}
                  disabled={notifications.length === 0}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Close Bulletin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: SUBMIT PROPOSAL / EMERGENCY MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5"
            >
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <PlusCircle className="text-amber-600" size={22} /> Propose Public Initiative
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add your request directly to the community voting pool. All citizens will be able to swipe, rate, and delegate their votes to verify funding.
                </p>
              </div>

              <form onSubmit={handleCreateIdea} className="space-y-4">
                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Governance Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCategory('main')}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        newCategory === 'main'
                          ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <LayoutGrid size={13} />
                      Main Pool
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCategory('emergency')}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        newCategory === 'emergency'
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                      }`}
                    >
                      <AlertTriangle size={13} />
                      Emergency
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCategory('political')}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        newCategory === 'political'
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600"
                      }`}
                    >
                      <Gavel size={13} />
                      Socioeconomics
                    </button>
                  </div>
                </div>

                {/* Emergency Helper banner */}
                {newCategory === 'emergency' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-[11px] leading-relaxed space-y-1"
                  >
                    <p className="font-black uppercase tracking-wider text-[9px] text-amber-700 flex items-center gap-1">
                      🚑 EMERGENCY CATEGORY RULES
                    </p>
                    <p className="font-medium text-amber-800">
                      The emergency category is reserved **strictly** for urgent, immediate situations—such as families needing warm shelter, individuals requiring life-saving surgery or medical aid, and regional food security pools.
                    </p>
                  </motion.div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {newCategory === 'emergency' ? 'Emergency Title' : 'Proposal Title'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newCategory === 'emergency' 
                        ? 'e.g., Immediate Shelter & Hot Meals for 20 Displaced Families' 
                        : 'e.g., Decentralized Solar Array Installation in Larissa'
                    }
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors"
                  />
                </div>

                {/* Cost / Financial Target */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {newCategory === 'emergency' ? 'Relief Funding Target ($)' : 'Project Budget Target ($)'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 25000"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors"
                  />
                </div>

                {/* Creator handle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Proposer Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      placeholder="e.g., MedDirect"
                      value={newCreator}
                      onChange={(e) => setNewCreator(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Detailed Request Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      newCategory === 'emergency'
                        ? 'Describe the critical situation in detail. For shelter, include capacity and location. For surgery, specify urgency, hospital, and clinical context. For food, outline immediate delivery channels.'
                        : 'Explain your direct-democracy project proposal, target milestones, and how it will support a self-sustained parallel society.'
                    }
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Broadcast to Ledger
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: GOOGLE SIGN-IN IFRAME / POPUP BLOCKER HINT */}
      <AnimatePresence>
        {showSignInHint && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-5"
            >
              <button 
                onClick={() => setShowSignInHint(false)}
                className="absolute top-5 right-5 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-2 text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-900 flex items-center justify-center mx-auto mb-3">
                  <Globe size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider text-indigo-400">Google Sign-In Hint</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inside preview environments (iframes), modern browsers block Google Authentication popups for sandbox security.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2.5 text-xs">
                <p className="font-semibold text-slate-300">To Sign In Successfully:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-400 leading-relaxed font-mono">
                  <li>Look at the top-right corner of the browser window.</li>
                  <li>Click the <strong className="text-white">"Open in New Tab"</strong> icon (next to the address bar).</li>
                  <li>Click the colored <strong className="text-white">"Sign In with Google"</strong> button on the new tab.</li>
                  <li>Authorize, and your verified citizen profile is active instantly!</li>
                </ol>
              </div>

              <div className="pt-3 flex items-center justify-center">
                <button 
                  onClick={() => setShowSignInHint(false)}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Got It, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: COMPACT, FRIENDLY WELCOMING CARD */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => {
              localStorage.setItem('civic_swipe_welcome_dismissed', 'true');
              setShowWelcomeModal(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-100 text-slate-800 rounded-2xl p-5 md:p-6 max-w-sm w-full shadow-xl relative space-y-4"
            >
              <button 
                onClick={() => {
                  localStorage.setItem('civic_swipe_welcome_dismissed', 'true');
                  setShowWelcomeModal(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>

              {/* Friendly greeting */}
              <div className="space-y-1 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-700 shadow-inner">
                  <span className="text-lg">💡</span>
                </div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900">Welcome to Agora</h3>
                <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold">Public Domain Civic Ledger</p>
              </div>

              {/* Creator Quote */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-center">
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                  "I am not a programmer—just an enthusiastic person with some logic, intuition, and a big vision who wanted to see this public domain ledger come to life!"
                </p>
                <span className="text-[9px] font-mono text-slate-400 block pt-1">— Creator Note</span>
              </div>

              {/* Developer contact, social & email links in tiny compact layout */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  {/* Instagram Button */}
                  <a 
                    href="https://instagram.com/solotrippin13" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 p-2 rounded-xl flex items-center gap-2 justify-center transition-all group"
                  >
                    <Instagram size={13} className="text-pink-600" />
                    <span className="font-mono text-[10px] text-slate-700 font-bold">@solotrippin13</span>
                  </a>

                  {/* Mail Button */}
                  <a 
                    href="mailto:hazizimarios98@gmail.com"
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 p-2 rounded-xl flex items-center gap-2 justify-center transition-all"
                  >
                    <Mail size={13} className="text-blue-500" />
                    <span className="font-mono text-[10px] text-slate-700 font-bold">Get in Touch</span>
                  </a>
                </div>

                {/* GitHub Contribution Button */}
                <a 
                  href="https://github.com/hazizimarios98/agora" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 p-2 rounded-xl flex items-center gap-2.5 justify-center transition-all group cursor-pointer"
                >
                  <Github size={13} className="text-slate-950 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] text-slate-700 font-bold flex items-center gap-1">
                    Open Source Contributors <ExternalLink size={10} className="text-slate-400" />
                  </span>
                </a>
              </div>

              {/* Single CTA Action Button */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    localStorage.setItem('civic_swipe_welcome_dismissed', 'true');
                    setShowWelcomeModal(false);
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md text-center active:scale-[0.98]"
                >
                  Let's Swipe & Explore
                </button>

                <button 
                  onClick={() => {
                    // Pre-seed points and coins
                    setIntuitionPoints(650);
                    localStorage.setItem('idea_swipe_intuition_points', '650');
                    setCivicCoins(1200);
                    localStorage.setItem('idea_swipe_civic_coins', '1200');
                    
                    // Pre-seed credentials
                    const trialCreds: CitizenCredential[] = [
                      {
                        id: "trial1",
                        type: 'degree',
                        title: "Ph.D. in Direct Democracy",
                        institution: "National Kapodistrian University of Athens",
                        year: "2024",
                        fileName: "democracy_phd_verified.pdf",
                        status: 'verified'
                      },
                      {
                        id: "trial2",
                        type: 'degree',
                        title: "M.Sc. in Cryptography & Ledger Protocols",
                        institution: "Technical University of Crete",
                        year: "2022",
                        fileName: "cryptography_msc_verified.pdf",
                        status: 'verified'
                      }
                    ];
                    setCredentials(trialCreds);
                    localStorage.setItem('idea_swipe_credentials', JSON.stringify(trialCreds));

                    // Switch view to forum
                    setSelectedCategory('forum');
                    setActiveView('cards');
                    
                    localStorage.setItem('civic_swipe_welcome_dismissed', 'true');
                    setShowWelcomeModal(false);

                    triggerToast("⚡ Sandbox Trial Mode Activated! +650 IP, +1200 CC, and Ph.D. Credentials unlocked! Welcome to the Deliberation Forum.", "success");
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md text-center active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  ⚡ Sandbox Trial Mode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: VERIFIABLE ACADEMIC & PROFESSIONAL CREDENTIAL UPLOADER */}
      <AnimatePresence>
        {showCredentialModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5 text-left"
            >
              <button 
                onClick={() => setShowCredentialModal(false)}
                className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <Award className="text-purple-600" size={20} /> Verify Academic Credentials
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Uploading university degrees or verified professional achievements adds <strong className="text-indigo-600 font-semibold">+100 Intuition Points (IP)</strong> to your profile. This gives your future swipes and prediction likes more structural weight!
                </p>
              </div>

              <form onSubmit={handleAddCredentialSubmit} className="space-y-4">
                {/* Credential Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Credential Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCredType('degree')}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        credType === 'degree'
                          ? "bg-purple-950 text-white border-purple-950 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      🎓 University Degree
                    </button>
                    <button
                      type="button"
                      onClick={() => setCredType('achievement')}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        credType === 'achievement'
                          ? "bg-purple-950 text-white border-purple-950 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      🏆 Key Achievement
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Degree / Title Name</label>
                  <input
                    required
                    type="text"
                    placeholder={credType === 'degree' ? "e.g., Bachelor of Computer Science" : "e.g., Lead Smart Contract Auditor"}
                    value={credTitle}
                    onChange={(e) => setCredTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors"
                  />
                </div>

                {/* Institution */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Issuing University / Institution</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., National and Kapodistrian University of Athens"
                    value={credInstitution}
                    onChange={(e) => setCredInstitution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Graduation / Award Year</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., 2021"
                    value={credYear}
                    onChange={(e) => setCredYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-slate-400 font-medium transition-colors"
                  />
                </div>

                {/* Drag and Drop File Uploader */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">PDF Certificate / Scanned Degree</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                      dragActive 
                        ? "border-purple-500 bg-purple-50/40" 
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload-input" 
                      className="cursor-pointer space-y-2 flex flex-col items-center justify-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 text-xs">
                        📄
                      </div>
                      {fileName ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono font-bold text-slate-800 max-w-[240px] truncate">{fileName}</p>
                          <p className="text-[8px] text-green-600 font-black uppercase">Ready for local verification</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-700">Drag & Drop file here, or <span className="text-purple-600 hover:underline">browse</span></p>
                          <p className="text-[8px] text-slate-400 font-mono">Supports PDF, PNG, JPG (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCredentialModal(false)}
                    className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-950 hover:bg-purple-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Verify & Award IP
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: POINTS EXPLANATION & SHARE WITH FRIENDS MODAL */}
      <AnimatePresence>
        {showPointsExplanation && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 text-left"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowPointsExplanation(null)}
                className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Title & Toggle buttons */}
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  🛡️ Civic Ledger Metrics
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  How your predictive wisdom and spendable influence shape the synchronized ledger.
                </p>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => setShowPointsExplanation('intuition')}
                    className={`py-2 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      showPointsExplanation === 'intuition'
                        ? "bg-blue-950 text-white border-blue-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    🔮 Intuition (IP)
                  </button>
                  <button
                    onClick={() => setShowPointsExplanation('civic')}
                    className={`py-2 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      showPointsExplanation === 'civic'
                        ? "bg-amber-950 text-white border-amber-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    🪙 Civic Coins (CC)
                  </button>
                </div>
              </div>

              {/* Content Panel */}
              <div className="space-y-4 pt-1 border-t border-slate-100">
                {showPointsExplanation === 'intuition' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/60 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">Your Balance</span>
                        <span className="text-xs font-mono font-black text-blue-600 bg-white px-2 py-0.5 rounded-lg border border-blue-200">{intuitionPoints} IP</span>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">Voting Weight Multiplier</span>
                        <span className="text-xs font-mono font-black text-slate-900">
                          {parseFloat((1 + Math.max(0, Math.floor(intuitionPoints / 100) * 0.1)).toFixed(1))}x
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium leading-relaxed italic">
                        *Every 100 IP gives you +10% voting weight on the platform!
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">🔮 What are Intuition Points?</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Intuition Points (IP) represent your analytical wisdom and swiping accuracy on civic ideas. It is an index of your alignment with facts and rational deliberation.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">📈 How to Earn IP</h4>
                      <ul className="text-[10.5px] text-slate-500 space-y-1.5 list-disc pl-4 leading-normal">
                        <li><strong>Correct Prediction:</strong> Backing high-quality proposals or rejecting low-quality ones grants <span className="text-emerald-600 font-bold">+10 IP</span>.</li>
                        <li><strong>Verifying Qualifications:</strong> Uploading verifiable academic degrees or achievements grants <span className="text-purple-600 font-bold">+100 IP</span> instantly.</li>
                      </ul>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">⚠️ How you Lose IP</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Swiping UP on low-quality proposals or swiping DOWN on high-quality, effective proposals results in a <span className="text-red-500 font-bold">-5 IP</span> deduction.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/60 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Your Balance</span>
                        <span className="text-xs font-mono font-black text-amber-600 bg-white px-2 py-0.5 rounded-lg border border-amber-200">{civicCoins} CC</span>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">Estimated Review Capacity</span>
                        <span className="text-xs font-mono font-black text-slate-900">
                          {Math.floor(civicCoins / 1)} Proposal Assessments
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">🪙 What are Civic Coins?</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Civic Coins (CC) are spendable cryptographic utility coins earned by making correct foresight decisions. They measure active energy and trust-building on the ledger.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">⚡ Spend Utility</h4>
                      <ul className="text-[10.5px] text-slate-500 space-y-1.5 list-disc pl-4 leading-normal">
                        <li><strong>Submit Assessment Reports:</strong> It costs <strong className="text-amber-600">1 CC</strong> to submit a proposal rating report, preventing spam and ensuring evaluations are deliberate and high-effort.</li>
                        <li><strong>Earn on Success:</strong> Correct swiping predictions on proposals earn you <span className="text-emerald-600 font-bold">+2 CC</span>!</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Functional Algorithm & Verification Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 text-left space-y-2">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  💻 Algorithm fully functional?
                </h4>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  <strong>Absolutely!</strong> The prediction engine evaluates your swipes directly against real-time consensus. Your current voting weight (<span className="font-mono text-[10px] bg-white border px-1 rounded font-bold">{parseFloat((1 + Math.max(0, Math.floor(intuitionPoints / 100) * 0.1)).toFixed(1))}x</span>) is factored into proposal scores inside our custom database.
                </p>
              </div>

              {/* Sharing Widget */}
              <div className="border-t border-slate-100 pt-4 space-y-3 text-left">
                <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest flex items-center gap-1">
                  🔗 Share with Friends
                </h4>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Invite your friends to swipe on proposals, test their forecasting intuition, and explore the synchronized civic ledger!
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5">
                  <span className="text-[9.5px] font-mono text-slate-500 truncate select-all flex-1">
                    https://ais-pre-f3prd2kxukkcwjzkk2afy5-219306438652.europe-west2.run.app
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://ais-pre-f3prd2kxukkcwjzkk2afy5-219306438652.europe-west2.run.app");
                      triggerToast("📋 Shared App URL copied to your clipboard!", 'success');
                    }}
                    className="shrink-0 p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2"
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
              </div>

              {/* Close Bottom Button */}
              <button
                onClick={() => setShowPointsExplanation(null)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md text-center active:scale-[0.98]"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL NOTIFICATION TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 max-w-xs w-full border text-left bg-slate-900 border-slate-800 text-white"
          >
            <div className="text-sm shrink-0">
              {toast.type === 'success' ? '🎉' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </div>
            <p className="text-[10.5px] font-bold leading-normal flex-1">
              {toast.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

