import { ChatHeader } from "~/components/chat-header";
import { ChatContent } from "~/components/chat-content";

const PANEL_WIDTH = "w-[380px]";

export function ChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      aria-hidden={!open}
      {...(!open && { inert: true })}
      className={`hidden shrink-0 bg-neutral-50 transition-all duration-300 ease-in-out dark:bg-neutral-900 md:block ${
        open
          ? `${PANEL_WIDTH} border-l border-neutral-100 dark:border-neutral-800`
          : "w-0 overflow-hidden"
      }`}
    >
      <div className={`flex h-full ${PANEL_WIDTH} flex-col`}>
        <ChatHeader onClose={onClose} />
        <ChatContent />
      </div>
    </aside>
  );
}
