"use client";

import { useCallback, useEffect, useState } from "react";

// Small shared data-fetching hook so every page doesn't hand-roll the same
// loading/error/refetch state machine. `fn` must be a stable-enough callback
// (wrap in useCallback with real deps at the call site) — re-runs whenever
// its identity changes.
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // The dep list is supplied by the caller by design — that's the point of
    // this hook, and it's why both rules are muted here. Call sites pass
    // either `[fn]` for a useCallback-wrapped fetcher or `[]` for an inline
    // one that must run exactly once; keying on `fn` identity instead would
    // make the latter refetch on every render, forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    // Deferred a tick so the first result lands as an update rather than a
    // synchronous setState-in-effect (React Compiler lint).
    queueMicrotask(() => load());
  }, [load]);

  return { data, error, loading, reload: load };
}
