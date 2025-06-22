import { DictionaryCard } from "./dictionary-card";
import { StackCard } from "./stack-card";

export type SearchResult = {
  query: string;
  cards: StackCard[];
  dictionaryCards: DictionaryCard[];
};
