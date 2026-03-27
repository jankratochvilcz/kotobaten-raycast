import { launchCommand, LaunchType, showHUD } from "@raycast/api";
import { getPracticeWordsCache, setCurrentWordIndex, setRotationBase } from "./services/storage";
import { requireToken } from "./services/authentication";
import { submitImpression } from "./services/api";

export default async function Command() {
  try {
    const cache = await getPracticeWordsCache();

    if (!cache) {
      await showHUD("No practice words loaded. Open menu bar to load.");
      return;
    }

    const { words, index: currentIndex } = cache;
    const word = words[currentIndex];

    const nextIndex = (currentIndex + 1) % words.length;
    await setCurrentWordIndex(nextIndex);
    await setRotationBase(nextIndex, Date.now());

    await showHUD("Retained!");

    try {
      await launchCommand({ name: "practice-menubar", type: LaunchType.Background });
    } catch {
      // Menu bar may not be active
    }

    const token = await requireToken();
    if (token) {
      await submitImpression(word.stackCardId, word.impressionType, true, token);
    }
  } catch (error) {
    await showHUD("Failed to mark word as retained");
    console.error("Error in mark-retained:", error);
  }
}
