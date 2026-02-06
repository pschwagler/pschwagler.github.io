import { GitHubIcon, LinkedInIcon } from "~/components/icons";
import {
  APPS,
  EXPERIENCE,
  SKILL_GROUPS,
  SOCIAL_LINKS,
  type SocialPlatform,
} from "~/data/portfolio";

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

function IntroSection() {
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Patrick Schwagler</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Builder. Engineer. Leader.
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
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              aria-label={link.platform}
            >
              <Icon />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function AppsSection() {
  return (
    <section className="mt-16 space-y-4">
      <SectionHeading>Apps</SectionHeading>
      <div className="space-y-3">
        {APPS.map((app) => (
          <div
            key={app.name}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <p className="font-medium">{app.name}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {app.description}
            </p>
          </div>
        ))}
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

export function Portfolio() {
  return (
    <>
      <IntroSection />
      <AppsSection />
      <ExperienceSection />
      <SkillsSection />
    </>
  );
}
