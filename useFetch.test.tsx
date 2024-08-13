import { useFetch } from "@/hooks/useFetch";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { fireEvent, render } from ".";
import { APIResponseReturn } from "@/lib/api";
import { Show } from "solid-js";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const dbUsers = [
  {
    username: "Dummy",
    password: "Dummylol123",
  },
  {
    username: "Ymmud",
    password: "321lolymmuD",
  },
];

const server = setupServer(
  http.post("/api/sign-in", async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    const user = dbUsers.find(
      ({ username: dbUsername }) => dbUsername === username
    );
    if (user && password === user.password) {
      return HttpResponse.json({
        body: "Signed in successfully",
        success: true,
      });
    } else {
      return HttpResponse.json({
        body: "Incorrect password",
        success: false,
      });
    }
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const App = () => {
  let usernameRef: HTMLInputElement | undefined;
  let passwordRef: HTMLInputElement | undefined;
  const { fetchData, response } = useFetch<APIResponseReturn>();
  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    await fetchData("/api/sign-in", {
      method: "POST",
      body: {
        username: usernameRef?.value,
        password: passwordRef?.value,
      },
    });
  };
  return (
    <main>
      <Show when={response.body}>
        <div>{String(response.body)}</div>
        <div>{`Success: ${response.success}`}</div>
      </Show>
      <form onsubmit={(e) => onSubmit(e)}>
        <input
          type="text"
          name="username"
          ref={usernameRef}
          placeholder="Username"
        />
        <input
          type="password"
          name="password"
          ref={passwordRef}
          placeholder="Password"
        />
        <button type="submit">Sign In</button>
      </form>
    </main>
  );
};

const getFields = () => {
  const { getByPlaceholderText, getByText, queryByText, findByText } = render(
    () => <App />
  );
  const usernameInput = getByPlaceholderText("Username");
  const passwordInput = getByPlaceholderText("Password");
  const submitButton = getByText("Sign In");
  return {
    usernameInput,
    passwordInput,
    submitButton,
    getByPlaceholderText,
    findByText,
    getByText,
    queryByText,
  };
};

const targetValue = (input: string) => {
  return {
    target: {
      value: input,
    },
  };
};

describe("useFetch hook + api", () => {
  test("should respond with signed in successfully and success true if correct details", async () => {
    const { usernameInput, passwordInput, submitButton, findByText } =
      getFields();
    fireEvent.input(usernameInput, targetValue("Dummy"));
    fireEvent.input(passwordInput, targetValue("Dummylol123"));
    fireEvent.submit(submitButton);
    expect(await findByText("Signed in successfully")).toBeTruthy();
    expect(await findByText("Success: true")).toBeTruthy();
  });
  test("should respond with incorrect password and success false if incorrect password ", async () => {
    const { usernameInput, passwordInput, submitButton, findByText } =
      getFields();
    fireEvent.input(usernameInput, targetValue("Dummy"));
    fireEvent.input(passwordInput, targetValue("Dummylol111"));
    fireEvent.submit(submitButton);
    expect(await findByText("Incorrect password")).toBeTruthy();
    expect(await findByText("Success: false")).toBeTruthy();
  });
  test("should response with incorrect password and success false if user doesn't exist", async () => {
    const { usernameInput, passwordInput, submitButton, findByText } =
      getFields();
    fireEvent.input(usernameInput, targetValue("$InvalidUser"));
    fireEvent.input(passwordInput, targetValue("Randomlol123"));
    fireEvent.submit(submitButton);
    expect(await findByText("Incorrect password")).toBeTruthy();
    expect(await findByText("Success: false")).toBeTruthy();
  });
});
