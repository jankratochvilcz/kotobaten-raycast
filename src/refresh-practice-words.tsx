import { launchCommand, LaunchType, showHUD } from "@raycast/api";
import { requireToken } from "./services/authentication";
import { fetchAndProcessPracticeWords } from "./services/practice";
import { setPracticeWordsCache, setRotationBase } from "./services/storage";

const PRACTICE_FETCH_COUNT = 60;

export default async function Command() {
  try {
    const token = await requireToken();

    if (!token) {
      await showHUD("Authentication required");
      return;
    }

    const words = await fetchAndProcessPracticeWords(PRACTICE_FETCH_COUNT, token);

    if (words.length === 0) {
      await showHUD("No practice words available");
      return;
    }

    const now = Date.now();
    await setPracticeWordsCache(words, 0);
    await setRotationBase(0, now);

    await showHUD(`Loaded ${words.length} practice words`);

    try {
      await launchCommand({ name: "practice-menubar", type: LaunchType.Background });
    } catch {
      // Menu bar may not be active
    }
  } catch (error) {
    await showHUD("Failed to refresh practice words");
    console.error("Error in refresh-practice-words:", error);
  }
}
