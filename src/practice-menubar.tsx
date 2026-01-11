import { MenuBarExtra, Icon, open } from "@raycast/api";
import { useEffect, useState } from "react";
import { getPracticeWords } from "./services/api";
import { requireToken } from "./services/authentication";
import {
  DisplayWord,
  getPracticeWordsCache,
  setPracticeWordsCache,
  getCurrentWordIndex,
  setCurrentWordIndex,
  getRotationEnabled,
  setRotationEnabled,
  isCacheValid,
} from "./services/storage";
import { formatDisplayWordAsOneLine } from "./services/formatting";
import { Impression } from "./types/practice-impression";

const ROTATION_INTERVAL_MS = 60000; // 1 minute
const PRACTICE_FETCH_COUNT = 60;
const CACHE_DURATION_MS = 3600000; // 1 hour

function extractDisplayWord(impression: Impression): DisplayWord | undefined {
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

export default function PracticeMenuBar() {
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

  // Load and fetch practice words
  useEffect(() => {
    async function loadWords() {
      setIsLoading(true);
      setError(undefined);

      try {
        // Try to load from cache first
        const cache = await getPracticeWordsCache();
        const isValid = await isCacheValid(CACHE_DURATION_MS);

        if (cache && isValid) {
          // Use cached data
          setWords(cache.words);
          setCurrentIndex(cache.index);
          setIsLoading(false);
          return;
        }

        // Cache is invalid or missing, fetch from API
        const token = await requireToken();

        if (!token) {
          setError("Authentication required");
          setIsLoading(false);
          return;
        }

        const response = await getPracticeWords(PRACTICE_FETCH_COUNT, token);

        if (response && response.impressions.length > 0) {
          const displayWords = response.impressions
            .map((impression) => extractDisplayWord(impression))
            .filter((word): word is DisplayWord => word !== undefined);

          setWords(displayWords);
          setCurrentIndex(0);

          // Cache the results
          await setPracticeWordsCache(displayWords, 0);
        } else {
          setError("No practice words available");
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

  // Persist current index when it changes
  useEffect(() => {
    if (words.length > 0) {
      setCurrentWordIndex(currentIndex);
    }
  }, [currentIndex, words.length]);

  // Poll for external index changes (from global hotkey commands)
  useEffect(() => {
    if (words.length === 0) {
      return;
    }

    const pollInterval = setInterval(async () => {
      const storedIndex = await getCurrentWordIndex();

      if (storedIndex !== currentIndex) {
        setCurrentIndex(storedIndex);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(pollInterval);
  }, [currentIndex, words.length]);

  // Rotation timer
  useEffect(() => {
    if (!isEnabled || words.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isEnabled, words.length]);

  // Toggle enabled state
  const toggleEnabled = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await setRotationEnabled(newState);
  };

  // Manually go to next word
  const nextWord = () => {
    if (words.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }
  };

  // Manually go to previous word
  const previousWord = () => {
    if (words.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + words.length) % words.length);
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
