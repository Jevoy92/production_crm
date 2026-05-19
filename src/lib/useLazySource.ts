import { useEffect, useState } from "react";

// Loads a markdown body lazily. Returns "" while loading or if loader is missing.
export function useLazySource(load?: () => Promise<string>): {
  source: string;
  loading: boolean;
} {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(Boolean(load));

  useEffect(() => {
    if (!load) {
      setSource("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    load()
      .then((text) => {
        if (!cancelled) setSource(text);
      })
      .catch(() => {
        if (!cancelled) setSource("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { source, loading };
}