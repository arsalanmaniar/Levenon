/** Minimal class joiner — no dependency needed for the class shapes we use. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
