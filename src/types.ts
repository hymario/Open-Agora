/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VersionRecord {
  id: string;
  timestamp: string;
  title?: string;
  description?: string;
  text?: string;
  image?: string;
  editor: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  creator: string;
  cost: number;
  image: string;
  stats: IdeaStats;
  votes: number;
  comments: Comment[];
  parentId?: string;
  parentTitle?: string;
  upgrades?: UpgradeSuggestion[];
  category: 'main' | 'emergency' | 'political' | 'forum';
  investedAmount: number;
  startingInvestedAmount: number;
  versions?: VersionRecord[];
}

export interface ForumThread {
  id: string;
  title: string;
  description: string;
  creator: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  stats: {
    informed: number;
    effective: number;
  };
  comments: Comment[];
  elevatedToProposalId?: string;
  category?: 'main' | 'emergency' | 'political'; // Preferred category if elevated
  forumCategory?: string;
  userVote?: 'like' | 'dislike' | null;
  userRatings?: { informed: number; effective: number } | null;
  versions?: VersionRecord[];
}

export interface UpgradeSuggestion {
  id: string;
  user: string;
  title: string;
  description: string;
  cost: number;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  reactions: {
    like: number;
    dislike: number;
    informed: number;
    uninformed: number;
    effective: number;
    ineffective: number;
  };
  userReactions?: string[];
  replies?: Comment[];
  versions?: VersionRecord[];
}

export interface IdeaStats {
  informed: number; // 1-5
  effective: number; // 1-5
}

export interface VotePayload {
  direction: 'up' | 'down';
  ratings: {
    informed: number;
    effective: number;
    informedComment?: string;
    effectiveComment?: string;
  };
}

export interface FundingStats {
  totalUsers: number;
  totalCost: number;
  costPerUser: number;
  fundedIdeasCount: number;
}

export interface Representative {
  name: string;
  avatar: string;
  bio: string;
  alignment: string;
  matchScore: number;
  followersCount: number;
  delegatedTo?: string; // Point to another representative (liquid democracy chain)
  recommendations: Record<string, {
    vote: 'up' | 'down';
    informed: number;
    effective: number;
    comment: string;
  }>;
}

export interface DelegationHistory {
  ideaId: string;
  ideaTitle: string;
  vote: 'up' | 'down';
  ratings: {
    informed: number;
    effective: number;
  };
  representative: string;
  timestamp: string;
}

export interface CitizenCredential {
  id: string;
  type: 'degree' | 'achievement';
  title: string;
  institution: string;
  year: string;
  fileName?: string;
  status: 'verified';
}

