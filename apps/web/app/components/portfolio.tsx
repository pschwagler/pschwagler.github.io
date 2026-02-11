import { useState } from "react";
import { GitHubIcon, LinkedInIcon } from "~/components/icons";
import {
  ADJECTIVES,
  APPS,
  EXPERIENCE,
  SKILL_GROUPS,
  SOCIAL_LINKS,
  type SocialPlatform,
} from "~/data/portfolio";
import { useRotatingText } from "~/hooks/use-rotating-text";

const SOCIAL_ICONS: Record<SocialPlatform, React.FC<{ className?: string }>> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
      {children}
    </h2>
  );
}

function RotatingAdjective() {
  const current = useRotatingText(ADJECTIVES);

  return (
    <span
      key={current}
      className="inline-block animate-fade-in"
      aria-live="polite"
    >
      {current}
    </span>
  );
}

function IntroSection() {
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Patrick Schwagler</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Forward Deployed Software Engineer
      </p>
      <p className="text-base text-neutral-500 dark:text-neutral-400">
        <RotatingAdjective />
      </p>
      <div className="flex gap-3">
        {SOCIAL_LINKS.map((link) => {
          const Icon = SOCIAL_ICONS[link.platform];
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-500"
              aria-label={`${link.platform === "github" ? "GitHub" : "LinkedIn"} profile`}
            >
              <Icon />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function AppsSection({
  onAskAboutApp,
}: {
  onAskAboutApp?: (appName: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="mt-16 space-y-4">
      <SectionHeading>Apps</SectionHeading>
      <div className="space-y-3">
        {APPS.map((app) => {
          const isExpanded = expanded === app.name;
          return (
            <div
              key={app.name}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : app.name)}
                className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${app.name}`}
              >
                <img
                  src={app.iconSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 rounded"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {app.description}
                  </p>
                </div>
                <span
                  className={`text-neutral-400 transition-transform duration-200 dark:text-neutral-500 ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-800">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {app.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-100 dark:focus-visible:ring-neutral-500"
                      >
                        Visit {app.name} →
                      </a>
                      <a
                        href={app.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-500"
                        aria-label={`${app.name} on GitHub`}
                      >
                        <GitHubIcon className="h-4 w-4" />
                      </a>
                      {onAskAboutApp && (
                        <button
                          type="button"
                          onClick={() => onAskAboutApp(app.name)}
                          className="rounded-sm text-sm font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-100 dark:hover:decoration-neutral-100 dark:focus-visible:ring-neutral-500"
                        >
                          Ask AI about this →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section className="mt-16 space-y-4">
      <SectionHeading>Experience</SectionHeading>
      <div className="space-y-4">
        {EXPERIENCE.map((exp) => (
          <div
            key={exp.title}
            className="flex items-baseline justify-between gap-4"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                {exp.title}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {exp.company}
              </p>
            </div>
            <p className="shrink-0 text-sm text-neutral-400 dark:text-neutral-500">
              {exp.period}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section className="mt-16 space-y-4">
      <SectionHeading>Skills</SectionHeading>
      <div className="space-y-4">
        {SKILL_GROUPS.map((group) => (
          <div key={group.category}>
            <p className="mb-2 text-xs font-medium text-neutral-400 dark:text-neutral-500">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Portfolio({
  onAskAboutApp,
}: {
  onAskAboutApp?: (appName: string) => void;
}) {
  return (
    <>
      <IntroSection />
      <AppsSection onAskAboutApp={onAskAboutApp} />
      <ExperienceSection />
      <SkillsSection />
    </>
  );
}
