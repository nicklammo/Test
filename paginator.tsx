import {
  For,
  JSX,
  Show,
  createEffect,
  createSignal,
  onCleanup,
} from "solid-js";
import { Button } from "./forms/button";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Signal } from "solid-js";

interface PaginatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  init?: number;
  max?: number;
  children: JSX.Element | JSX.Element[];
}

type PaginatorStore = ReturnType<typeof createPaginatorStore>[0];

const createPaginatorStore = (props: PaginatorProps) => {
  return createStore(
    {
      isLoading: true,
      isFocused: false,
      totalPages: 0,
      page: props.init || 1,
      child: <></>,
    },
    { name: "PaginatorStore" }
  );
};

const createChild = (el: PaginatorProps["children"], p: PaginatorStore) => {
  if (Array.isArray(el)) {
    const els = el as JSX.Element[];
    return els[p.page - 1];
  }
  return el;
};
const getPageCount = (el: PaginatorProps["children"], max?: number) =>
  Array.isArray(el)
    ? max
      ? max < el.length
        ? max
        : el.length
      : el.length
    : 0;

const Paginator = (props: PaginatorProps) => {
  const [p, setP] = createPaginatorStore(props);
  const store = { p, setP };
  const [ref, setRef]: Signal<HTMLElement | undefined> = createSignal();

  createEffect(() => {
    // setup
    setP((s) => ({
      ...s,
      child: createChild(props.children, p),
      totalPages: getPageCount(props.children, props.max),
      isLoading: false,
    }));
  });

  createEffect(() => {
    // auto scroll
    let interval = null;
    if (!p.isFocused) {
      const loop = (p.page % p.totalPages) + 1;
      const setPage = () => setP((s) => ({ ...s, page: loop }));
      interval = setInterval(setPage, 3000);
    }
    onCleanup(() => interval && clearInterval(interval));
  });

  const enter = () => setP((s) => ({ ...s, isFocused: true }));
  const leave = () => setP((s) => ({ ...s, isFocused: false }));

  createEffect(() => {
    ref()?.addEventListener("mouseenter", enter);
    ref()?.addEventListener("mouseleave", leave);
  });

  // Can use cleanup anywhere in solid
  onCleanup(() => {
    ref()?.removeEventListener("mouseenter", enter);
    ref()?.removeEventListener("mouseleave", leave);
  });

  return (
    <Show when={!p.isLoading} fallback={<div>Loading...</div>}>
      <nav ref={setRef}>
        <div class={props.class}>
          {p.child}
          <div class="flex justify-center gap-2">
            <PaginatorButtons {...store} />
          </div>
        </div>
      </nav>
    </Show>
  );
};

type PaginatorButtonsProps = {
  p: PaginatorStore;
  setP: SetStoreFunction<PaginatorStore>;
};

const prevP = (setP: PaginatorButtonsProps["setP"]) =>
  setP((s) => ({
    ...s,
    isFocused: true,
    page: s.page - 1 >= 1 ? s.page - 1 : s.page,
  }));

const nextP = (setP: PaginatorButtonsProps["setP"]) =>
  setP((s) => ({
    ...s,
    isFocused: true,
    page: s.page + 1 <= s.totalPages ? s.page + 1 : s.page,
  }));

const PaginatorButtons = (props: PaginatorButtonsProps) => {
  const { p, setP } = props;
  return (
    <>
      <Button onclick={() => prevP(setP)}>Prev</Button>
      <For each={Array.from({ length: p.totalPages }, (_, i) => i + 1)}>
        {(pageNum) => (
          <Button
            onclick={() =>
              setP((s) => ({ ...s, isFocused: true, page: pageNum }))
            }
            class={`px-3 py-2 text-white ${
              p.page === pageNum ? "bg-gray-600" : "bg-black"
            }`}
          >
            {pageNum}
          </Button>
        )}
      </For>
      <Button onclick={() => nextP(setP)}>Next</Button>
    </>
  );
};

export { Paginator };
