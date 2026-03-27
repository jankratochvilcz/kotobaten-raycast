import { MenuBarExtra, Icon, open, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { requireToken } from "./services/authentication";
import {
  DisplayWord,
  getPracticeWordsCache,
  setPracticeWordsCache,
  setCurrentWordIndex,
  getRotationEnabled,
  setRotationEnabled,
  getRotationBase,
  setRotationBase,
  calculateRotatedIndex,
  isCacheValid,
} from "./services/storage";
import { formatDisplayWordAsOneLine } from "./services/formatting";
import { fetchAndProcessPracticeWords } from "./services/practice";
import { submitImpression } from "./services/api";

const PRACTICE_FETCH_COUNT = 60;
const CACHE_DURATION_MS = 3600000; // 1 hour

function getRotationIntervalMs(): number {
  const prefs = getPreferenceValues<{ rotationIntervalSeconds?: string }>();
  const seconds = parseInt(prefs.rotationIntervalSeconds || "60", 10);
  return (isNaN(seconds) || seconds < 5 ? 60 : seconds) * 1000;
}

export default function PracticeMenuBar() {
  const rotationIntervalMs = getRotationIntervalMs();
  const [words, setWords] = useState<DisplayWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Load enabled state from storage
  useEffect(() => {
    async function loadEnabledState() {
      const enabled = await getRotationEnabled();
      setIsEnabled(enabled);
    }
    loadEnabledState();
  }, []);

  // Load and fetch practice words, then compute current rotated index
  useEffect(() => {
    async function loadWords() {
      setError(undefined);

      try {
        // Try cache first — avoid loading state to prevent title jitter on re-mount
        const cache = await getPracticeWordsCache();
        const isValid = await isCacheValid(CACHE_DURATION_MS);

        let loadedWords: DisplayWord[];

        if (cache && isValid) {
          loadedWords = cache.words;
        } else {
          // Only show loading spinner when we need to fetch from API
          setIsLoading(true);
          const token = await requireToken();

          if (!token) {
            setError("Authentication required");
            setIsLoading(false);
            return;
          }

          loadedWords = await fetchAndProcessPracticeWords(PRACTICE_FETCH_COUNT, token);

          if (loadedWords.length === 0) {
            setError("No practice words available");
            setIsLoading(false);
            return;
          }

          // Cache the results and set rotation anchor to index 0 / now
          const now = Date.now();
          await setPracticeWordsCache(loadedWords, 0);
          await setRotationBase(0, now);
        }

        setWords(loadedWords);

        // Compute the current index from the rotation anchor
        const enabled = await getRotationEnabled();
        const base = await getRotationBase();
        const now = Date.now();

        if (base && enabled) {
          const idx = calculateRotatedIndex(base.baseIndex, base.baseTime, now, rotationIntervalMs, loadedWords.length);
          setCurrentIndex(idx);
          await setCurrentWordIndex(idx);
        } else if (base) {
          setCurrentIndex(base.baseIndex);
        } else {
          await setRotationBase(0, now);
          setCurrentIndex(0);
        }
      } catch (err) {
        setError("Failed to load practice words");
        console.error("Error loading practice words:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWords();
  }, []);

  // Toggle enabled state
  const toggleEnabled = async () => {
    const newState = !isEnabled;
    await setRotationBase(currentIndex, Date.now());
    setIsEnabled(newState);
    await setRotationEnabled(newState);
  };

  // Manually go to next word
  const nextWord = async () => {
    if (words.length > 0) {
      const newIndex = (currentIndex + 1) % words.length;
      setCurrentIndex(newIndex);
      await setCurrentWordIndex(newIndex);
      await setRotationBase(newIndex, Date.now());
    }
  };

  // Manually go to previous word
  const previousWord = async () => {
    if (words.length > 0) {
      const newIndex = (currentIndex - 1 + words.length) % words.length;
      setCurrentIndex(newIndex);
      await setCurrentWordIndex(newIndex);
      await setRotationBase(newIndex, Date.now());
    }
  };

  // Submit practice result and advance to next word
  const markWord = async (success: boolean) => {
    if (words.length === 0) return;

    const word = words[currentIndex];

    // Advance to next word first — the menu closes immediately on click,
    // so storage must be updated before the slower API call.
    const newIndex = (currentIndex + 1) % words.length;
    setCurrentIndex(newIndex);
    await setCurrentWordIndex(newIndex);
    await setRotationBase(newIndex, Date.now());

    const token = await requireToken();
    if (token) {
      await submitImpression(word.stackCardId, word.impressionType, success, token);
    }
  };

  // Get display text
  const getTitle = () => {
    if (isLoading) {
      return "Loading...";
    }

    if (error) {
      return "Error";
    }

    if (words.length === 0) {
      return "No words";
    }

    if (!isEnabled) {
      return "Paused";
    }

    return formatDisplayWordAsOneLine(words[currentIndex]);
  };

  return (
    <MenuBarExtra title={getTitle()} isLoading={isLoading} tooltip="Japanese Practice Words">
      {!isLoading && !error && words.length > 0 && (
        <>
          <MenuBarExtra.Item
            title={`${currentIndex + 1} of ${words.length}`}
            icon={Icon.List}
          />
          <MenuBarExtra.Separator />

          <MenuBarExtra.Item
            title={isEnabled ? "Pause Rotation" : "Resume Rotation"}
            icon={isEnabled ? Icon.Pause : Icon.Play}
            onAction={toggleEnabled}
          />

          <MenuBarExtra.Item
            title="Previous Word"
            icon={Icon.ArrowLeft}
            onAction={previousWord}
          />

          <MenuBarExtra.Item
            title="Next Word"
            icon={Icon.ArrowRight}
            onAction={nextWord}
          />

          <MenuBarExtra.Separator />

          <MenuBarExtra.Item
            title="I know this one!"
            icon={Icon.CheckCircle}
            onAction={() => markWord(true)}
          />

          <MenuBarExtra.Item
            title="Needs more practice."
            icon={Icon.XMarkCircle}
            onAction={() => markWord(false)}
          />

          <MenuBarExtra.Separator />

          <MenuBarExtra.Section title="Current Word">
            <MenuBarExtra.Item title={`Sense: ${words[currentIndex].sense}`} />
            {words[currentIndex].kanji && <MenuBarExtra.Item title={`Kanji: ${words[currentIndex].kanji}`} />}
            {words[currentIndex].kana && <MenuBarExtra.Item title={`Kana: ${words[currentIndex].kana}`} />}
          </MenuBarExtra.Section>
        </>
      )}

      {error && (
        <MenuBarExtra.Item title={error} icon={Icon.ExclamationMark} onAction={() => open("raycast://reload")} />
      )}

      {isLoading && <MenuBarExtra.Item title="Loading practice words..." icon={Icon.CircleProgress} />}
    </MenuBarExtra>
  );
}
