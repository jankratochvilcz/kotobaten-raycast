import { StackCardType } from "./stack-card-type";

export type StackCard = {
  // CardDefinition
  created: string; // ISO date string
  sense: string;
  kana: string;
  kanji: string;
  note: string;
  order: number;
  userId: number;
  type: StackCardType;

  // User Progress
  firstSeen?: string; // ISO date string or undefined
  lastSeen?: string;
  oldestConsecutiveKanaSuccess?: string;
  newestConsecutiveKanaSuccess?: string;
  oldestConsecutiveSenseSuccess?: string;
  newestConsecutiveSenseSuccess?: string;
  consecutiveKanaSuccessCount: number;
  consecutiveSenseSuccessCount: number;
  senseRetentionScore?: number;
  lastSenseRetentionScoreUpdated?: string;
  kanaRetentionScore?: number;
  lastKanaRetentionScoreUpdated?: string;
  kanaIsInPracticeQueue: boolean;
  senseIsInPracticeQueue: boolean;
};