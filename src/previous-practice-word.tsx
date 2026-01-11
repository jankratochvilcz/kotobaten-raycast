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
    const previousIndex = (currentIndex - 1 + words.length) % words.length;

    await setCurrentWordIndex(previousIndex);

    const previousWord = words[previousIndex];
    await showHUD(`${previousIndex + 1}/${words.length}: ${formatDisplayWordAsOneLine(previousWord)}`);
  } catch (error) {
    await showHUD("Failed to navigate to previous word");
    console.error("Error in previous-practice-word:", error);
  }
}
