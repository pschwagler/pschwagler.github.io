import { useCallback, useEffect, useRef, useState } from "react";
import { useEscapeKey } from "~/hooks/use-escape-key";
import { useFocusTrap } from "~/hooks/use-focus-trap";
import { MAX_CONTACT_MESSAGE_LENGTH } from "~/lib/constants";
import { XIcon, LinkedInIcon } from "~/components/icons";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500";

export function ContactModal({
  open,
  onClose,
  getToken,
}: {
  open: boolean;
  onClose: () => void;
  getToken: () => Promise<string | undefined>;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEscapeKey(onClose, open && status !== "submitting");

  // Enter/exit animation
  useEffect(() => {
    if (open) {
      // Trigger enter animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("submitting");
      setErrorMessage("");

      try {
        const token = await getToken();
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            message,
            name: name || undefined,
            company: company || undefined,
            jobTitle: jobTitle || undefined,
            turnstileToken: token,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send message");
        }

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }
    },
    [email, message, name, company, jobTitle, getToken]
  );

  const handleClose = useCallback(() => {
    if (status === "submitting") return;
    onClose();
    // Reset after close animation
    setTimeout(() => {
      setName("");
      setCompany("");
      setJobTitle("");
      setEmail("");
      setMessage("");
      setStatus("idle");
      setErrorMessage("");
    }, 200);
  }, [onClose, status]);

  if (!open && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Contact form"
        className={`w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Get in touch
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              I&apos;ll follow up with my resume if it&apos;s a good fit.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm p-1 text-neutral-400 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-500 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-500"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {status === "success" ? (
          <div className="py-8 text-center">
            <p className="text-neutral-900 dark:text-neutral-50">
              Thanks for reaching out — I&apos;ll get back to you within a day
              or two.
            </p>
            <a
              href="https://linkedin.com/in/pschwagler"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <LinkedInIcon className="h-4 w-4" />
              Connect on LinkedIn
            </a>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-500"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "submitting"}
              placeholder="Your name"
              className={inputClass}
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={status === "submitting"}
                placeholder="Company"
                className={inputClass}
              />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={status === "submitting"}
                placeholder="Job title for the role"
                className={inputClass}
              />
            </div>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              placeholder="you@example.com"
              className={inputClass}
            />
            <div>
              <textarea
                id="contact-message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === "submitting"}
                maxLength={MAX_CONTACT_MESSAGE_LENGTH}
                rows={4}
                placeholder="Describe the role, project, or idea..."
                className={`resize-none ${inputClass}`}
              />
              <p className="mt-1 text-right text-xs text-neutral-400 dark:text-neutral-500">
                {message.length}/{MAX_CONTACT_MESSAGE_LENGTH}
              </p>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-500"
            >
              {status === "submitting" ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
