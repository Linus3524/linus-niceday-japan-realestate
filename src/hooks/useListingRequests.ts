import { useEffect, useRef } from "react";

type Scope = "preview" | "analysis" | "location" | "crime" | "commute" | "share" | "pdf" | "clipboard";

/** Tokens control permission to publish results; transport payloads remain unchanged. */
export function useListingRequests() {
  const ref = useRef<{
    generation: number;
    scopes: Partial<Record<Scope, { pending: boolean }>>;
  }>({ generation: 0, scopes: {} });
  const requests = useRef({
    invalidate(...scopes: Scope[]) {
      for (const scope of scopes) delete ref.current.scopes[scope];
    },
    invalidateAll() {
      ref.current.generation++;
      ref.current.scopes = {};
    },
    pending(scope: Scope) { return Boolean(ref.current.scopes[scope]?.pending); },
    begin(scope: Scope) {
      const generation = ref.current.generation;
      const entry = { pending: true };
      ref.current.scopes[scope] = entry;
      return {
        current: () => ref.current.generation === generation && ref.current.scopes[scope] === entry,
        finish: () => { entry.pending = false; },
      };
    },
  }).current;
  useEffect(() => () => requests.invalidateAll(), [requests]);
  return requests;
}
