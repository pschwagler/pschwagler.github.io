import { useChat } from "@ai-sdk/react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useMemo, useState } from "react";
import { toggleTheme } from "~/lib/theme";
import { ThemeToggle } from "~/components/theme-toggle";
import { Portfolio } from "~/components/portfolio";
import { ChatPanel } from "~/components/chat-panel";
import { ContactModal } from "~/components/contact-modal";
import { MobileSheet } from "~/components/mobile-sheet";
import { Fab } from "~/components/fab";
import { useTurnstile } from "~/hooks/use-turnstile";
import { useSuggestions } from "~/hooks/use-suggestions";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

const SITE_URL = "https://patrick-schwagler.vercel.app";

export function meta() {
  const title = "Patrick Schwagler";
  const description =
    "Forward Deployed Engineer, Engineering Manager, and AI Engineer. Explore my work at C3.ai, side projects, and tech stack.";
  const ogImage = `${SITE_URL}/og.png`;

  return [
    { title },
    { name: "description", content: description },

    // Canonical
    { tagName: "link", rel: "canonical", href: SITE_URL },

    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: SITE_URL },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: title },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },

    // JSON-LD structured data
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Patrick Schwagler",
        jobTitle: "Engineering Manager",
        description,
        url: SITE_URL,
        sameAs: [
          "https://github.com/pschwagler",
          "https://linkedin.com/in/pschwagler",
        ],
        knowsAbout: [
          "TypeScript",
          "React",
          "Node.js",
          "Python",
          "AI/ML",
          "Cloud Architecture",
        ],
      },
    },
  ];
}

export default function Home() {
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const { widgetRef, tokenReady, onSuccess, getToken, reset } =
    useTurnstile(TURNSTILE_SITE_KEY);
  const { suggestions, fetchSuggestions, clearSuggestions } = useSuggestions();

  const {
    messages,
    sendMessage: rawSendMessage,
    status,
    error,
    clearError,
  } = useChat({
    onFinish: useCallback(() => {
      reset();
    }, [reset]),
  });

  const sendMessage = useCallback(
    async (message: Parameters<typeof rawSendMessage>[0]) => {
      clearSuggestions();
      const token = await getToken();
      // Fire chat and suggestion requests in parallel
      const chatPromise = rawSendMessage(message, {
        body: { turnstileToken: token },
      });
      const text =
        message == null
          ? ""
          : typeof message === "string"
            ? message
            : "text" in message
              ? (message.text ?? "")
              : "";
      const simpleMessages = [
        ...messages.map((m) => ({ role: m.role, parts: m.parts })),
        { role: "user", parts: [{ type: "text", text }] },
      ];
      fetchSuggestions(simpleMessages, token);
      return chatPromise;
    },
    [rawSendMessage, getToken, messages, fetchSuggestions, clearSuggestions]
  );

  const handleContact = useCallback(() => setContactOpen(true), []);

  const chatProps = useMemo(
    () => ({
      messages,
      sendMessage,
      status,
      error,
      clearError,
      tokenReady,
      suggestions,
      onContact: handleContact,
    }),
    [
      messages,
      sendMessage,
      status,
      error,
      clearError,
      tokenReady,
      suggestions,
      handleContact,
    ]
  );

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
    <div className="flex h-dvh">
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
          <Portfolio
            onAskAboutApp={handleAskAboutApp}
            onContact={() => setContactOpen(true)}
          />
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

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        getToken={getToken}
      />

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={widgetRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ size: "invisible" }}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
