"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/lib/types";
import {
  calculateTotals,
  lineFromVariant,
  type CartLine,
  type CartTotals,
} from "@/lib/cart/types";
import { useToast } from "@/components/providers/toast-provider";

/**
 * Cart state — in memory, for the session only.
 *
 * No localStorage by design (Phase 3 spec): nothing here should outlive the tab
 * until there is an order record behind it. Persisting a cart whose prices and
 * stock came from a page load days ago is a bug waiting to be reported as one.
 */

type State = {
  lines: CartLine[];
  isOpen: boolean;
};

type Action =
  | { type: "add"; line: CartLine }
  | { type: "setQuantity"; variantSku: string; quantity: number }
  | { type: "remove"; variantSku: string }
  | { type: "clear" }
  | { type: "open" }
  | { type: "close" };

const INITIAL: State = { lines: [], isOpen: false };

function clampQuantity(quantity: number, max: number): number {
  if (!Number.isFinite(quantity)) return 1;
  const whole = Math.floor(quantity);
  // A variant with zero stock should never reach the cart, but if it does the
  // line is capped at zero and removed by the caller rather than going negative.
  return Math.max(0, Math.min(whole, Math.max(0, max)));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const incoming = action.line;

      // Mixed currencies would make the subtotal meaningless. Every product is
      // PKR today, so this is a guard, not a user-facing flow.
      const existingCurrency = state.lines[0]?.currency;
      if (existingCurrency && existingCurrency !== incoming.currency) {
        return state;
      }

      const index = state.lines.findIndex(
        (line) => line.variantSku === incoming.variantSku,
      );

      if (index === -1) {
        const quantity = clampQuantity(incoming.quantity, incoming.maxQuantity);
        if (quantity < 1) return state;
        return {
          ...state,
          lines: [...state.lines, { ...incoming, quantity }],
        };
      }

      // Already in the bag: top up, never exceeding what is actually on the rail.
      const current = state.lines[index];
      const quantity = clampQuantity(
        current.quantity + incoming.quantity,
        current.maxQuantity,
      );
      if (quantity === current.quantity) return state;

      const lines = [...state.lines];
      lines[index] = { ...current, quantity };
      return { ...state, lines };
    }

    case "setQuantity": {
      const index = state.lines.findIndex(
        (line) => line.variantSku === action.variantSku,
      );
      if (index === -1) return state;

      const current = state.lines[index];
      const quantity = clampQuantity(action.quantity, current.maxQuantity);

      if (quantity < 1) {
        return {
          ...state,
          lines: state.lines.filter((line) => line.variantSku !== action.variantSku),
        };
      }
      if (quantity === current.quantity) return state;

      const lines = [...state.lines];
      lines[index] = { ...current, quantity };
      return { ...state, lines };
    }

    case "remove":
      return {
        ...state,
        lines: state.lines.filter((line) => line.variantSku !== action.variantSku),
      };

    case "clear":
      return { ...state, lines: [] };

    case "open":
      return { ...state, isOpen: true };

    case "close":
      return { ...state, isOpen: false };

    default:
      return state;
  }
}

type CartContextValue = {
  lines: CartLine[];
  totals: CartTotals;
  isOpen: boolean;
  /** Adds a variant and opens the drawer. Ignores out-of-stock variants. */
  addVariant: (product: Product, variant: ProductVariant, quantity?: number) => void;
  setQuantity: (variantSku: string, quantity: number) => void;
  remove: (variantSku: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  /** Quantity of a given variant already in the bag. */
  quantityOf: (variantSku: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { showToast } = useToast();

  const addVariant = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      if (variant.stockOnHand < 1) return;
      dispatch({ type: "add", line: lineFromVariant(product, variant, quantity) });
      dispatch({ type: "open" });
      // Client brief, 2026-08-28. The drawer sliding open is already strong
      // feedback on its own, but the brief names "Added to bag" explicitly
      // as one of the toast system's own use cases, so this is deliberate
      // layering, not a redundant addition.
      showToast("Added to bag", "success");
    },
    [showToast],
  );

  const setQuantity = useCallback((variantSku: string, quantity: number) => {
    dispatch({ type: "setQuantity", variantSku, quantity });
  }, []);

  const remove = useCallback((variantSku: string) => {
    dispatch({ type: "remove", variantSku });
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openCart = useCallback(() => dispatch({ type: "open" }), []);
  const closeCart = useCallback(() => dispatch({ type: "close" }), []);

  const totals = useMemo(() => calculateTotals(state.lines), [state.lines]);

  const quantityOf = useCallback(
    (variantSku: string) =>
      state.lines.find((line) => line.variantSku === variantSku)?.quantity ?? 0,
    [state.lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      totals,
      isOpen: state.isOpen,
      addVariant,
      setQuantity,
      remove,
      clear,
      openCart,
      closeCart,
      quantityOf,
    }),
    [
      state.lines,
      state.isOpen,
      totals,
      addVariant,
      setQuantity,
      remove,
      clear,
      openCart,
      closeCart,
      quantityOf,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
