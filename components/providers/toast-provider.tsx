"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";
type ToastEntry = { id: string; type: ToastType; message: string };

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 2500;

// A small coloured dot per type, not a coloured surface — SKILL.md §2 is
// explicit that `--success` "may tint a confirmation's text and its glyph
// and nothing else — no success buttons, no success panels". Every toast is
// the same neutral `bg-ink`/`text-paper` pill regardless of type; only this
// dot carries the accent, same principle the discount field's own tick
// already follows.
const DOT_COLOR: Record<ToastType, string> = {
  success: "bg-success",
  // The brief's own literal choice — error toasts stay charcoal, not the
  // new `--error` red added for form fields in this same pass. A toast
  // reporting a minor failure ("couldn't copy the link") is not the same
  // severity as a rejected form submission.
  error: "bg-charcoal",
  info: "bg-purple-500",
};

/**
 * Toast notifications (client brief, 2026-08-28) — one provider, mounted
 * once at the root layout, bottom-centre, auto-dismissing after 2.5s.
 *
 * Wired into `CartProvider`/`WishlistProvider`'s own add/remove/toggle
 * callbacks rather than at each individual call site (`AddToCart`,
 * `NewArrivalCard`, `ProductCard`, `WishlistHeart`, the wishlist page's own
 * add-to-cart, …) — this codebase has many entry points for both actions,
 * and calling `showToast` once inside the shared action gets every one of
 * them for free, the same reasoning the bag/heart nav icons' own
 * count-watching animations already used two passes ago.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      idRef.current += 1;
      const id = `toast-${idRef.current}`;
      setToasts((previous) => [...previous, { id, type, message }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-8 z-[160] flex flex-col items-center gap-2 px-6"
          >
            <AnimatePresence>
              {toasts.map((toast) => (
                <m.div
                  key={toast.id}
                  role="status"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3 }}
                  className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-body text-paper shadow-thread"
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_COLOR[toast.type])}
                  />
                  {toast.message}
                </m.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
