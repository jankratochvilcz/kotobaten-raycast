import { DisplayWord } from "./storage";

export function formatDisplayWordAsOneLine(word: DisplayWord): string {
  const parts = [word.sense];

  if (word.kanji) {
    parts.push(word.kanji);
  }

  if (word.kana) {
    parts.push(word.kana);
  }

  return parts.join(" - ");
}
