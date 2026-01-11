import { showHUD } from "@raycast/api";
import { getPracticeWordsCache, setCurrentWordIndex } from "./services/storage";
import { formatDisplayWordAsOneLine } from "./services/formatting";

export default async function Command() {
  try {
    const cache = await getPracticeWordsCache();

    if (!cache) {
      await showHUD("No practice words loaded. Open menu bar to load.");
      return;
    }

    const { words, index: currentIndex } = cache;
    const nextIndex = (currentIndex + 1) % words.length;

    await setCurrentWordIndex(nextIndex);

    const nextWord = words[nextIndex];
    await showHUD(`${nextIndex + 1}/${words.length}: ${formatDisplayWordAsOneLine(nextWord)}`);
  } catch (error) {
    await showHUD("Failed to navigate to next word");
    console.error("Error in next-practice-word:", error);
  }
}
