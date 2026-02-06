import { XIcon } from "~/components/icons";
import { ChatContent } from "~/components/chat-content";

export function ChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={`hidden shrink-0 bg-neutral-50 transition-all duration-300 ease-in-out dark:bg-neutral-900 md:block ${
        open
          ? "w-[380px] border-l border-neutral-100 dark:border-neutral-800"
          : "w-0 overflow-hidden"
      }`}
    >
      <div className="flex h-full w-[380px] flex-col">
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
        <ChatContent />
      </div>
    </aside>
  );
}
