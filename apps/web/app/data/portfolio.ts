export interface AppItem {
  name: string;
  description: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
}

export const APPS: AppItem[] = [
  { name: "Beach League", description: "Beach volleyball league management" },
  { name: "GiftWell", description: "Thoughtful gift recommendations" },
];

export const EXPERIENCE: ExperienceItem[] = [
  { title: "Manager, Forward Deployed Engineering", company: "C3.ai" },
  { title: "Senior Forward Deployed Engineer", company: "C3.ai" },
  { title: "Forward Deployed Engineer", company: "C3.ai" },
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
