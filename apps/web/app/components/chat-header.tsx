import { MailIcon, XIcon } from "~/components/icons";

export function ChatHeader({
  onClose,
  onContact,
}: {
  onClose: () => void;
  onContact?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Chat
      </span>
      <div className="flex items-center gap-1">
        {onContact && (
          <button
            onClick={onContact}
            className="rounded-sm p-1 text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-500 dark:hover:text-neutral-300 dark:focus-visible:ring-neutral-500"
            aria-label="Contact"
          >
            <MailIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-500 dark:hover:text-neutral-300 dark:focus-visible:ring-neutral-500"
          aria-label="Close chat"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
