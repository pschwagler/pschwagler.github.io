export type SocialPlatform = "github" | "linkedin";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: "github", url: "https://github.com/pschwagler" },
  { platform: "linkedin", url: "https://linkedin.com/in/pschwagler" },
];

export interface AppItem {
  name: string;
  description: string;
  icon: string;
  techStack: string[];
  url: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  period: string;
}

export const APPS: AppItem[] = [
  {
    name: "Beach League",
    description: "Beach volleyball league management",
    icon: "🏐",
    techStack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    url: "https://beachleague.app",
  },
  {
    name: "GiftWell",
    description: "Thoughtful gift recommendations",
    icon: "🎁",
    techStack: ["React", "TypeScript", "AI/ML", "Vercel"],
    url: "https://giftwell.app",
  },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    title: "Manager, Forward Deployed Engineering",
    company: "C3.ai",
    period: "2022 – 2024",
  },
  {
    title: "Senior Forward Deployed Engineer",
    company: "C3.ai",
    period: "2021 – 2022",
  },
  {
    title: "Forward Deployed Engineer",
    company: "C3.ai",
    period: "2019 – 2021",
  },
];

export interface SkillGroup {
  category: string;
  items: string[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "SQL"],
  },
  {
    category: "Frameworks & Libraries",
    items: ["React", "Node.js", "Tailwind CSS", "Vite"],
  },
  {
    category: "Platforms & Tools",
    items: ["AWS", "Vercel", "Supabase", "Git"],
  },
];
