import { createStore } from "solid-js/store";
import pkg from "lodash";
const { debounce } = pkg;

type Input = Parameters<typeof fetch>[0];
type BodyInit = Record<any, any> | string | FormData | URLSearchParams;
interface Init extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
};

/* USE ERROR BOUNDARIES */

const fetcher = async <T>(input: Input, init: Init) => {
  const headers = new Headers(init.headers);
  !headers.has("Content-Type") && headers.set("Content-Type", "application/json");
  const response = await fetch(input, {
    ...init,
    headers,
    body: JSON.stringify(init.body),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${response.url}`);
  };
  try {
    return await response.json() as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${(e as Error).message}`);
  }
};

const useFetch = <T extends object>() => {
  const [response, setResponse] = createStore({} as T, { name: "useFetchStore"});

  const fetchData = async (input: Input, init: Init) => {
    setResponse(await fetcher<T>(input, init));
  };

  return { fetchData: debounce(fetchData, 300), response };
};

export { useFetch };
