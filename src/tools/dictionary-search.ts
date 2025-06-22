import { requireToken } from "../services/authentication";
import { search } from "../services/api";
import { showToast, Toast, Tool } from "@raycast/api";

type Input = {
  /**
   * The term to search for in the collection. Can be English or Japanese, Kanji or Kana.
   */
  term: string;

  /**
   * Indicates that the word is commonly used in the corpus of Japanese language.
   */
  commonlyUsedWordsOnly?: boolean
};

export default async function dictionarySearch({term, commonlyUsedWordsOnly}: Input) {
  const token = await requireToken();
  if (!token) {
    return "Not authenticated."
  }
  try {
    const result = await search(term, token);
    let results = result.result?.dictionaryCards || [];

    if(commonlyUsedWordsOnly) {
      results = results.filter(card => card.isCommon);
    }

    return results;
  
  } catch (e) {
    return "Search failed."
  }
}
