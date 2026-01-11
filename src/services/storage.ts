import { LocalStorage } from "@raycast/api";

const STORAGE_KEY_ENABLED = "practice_menubar_enabled";
const STORAGE_KEY_WORDS = "practice_menubar_words";
const STORAGE_KEY_INDEX = "practice_menubar_index";
const STORAGE_KEY_TIMESTAMP = "practice_menubar_timestamp";

export interface DisplayWord {
  sense: string;
  kanji?: string;
  kana?: string;
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
