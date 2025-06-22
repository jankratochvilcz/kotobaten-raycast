import { requireToken } from "../services/authentication";
import { showToast, Toast, Tool } from "@raycast/api";
import { addWord } from "../services/api";

/**
 * Input type for adding a word to the collection.
 */
type Input = {
/**
 * The English or other non-Japanese translatio of the word - usually the speaker's native language.
 */
  sense: string,

  /**
   * The Kanji representation of the word, if applicable. Can be unfilled if the word is commonly only used using kana / hiragana / katakana.
   */
  kanji: string | undefined,

  /**
   * The kana representation of the word. Can be furigana if kanji is filled (through hiragana) or hiragana / katakana if that's the sole representation.
   */
  kana: string | undefined,

  /**
   * Useful context about the word. E.g., if the user asked about the word in some context of e.g., a specific sentence or asked additional questions about it, you can add it here. Should be max 2-3 sentences.
   */
  note: string | undefined,
};

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Are you sure you want to add a new word to your collection? ${input.sense}: ${input.kanji} - ${input.kana} (note: ${input.note || "-"})`,
  };
};

export default async function addWordTool({ sense, kana, kanji, note }: Input) {

  const token = await requireToken();
  if (!token) {
    return "Not authenticated."
  }
  try {
    const result = await addWord(sense, kanji, kana, note, token);
    return "Added word successfully: " + JSON.stringify(result);
  } catch (e) {
    return "Failed to add word due to an unexpected exception."
  }
}
