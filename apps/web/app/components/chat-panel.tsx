import { ChatHeader } from "~/components/chat-header";
import { ChatContent, type ChatContentProps } from "~/components/chat-content";

const PANEL_WIDTH_CLASS = "w-[380px]";

export function ChatPanel({
  open,
  onClose,
  onContact,
  ...chatProps
}: {
  open: boolean;
  onClose: () => void;
} & ChatContentProps) {
  return (
    <aside
      aria-hidden={!open}
      {...(!open && { inert: true })}
      className={`hidden shrink-0 bg-neutral-50 transition-all duration-300 ease-in-out dark:bg-neutral-900 md:block ${
        open
          ? `${PANEL_WIDTH_CLASS} border-l border-neutral-100 dark:border-neutral-800`
          : "w-0 overflow-hidden"
      }`}
    >
      <div className={`flex h-full ${PANEL_WIDTH_CLASS} flex-col`}>
        <ChatHeader onClose={onClose} onContact={onContact} />
        <ChatContent onContact={onContact} {...chatProps} />
      </div>
    </aside>
  );
}
