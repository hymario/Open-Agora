import React from 'react';
import { FundingStats } from '../types';
import { Wallet, Users, Info } from 'lucide-react';

interface FundingSummaryProps {
  stats: FundingStats;
}

export const FundingSummary: React.FC<FundingSummaryProps> = ({ stats }) => {
  return (
    <div className="bg-[#1a1a1a] border-t border-white/10 p-6 rounded-t-[32px] shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight text-white">Community Fund</h3>
        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Active Epoch
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Users size={12} /> Active Citizens
          </p>
          <p className="text-2xl font-mono text-white">
            {(stats.totalUsers / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Wallet size={12} /> Share / User
          </p>
          <p className="text-2xl font-mono text-white text-green-400">
            ${stats.costPerUser.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/60">
          <span>Current Pool Burden</span>
          <span>${(stats.totalCost / 1000).toFixed(0)}k</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-1000" 
            style={{ width: '45%' }} // Mock progress
          />
        </div>
        <p className="text-[10px] text-white/30 leading-relaxed italic flex items-start gap-2">
          <Info size={12} className="shrink-0 mt-0.5" />
          Every member of Agora shares the cost equally for the top-rated emergent projects at the end of each month.
        </p>
      </div>
    </div>
  );
};
