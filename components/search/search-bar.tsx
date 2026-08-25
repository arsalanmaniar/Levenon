"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, m } from "framer-motion";
import { Search, X } from "lucide-react";
import { useModalBehaviour } from "@/hooks/use-modal-behaviour";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatPrice, type Product } from "@/lib/types";
import { cn } from "@/lib/cn";

const DEBOUNCE_MS = 250;
const MAX_RESULTS = 6;
// Brand entrance curve.
const EASE = [0.16, 1, 0.3, 1] as const;

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Search, redesigned as a full-viewport overlay (client brief, 2026-08-25) —
 * replaces the earlier small nav-anchored dropdown.
 *
 * Queries `/api/products?q=` — the same route that reads the `listProducts`
 * seam — so there is no second search implementation and no external service.
 * Input is debounced at 250ms and every in-flight request is abortable, so a
 * fast typist never sees an older response overwrite a newer one.
 *
 * Modal mechanics (Escape, scroll lock, focus trap, inert background) come
 * from `useModalBehaviour`, the same hook the size guide and filter drawer
 * use — this is the fourth surface to need them, not a hand-rolled fifth
 * copy. Portaled to `<body>` for the same reason `MobileNav` is: a
 * `position: fixed` overlay inside a `sticky` nav ancestor can be clipped by
 * that ancestor's own stacking/overflow context in some browsers.
 */
export function SearchBar() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const listId = `search-results-${useId().replace(/:/g, "")}`;
  const trimmed = term.trim();

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    setTerm("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(-1);
  }, []);

  useModalBehaviour({
    open,
    onClose: close,
    panelRef,
    rootRef,
    initialFocusRef: inputRef,
  });

  // Debounced fetch. The timer and the request are both torn down on change,
  // so nothing races and nothing leaks.
  useEffect(() => {
    if (!open) return;

    if (trimmed.length === 0) {
      abortRef.current?.abort();
      setResults([]);
      setStatus("idle");
      setActiveIndex(-1);
      return;
    }

    setStatus("loading");
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/products?q=${encodeURIComponent(trimmed)}&limit=${MAX_RESULTS}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { products: Product[] };
        setResults(data.products);
        setStatus("ready");
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setStatus("error");
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [trimmed, open]);

  const goTo = useCallback(
    (product: Product) => {
      close();
      router.push(`/product/${product.slug}`);
    },
    [close, router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label inline-flex min-h-[44px] items-center gap-2 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
      >
        <Search
          aria-hidden="true"
          size={18}
          strokeWidth={1.5}
          // Visible on mobile (icon-only, no label there); hidden from `sm`
          // where the text label takes over; visible again from `lg`.
          className="block sm:hidden lg:block"
        />
        <span className="hidden sm:inline">Search</span>
        <span className="sr-only sm:hidden">Search the collection</span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div ref={rootRef} className="fixed inset-0 z-[120]">
                <m.div
                  aria-hidden="true"
                  onClick={close}
                  className="absolute inset-0 bg-ink/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25 }}
                />

                <m.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search"
                  className="absolute inset-x-0 top-0 max-h-full overflow-y-auto overscroll-contain bg-paper"
                  initial={reducedMotion ? { opacity: 0 } : { y: "-100%" }}
                  animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { y: "-100%" }}
                  transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
                >
                  <div className="relative mx-auto flex h-[120px] max-w-shell items-center px-6 md:px-10">
                    <Search
                      aria-hidden="true"
                      size={22}
                      strokeWidth={1.5}
                      className="shrink-0 text-charcoal"
                    />
                    <input
                      ref={inputRef}
                      type="search"
                      value={term}
                      onChange={(event) => setTerm(event.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search fabrics, styles…"
                      aria-label="Search the collection"
                      role="combobox"
                      aria-expanded={trimmed.length > 0}
                      aria-controls={listId}
                      aria-autocomplete="list"
                      aria-activedescendant={
                        activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
                      }
                      className="ml-4 h-full flex-1 border-b border-hairline bg-transparent text-2xl text-ink placeholder:text-charcoal focus:border-purple-500 focus:outline-none md:text-[28px]"
                    />
                    <button
                      type="button"
                      onClick={close}
                      className="label ml-4 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                    >
                      <X aria-hidden="true" size={20} strokeWidth={1.5} />
                      <span className="sr-only">Close search</span>
                    </button>
                  </div>

                  <div className="mx-auto max-w-shell border-t border-hairline px-6 pb-16 pt-8 md:px-10">
                    <SearchResults
                      listId={listId}
                      term={trimmed}
                      status={status}
                      results={results}
                      activeIndex={activeIndex}
                      onHover={setActiveIndex}
                      onSelect={goTo}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function SearchResults({
  listId,
  term,
  status,
  results,
  activeIndex,
  onHover,
  onSelect,
  reducedMotion,
}: {
  listId: string;
  term: string;
  status: Status;
  results: Product[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (product: Product) => void;
  reducedMotion: boolean;
}) {
  if (term.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <ThreadRing />
        <p className="label mt-6 text-charcoal">Search the collection</p>
        <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-charcoal">
          Try a piece, a category, or a SKU — &ldquo;coat&rdquo;, &ldquo;knit&rdquo;,
          &ldquo;LV-OW-01&rdquo;.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="label py-6 text-charcoal">Searching…</p>;
  }

  if (status === "error") {
    return (
      <p className="py-6 text-sm leading-relaxed text-charcoal">
        Search is not responding. The collection is still on the rail —{" "}
        <Link href="/#collection" className="text-purple-500 underline">
          browse it instead
        </Link>
        .
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8">
        <p className="label text-charcoal">No pieces match “{term}”</p>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-charcoal">
          The season is short — twelve pieces, not twelve hundred. Try a
          broader word, or see everything.
        </p>
        <Link
          href="/#collection"
          className="label mt-5 inline-flex min-h-[44px] items-center rounded-full border border-hairline px-5 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
        >
          See the collection
        </Link>
      </div>
    );
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label="Search results"
      className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
    >
      {results.map((product, index) => (
        <m.li
          key={product.id}
          id={`${listId}-option-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          onPointerEnter={() => onHover(index)}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: reducedMotion ? 0 : index * 0.05 }}
        >
          <button
            type="button"
            // Pointer down rather than click: on the old dropdown this beat
            // the input's blur handler; kept for the same reason even though
            // this overlay no longer closes on blur.
            onPointerDown={(event) => {
              event.preventDefault();
              onSelect(product);
            }}
            className={cn(
              "block w-full text-left",
              index === activeIndex && "ring-1 ring-purple-500",
            )}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-hairline bg-paper">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="7" strokeWidth="1.25" />
                    <circle cx="12" cy="12" r="4" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
                  </svg>
                </div>
              )}
            </div>
            <p className="mt-3 truncate font-display text-sm font-bold tracking-[-0.02em] text-ink">
              {product.name}
            </p>
            <p className="label mt-1 text-charcoal">{formatPrice(product)}</p>
          </button>
        </m.li>
      ))}
    </ul>
  );
}

/** The ring motif, reused for the empty state (SKILL.md §5.1). */
function ThreadRing() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="h-16 w-16 text-purple-500" fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
      <circle cx="60" cy="60" r="26" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="5 7" />
    </svg>
  );
}
