import { MoonIcon, SunIcon } from "~/components/icons";

export function ThemeToggle({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
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
