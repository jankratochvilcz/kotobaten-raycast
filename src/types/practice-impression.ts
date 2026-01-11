import { StackCard } from "./stack-card";

export type ImpressionType =
  | "GeneratedSentenceGuess"
  | "SenseGuess"
  | "KanaGuess"
  | "GeneratedSentenceWithParticlesSelect";

export interface BaseImpression {
  type: ImpressionType;
  id: number;
  stackCardId?: number;
}

export interface GeneratedSentenceGuess extends BaseImpression {
  type: "GeneratedSentenceGuess";
  kanaOnly: string;
  withKanji: string;
  sense: string;
}

export interface SenseGuess extends BaseImpression {
  type: "SenseGuess";
  card: StackCard;
}

export interface KanaGuess extends BaseImpression {
  type: "KanaGuess";
  card: StackCard;
}

export interface ParticleOption {
  id: number;
  withKanji: string;
  kanaOnly: string;
}

export interface GeneratedSentenceWithParticlesSelect extends BaseImpression {
  type: "GeneratedSentenceWithParticlesSelect";
  options: ParticleOption[];
  correctOption: number;
  explanation: string;
  sense: string;
}

export type Impression =
  | GeneratedSentenceGuess
  | SenseGuess
  | KanaGuess
  | GeneratedSentenceWithParticlesSelect;

export interface PracticeResponse {
  impressions: Impression[];
}
