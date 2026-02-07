import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import Markdown from "react-markdown";
import {
  CHAT_PLACEHOLDER,
  CHAT_PROMPT,
  SUGGESTED_QUESTIONS,
} from "~/data/chat";

function getTextContent(message: {
  parts: Array<{ type: string; text?: string }>;
}): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function ChatContent() {
  const { messages, sendMessage, status, error, clearError } = useChat();

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
                  onClick={() => sendMessage({ text: q })}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="flex flex-col gap-4 px-4 py-4">
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
                      <Markdown>{text}</Markdown>
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="text-left">
                <div className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-left">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {error.message || "Something went wrong — try again."}{" "}
                  <button
                    onClick={clearError}
                    className="underline underline-offset-2 hover:text-neutral-700 dark:hover:text-neutral-200"
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
          rows={1}
          maxLength={500}
          disabled={isStreaming}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-300 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
        />
      </div>
    </>
  );
}
