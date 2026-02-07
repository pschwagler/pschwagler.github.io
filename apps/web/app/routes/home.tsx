import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { toggleTheme } from "~/hooks/use-theme";
import { ThemeToggle } from "~/components/theme-toggle";
import { Portfolio } from "~/components/portfolio";
import { ChatPanel } from "~/components/chat-panel";
import { MobileSheet } from "~/components/mobile-sheet";
import { Fab } from "~/components/fab";

export function meta() {
  return [
    { title: "Patrick Schwagler" },
    { name: "description", content: "Builder. Engineer. Leader." },
  ];
}

export default function Home() {
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { messages, sendMessage, status, error, clearError } = useChat();

  const chatProps = { messages, sendMessage, status, error, clearError };

  function handleAskAboutApp(appName: string) {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      setChatOpen(true);
    } else {
      setMobileSheetOpen(true);
    }
    sendMessage({ text: `Tell me about ${appName}` });
  }

  return (
    <div className="flex min-h-screen">
      {/* Portfolio panel */}
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          chatOpen ? "pr-0" : "mx-auto max-w-3xl"
        }`}
      >
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="mb-8 flex justify-end">
            <ThemeToggle onToggle={toggleTheme} />
          </div>
          <Portfolio onAskAboutApp={handleAskAboutApp} />
        </div>
      </main>

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        {...chatProps}
      />

      {/* Desktop reopen chat button */}
      {!chatOpen && (
        <Fab
          onClick={() => setChatOpen(true)}
          label="Open chat"
          className="hidden md:block"
        />
      )}

      {/* Mobile FAB */}
      {!mobileSheetOpen && (
        <Fab
          onClick={() => setMobileSheetOpen(true)}
          label="Open chat"
          className="md:hidden"
        />
      )}

      <MobileSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        {...chatProps}
      />
    </div>
  );
}
