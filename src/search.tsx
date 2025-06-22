import { List, useNavigation } from "@raycast/api";
import { useState } from "react";
import useRedirectIfUnauthenticated from "./hooks/useRedirectIfLoggedOut";
import { search } from "./services/api";
import { getToken } from "./services/authentication";
import Authenticate from "./authenticate";
import { StackCard } from "./types/stack-card";
import { DictionaryCard } from "./types/dictionary-card";
import { SearchResult } from "./types/search-result";
import { all } from "axios";

// Define the result type for the search state
interface SearchResults {
  term: string;
  result?: SearchResult
}

const EMPTY_RESULTS: SearchResults = { term: "" };

export default function Search() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<SearchResults>({ ...EMPTY_RESULTS });

  useRedirectIfUnauthenticated();

  const onSearchTextChange = async (newSearchText: string) => {
    setSearchText(newSearchText);

    if (newSearchText.length < 1) {
      setResults({ ...EMPTY_RESULTS });
      return;
    }

    setIsLoading(true);

    const token = (await getToken())?.valueOf();
    if (typeof token !== "string") {
      navigation.push(<Authenticate />);
      return;
    }

    try {
      const apiResult = await search(newSearchText, token);
      const result: SearchResult | undefined = apiResult.result;
      setResults({
        term: newSearchText,
        result
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cards = results.result?.cards || [];
  const dictionaryCards = results.result?.dictionaryCards || [];
  const allResultsCount = cards.length + dictionaryCards.length;

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Search your words"
      searchBarPlaceholder="Enter kanji, kana, or the meaning you're looking for ..."
      searchText={searchText}
      onSearchTextChange={onSearchTextChange}
      isShowingDetail={allResultsCount > 0}
    >
      {cards.length > 0 && (
        <List.Section title="Stack Cards">
          {cards.map((card, idx) => (
            <List.Item
              key={card.kanji + card.kana + card.sense + idx}
              title={card.kanji || card.kana}
              subtitle={card.sense}
              detail={
                <List.Item.Detail
                  markdown={`${card.kanji ? `# ${card.kanji}` : ""}`}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Sense" text={card.sense} />
                      {card.kanji && <List.Item.Detail.Metadata.Label title="Kanji" text={card.kanji} />}
                      {card.kana && <List.Item.Detail.Metadata.Label title="Kana" text={card.kana} />}
                      {card.note && <List.Item.Detail.Metadata.Label title="Note" text={card.note} />}
                    </List.Item.Detail.Metadata>
                  }
                />
              }
            />
          ))}
        </List.Section>
      )}
      {dictionaryCards.length > 0 && (
        <List.Section title="Dictionary Results">
          {dictionaryCards.map((result, idx) => {
            const firstSense = result.senses && result.senses.length > 0 && result.senses[0].senses.length > 0
              ? result.senses[0].senses[0]
              : undefined;
            return (
              <List.Item
                key={(result.kanji || "") + (result.kana || "") + idx}
                title={result.kanji || result.kana}
                subtitle={firstSense}
                detail={
                  <List.Item.Detail
                    markdown={`${result.kanji ? `# ${result.kanji}` : ""}`}
                    metadata={
                      <List.Item.Detail.Metadata>
                        {firstSense && (
                          <List.Item.Detail.Metadata.Label title="Sense" text={firstSense} />
                        )}
                        {result.kanji && <List.Item.Detail.Metadata.Label title="Kanji" text={result.kanji} />}
                        {result.kana && <List.Item.Detail.Metadata.Label title="Kana" text={result.kana} />}
                      </List.Item.Detail.Metadata>
                    }
                  />
                }
              />
            );
          })}
        </List.Section>
      )}
      {cards.length === 0 && dictionaryCards.length === 0 && (
        <List.EmptyView title="No results." />
      )}
    </List>
  );
}
