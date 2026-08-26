/**
 * Payment marks (client brief, 2026-08-30, Item 6F) — Nishat Linen's own
 * footer convention. Monochrome (`currentColor`), not the networks' brand
 * colours: the brief's own spec is "charcoal colour", and a single flat
 * tint is also what keeps this from reading as an official brand asset —
 * simplified marks, not a reproduction of either network's logo artwork.
 */
export function VisaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="none" stroke="currentColor" />
      <text
        x="24"
        y="21"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontStyle="italic"
        fontWeight="700"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="none" stroke="currentColor" />
      <circle cx="20" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="28" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
