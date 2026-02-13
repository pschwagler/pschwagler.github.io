import { useCallback, useRef, useState } from "react";
import { FALLBACK_SUGGESTIONS } from "~/data/suggestions";

interface SimpleMessage {
  role: string;
  parts: Array<{ type: string; text?: string }>;
}

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (messages: SimpleMessage[], turnstileToken: string | undefined) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Clear previous suggestions while loading
      setSuggestions([]);

      try {
        const res = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, turnstileToken }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`suggestions ${res.status}`);

        const data: { suggestions: string[] } = await res.json();
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setSuggestions(FALLBACK_SUGGESTIONS);
        }
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, fetchSuggestions, clearSuggestions };
}
