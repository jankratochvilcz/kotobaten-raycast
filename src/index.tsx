import { ActionPanel, Action, Form, showToast, useNavigation, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { validateRequired } from "./validation";
import { getToken, isAuthenticated } from "./authentication";
import Authenticate from "./authenticate";
import { addWord } from "./api";
import {usePromise } from "@raycast/utils"

export default function Command() {
  const navigation = useNavigation();

  const [sense, setSense] = useState("");
  const [kana, setKana] = useState("");
  const [kanji, setKanji] = useState("");
  const [note, setNote] = useState("");

  const [senseError, setSenseError] = useState<string | undefined>();
  const [kanaError, setKanaError] = useState<string | undefined>();
  const [kanjiError, setKanjiError] = useState<string | undefined>();

  const onChangeSense = (newValue: string) => {
    setSenseError(validateRequired(newValue, "Sense"));
    setSense(newValue);
  };

  const onChangeKana = (newValue: string) => {
    setKanaError(validateRequired(newValue, "Kana"));
    setKanjiError(validateRequired(kanji, "Kanji"));
    setKana(newValue);
  };

  const onChangeKanji = (newValue: string) => {
    setKanjiError(validateRequired(newValue, "Kanji"));
    setKanaError(validateRequired(kana, "Kana"));
    setKanji(newValue);
  };

  const onChangeNote = (newValue: string) => {
    setNote(newValue);
  };

  useEffect(() => {
    const redirectIfLoggedOut = async () => {
      if(!(await isAuthenticated())) {
        navigation.push(<Authenticate />);
      }
    }

    redirectIfLoggedOut()
  })

  const { isLoading, revalidate: onSubmit } = usePromise(async () => {
    const token = (await getToken())?.valueOf();
    if (typeof token !== "string") {
      navigation.push(<Authenticate />);
    }

    if (senseError || kanaError || kanjiError) {
      showToast({
        title: "Please fix the errors and try submitting again.",
      });
      return;
    }

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
      });
      return false;
    }

    showHUD("⛩️ Word added!");
  }, [], {
    execute: false
  });

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
        onChange={onChangeSense}
        onBlur={() => onChangeSense(sense)}
      />
      <Form.TextField
        id="kanji"
        title="Kanji"
        placeholder="Enter the kanji for the word."
        error={kanjiError}
        onChange={onChangeKanji}
        onBlur={() => onChangeKanji(kanji)}
      />
      <Form.TextField
        id="kana"
        title="Kana"
        placeholder="Enter the kana for the word."
        error={kanaError}
        onChange={onChangeKana}
        onBlur={() => onChangeKana(kana)}
      />
      <Form.TextArea
        id="note"
        title="Note"
        placeholder="Jot down anything else relevant about the word."
        onChange={onChangeNote}
        onBlur={() => onChangeKana(kana)}
      />
    </Form>
  );
}
