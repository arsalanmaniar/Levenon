"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  buildFilterHref,
  parseFilters,
  priceInputValue,
  FILTER_PARAMS,
  type FilterSearchParams,
  type ProductFilters,
} from "@/lib/filters";
import { cn } from "@/lib/cn";
import type { Currency } from "@/lib/types";
import { formatMinor } from "@/lib/cart/types";
import { ShimmerAction } from "@/components/ui/shimmer-button";

type PriceFilterFormProps = {
  filters: ProductFilters;
  /** Query params the filters do not own, carried through as hidden inputs. */
  passthrough: Array<[string, string]>;
  currency: Currency;
  /** Catalogue price range in minor units, used for honest placeholders. */
  bounds: { min: number; max: number } | null;
  /** Unique per rendered instance — the panel appears twice (inline + drawer). */
  idPrefix: string;
  pathname?: string;
  /** True inside the mobile drawer — stacks fields and runs Apply full-width. */
  stacked?: boolean;
  className?: string;
};

const inputClass =
  "label h-11 w-full min-w-0 border border-hairline bg-paper px-3 text-ink " +
  "transition-colors duration-200 ease-state placeholder:text-charcoal " +
  "hover:border-purple-500 focus:border-purple-500";

/**
 * Price bounds and the in-stock toggle, as a real form.
 *
 * It is a genuine `method="get"` form pointed at the grid, so it filters
 * without JavaScript: the browser serialises the fields into the query string
 * and the server re-renders. When JS is present, submit is intercepted and
 * routed client-side instead, which keeps scroll position and skips the
 * document load. Either way the destination URL is built by one function.
 *
 * The inputs are uncontrolled on purpose. Filter state lives in the URL, so the
 * defaults come from there; the parent remounts this form (via `key`) whenever
 * the URL changes, which is the only moment the fields should be overwritten.
 */
export function PriceFilterForm({
  filters,
  passthrough,
  currency,
  bounds,
  idPrefix,
  pathname = "/",
  stacked = false,
  className,
}: PriceFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const minId = `${idPrefix}-price-min`;
  const maxId = `${idPrefix}-price-max`;
  const stockId = `${idPrefix}-in-stock`;
  const hintId = `${idPrefix}-price-hint`;

  const navigate = (form: HTMLFormElement) => {
    // Read the form exactly as the browser would submit it, then run the same
    // parser the server runs. No second interpretation of the same fields.
    const data = new FormData(form);
    const submitted: FilterSearchParams = {};
    data.forEach((value, key) => {
      if (typeof value !== "string") return;
      const existing = submitted[key];
      if (existing === undefined) submitted[key] = value;
      else if (Array.isArray(existing)) existing.push(value);
      else submitted[key] = [existing, value];
    });

    const href = buildFilterHref(parseFilters(submitted), submitted, pathname);
    startTransition(() => router.push(href, { scroll: false }));
  };

  return (
    <form
      method="get"
      action={pathname}
      onSubmit={(event) => {
        event.preventDefault();
        navigate(event.currentTarget);
      }}
      className={cn("flex flex-wrap items-end gap-x-6 gap-y-6", className)}
    >
      {/* Category is chosen by the pills above; carry it, and anything owned by
          another feature, through the submission untouched. */}
      {filters.category && (
        <input
          type="hidden"
          name={FILTER_PARAMS.category}
          value={filters.category}
        />
      )}
      {passthrough.map(([key, value], index) => (
        <input key={`${key}-${index}`} type="hidden" name={key} value={value} />
      ))}

      <fieldset className="min-w-0 flex-1 basis-[15rem] border-0 p-0">
        <legend className="label text-charcoal">Price</legend>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor={minId} className="label block text-charcoal">
              Min
            </label>
            <input
              id={minId}
              name={FILTER_PARAMS.priceMin}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={priceInputValue(filters.priceMin)}
              placeholder={bounds ? String(Math.floor(bounds.min / 100)) : "0"}
              aria-describedby={hintId}
              className={cn(inputClass, "mt-2")}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor={maxId} className="label block text-charcoal">
              Max
            </label>
            <input
              id={maxId}
              name={FILTER_PARAMS.priceMax}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={priceInputValue(filters.priceMax)}
              placeholder={bounds ? String(Math.ceil(bounds.max / 100)) : ""}
              aria-describedby={hintId}
              className={cn(inputClass, "mt-2")}
            />
          </div>
        </div>

        <p id={hintId} className="label mt-3 text-charcoal">
          {bounds
            ? `${currency}, whole numbers — rail runs ${formatMinor(
                bounds.min,
                currency,
              )} to ${formatMinor(bounds.max, currency)}`
            : `${currency}, whole numbers`}
        </p>
      </fieldset>

      <div
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-4",
          stacked && "w-full flex-col items-stretch",
        )}
      >
        <div className="flex min-h-[44px] items-center gap-3">
          {/* A real toggle switch: a track that fills purple and a thumb that
              slides, not a checkbox pretending to be a radio. `has-[:checked]`
              styles the visible track from the sr-only input it contains;
              `peer-checked` moves the thumb, its sibling. */}
          <label
            htmlFor={stockId}
            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-hairline bg-paper transition-colors duration-200 ease-state has-[:checked]:border-purple-500 has-[:checked]:bg-purple-500 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-500"
          >
            <input
              id={stockId}
              name={FILTER_PARAMS.inStock}
              type="checkbox"
              value="1"
              defaultChecked={filters.inStockOnly}
              onChange={(event) => {
                // Apply immediately when JS is present — the current price
                // fields ride along, so nothing typed is lost. Without JS the
                // Apply button below does the same job.
                const form = event.currentTarget.form;
                if (form) navigate(form);
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="ml-1 h-5 w-5 rounded-full bg-charcoal/50 transition-transform duration-200 ease-state peer-checked:translate-x-5 peer-checked:bg-paper"
            />
          </label>
          <label
            htmlFor={stockId}
            className="label cursor-pointer text-charcoal"
          >
            In stock only
          </label>
        </div>

        <ShimmerAction
          type="submit"
          disabled={isPending}
          className={cn("min-h-[48px]", stacked && "w-full")}
        >
          {isPending ? "Applying" : "Apply"}
        </ShimmerAction>
      </div>
    </form>
  );
}
