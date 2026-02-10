import { useCallback, useRef, useState } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

declare const turnstile: { getResponse: () => string | undefined } | undefined;

const TOKEN_TIMEOUT_MS = 5000;

type TokenWaiter = {
  resolve: (token: string | undefined) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Manages Cloudflare Turnstile token lifecycle.
 *
 * - `tokenReady`: boolean for UI gating (disable send until ready)
 * - `getToken()`: promise-based — resolves immediately if token is
 *    available, otherwise waits for onSuccess (with timeout + global
 *    API fallback). Event-driven, no polling.
 * - `reset()`: call after each exchange to get a fresh token.
 */
export function useTurnstile(siteKey: string | undefined) {
  const widgetRef = useRef<TurnstileInstance>(null);
  const tokenRef = useRef<string | undefined>(undefined);
  const [tokenReady, setTokenReady] = useState(!siteKey);
  const waitersRef = useRef<TokenWaiter[]>([]);

  const onSuccess = useCallback((token: string) => {
    tokenRef.current = token;
    setTokenReady(true);
    for (const waiter of waitersRef.current) {
      clearTimeout(waiter.timer);
      waiter.resolve(token);
    }
    waitersRef.current = [];
  }, []);

  const getToken = useCallback((): Promise<string | undefined> => {
    if (tokenRef.current) return Promise.resolve(tokenRef.current);
    if (!siteKey) return Promise.resolve(undefined);

    // Fallback: read from global Turnstile API (onSuccess can be unreliable)
    if (typeof turnstile !== "undefined") {
      const globalToken = turnstile.getResponse();
      if (globalToken) {
        tokenRef.current = globalToken;
        setTokenReady(true);
        return Promise.resolve(globalToken);
      }
    }

    // Wait for onSuccess callback, with timeout
    return new Promise<string | undefined>((resolve) => {
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter(
          (w) => w.resolve !== resolve
        );
        // Last chance: check global API before giving up
        const lastChance =
          typeof turnstile !== "undefined"
            ? turnstile.getResponse()
            : undefined;
        resolve(lastChance);
      }, TOKEN_TIMEOUT_MS);
      waitersRef.current.push({ resolve, timer });
    });
  }, [siteKey]);

  const reset = useCallback(() => {
    tokenRef.current = undefined;
    setTokenReady(false);
    widgetRef.current?.reset();
  }, []);

  return { widgetRef, tokenReady, onSuccess, getToken, reset };
}
