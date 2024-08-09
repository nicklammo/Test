import { For, JSX, Show, createEffect  } from "solid-js";
import { Button } from "./forms/button";
import { createStore, SetStoreFunction } from "solid-js/store";

interface PaginatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  init?: number;
  max?: number;
  children: JSX.Element | JSX.Element[];
};

type PaginatorStore = ReturnType<typeof createPaginatorStore>[0];

const createPaginatorStore = (props: PaginatorProps) => {
  return createStore({
    isLoading: true,
    totalPages: 0,
    page: props.init || 1,
    child: <></>,
  }, { name: "PaginatorStore" });
};

const createChild = (el: PaginatorProps["children"], p: PaginatorStore) => Array.isArray(el) ? el[p.page - 1] : el;
const getPageCount = (el: PaginatorProps["children"], max?: number) => Array.isArray(el) ? max ? max < el.length ? max : el.length : el.length: 0;

const Paginator = (props: PaginatorProps) => {
  const [p, setP] = createPaginatorStore(props);
  const store = { p, setP };
  createEffect(() => {
    setP((s) => ({ 
      ...s, 
      child: createChild(props.children, p),
      totalPages: getPageCount(props.children, props.max),
      isLoading: false,
    }));
    console.log(p.totalPages)
  });
  return (
    <Show when={!p.isLoading} fallback={<div>Loading...</div>}>
      <nav>
        <div class={props.class}>
          {p.child}
          <div class="flex gap-2">
            <PaginatorButtons {...store} />
          </div>
        </div>
      </nav>
    </Show>
  );
};

type PaginatorButtonsProps = {
  p: PaginatorStore;
  setP: SetStoreFunction<PaginatorStore>
};

const prevP = (setP: PaginatorButtonsProps["setP"]) => setP((s) => (
  { ...s, page: (s.page - 1 >= 1) ? s.page - 1 : s.page }
));

const nextP = (setP: PaginatorButtonsProps["setP"]) => setP((s) => (
  { ...s, page: (s.page + 1 <= s.totalPages) ? s.page + 1 : s.page }
));

const PaginatorButtons = (props: PaginatorButtonsProps) => {
  const { p, setP } = props;
  return (
    <>
      <Button onclick={() => prevP(setP)}>
        Prev
      </Button>
      <For each={Array.from({ length: p.totalPages }, (_, i) => i + 1)}>
        {(pageNum) => (
          <Button onclick={() => setP((s) => ( {...s, page: pageNum }))}>
            {pageNum}
          </Button>
        )}
      </For>
      <Button onclick={() => nextP(setP)}>
        Next
      </Button>
    </>
  );
};

export { Paginator };