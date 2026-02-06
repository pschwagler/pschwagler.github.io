import { XIcon } from "~/components/icons";

export function ChatHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Chat
      </span>
      <button
        onClick={onClose}
        className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        aria-label="Close chat"
      >
        <XIcon />
      </button>
    </div>
  );
}
