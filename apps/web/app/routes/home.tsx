import { useState } from "react";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Portfolio panel */}
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          chatOpen ? "pr-0" : "mx-auto max-w-3xl"
        }`}
      >
        <div className="mx-auto max-w-2xl px-6 py-12">
          {/* Intro */}
          <section className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Patrick Schwagler
            </h1>
            <p className="text-lg text-neutral-600">
              Builder. Engineer. Leader.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/pschwagler"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-neutral-900"
                aria-label="GitHub"
              >
                <GitHubIcon />
              </a>
              <a
                href="https://linkedin.com/in/pschwagler"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-neutral-900"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </div>
          </section>

          {/* Apps */}
          <section className="mt-16 space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
              Apps
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="font-medium">Beach League</p>
                <p className="text-sm text-neutral-500">
                  Beach volleyball league management
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="font-medium">GiftWell</p>
                <p className="text-sm text-neutral-500">
                  Thoughtful gift recommendations
                </p>
              </div>
            </div>
          </section>

          {/* Experience */}
          <section className="mt-16 space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
              Experience
            </h2>
            <div className="space-y-3">
              <div className="text-neutral-600">
                <p className="font-medium text-neutral-900">
                  Manager, Forward Deployed Engineering
                </p>
                <p className="text-sm">C3.ai</p>
              </div>
              <div className="text-neutral-600">
                <p className="font-medium text-neutral-900">
                  Senior Forward Deployed Engineer
                </p>
                <p className="text-sm">C3.ai</p>
              </div>
              <div className="text-neutral-600">
                <p className="font-medium text-neutral-900">
                  Forward Deployed Engineer
                </p>
                <p className="text-sm">C3.ai</p>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="mt-16 space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                "TypeScript",
                "React",
                "Node.js",
                "Python",
                "SQL",
                "AWS",
                "Tailwind",
                "Vite",
              ].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Chat panel */}
      {chatOpen ? (
        <aside className="hidden w-[380px] shrink-0 border-l border-neutral-100 bg-neutral-50 md:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <span className="text-sm font-medium text-neutral-500">Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
                aria-label="Close chat"
              >
                <XIcon />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm text-neutral-500">
                Ask me anything about Patrick&apos;s work
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "What did Patrick build at C3?",
                  "What's his tech stack?",
                  "Tell me about Beach League",
                ].map((q) => (
                  <button
                    key={q}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-neutral-100 p-4">
              <textarea
                placeholder="Ask a question..."
                rows={1}
                className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-300"
              />
            </div>
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 hidden rounded-full bg-neutral-900 p-3 text-white shadow-lg hover:bg-neutral-800 md:block"
          aria-label="Open chat"
        >
          <ChatIcon />
        </button>
      )}

      {/* Mobile FAB */}
      <button
        className="fixed bottom-6 right-6 rounded-full bg-neutral-900 p-3 text-white shadow-lg hover:bg-neutral-800 md:hidden"
        aria-label="Open chat"
      >
        <ChatIcon />
      </button>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
