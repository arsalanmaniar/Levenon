"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, m } from "framer-motion";
import { Search } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatPrice, type Product } from "@/lib/types";
import { cn } from "@/lib/cn";

const DEBOUNCE_MS = 250;
const MAX_RESULTS = 6;
// Brand entrance curve; the panel only ever fades and rises a few pixels.
const EASE = [0.16, 1, 0.3, 1] as const;

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Instant search in the nav.
 *
 * Queries `/api/products?q=` — the same route that reads the `listProducts`
 * seam — so there is no second search implementation and no external service.
 * Input is debounced at 250ms and every in-flight request is abortable, so a
 * fast typist never sees an older response overwrite a newer one.
 *
 * Keyboard model follows the combobox pattern: ↑/↓ move the active option,
 * Enter opens it, Escape closes the panel (and on a second press, collapses the
 * field), Tab out closes.
 */
export function SearchBar() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const listId = `search-results-${useId().replace(/:/g, "")}`;
  const trimmed = term.trim();

  const collapse = useCallback(() => {
    abortRef.current?.abort();
    setExpanded(false);
    setTerm("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(-1);
  }, []);


  // Debounced fetch. The timer and the request are both torn down on change,
  // so nothing races and nothing leaks.
  useEffect(() => {
    if (!expanded) return;

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
  }, [trimmed, expanded]);

  // Close on outside click.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) collapse();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, collapse]);

  const open = useCallback((product: Product) => {
    collapse();
    router.push(`/product/${product.slug}`);
  }, [collapse, router]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      // First Escape clears a query; a second collapses the field.
      if (trimmed.length > 0) setTerm("");
      else collapse();
      return;
    }

    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      open(results[activeIndex]);
    }
  };

  const showPanel = expanded && (trimmed.length > 0 || status === "idle");

  return (
    <div ref={rootRef} className="relative">
      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            // Focus after the field exists.
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="label inline-flex min-h-[44px] items-center gap-2 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
        >
          <Search
            aria-hidden="true"
            strokeWidth={1.5}
            // Visible on mobile (icon-only, no label there); hidden from
            // `sm` where the text label takes over, since that band is the
            // exact width the nav has no room to spare (three centre links
            // plus the full right cluster measured to overflow by 24px at
            // 768px before this existed); visible again from `lg`, where the
            // nav has real breathing room for icon + label together.
            className="block h-5 w-5 sm:hidden lg:block"
          />
          <span className="hidden sm:inline">Search</span>
          <span className="sr-only sm:hidden">Search the collection</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 border-b border-hairline pb-1 focus-within:border-purple-500">
          <Search aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-charcoal" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={(event) => {
              // Blur to something outside the widget closes it; clicking a
              // result must not close the panel before the click lands.
              if (!rootRef.current?.contains(event.relatedTarget as Node)) {
                collapse();
              }
            }}
            placeholder="Search the collection"
            aria-label="Search the collection"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
            }
            className="label w-[180px] bg-transparent py-2 text-ink placeholder:text-charcoal focus:outline-none md:w-[240px]"
          />
          <button
            type="button"
            onClick={collapse}
            className="label px-2 text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
          >
            Close
            <span className="sr-only"> search</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {showPanel && (
          <m.div
            initial={reducedMotion ? false : { opacity: 0, y: -6 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: reducedMotion ? 0 : 0.24, ease: EASE }}
            className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,420px)] border border-hairline bg-paper shadow-thread"
          >
            <SearchPanel
              listId={listId}
              term={trimmed}
              status={status}
              results={results}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelect={open}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchPanel({
  listId,
  term,
  status,
  results,
  activeIndex,
  onHover,
  onSelect,
}: {
  listId: string;
  term: string;
  status: Status;
  results: Product[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (product: Product) => void;
}) {
  if (term.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
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
    return <p className="label px-5 py-6 text-charcoal">Searching…</p>;
  }

  if (status === "error") {
    return (
      <p className="px-5 py-6 text-sm leading-relaxed text-charcoal">
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
      <div className="px-5 py-8">
        <p className="label text-charcoal">No pieces match “{term}”</p>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-charcoal">
          The season is short — twelve pieces, not twelve hundred. Try a broader
          word, or see everything.
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
    <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto overscroll-contain">
      {results.map((product, index) => (
        <li
          key={product.id}
          id={`${listId}-option-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          onPointerEnter={() => onHover(index)}
        >
          <button
            type="button"
            // Pointer down rather than click: the input's blur handler would
            // otherwise tear the panel down before a click completes.
            onPointerDown={(event) => {
              event.preventDefault();
              onSelect(product);
            }}
            className={cn(
              "flex w-full items-center gap-4 border-b border-hairline px-4 py-3 text-left transition-colors duration-150 ease-state last:border-b-0",
              index === activeIndex ? "bg-purple-500/5" : "hover:bg-purple-500/5",
            )}
          >
            <SearchThumb product={product} />

            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-extrabold tracking-[-0.02em] text-ink">
                {product.name}
              </span>
              <span className="label mt-1 block text-charcoal">
                {product.category.name}
              </span>
            </span>

            <span className="label whitespace-nowrap text-ink">
              {formatPrice(product)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Thumbnail: real photography when it exists, thread motif until then. */
function SearchThumb({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden border border-hairline bg-paper">
      {image ? (
        <Image
          src={image.url}
          alt=""
          width={48}
          height={48}
          sizes="48px"
          className="h-full w-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="7" strokeWidth="1.25" />
          <circle cx="12" cy="12" r="4" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
        </svg>
      )}
    </span>
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
