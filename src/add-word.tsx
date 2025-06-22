import { ActionPanel, Action, Form, showToast, useNavigation, showHUD, popToRoot, Toast } from "@raycast/api";
import { useState } from "react";
import { validateRequired } from "./services/validation";
import { requireToken } from "./services/authentication";
import Authenticate from "./authenticate";
import { addWord } from "./services/api";
import useRedirectIfUnauthenticated from "./hooks/useRedirectIfLoggedOut";

type AddWordProps = {
  sense?: string;
  kanji?: string;
  kana?: string;
  note?: string;
}

export default function AddWord({ sense: initialSense = "", kanji: initialKanji = "", kana: initialKana = "", note: initialNote = "" }: AddWordProps) {
  const navigation = useNavigation();

  const [sense, setSense] = useState(initialSense);
  const [kana, setKana] = useState(initialKana);
  const [kanji, setKanji] = useState(initialKanji);
  const [note, setNote] = useState(initialNote);
  const [isLoading, setIsLoading] = useState(false);

  const [senseError, setSenseError] = useState<string | undefined>();
  const [kanjiError, setKanjiError] = useState<string | undefined>();

  useRedirectIfUnauthenticated()

  const onChangeSense = (newValue: string) => {
    setSenseError(validateRequired(newValue, "Sense"));
    setSense(newValue);
  };

  const onChangeKana = (newValue: string) => {
    setKanjiError(validateRequired(`${newValue}${kana}`, "Kanji or kana"));
    setKana(newValue);
  };

  const onChangeKanji = (newValue: string) => {
    setKanjiError(validateRequired(`${newValue}${kana}`, "Kanji or kana"));
    setKanji(newValue);
  };

  const onChangeNote = (newValue: string) => {
    setNote(newValue);
  };

  const onSubmit = async () => {
    const token = await requireToken();
    if (!token) {
      navigation.push(<Authenticate />);
      return;
    }

    if (senseError || kanjiError) {
      showToast({
        title: "Please fix the errors and try submitting again.",
        style: Toast.Style.Failure,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await addWord(
        sense,
        kanji.length > 0 ? kanji : undefined,
        kana.length > 0 ? kana : undefined,
        note,
        token as string
      );

      if (!result) {
        showToast({
          title: "Error adding word. Please try again.",
          style: Toast.Style.Failure,
        });
        return false;
      }

      popToRoot();
      showHUD("⛩️ Word added!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Word" onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="sense"
        title="Sense"
        placeholder="Enter the meaning in English or another language."
        error={senseError}
        value={sense}
        onChange={onChangeSense}
        onBlur={() => onChangeSense(sense)}
      />
      <Form.TextField
        id="kanji"
        title="Kanji"
        placeholder="Enter the kanji for the word."
        error={kanjiError}
        value={kanji}
        onChange={onChangeKanji}
        onBlur={() => onChangeKanji(kanji)}
      />
      <Form.TextField
        id="kana"
        title="Kana"
        placeholder="Enter the kana for the word."
        value={kana}
        onChange={onChangeKana}
        onBlur={() => onChangeKana(kana)}
      />
      <Form.TextArea
        id="note"
        title="Note"
        placeholder="Jot down anything else relevant about the word."
        value={note}
        onChange={onChangeNote}
        onBlur={() => onChangeKana(kana)}
      />
    </Form>
  );
}
