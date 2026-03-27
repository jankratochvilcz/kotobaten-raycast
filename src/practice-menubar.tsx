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
      setIsLoading(true);
      setError(undefined);

      try {
        const cache = await getPracticeWordsCache();
        const isValid = await isCacheValid(CACHE_DURATION_MS);

        let loadedWords: DisplayWord[];

        if (cache && isValid) {
          loadedWords = cache.words;
        } else {
          // Cache is invalid or missing, fetch from API
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
          // Paused — show the anchored index
          setCurrentIndex(base.baseIndex);
        } else {
          // No base yet (shouldn't happen after fresh fetch, but be safe)
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

  // In-process rotation timer — advances the word while the process is alive.
  // If the process is suspended by Raycast and later re-mounted (via the
  // `interval: "1m"` background refresh), the effect above recalculates the
  // correct index from the timestamp anchor, so no words are skipped.
  useEffect(() => {
    if (!isEnabled || words.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      const now = Date.now();
      const base = await getRotationBase();
      if (!base) return;

      const idx = calculateRotatedIndex(base.baseIndex, base.baseTime, now, rotationIntervalMs, words.length);
      setCurrentIndex(idx);
      await setCurrentWordIndex(idx);
    }, rotationIntervalMs);

    return () => clearInterval(interval);
  }, [isEnabled, words.length]);

  // Toggle enabled state
  const toggleEnabled = async () => {
    const newState = !isEnabled;
    const now = Date.now();

    if (newState) {
      // Resuming — set a new anchor at the current index so rotation continues from here
      await setRotationBase(currentIndex, now);
    } else {
      // Pausing — anchor at the current index so we remember where we stopped
      await setRotationBase(currentIndex, now);
    }

    setIsEnabled(newState);
    await setRotationEnabled(newState);
  };

  // Manually go to next word
  const nextWord = async () => {
    if (words.length > 0) {
      const newIndex = (currentIndex + 1) % words.length;
      setCurrentIndex(newIndex);
      await setCurrentWordIndex(newIndex);
      // Reset the rotation anchor so the timer counts from this new position
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
    <MenuBarExtra title={getTitle()} tooltip="Japanese Practice Words">
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
