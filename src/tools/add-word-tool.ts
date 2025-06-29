import { requireToken } from "../services/authentication";
import { showToast, Toast, confirmAlert } from "@raycast/api";
import { addWord } from "../services/api";

type Input = {
    sense: string,
    kanji: string | undefined,
    kana: string | undefined,
    note: string | undefined,
};

export default async function addWordTool({ sense, kana, kanji, note }: Input) {
  const confirmed = await confirmAlert({
    title: "Add this word?",
    message: `Are you sure you want to add:\nSense: ${sense}\nKanji: ${kanji || "-"}\nKana: ${kana || "-"}\nNote: ${note || "-"}`,
    primaryAction: {
      title: "Add Word",
    },
  });
  if (!confirmed) {
    await showToast({ style: Toast.Style.Failure, title: "Cancelled" });
    return null;
  }

  const token = await requireToken();
  if (!token) {
    await showToast({ style: Toast.Style.Failure, title: "Not authenticated" });
    return null;
  }
  try {
    const result = await addWord(sense, kanji, kana, note, token);
    await showToast({ style: Toast.Style.Success, title: "Word added" });
    return result;
  } catch (e) {
    await showToast({ style: Toast.Style.Failure, title: "Failed to add word" });
    return null;
  }
}
