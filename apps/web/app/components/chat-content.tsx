import type { UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { lazy, Suspense, useEffect, useRef, type KeyboardEvent } from "react";

const Markdown = lazy(() => import("react-markdown"));
import {
  CHAT_PLACEHOLDER,
  CHAT_PROMPT,
  SUGGESTED_QUESTIONS,
} from "~/data/chat";
import { MAX_MESSAGE_LENGTH } from "~/lib/constants";
import { getTextContent } from "~/lib/messages";

export interface ChatContentProps {
  messages: UIMessage[];
  sendMessage: (params: { text: string }) => void;
  status: ChatStatus;
  error: Error | undefined;
  clearError: () => void;
}

export function ChatContent({
  messages,
  sendMessage,
  status,
  error,
  clearError,
}: ChatContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function handleSubmit() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    el.value = "";
    el.style.height = "auto";
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function onInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <>
      <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
        {!hasMessages && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {CHAT_PROMPT}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage({ text: q })}
                  aria-label={`Ask: ${q}`}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:focus-visible:ring-neutral-500"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="flex flex-col gap-4 px-4 py-4" aria-live="polite">
            {messages.map((message) => {
              const text = getTextContent(message);
              if (!text) return null;
              return (
                <div
                  key={message.id}
                  className={
                    message.role === "user" ? "text-right" : "text-left"
                  }
                >
                  {message.role === "user" ? (
                    <p className="inline-block max-w-[85%] whitespace-pre-wrap text-sm text-neutral-900 dark:text-neutral-100">
                      {text}
                    </p>
                  ) : (
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-[85%] prose-p:leading-relaxed prose-pre:bg-neutral-100 prose-pre:dark:bg-neutral-800">
                      <Suspense
                        fallback={<p className="whitespace-pre-wrap">{text}</p>}
                      >
                        <Markdown>{text}</Markdown>
                      </Suspense>
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div
                className="text-left"
                role="status"
                aria-label="AI is responding"
              >
                <div className="inline-flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-left" role="alert">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {error.message || "Something went wrong — try again."}{" "}
                  <button
                    onClick={clearError}
                    className="rounded-sm underline underline-offset-2 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-neutral-200 dark:focus-visible:ring-neutral-500"
                  >
                    Dismiss
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
        <textarea
          ref={textareaRef}
          onKeyDown={onKeyDown}
          onInput={onInput}
          placeholder={CHAT_PLACEHOLDER}
          aria-label="Chat message"
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isStreaming}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-500"
        />
      </div>
    </>
  );
}
