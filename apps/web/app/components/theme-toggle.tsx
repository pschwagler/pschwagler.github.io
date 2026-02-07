import { MoonIcon, SunIcon } from "~/components/icons";

export function ThemeToggle({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="rounded-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-500"
      aria-label="Toggle dark mode"
    >
      {/* CSS-based icon swap avoids hydration mismatch */}
      <span className="dark:hidden">
        <MoonIcon />
      </span>
      <span className="hidden dark:block">
        <SunIcon />
      </span>
    </button>
  );
}
