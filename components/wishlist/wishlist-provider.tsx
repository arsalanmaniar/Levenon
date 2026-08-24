"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";

/**
 * Wishlist state — in memory, for the session only.
 *
 * Same rule as the cart (Phase 3): nothing here outlives the tab. It is a
 * deliberately separate provider and separate reducer, so clearing the cart
 * cannot touch the wishlist and vice versa — the two share no state at all.
 *
 * Whole `Product` objects are stored rather than ids. The wishlist page has to
 * render cards and offer add-to-cart, and re-fetching a product we already had
 * in hand would be work for its own sake.
 */

type State = { items: Product[] };

type Action =
  | { type: "add"; product: Product }
  | { type: "remove"; id: string }
  | { type: "toggle"; product: Product }
  | { type: "clear" };

const INITIAL: State = { items: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      if (state.items.some((item) => item.id === action.product.id)) return state;
      return { items: [...state.items, action.product] };

    case "remove": {
      const items = state.items.filter((item) => item.id !== action.id);
      return items.length === state.items.length ? state : { items };
    }

    case "toggle": {
      const exists = state.items.some((item) => item.id === action.product.id);
      return exists
        ? { items: state.items.filter((item) => item.id !== action.product.id) }
        : { items: [...state.items, action.product] };
    }

    case "clear":
      return state.items.length === 0 ? state : INITIAL;

    default:
      return state;
  }
}

type WishlistContextValue = {
  items: Product[];
  count: number;
  has: (id: string) => boolean;
  add: (product: Product) => void;
  remove: (id: string) => void;
  toggle: (product: Product) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const add = useCallback((product: Product) => dispatch({ type: "add", product }), []);
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const toggle = useCallback(
    (product: Product) => dispatch({ type: "toggle", product }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const has = useCallback(
    (id: string) => state.items.some((item) => item.id === id),
    [state.items],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items: state.items,
      count: state.items.length,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [state.items, has, add, remove, toggle, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside <WishlistProvider>");
  }
  return context;
}
