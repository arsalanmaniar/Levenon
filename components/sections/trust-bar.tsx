import { Truck, RefreshCw, Lock, Scissors } from "lucide-react";

const ITEMS = [
  { Icon: Truck, heading: "Free Delivery", subtext: "On orders above PKR 5,000" },
  { Icon: RefreshCw, heading: "Easy Returns", subtext: "7-day return policy" },
  { Icon: Lock, heading: "Secure Payment", subtext: "Card & bank transfer" },
  { Icon: Scissors, heading: "Unstitched", subtext: "You choose the fit" },
];

/**
 * Trust bar (client brief, 2026-08-30, Item 4) — Maria B / Nishat's own
 * convention, above the footer. A plain server component: four static
 * facts, nothing interactive.
 */
export function TrustBar() {
  return (
    <section className="border-y border-hairline bg-paper">
      <div className="mx-auto max-w-shell px-6 py-10 md:px-12 lg:px-20">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
          {ITEMS.map(({ Icon, heading, subtext }) => (
            <li key={heading} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <Icon aria-hidden="true" size={40} strokeWidth={1.25} className="text-purple-500" />
              <p className="mt-4 font-display text-[14px] font-semibold text-ink">{heading}</p>
              <p className="mt-1 font-sans text-xs text-charcoal">{subtext}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
