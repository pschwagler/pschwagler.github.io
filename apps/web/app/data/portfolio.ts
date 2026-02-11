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
  iconSrc: string;
  techStack: string[];
  url: string;
  githubUrl: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  period: string;
}

export const APPS: AppItem[] = [
  {
    name: "Beach League",
    description: "Beach volleyball league management and registration",
    iconSrc: "/images/beach-league.ico",
    techStack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    url: "https://beachleaguevb.com",
    githubUrl: "https://github.com/pschwagler/beach-kings",
  },
  {
    name: "GiftWell",
    description: "Subscription gifting platform",
    iconSrc: "/images/giftwell.png",
    techStack: ["React", "TypeScript", "AI/ML", "Vercel"],
    url: "https://giftwell.shop",
    githubUrl: "https://github.com/pschwagler/gsub",
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

export const ADJECTIVES = [
  "Engineer",
  "Builder",
  "Creator",
  "AI/ML Deployments",
  "Leader",
  "Technologist",
  "Generalist",
  "Lifelong Learner",
  "Problem Solver",
  "Manager",
  "Full-Stack Dev",
  "Systems Thinker",
  "Mentor",
  "Product Thinker",
  "Prototyper",
] as const;

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
