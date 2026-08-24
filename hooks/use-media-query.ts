"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared media-query subscription.
 *
 * One `MediaQueryList` and one listener per *query*, not per component. The
 * product grid renders eight cards, each of which asks about reduced motion and
 * pointer type; before this, that was ~24 separate `matchMedia` calls, 24
 * listeners and 24 effects on mount — measurable in Total Blocking Time.
 *
 * `useSyncExternalStore` also fixes a subtler problem: every consumer now reads
 * the same value in the same commit, so cards cannot briefly disagree about
 * whether motion is allowed.
 */

type Entry = {
  mql: MediaQueryList;
  subscribers: Set<() => void>;
  cleanup?: () => void;
};

const entries = new Map<string, Entry>();

function getEntry(query: string): Entry {
  let entry = entries.get(query);
  if (!entry) {
    entry = { mql: window.matchMedia(query), subscribers: new Set() };
    entries.set(query, entry);
  }
  return entry;
}

function subscribe(query: string) {
  return (onStoreChange: () => void) => {
    const entry = getEntry(query);
    entry.subscribers.add(onStoreChange);

    if (!entry.cleanup) {
      const notify = () => entry!.subscribers.forEach((fn) => fn());
      entry.mql.addEventListener("change", notify);
      entry.cleanup = () => entry!.mql.removeEventListener("change", notify);
    }

    return () => {
      entry.subscribers.delete(onStoreChange);
      if (entry.subscribers.size === 0) {
        entry.cleanup?.();
        entry.cleanup = undefined;
      }
    };
  };
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => getEntry(query).mql.matches,
    () => serverValue,
  );
}
