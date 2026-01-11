import { getPracticeWords } from "./api";
import { DisplayWord } from "./storage";
import { Impression, PracticeResponse } from "../types/practice-impression";
import { containsProfanityInFields } from "./profanity-filter";

/**
 * Extract a DisplayWord from an Impression based on its type
 */
export function extractDisplayWord(impression: Impression): DisplayWord | undefined {
  switch (impression.type) {
    case "SenseGuess":
    case "KanaGuess":
      return {
        sense: impression.card.sense,
        kanji: impression.card.kanji || undefined,
        kana: impression.card.kana || undefined,
      };
    case "GeneratedSentenceGuess":
      return {
        sense: impression.sense,
        kanji: impression.withKanji,
        kana: impression.kanaOnly,
      };
    case "GeneratedSentenceWithParticlesSelect":
      return {
        sense: impression.sense,
        kanji: impression.options[impression.correctOption]?.withKanji,
        kana: impression.options[impression.correctOption]?.kanaOnly,
      };
    default:
      return undefined;
  }
}

/**
 * Filter out words that contain profanity
 */
export function filterProfanity(words: DisplayWord[]): DisplayWord[] {
  return words.filter(
    (word) =>
      !containsProfanityInFields({
        sense: word.sense,
        kanji: word.kanji,
        kana: word.kana,
      }),
  );
}

/**
 * Process practice impressions into filtered display words
 */
export function processPracticeImpressions(impressions: Impression[]): DisplayWord[] {
  const displayWords = impressions
    .map((impression) => extractDisplayWord(impression))
    .filter((word): word is DisplayWord => word !== undefined);

  return filterProfanity(displayWords);
}

/**
 * Fetch practice words from API and process them
 */
export async function fetchAndProcessPracticeWords(
  count: number,
  token: string,
): Promise<DisplayWord[]> {
  const response = await getPracticeWords(count, token);

  if (!response || !response.impressions || response.impressions.length === 0) {
    return [];
  }

  return processPracticeImpressions(response.impressions);
}
