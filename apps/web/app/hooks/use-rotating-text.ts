import { useEffect, useRef, useState } from "react";

export function useRotatingText(items: readonly string[], intervalMs = 3000) {
  const [index, setIndex] = useState(0);
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => {
        prevRef.current = items[prev];
        return (prev + 1) % items.length;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [items, intervalMs]);

  return { current: items[index], previous: prevRef.current };
}
