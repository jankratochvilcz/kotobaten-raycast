import { DictionaryCardSense } from "./dictionary-card-sense";

export type DictionaryCard = {
  kanji: string;
  kana: string;
  senses: DictionaryCardSense[];
  isCommon: boolean;
};