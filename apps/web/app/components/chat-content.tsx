import {
  CHAT_PLACEHOLDER,
  CHAT_PROMPT,
  SUGGESTED_QUESTIONS,
} from "~/data/chat";

export function ChatContent({
  onQuestionClick,
}: {
  onQuestionClick?: (q: string) => void;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {CHAT_PROMPT}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onQuestionClick?.(q)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
        <textarea
          placeholder={CHAT_PLACEHOLDER}
          rows={1}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
        />
      </div>
    </>
  );
}
