import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Info, Target, MessageSquare } from 'lucide-react';

interface RatingAxesProps {
  onRatingChange: (ratings: {
    informed: number;
    effective: number;
    informedComment: string;
    effectiveComment: string;
  }) => void;
}

export const RatingAxes: React.FC<RatingAxesProps> = ({ onRatingChange }) => {
  const [ratings, setRatings] = useState({
    informed: 3,
    effective: 3,
  });

  const [comments, setComments] = useState({
    informed: '',
    effective: '',
  });

  const [activeComment, setActiveComment] = useState<string | null>(null);

  const updateRating = (axis: keyof typeof ratings, value: number) => {
    const newRatings = { ...ratings, [axis]: value };
    setRatings(newRatings);
    onRatingChange({
      ...newRatings,
      informedComment: comments.informed,
      effectiveComment: comments.effective,
    });
  };

  const updateComment = (axis: keyof typeof comments, value: string) => {
    const newComments = { ...comments, [axis]: value };
    setComments(newComments);
    onRatingChange({
      ...ratings,
      informedComment: newComments.informed,
      effectiveComment: newComments.effective,
    });
  };

  const Axis = ({ 
    label, 
    value, 
    axis, 
    icon: Icon, 
    leftLabel, 
    rightLabel 
  }: { 
    label: string; 
    value: number; 
    axis: keyof typeof ratings; 
    icon: any;
    leftLabel: string;
    rightLabel: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Icon size={14} className="text-slate-400" />
          {label}
        </label>
        <button 
          onClick={() => setActiveComment(activeComment === axis ? null : axis)}
          className={cn(
            "p-1 rounded transition-colors",
            comments[axis] ? "text-blue-600" : "text-slate-300 hover:text-slate-500"
          )}
        >
          <MessageSquare size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] text-slate-400 uppercase font-mono w-16 text-right">{leftLabel}</span>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(e) => updateRating(axis, parseInt(e.target.value))}
          className="flex-1 accent-slate-900 h-1.5 rounded-full cursor-pointer opacity-80"
        />
        <span className="text-[10px] text-slate-400 uppercase font-mono w-16 text-left">{rightLabel}</span>
      </div>

      {activeComment === axis && (
        <textarea
          autoFocus
          value={comments[axis]}
          onChange={(e) => updateComment(axis, e.target.value)}
          placeholder={`Why is it ${value <= 2 ? leftLabel.toLowerCase() : value >= 4 ? rightLabel.toLowerCase() : 'neutral'}?`}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-inner"
          rows={2}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6 pt-4">
      <Axis 
        label="Knowledge Base" 
        axis="informed" 
        value={ratings.informed} 
        icon={Info}
        leftLabel="Uninformed"
        rightLabel="Informed"
      />
      <Axis 
        label="Impact Depth" 
        axis="effective" 
        value={ratings.effective} 
        icon={Target}
        leftLabel="Ineffective"
        rightLabel="Effective"
      />
    </div>
  );
};
