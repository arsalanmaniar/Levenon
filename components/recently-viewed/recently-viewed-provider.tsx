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
 * Recently viewed — in memory, for the session only.
 *
 * Same rule as the cart and the wishlist: nothing outlives the tab, and this is
 * its own provider with its own reducer so clearing any of the three cannot
 * disturb the others.
 *
 * Whole `Product` objects are stored, not ids: the strip renders full cards and
 * re-fetching something we already had in hand would be work for its own sake.
 */

const MAX_ITEMS = 6;

type State = { items: Product[] };

type Action = { type: "record"; product: Product } | { type: "clear" };

const INITIAL: State = { items: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "record": {
      const existing = state.items.find((item) => item.id === action.product.id);

      // Re-viewing something already in the list moves it to the front rather
      // than duplicating it — and must not evict anything.
      const withoutIt = state.items.filter((item) => item.id !== action.product.id);
      const next = [action.product, ...withoutIt].slice(0, MAX_ITEMS);

      // Nothing changed: same product already at the front.
      if (existing && state.items[0]?.id === action.product.id) return state;

      return { items: next };
    }

    case "clear":
      return state.items.length === 0 ? state : INITIAL;

    default:
      return state;
  }
}

type RecentlyViewedContextValue = {
  items: Product[];
  /** Records a view. Safe to call on every mount; repeats are idempotent. */
  record: (product: Product) => void;
  /** Everything except the product given — what a detail page should show. */
  except: (productId: string) => Product[];
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const record = useCallback(
    (product: Product) => dispatch({ type: "record", product }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const except = useCallback(
    (productId: string) => state.items.filter((item) => item.id !== productId),
    [state.items],
  );

  const value = useMemo<RecentlyViewedContextValue>(
    () => ({ items: state.items, record, except, clear }),
    [state.items, record, except, clear],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used inside <RecentlyViewedProvider>");
  }
  return context;
}

export { MAX_ITEMS as RECENTLY_VIEWED_LIMIT };
