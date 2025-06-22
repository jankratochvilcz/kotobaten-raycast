import { requireToken } from "../services/authentication";
import { search } from "../services/api";
import { showToast, Toast, Tool } from "@raycast/api";

type Input = {
  /**
   * The term to search for in the collection. Can be English or Japanese, Kanji or Kana.
   */
  term: string;
};

export default async function collectionSearch({term}: Input) {
  const token = await requireToken();
  if (!token) {
    return "Not authenticated."
  }
  try {
    const result = await search(term, token);
    return result.result?.cards?.map(x => ({
      kanji: x.kanji,
      kana: x.kana,
      meaning: x.sense,
      addedDate: x.created
    })) || [];
  } catch (e) {
    return "Search failed."
  }
}
