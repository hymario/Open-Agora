import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, HelpCircle, CheckCircle, ShieldCheck, Heart, Landmark, Vote, MessageSquare, Sparkles, Globe, Layers, Wifi, Cpu, Zap, TrendingUp, RefreshCw, Activity, Terminal } from 'lucide-react';
import { formatCivicNumber } from '../lib/civicNumber';

interface GreeceRegion {
  id: string;
  name: string;
  englishName: string;
  x: number; // Percent coordinates for positioning on a stylized vector container
  y: number;
  users: number; // Active direct-democracy voters/citizens
  representatives: number; // Dynamic delegated proxy nodes
  initiatives: {
    name: string;
    type: 'assembly' | 'referendum' | 'council';
    description: string;
    metric: string;
    status: string;
  }[];
}

const GREECE_REGIONS: GreeceRegion[] = [
  {
    id: 'attica',
    name: 'Αττική',
    englishName: 'Attica (Athens & Saronic)',
    x: 62,
    y: 65,
    users: 48500,
    representatives: 142,
    initiatives: [
      { name: 'Attica Citizens Assembly', type: 'assembly', description: 'Bi-weekly physical and digital assemblies resolving regional resource pooling.', metric: '4,820 active delegates', status: 'Active' },
      { name: 'Regional Transport Funding Referendum', type: 'referendum', description: 'Referendum to implement peer-to-peer cooperative transit funding.', metric: 'Voting ends in 3 days', status: 'Voting Open' },
      { name: 'Athens Public Domain Ledger Council', type: 'council', description: 'Managing community-funded servers and ledger verification nodes.', metric: '99.8% consensus rate', status: 'Operational' }
    ]
  },
  {
    id: 'macedonia',
    name: 'Κεντρική Μακεδονία',
    englishName: 'Central Macedonia (Thessaloniki)',
    x: 48,
    y: 20,
    users: 29400,
    representatives: 85,
    initiatives: [
      { name: 'Thessaloniki Direct Council', type: 'assembly', description: 'Direct democratic committee for local municipal organization.', metric: '2,150 active delegates', status: 'Active' },
      { name: 'Consensus Charter on Land Stewardship', type: 'referendum', description: 'Debating local land management and mutual assistance protocols.', metric: 'Deliberation stage', status: 'Deliberating' }
    ]
  },
  {
    id: 'thrace',
    name: 'Ανατολική Μακεδονία & Θράκη',
    englishName: 'East Macedonia & Thrace (Alexandroupoli)',
    x: 72,
    y: 12,
    users: 9800,
    representatives: 22,
    initiatives: [
      { name: 'Border Communities Mesh Sync', type: 'council', description: 'Syncing decentralized voter registries via long-range wireless networks.', metric: '15 nodes operational', status: 'Online' },
      { name: 'Evros Eco-Reserve Assembly', type: 'assembly', description: 'Direct consensus on community volunteer safety patrols and fire breaks.', metric: '120 active patrollers', status: 'Active' }
    ]
  },
  {
    id: 'west_macedonia',
    name: 'Δυτική Μακεδονία',
    englishName: 'West Macedonia (Kozani)',
    x: 37,
    y: 24,
    users: 7500,
    representatives: 18,
    initiatives: [
      { name: 'Post-Coal Energy Transition Council', type: 'council', description: 'Planning microgrids for community-owned heating and solar structures.', metric: 'Consensus achieved', status: 'Approved' }
    ]
  },
  {
    id: 'epirus',
    name: 'Ήπειρος',
    englishName: 'Epirus (Ioannina)',
    x: 28,
    y: 40,
    users: 6200,
    representatives: 15,
    initiatives: [
      { name: 'Epirus Mountain Community Assembly', type: 'assembly', description: 'Local direct democracy circles for remote mountain communities to share resource ledgers.', metric: '380 active delegates', status: 'Active' }
    ]
  },
  {
    id: 'thessaly',
    name: 'Θεσσαλία',
    englishName: 'Thessaly (Larisa & Volos)',
    x: 46,
    y: 42,
    users: 11500,
    representatives: 26,
    initiatives: [
      { name: 'Thessaly Democratic Working Group', type: 'assembly', description: 'Focusing on regional resource self-reliance during unexpected crises.', metric: '750 active delegates', status: 'Active' }
    ]
  },
  {
    id: 'west_greece',
    name: 'Δυτική Ελλάδα',
    englishName: 'West Greece (Patras)',
    x: 35,
    y: 58,
    users: 14200,
    representatives: 38,
    initiatives: [
      { name: 'Patras Port Logistics Assembly', type: 'assembly', description: 'Direct voter management of cooperative shipping and storage assets.', metric: '840 delegates active', status: 'Active' },
      { name: 'Gulf of Patras Conservation Vote', type: 'referendum', description: 'Referendum regarding limits on corporate aquaculture leasing.', metric: '94% opposing turnout', status: 'Passed' }
    ]
  },
  {
    id: 'central_greece',
    name: 'Στερεά Ελλάδα',
    englishName: 'Central Greece (Lamia & Chalkida)',
    x: 55,
    y: 55,
    users: 10400,
    representatives: 24,
    initiatives: [
      { name: 'Euboea Forest Direct Council', type: 'assembly', description: 'Autonomous community forest regeneration after extreme weather.', metric: '520 registered voters', status: 'Active' }
    ]
  },
  {
    id: 'peloponnese',
    name: 'Πελοπόννησος',
    englishName: 'Peloponnese (Sparta & Tripoli)',
    x: 42,
    y: 72,
    users: 12800,
    representatives: 31,
    initiatives: [
      { name: 'Peloponnesian Citizen Circle', type: 'assembly', description: 'Decentralized consensus assembly for agricultural coordination and local resource distribution.', metric: '950 active delegates', status: 'Active' }
    ]
  },
  {
    id: 'ionian_islands',
    name: 'Ιόνια Νησιά',
    englishName: 'Ionian Islands (Corfu & Zante)',
    x: 18,
    y: 48,
    users: 5400,
    representatives: 12,
    initiatives: [
      { name: 'Ionian Maritime Safety Ledger', type: 'council', description: 'Direct coordination of shared fishing vessels and marine telemetry logs.', metric: '18 vessels participating', status: 'Active' }
    ]
  },
  {
    id: 'north_aegean',
    name: 'Βόρειο Αιγαίο',
    englishName: 'North Aegean (Lesbos & Samos)',
    x: 78,
    y: 45,
    users: 4900,
    representatives: 10,
    initiatives: [
      { name: 'Aegean Island Cooperative Council', type: 'assembly', description: 'Coordinating emergency mutual-assistance supplies across remote islands.', metric: '4 islands linked', status: 'Active' }
    ]
  },
  {
    id: 'cyclades',
    name: 'Κυκλάδες',
    englishName: 'Cyclades (Naxos & Syros)',
    x: 68,
    y: 74,
    users: 7100,
    representatives: 16,
    initiatives: [
      { name: 'Water Self-Sufficiency Referendum', type: 'referendum', description: 'Direct vote to build mutual-consent solar desalinators on arid islands.', metric: '82% voter turnout', status: 'Voting Closed' }
    ]
  },
  {
    id: 'dodecanese',
    name: 'Δωδεκάνησα',
    englishName: 'Dodecanese (Rhodes & Kos)',
    x: 88,
    y: 80,
    users: 8200,
    representatives: 19,
    initiatives: [
      { name: 'Dodecanese Heritage Commons', type: 'council', description: 'Direct civic preservation of historic structures via volunteer maintenance registries.', metric: '290 volunteers', status: 'Active' }
    ]
  },
  {
    id: 'crete',
    name: 'Κρήτη',
    englishName: 'Crete (Heraklion & Chania)',
    x: 75,
    y: 92,
    users: 18100,
    representatives: 44,
    initiatives: [
      { name: 'Crete Regional Assembly', type: 'assembly', description: 'Autonomous direct democracy circles across Cretan cities.', metric: '1,580 active delegates', status: 'Active' },
      { name: 'Cooperative Energy Initiative', type: 'council', description: 'Cooperative development of communal microgrids managed by direct vote.', metric: 'Proposal approved', status: 'Approved' }
    ]
  }
];

const LOG_TEMPLATE_EVENTS = [
  "Verified transaction consensus on Athens transport proposal",
  "Sparta Medical Aid synchronized bio-inventory with Peloponnese Node",
  "Thessaloniki Local Assembly registered 4 new voters",
  "Larisa Local Assembly approved communal farming rotation cycle #42",
  "Euboea Node initiated forest monitoring telemetry block #921",
  "Crete Cooperative Microgrid offset 12.8MWh of peak consumption",
  "Alexandroupoli Node completed cryptographic audit of checksums",
  "Chania Node synchronized 12 direct-democracy proxies successfully",
  "Ioannina Council approved municipal pasture ledger block #819",
  "Patras maritime cooperative logged cargo logistics for common stock",
  "Naxos water desalinator project triggered smart-contract fund release"
];

const CITY_LABELS = [
  { name: 'Thessaloniki', x: 48, y: 17 },
  { name: 'Athens', x: 62, y: 62 },
  { name: 'Patras', x: 35, y: 55 },
  { name: 'Sparta', x: 42, y: 76 },
  { name: 'Ioannina', x: 28, y: 37 },
  { name: 'Larissa', x: 46, y: 39 },
  { name: 'Alexandroupoli', x: 75, y: 10 },
  { name: 'Heraklion', x: 75, y: 89 }
];

export const GreeceMapSection: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<GreeceRegion>(GREECE_REGIONS[0]);
  const [blockHeight, setBlockHeight] = useState(148092);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    "Node #4182 verified block consensus for Athens transport proposal",
    "Sparta Medical Aid synchronized bio-ledger with Peloponnese Node",
    "Larisa Local Assembly approved communal farming rotation cycle #4"
  ]);

  const totalNetworkUsers = useMemo(() => GREECE_REGIONS.reduce((acc, r) => acc + r.users, 0), []);
  const totalNetworkReps = useMemo(() => GREECE_REGIONS.reduce((acc, r) => acc + r.representatives, 0), []);

  // Periodic ledger update simulation
  useEffect(() => {
    const logInterval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      const randomEvent = LOG_TEMPLATE_EVENTS[Math.floor(Math.random() * LOG_TEMPLATE_EVENTS.length)];
      const randomNode = Math.floor(Math.random() * 9000 + 1000);
      const newLog = `[Node #${randomNode}] ${randomEvent}`;
      
      setLiveLogs(prev => [newLog, prev[0], prev[1]].slice(0, 3));
    }, 4500);

    return () => clearInterval(logInterval);
  }, []);

  // Cleaned up neighboring connections to satisfy "no need for roads"
  const getIconForType = (type: string) => {
    switch (type) {
      case 'assembly': return <Landmark className="text-emerald-400 animate-pulse" size={14} />;
      case 'referendum': return <Vote className="text-amber-400" size={14} />;
      case 'council': return <MessageSquare className="text-purple-400" size={14} />;
      default: return <Users className="text-slate-400" size={14} />;
    }
  };

  return (
    <div id="greece-map-container" className="bg-slate-900 text-slate-100 rounded-3xl p-3 sm:p-6 border border-slate-800 shadow-xl space-y-4 sm:space-y-6 max-w-4xl mx-auto my-4">
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Parallel Direct Democracy</h3>
          </div>
          <h2 className="text-lg font-black text-white mt-1">Hellenic Assembly Network Map</h2>
          <p className="text-[10px] text-slate-400 max-w-[520px] mt-1 leading-normal">
            Visualizing the decentralized citizen nodes of our direct-democratic self-sustained parallel society. Active citizens organize local assemblies, cast votes, and validate proposals directly.
          </p>
        </div>
        
        {/* Network Metrics block */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 shrink-0 flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Voters</span>
            <span className="font-black text-emerald-400">{formatCivicNumber(totalNetworkUsers)}</span>
          </div>
          <div className="border-l border-slate-800 h-8" />
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Proxy Nodes</span>
            <span className="font-black text-white">{formatCivicNumber(totalNetworkReps)}</span>
          </div>
          <div className="border-l border-slate-800 h-8" />
          <div>
            <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Block Height</span>
            <span className="font-black text-purple-400 flex items-center gap-1">
              <Cpu size={10} className="text-purple-400 animate-spin-slow" />
              #{blockHeight}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interactive Vector Greece Map with details */}
        <div className="lg:col-span-7 bg-slate-950/90 rounded-3xl p-2 sm:p-4 border border-slate-850 aspect-square w-full relative flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[380px] shadow-2xl">
          {/* Radar Scanner aesthetic overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] border-4 border-emerald-500/30 rounded-full animate-ping [animation-duration:8s]" />
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Detailed Schematic SVG Map Outline of Greece & Islands */}
          <svg className="absolute inset-0 w-full h-full p-2 opacity-50 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            {/* Outline of Northern / Central Greece / Thrace / Epirus */}
            <path 
              d="M 15,35 L 20,25 Q 30,18 42,15 L 50,15 L 60,18 Q 70,12 80,10 L 85,14 L 80,18 L 76,20 L 72,25 L 65,22 L 62,28 L 56,25 L 54,30 L 48,32 L 48,40 L 45,46 L 52,50 L 56,46 L 58,52 L 62,56 L 64,62 L 60,65 L 56,62 Q 52,56 46,55 Q 40,54 36,48 L 32,50 L 26,45 L 22,48 L 18,44 Z" 
              strokeWidth="1.0" 
              strokeLinejoin="round" 
              className="text-slate-800 fill-slate-900/40"
            />
            {/* Outline of Peloponnese */}
            <path 
              d="M 33,56 L 37,56 Q 44,54 48,58 L 47,64 L 51,68 L 48,74 L 44,72 L 45,78 L 41,79 L 38,74 L 33,76 L 30,70 L 32,65 Z" 
              strokeWidth="1.0" 
              strokeLinejoin="round" 
              className="text-slate-800 fill-slate-900/40"
            />
            {/* Euboea (Evia) Island */}
            <path 
              d="M 56,48 L 60,52 L 64,58 L 61,60 L 55,52 Z" 
              strokeWidth="1.0" 
              strokeLinejoin="round" 
              className="text-slate-800 fill-slate-900/50"
            />
            {/* Crete Island */}
            <path 
              d="M 55,91 L 62,90 L 70,91 L 80,91 L 85,93 L 83,95 L 75,94 L 65,94 L 54,93 Z" 
              strokeWidth="1.0" 
              strokeLinejoin="round" 
              className="text-slate-800 fill-slate-900/50"
            />
            
            {/* Detailed Ionian Islands outlines */}
            <path d="M 14,32 L 16,34 L 15,38 Z" strokeWidth="0.8" className="text-slate-700 fill-slate-900/60" />
            <path d="M 15,50 L 17,54 L 19,52 Z" strokeWidth="0.8" className="text-slate-700 fill-slate-900/60" />
            <path d="M 17,58 L 19,61 Z" strokeWidth="0.8" className="text-slate-700" />

            {/* Aegean and Dodecanese Islands outlines */}
            <path d="M 80,42 L 84,45 L 82,48 Z" strokeWidth="0.8" className="text-slate-700 fill-slate-900/60" />
            <path d="M 80,54 L 82,58 Z" strokeWidth="0.8" className="text-slate-700" />
            <path d="M 83,65 L 86,66 L 85,68 Z" strokeWidth="0.8" className="text-slate-700" />
            <path d="M 88,81 L 91,85 L 89,87 Z" strokeWidth="0.8" className="text-slate-700 fill-slate-900/60" />

            {/* Cyclades dots */}
            <circle cx="64" cy="69" r="0.8" className="text-slate-700 fill-slate-700" />
            <circle cx="66" cy="71" r="1.0" className="text-slate-600 fill-slate-600" />
            <circle cx="63" cy="73" r="0.9" className="text-slate-600 fill-slate-600" />
            <circle cx="65" cy="76" r="1.1" className="text-slate-600 fill-slate-600" />
            <circle cx="69" cy="72" r="1.0" className="text-purple-500 fill-purple-500/50" />
            <circle cx="70" cy="75" r="0.9" className="text-slate-600 fill-slate-600" />
            <circle cx="68" cy="78" r="1.0" className="text-slate-600 fill-slate-600" />
            <circle cx="72" cy="77" r="0.8" className="text-slate-700 fill-slate-700" />
            <circle cx="67" cy="81" r="1.0" className="text-slate-600 fill-slate-600" />

          </svg>

          {/* Render styled city labels directly on the map background for visual details */}
          {CITY_LABELS.map((city) => (
            <div 
              key={city.name} 
              style={{ left: `${city.x}%`, top: `${city.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center select-none"
            >
              <span className="w-1 h-1 rounded-full bg-slate-600/60" />
              <span className="text-[7px] font-mono text-slate-600 font-extrabold uppercase tracking-widest mt-0.5">{city.name}</span>
            </div>
          ))}

          {/* Interactive Regional Hotspots Overlay */}
          {GREECE_REGIONS.map((region) => {
            const isSelected = selectedRegion.id === region.id;
            
            return (
              <button
                key={region.id}
                id={`region-hotspot-${region.id}`}
                onClick={() => setSelectedRegion(region)}
                style={{ left: `${region.x}%`, top: `${region.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 focus:outline-none cursor-pointer"
              >
                {/* Ping Animation */}
                <span className={`absolute inset-0 rounded-full w-8 h-8 -translate-x-2 -translate-y-2 transition-all duration-700 ${
                  isSelected 
                    ? 'bg-emerald-400/30 scale-125 animate-ping' 
                    : 'bg-slate-800/40 group-hover:bg-slate-700/50'
                }`} />
                
                {/* Hotspot circle */}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 relative ${
                  isSelected 
                    ? 'bg-emerald-400 border-white scale-125 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-900 border-slate-700 hover:border-slate-400 group-hover:scale-110'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isSelected 
                      ? 'bg-slate-950' 
                      : 'bg-slate-400 group-hover:bg-white'
                  }`} />
                </div>

                {/* Region Tooltip Label */}
                <div className={`absolute left-1/2 -translate-x-1/2 top-5 p-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all shadow-md whitespace-nowrap border ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-800 text-white z-20 scale-105 shadow-emerald-950/20' 
                    : 'bg-slate-950/85 border-slate-900 text-slate-400 group-hover:text-slate-200'
                }`}>
                  {region.name}
                </div>
              </button>
            );
          })}

          {/* Scale Indicator */}
          <div className="absolute bottom-3 left-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/80 p-2 px-3 rounded-xl border border-slate-850 flex items-center gap-1.5 shadow-lg">
            <Globe size={11} className="text-emerald-500 animate-spin-slow" />
            <span>Liquid Mesh Active</span>
          </div>
        </div>

        {/* Right Side: Detailed Selected Region Information Card */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-[380px] space-y-4">
          <div className="bg-slate-950/80 border border-slate-850 rounded-3xl p-4 space-y-4 flex-1">
            {/* Header of selected card */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-3">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded-md">
                  Active Assembly Circle
                </span>
                <h3 className="text-base font-black text-white mt-1.5 flex items-center gap-1">
                  <MapPin size={15} className="text-emerald-400 animate-bounce" /> {selectedRegion.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">{selectedRegion.englishName}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Voter Base</span>
                <span className="text-xs font-mono font-black text-emerald-400">
                  {formatCivicNumber(selectedRegion.users)}
                </span>
              </div>
            </div>

            {/* Pyramid consolidation indicator for the region */}
            <div className="bg-slate-900/80 border border-slate-850 rounded-2xl p-3 space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Users size={12} className="text-slate-400" /> Liquid Cascades:
                </span>
                <span className="text-white font-mono font-bold">
                  {formatCivicNumber(selectedRegion.representatives)} active proxies
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (selectedRegion.representatives / 150) * 100)}%` }}
                />
              </div>
            </div>

            {/* Local Community Projects Section */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-400 animate-pulse" /> Regional Initiatives
              </h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {selectedRegion.initiatives.map((proj) => (
                  <div key={proj.name} className="bg-slate-900/60 border border-slate-850 rounded-xl p-2.5 hover:border-slate-800 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getIconForType(proj.type)}
                        <span className="text-[10px] font-bold text-slate-200 leading-tight">{proj.name}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">
                        {proj.metric}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal font-medium">{proj.description}</p>
                    <div className="text-[7px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      <ShieldCheck size={9} className="text-slate-400" /> Progress: <span className="text-slate-300 font-bold">{proj.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSS Animation injection for moving dash lines */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}} />

          {/* Dynamic running ledger feed */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 space-y-2 font-mono text-[9px] text-slate-400">
            <h5 className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-slate-900">
              <Terminal size={11} className="text-purple-400 animate-pulse" />
              Real-time Ledger Sync Stream
            </h5>
            <div className="space-y-1">
              {liveLogs.map((log, i) => (
                <div 
                  key={`${i}-${log.substring(0, 15)}`} 
                  className={`truncate flex items-center gap-1.5 transition-opacity ${i === 0 ? 'text-emerald-400 font-bold' : 'opacity-60'}`}
                >
                  <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
