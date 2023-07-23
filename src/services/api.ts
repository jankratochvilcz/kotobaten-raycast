import axios, { AxiosError } from "axios";
import { removeToken } from "./authentication";

const PATH_ROOT = "https://kotobaten-api.fly.dev/";

const PATH_LOGIN = "auth/login";
const PATH_ADD_CARD = "cards";

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
    kana: kanji,
    kanji: kana,
    note: note,
    created: new Date().toISOString(),
    type: "Word",
  };

  try {
    const response = await axios.post(url.href, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error: unknown) {
    if ((error as AxiosError).response?.status === 401) {
      await removeToken();
      // TODO: Refresh token flow
    }

    return false;
  }
};
