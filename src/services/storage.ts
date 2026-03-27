import { LocalStorage } from "@raycast/api";

const STORAGE_KEY_ENABLED = "practice_menubar_enabled";
const STORAGE_KEY_WORDS = "practice_menubar_words";
const STORAGE_KEY_INDEX = "practice_menubar_index";
const STORAGE_KEY_TIMESTAMP = "practice_menubar_timestamp";
const STORAGE_KEY_ROTATION_BASE_INDEX = "practice_menubar_rotation_base_index";
const STORAGE_KEY_ROTATION_BASE_TIME = "practice_menubar_rotation_base_time";

export interface DisplayWord {
  sense: string;
  kanji?: string;
  kana?: string;
  stackCardId?: number;
  impressionType: string;
}

export interface PracticeWordsCache {
  words: DisplayWord[];
  index: number;
  timestamp: number;
}

// Practice words cache operations
export const getPracticeWordsCache = async (): Promise<PracticeWordsCache | undefined> => {
  const cachedWords = await LocalStorage.getItem<string>(STORAGE_KEY_WORDS);
  const cachedIndex = await LocalStorage.getItem<string>(STORAGE_KEY_INDEX);
  const cachedTimestamp = await LocalStorage.getItem<string>(STORAGE_KEY_TIMESTAMP);

  if (!cachedWords) {
    return undefined;
  }

  return {
    words: JSON.parse(cachedWords) as DisplayWord[],
    index: cachedIndex ? parseInt(cachedIndex, 10) : 0,
    timestamp: cachedTimestamp ? parseInt(cachedTimestamp, 10) : 0,
  };
};

export const setPracticeWordsCache = async (words: DisplayWord[], index: number): Promise<void> => {
  const timestamp = Date.now();
  await LocalStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words));
  await LocalStorage.setItem(STORAGE_KEY_INDEX, index.toString());
  await LocalStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp.toString());
};

export const getPracticeWordsCacheTimestamp = async (): Promise<number> => {
  const cachedTimestamp = await LocalStorage.getItem<string>(STORAGE_KEY_TIMESTAMP);
  return cachedTimestamp ? parseInt(cachedTimestamp, 10) : 0;
};

export const isCacheValid = async (maxAgeMs: number): Promise<boolean> => {
  const cachedWords = await LocalStorage.getItem<string>(STORAGE_KEY_WORDS);
  if (!cachedWords) {
    return false;
  }

  const timestamp = await getPracticeWordsCacheTimestamp();
  const now = Date.now();
  return now - timestamp < maxAgeMs;
};

// Current word index operations
export const getCurrentWordIndex = async (): Promise<number> => {
  const cachedIndex = await LocalStorage.getItem<string>(STORAGE_KEY_INDEX);
  return cachedIndex ? parseInt(cachedIndex, 10) : 0;
};

export const setCurrentWordIndex = async (index: number): Promise<void> => {
  await LocalStorage.setItem(STORAGE_KEY_INDEX, index.toString());
};

// Rotation enabled state operations
export const getRotationEnabled = async (): Promise<boolean> => {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEY_ENABLED);
  return stored !== undefined ? stored === "true" : true;
};

export const setRotationEnabled = async (enabled: boolean): Promise<void> => {
  await LocalStorage.setItem(STORAGE_KEY_ENABLED, enabled.toString());
};

// Rotation base (anchor point for timestamp-based rotation)
export const getRotationBase = async (): Promise<{ baseIndex: number; baseTime: number } | undefined> => {
  const baseIndex = await LocalStorage.getItem<string>(STORAGE_KEY_ROTATION_BASE_INDEX);
  const baseTime = await LocalStorage.getItem<string>(STORAGE_KEY_ROTATION_BASE_TIME);
  if (baseIndex === undefined || baseTime === undefined) return undefined;
  return { baseIndex: parseInt(baseIndex, 10), baseTime: parseInt(baseTime, 10) };
};

export const setRotationBase = async (baseIndex: number, baseTime: number): Promise<void> => {
  await LocalStorage.setItem(STORAGE_KEY_ROTATION_BASE_INDEX, baseIndex.toString());
  await LocalStorage.setItem(STORAGE_KEY_ROTATION_BASE_TIME, baseTime.toString());
};

/**
 * Calculate the current rotation index based on a timestamp anchor.
 * Even if the process was suspended, this derives the correct position from wall-clock time.
 */
export const calculateRotatedIndex = (
  baseIndex: number,
  baseTime: number,
  now: number,
  intervalMs: number,
  totalWords: number,
): number => {
  const elapsed = Math.max(0, now - baseTime);
  const steps = Math.floor(elapsed / intervalMs);
  return (baseIndex + steps) % totalWords;
};