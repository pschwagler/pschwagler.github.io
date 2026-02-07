import { ChatHeader } from "~/components/chat-header";
import { ChatContent, type ChatContentProps } from "~/components/chat-content";
import { useEscapeKey } from "~/hooks/use-escape-key";
import { useFocusTrap } from "~/hooks/use-focus-trap";

export function MobileSheet({
  open,
  onClose,
  ...chatProps
}: {
  open: boolean;
  onClose: () => void;
} & ChatContentProps) {
  useEscapeKey(onClose, open);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
      aria-label="Chat"
      {...(!open && { inert: true })}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        ref={trapRef}
        className={`absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-neutral-900 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-8 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        <ChatHeader onClose={onClose} />
        {/* Content */}
        <div className="flex flex-1 flex-col py-8">
          <ChatContent {...chatProps} />
        </div>
      </div>
    </div>
  );
}
