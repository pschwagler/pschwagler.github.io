import { GitHubIcon, LinkedInIcon } from "~/components/icons";
import { APPS, EXPERIENCE, SKILL_GROUPS } from "~/data/portfolio";

export function Portfolio() {
  return (
    <>
      {/* Intro */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Patrick Schwagler</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Builder. Engineer. Leader.
        </p>
        <div className="flex gap-3">
          <a
            href="https://github.com/pschwagler"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://linkedin.com/in/pschwagler"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
          </a>
        </div>
      </section>

      {/* Apps */}
      <section className="mt-16 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Apps
        </h2>
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

      {/* Experience */}
      <section className="mt-16 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Experience
        </h2>
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

      {/* Skills */}
      <section className="mt-16 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Skills
        </h2>
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
    </>
  );
}
