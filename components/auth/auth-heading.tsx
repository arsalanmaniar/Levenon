/**
 * The auth pages' title block. A plain server component, kept out of the
 * form components on purpose: `LoginForm` reads `useSearchParams()` for its
 * `?next=` redirect, which opts that whole subtree out of server rendering
 * and into its `Suspense` fallback. With the heading inside it, the page's
 * `<h1>` was absent from the SSR HTML entirely and the right-hand panel sat
 * blank until hydration. Hoisting it here puts real content in the markup
 * immediately and leaves only the interactive form suspended.
 */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="text-balance font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      <p className="mt-2 font-sans text-[14px] text-charcoal">{subtitle}</p>
    </>
  );
}
