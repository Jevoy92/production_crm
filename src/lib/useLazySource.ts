import { useEffect, useState } from "react";

// Loads a markdown body lazily. Tries the bundled loader first, then falls
// back to fetching the same file from /hubs/scripts/ in public/ so the page
// keeps working even if the lazy chunk fails to resolve at runtime.
export function useLazySource(
  load?: () => Promise<string>,
  fallbackUrl?: string,
): { source: string; loading: boolean } {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(Boolean(load || fallbackUrl));

  useEffect(() => {
    if (!load && !fallbackUrl) {
      setSource("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const tryFallback = async (): Promise<string> => {
      if (!fallbackUrl) return "";
      try {
        const res = await fetch(fallbackUrl);
        if (!res.ok) return "";
        return await res.text();
      } catch {
        return "";
      }
    };

    (async () => {
      let text = "";
      if (load) {
        try {
          text = (await load()) ?? "";
        } catch (err) {
          console.error("[useLazySource] bundle load failed", err);
          text = "";
        }
      }
      if (!text) text = await tryFallback();
      if (!cancelled) {
        setSource(text);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load, fallbackUrl]);

  return { source, loading };
}