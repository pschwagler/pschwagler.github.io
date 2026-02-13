/**
 * Curated pool of follow-up questions mapped to real content.
 * Used by /api/suggestions to pick contextually relevant follow-ups.
 * Lives in code (not in the chat system prompt) to avoid bloating LLM context.
 */
export const SUGGESTION_POOL: string[] = [
  // Background / Princeton / Volleyball
  "How did he end up in tech from civil engineering?",
  "What did he study at Princeton?",
  "What was it like playing professional volleyball?",
  "Where did Patrick play volleyball professionally?",
  "What did he learn from playing professional volleyball?",
  "What was playing volleyball in Italy like?",
  "What did he do before C3.ai?",

  // C3.ai general
  "What does C3.ai do?",
  "How long was he at C3.ai?",
  "What industries did he work across at C3?",
  "What cloud platforms has he deployed on?",
  "What was his career progression at C3?",
  "Why did he leave C3.ai?",

  // FDE projects (early career)
  "Tell me about the financial institution project",
  "What was the hardest debugging problem he solved?",
  "How did he fix the OOM crashes at the financial institution?",
  "What was the petrochemical manufacturer project about?",
  "How did he handle the air-gapped deployment environment?",
  "What was the mapreduce solution he built for aggregation?",
  "How did the financial institution project grow over time?",
  "What was the sustainability compliance work he did?",

  // Senior FDE projects
  "Tell me about the aluminum cup manufacturer rescue",
  "What was the energy forecasting project for the steel manufacturer?",
  "How did he deliver the steel manufacturer project in 5 weeks?",
  "What was the steel manufacturer evidence package?",
  "Tell me about the utility company API he designed",
  "What was the energy baselining project?",
  "How did he optimize the utility company's infrastructure costs?",

  // Manager / Leadership
  "Why did he move into management?",
  "How many engineers did he manage?",
  "Tell me about the Property Assessment application",
  "How did he cut cloud costs on the Property Assessment project?",
  "What was the multi-tenancy architecture he designed?",
  "How did he speed up deployment timelines?",
  "How did he manage 15 contract engineers?",
  "What's his approach to growing junior engineers into leads?",
  "What was the hardest leadership challenge?",
  "How did he handle the organizational strategy role?",

  // Beach League
  "Tell me about Beach League",
  "How does Beach League's AI score entry work?",
  "What tech stack does Beach League use?",
  "What's the vision for Beach League?",
  "How did Beach League change the training sessions?",
  "What kind of player statistics does Beach League track?",

  // GiftWell
  "What is GiftWell?",
  "Why did GiftWell stall?",
  "What features did GiftWell have?",
  "How was GiftWell's CI/CD pipeline set up?",

  // Riparian / early career
  "What did he do at Riparian?",

  // Skills / Tech stack
  "What's his tech stack?",
  "What languages does he work with?",
  "What databases has he used?",
  "What's his experience with distributed systems?",
  "Has he worked with ML pipelines?",
  "What testing frameworks does he use?",
  "What frontend frameworks does he know?",
  "What backend frameworks does he prefer?",

  // Engineering philosophy
  "What's his engineering philosophy?",
  "How does he approach code quality?",
  "What does he think about testing?",
  "What are his core engineering principles?",
  "How does he approach code reviews?",

  // AI-assisted development / This site
  "What's his take on AI-assisted development?",
  "How did Patrick build this site?",
  "How long did it take to build this site?",
  "Tell me how this site works",
  "What are ralph loops?",
  "How has his perspective on AI tools changed?",
  "How does he use Claude and Cursor day-to-day?",
  "What tasks does he delegate to AI vs do himself?",
  "What's the RAG pipeline behind this site?",

  // Career arc / What drives him
  "What drives him professionally?",
  "What should I take away from his experience?",
  "What kind of role is he looking for?",
  "Is he looking for IC or management roles?",
  "What makes him well-suited for the AI era?",
  "How would you describe his career arc?",
];

/** Client-side fallback when the suggestion API fails */
export const FALLBACK_SUGGESTIONS: string[] = [
  "What was the hardest problem he solved?",
  "Tell me about his side projects",
  "What's his engineering philosophy?",
];
