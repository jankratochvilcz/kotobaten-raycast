import axios, { AxiosError } from "axios";
import { removeToken } from "./authentication";
import { SearchResult } from "../types/search-result";

const PATH_ROOT = "https://kotoprdapiapp.salmonsmoke-5b2676a9.northeurope.azurecontainerapps.io/";

const PATH_LOGIN = "auth/login";
const PATH_ADD_CARD = "cards";
const PATH_SEARCH = "search";

function createAuthenticationHeaders(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

async function logoutIfNeeded(requestError: unknown) {
  if ((requestError as AxiosError).response?.status === 401) {
    await removeToken();
  }
}

export const login = async (email: string, password: string): Promise<string | undefined> => {
  const url = new URL(PATH_LOGIN, PATH_ROOT);

  const inputData = new URLSearchParams();
  inputData.append("username", email);
  inputData.append("password", password);
  inputData.append("grant_type", "password");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const response = await axios.post(url.href, inputData.toString(), {
    headers,
  });

  if (response.status === 200) {
    return response.data.access_token as string;
  }

  return undefined;
};

export const addWord = async (
  sense: string,
  kanji: string | undefined,
  kana: string | undefined,
  note: string | undefined,
  token: string
) => {
  const url = new URL(PATH_ADD_CARD, PATH_ROOT);

  const payload = {
    sense: sense,
    kana: kana,
    kanji: kanji,
    note: note,
    created: new Date().toISOString(),
    type: "Word",
  };

  try {
    const response = await axios.post(url.href, payload, createAuthenticationHeaders(token));

    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error: unknown) {
    await logoutIfNeeded(error);

    return false;
  }
};

export const search = async (
  term: string,
  token: string,
  abort?: AbortSignal
): Promise<{ term: string; result?: SearchResult }> => {
  const url = new URL(PATH_SEARCH, PATH_ROOT);
  url.searchParams.append("term", term);

  try {
    const response = await axios.get(url.href, {
      ...createAuthenticationHeaders(token),
      signal: abort,
    });

    if (response.status === 200) {
      return { term, result: response.data as SearchResult };
    }

    return { term };
  } catch (error: unknown) {
    await logoutIfNeeded(error);

    return { term };
  }
};

export const resetStackCardProgress = async (cardId: number, token: string): Promise<boolean> => {
  const url = new URL("cardsreset", PATH_ROOT);
  url.searchParams.append("cardId", cardId.toString());

  try {
    const response = await axios.post(url.href, undefined, createAuthenticationHeaders(token));
    return response.status === 200;
  } catch (error: unknown) {
    await logoutIfNeeded(error);
    return false;
  }
};
