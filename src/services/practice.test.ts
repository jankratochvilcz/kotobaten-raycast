import {
  extractDisplayWord,
  filterProfanity,
  processPracticeImpressions,
} from "./practice";
import { Impression } from "../types/practice-impression";
import { DisplayWord } from "./storage";
import { StackCard } from "../types/stack-card";

// Helper function to create test StackCard with default values
function createTestStackCard(overrides: Partial<StackCard> = {}): StackCard {
  return {
    id: 1,
    created: "2024-01-01",
    sense: "test",
    kana: "test",
    kanji: "test",
    note: "",
    order: 0,
    userId: 1,
    type: "Word",
    consecutiveKanaSuccessCount: 0,
    consecutiveSenseSuccessCount: 0,
    kanaIsInPracticeQueue: false,
    senseIsInPracticeQueue: false,
    ...overrides,
  };
}

describe("practice service", () => {
  describe("extractDisplayWord", () => {
    it("should extract display word from SenseGuess impression", () => {
      const impression: Impression = {
        type: "SenseGuess",
        id: 1,
        card: createTestStackCard({
          sense: "house",
          kanji: "家",
          kana: "いえ",
        }),
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "house",
        kanji: "家",
        kana: "いえ",
      });
    });

    it("should extract display word from KanaGuess impression", () => {
      const impression: Impression = {
        type: "KanaGuess",
        id: 2,
        card: createTestStackCard({
          id: 2,
          sense: "cat",
          kanji: "猫",
          kana: "ねこ",
        }),
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "cat",
        kanji: "猫",
        kana: "ねこ",
      });
    });

    it("should handle empty kanji in SenseGuess/KanaGuess", () => {
      const impression: Impression = {
        type: "SenseGuess",
        id: 3,
        card: createTestStackCard({
          id: 3,
          sense: "hello",
          kanji: "",
          kana: "こんにちは",
        }),
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "hello",
        kanji: undefined,
        kana: "こんにちは",
      });
    });

    it("should extract display word from GeneratedSentenceGuess impression", () => {
      const impression: Impression = {
        type: "GeneratedSentenceGuess",
        id: 4,
        kanaOnly: "わたしはがくせいです",
        withKanji: "私は学生です",
        sense: "I am a student",
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "I am a student",
        kanji: "私は学生です",
        kana: "わたしはがくせいです",
      });
    });

    it("should extract display word from GeneratedSentenceWithParticlesSelect impression", () => {
      const impression: Impression = {
        type: "GeneratedSentenceWithParticlesSelect",
        id: 5,
        options: [
          { id: 1, withKanji: "学校に行く", kanaOnly: "がっこうにいく" },
          { id: 2, withKanji: "学校で行く", kanaOnly: "がっこうでいく" },
        ],
        correctOption: 0,
        explanation: "Use に for direction",
        sense: "go to school",
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "go to school",
        kanji: "学校に行く",
        kana: "がっこうにいく",
      });
    });

    it("should handle GeneratedSentenceWithParticlesSelect with different correct option", () => {
      const impression: Impression = {
        type: "GeneratedSentenceWithParticlesSelect",
        id: 6,
        options: [
          { id: 1, withKanji: "学校に行く", kanaOnly: "がっこうにいく" },
          { id: 2, withKanji: "学校で行く", kanaOnly: "がっこうでいく" },
        ],
        correctOption: 1,
        explanation: "Use で for location",
        sense: "go at school",
      };

      const result = extractDisplayWord(impression);

      expect(result).toEqual({
        sense: "go at school",
        kanji: "学校で行く",
        kana: "がっこうでいく",
      });
    });
  });

  describe("filterProfanity", () => {
    it("should filter out words with profanity in sense", () => {
      const words: DisplayWord[] = [
        { sense: "clean word", kanji: "綺麗", kana: "きれい" },
        { sense: "fuck", kanji: "悪い", kana: "わるい" },
        { sense: "another clean word", kanji: "良い", kana: "よい" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { sense: "clean word", kanji: "綺麗", kana: "きれい" },
        { sense: "another clean word", kanji: "良い", kana: "よい" },
      ]);
    });

    it("should filter out words with profanity in kanji", () => {
      const words: DisplayWord[] = [
        { sense: "house", kanji: "家", kana: "いえ" },
        { sense: "word", kanji: "shit", kana: "わーど" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(1);
      expect(result[0].sense).toBe("house");
    });

    it("should filter out words with profanity in kana", () => {
      const words: DisplayWord[] = [
        { sense: "cat", kanji: "猫", kana: "ねこ" },
        { sense: "word", kanji: "言葉", kana: "damn" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(1);
      expect(result[0].sense).toBe("cat");
    });

    it("should filter out multiple profane words", () => {
      const words: DisplayWord[] = [
        { sense: "ass", kanji: "悪1", kana: "わる1" },
        { sense: "dog", kanji: "犬", kana: "いぬ" },
        { sense: "bitch", kanji: "悪2", kana: "わる2" },
        { sense: "cat", kanji: "猫", kana: "ねこ" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(2);
      expect(result[0].sense).toBe("dog");
      expect(result[1].sense).toBe("cat");
    });

    it("should return all words when none contain profanity", () => {
      const words: DisplayWord[] = [
        { sense: "dog", kanji: "犬", kana: "いぬ" },
        { sense: "cat", kanji: "猫", kana: "ねこ" },
        { sense: "bird", kanji: "鳥", kana: "とり" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(3);
      expect(result).toEqual(words);
    });

    it("should return empty array when all words contain profanity", () => {
      const words: DisplayWord[] = [
        { sense: "fuck", kanji: "悪1", kana: "わる1" },
        { sense: "shit", kanji: "悪2", kana: "わる2" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle words with undefined kanji and kana", () => {
      const words: DisplayWord[] = [
        { sense: "hello" },
        { sense: "goodbye", kana: "さよなら" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(2);
      expect(result).toEqual(words);
    });

    it("should filter profanity with mixed case", () => {
      const words: DisplayWord[] = [
        { sense: "FUCK", kanji: "test", kana: "test" },
        { sense: "normal word", kanji: "普通", kana: "ふつう" },
      ];

      const result = filterProfanity(words);

      expect(result).toHaveLength(1);
      expect(result[0].sense).toBe("normal word");
    });
  });

  describe("processPracticeImpressions", () => {
    it("should extract and filter impressions correctly", () => {
      const impressions: Impression[] = [
        {
          type: "SenseGuess",
          id: 1,
          card: createTestStackCard({
            id: 1,
            sense: "clean word",
            kanji: "綺麗",
            kana: "きれい",
          }),
        },
        {
          type: "GeneratedSentenceGuess",
          id: 2,
          kanaOnly: "わるい",
          withKanji: "悪い",
          sense: "fuck",
        },
        {
          type: "KanaGuess",
          id: 3,
          card: createTestStackCard({
            id: 3,
            sense: "another clean",
            kanji: "良い",
            kana: "よい",
          }),
        },
      ];

      const result = processPracticeImpressions(impressions);

      expect(result).toHaveLength(2);
      expect(result[0].sense).toBe("clean word");
      expect(result[1].sense).toBe("another clean");
    });

    it("should handle empty impressions array", () => {
      const result = processPracticeImpressions([]);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should not filter clean words", () => {
      const impressions: Impression[] = [
        {
          type: "SenseGuess",
          id: 1,
          card: createTestStackCard({
            id: 1,
            sense: "good word",
            kanji: "良い",
            kana: "よい",
          }),
        },
      ];

      const result = processPracticeImpressions(impressions);

      expect(result).toHaveLength(1);
      expect(result[0].sense).toBe("good word");
    });

    it("should return empty array when all words are filtered out by profanity", () => {
      const impressions: Impression[] = [
        {
          type: "SenseGuess",
          id: 1,
          card: createTestStackCard({
            id: 1,
            sense: "shit",
            kanji: "悪1",
            kana: "わる1",
          }),
        },
        {
          type: "KanaGuess",
          id: 2,
          card: createTestStackCard({
            id: 2,
            sense: "damn",
            kanji: "悪2",
            kana: "わる2",
          }),
        },
      ];

      const result = processPracticeImpressions(impressions);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should filter profanity from mixed impression types", () => {
      const impressions: Impression[] = [
        {
          type: "GeneratedSentenceGuess",
          id: 1,
          kanaOnly: "test",
          withKanji: "test",
          sense: "fuck this",
        },
        {
          type: "SenseGuess",
          id: 2,
          card: createTestStackCard({
            id: 2,
            sense: "normal word",
            kanji: "普通",
            kana: "ふつう",
          }),
        },
        {
          type: "GeneratedSentenceWithParticlesSelect",
          id: 3,
          options: [
            { id: 1, withKanji: "test", kanaOnly: "test" },
          ],
          correctOption: 0,
          explanation: "test",
          sense: "bitch",
        },
      ];

      const result = processPracticeImpressions(impressions);

      expect(result).toHaveLength(1);
      expect(result[0].sense).toBe("normal word");
    });
  });
});
