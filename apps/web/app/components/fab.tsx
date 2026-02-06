import { ChatIcon } from "~/components/icons";

export function Fab({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 rounded-full bg-neutral-900 p-3 text-white shadow-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 ${className}`}
      aria-label={label}
    >
      <ChatIcon />
    </button>
  );
}
