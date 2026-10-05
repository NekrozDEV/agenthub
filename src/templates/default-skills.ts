export interface SkillTemplate {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: 'core' | 'frontend' | 'security' | 'architecture' | 'quality';
  content: string;
}

export const DEFAULT_SKILLS: SkillTemplate[] = [
  {
    id: 'agenthub-guide',
    filename: 'agenthub-guide.md',
    title: 'AgentHub Universal Agent Guide (Meta-Skill)',
    description: 'Core operating manual: how AI agents discover skills, preserve token budget, manage secrets & handle handoffs',
    category: 'core',
    content: `# 🤖 AgentHub Universal Agent Operating Guide

Welcome to the AgentHub ecosystem. You are operating as an autonomous or semi-autonomous AI engineer within an AgentHub-managed environment. Follow these core protocols strictly.

---

## 1. ⚡ Token Preservation & Context Discipline
- **DO NOT read entire directory trees blindly.**
- **First Step**: Check \`PROJECTS_MAP.md\` (or call \`agenthub_get_project_map\`). It provides a concise, high-level map of all projects, tech stacks, and architectures designed to consume minimal tokens.
- Only inspect specific source files directly required for the current user task.
- Summarize findings concisely rather than dumping full file listings.

---

## 2. 🧠 Skill Discovery (Load On-Demand)
- Skills in \`skills/\` contain standardized engineering playbooks.
- **Progressive Disclosure**:
  - Do not load all skills into context at once.
  - Check the available skills list (e.g. via \`agenthub_list_skills\` or looking at \`skills/\`).
  - Read full skill documents (e.g. \`skills/frontend-design.md\`, \`skills/code-review.md\`, \`skills/bug-hunter.md\`) only when your current task demands that methodology.

---

## 3. 🛡️ Zero-Leak Security Vault
- **NEVER** output raw credentials, API tokens, passwords, database strings, or private keys in chat messages, commit messages, or source code.
- If a project needs credentials:
  - Check if the key exists in AgentHub Vault (call \`agenthub_list_vault_keys\` or use \`agenthub vault list\`).
  - Use environment variables (e.g., \`process.env.API_KEY\`) with appropriate fallback placeholders.
  - Direct the user to set missing secrets via: \`agenthub vault set <KEY> <VALUE>\`.
- When uncertain about committed files or modified code, verify with \`agenthub audit\` or \`agenthub_audit_code\`.

---

## 4. 🔄 Cross-Agent Handoff Protocol
Different AI systems (Claude Code, Google Antigravity, DeepSeek Harness, OpenCode, Windsurf, Cursor, Copilot) frequently collaborate on the same codebase.
- **Starting a session**:
  - Check \`HANDOFF.md\` (or call \`agenthub_get_handoff\`).
  - If a checkpoint exists with status \`IN_PROGRESS\` or \`READY_FOR_REVIEW\`, resume immediately from the recorded next steps without requiring the user to re-explain the task.
- **Ending a session or hitting token limits**:
  - Record your progress! Save a checkpoint via \`agenthub handoff create -t "Task" -s "Summary" -f file1 file2\` or \`agenthub_create_handoff\`.
  - Provide crisp, actionable next steps for whoever takes over.

---

## 5. 🛠️ Tool & MCP Integration
- If AgentHub MCP is connected, leverage built-in tools:
  - \`agenthub_list_skills\`: discover available capabilities
  - \`agenthub_get_skill\`: fetch detailed skill instructions
  - \`agenthub_get_project_map\`: get current project overview
  - \`agenthub_get_handoff\` / \`agenthub_create_handoff\`: maintain cross-agent continuity
  - \`agenthub_audit_code\`: inspect code for credential leakage
`,
  },
  {
    id: 'frontend-design',
    filename: 'frontend-design.md',
    title: 'Modern Frontend Design & UI Excellence',
    description: 'Create production-ready, beautiful, accessible modern interfaces with Tailwind CSS, micro-interactions and clean typography',
    category: 'frontend',
    content: `# Modern Frontend Design & UI Excellence Skill

## Objective
Guide the AI agent to build visually stunning, accessible, responsive, and delightful web user interfaces.

## 🎨 Aesthetics & Visual Hierarchy
1. **Typography First**:
   - Establish clean typographic scale (display, h1, h2, h3, body, caption).
   - Use high-quality fonts (Inter, Geist, Plus Jakarta Sans, SF Pro).
   - Maintain readable line heights (\`leading-relaxed\` for prose, \`leading-tight\` for headings).
2. **Color Palette & Lighting**:
   - Cohesive 60-30-10 color rule (60% background, 30% structural surface, 10% intentional accent).
   - Provide seamless dark mode support (\`dark:\` variants).
   - Subtle borders (\`border-border/40\` or \`border-white/10\`) and soft ambient shadows.
3. **Spacing & Layout Rhythm**:
   - Consistent 4px/8px grid system (gap-2, gap-4, gap-6, gap-8).
   - Prevent layout shift with explicit aspect ratios and skeleton loaders.
   - Mobile-first responsive layouts using Flexbox and CSS Grid.

## ⚡ Interaction & Micro-Animations
1. **Fluid Transitions**:
   - Never pop elements abruptly. Use smooth easing (\`transition-all duration-200 ease-out\`).
   - Add hover states, active press states (\`active:scale-[0.98]\`), and focus-visible rings for keyboard users.
2. **Glassmorphism & Depth**:
   - Modern backdrops: \`backdrop-blur-md bg-background/80\`.
   - Polished card designs with soft hover glows.

## ♿ Accessibility (a11y)
1. **Semantic HTML**:
   - Always use proper elements (\`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<button>\`).
   - Never use \`<div onClick>\` where \`<button>\` belongs.
2. **Contrast & Keyboard Navigation**:
   - Meet WCAG AA contrast standards (minimum 4.5:1 for normal text).
   - Ensure all interactive controls have visible focus rings.
`,
  },
  {
    id: 'cybersecurity-guidelines',
    filename: 'cybersecurity-guidelines.md',
    title: 'Cybersecurity & Vulnerability Prevention',
    description: 'OWASP Top 10 defense, sanitization, secrets isolation, secure headers and hardened auth flows',
    category: 'security',
    content: `# Cybersecurity & Vulnerability Prevention Skill

## Objective
Ensure code written or reviewed by AI agents is resilient against modern attack vectors and security exploits.

## 🛡️ Core Security Principles
1. **Zero-Trust Input Handling**:
   - Treat ALL user inputs, headers, query params, and body payloads as untrusted.
   - Validate with strict schema libraries (Zod, Valibot, Yup, Pydantic).
   - Strip unexpected properties and enforce length limits to prevent DoS.
2. **Injection Defense**:
   - **SQL Injection**: Always use parameterized queries or trusted ORMs. Never concatenate strings into queries.
   - **XSS (Cross-Site Scripting)**: Sanitize HTML content before rendering; avoid \`dangerouslySetInnerHTML\` unless sanitized with DOMPurify.
   - **Command Injection**: Never pass user input to \`exec\` or shell execution without strict whitelisting.
3. **Secrets & Credential Hygiene**:
   - Never store API keys, tokens, or database connection strings in source code or git.
   - Store credentials in AgentHub Vault (\`agenthub vault set <KEY> <VALUE>\`).
   - Run \`agenthub audit\` before committing.
4. **Authentication & Session Security**:
   - Hash passwords with Argon2id or bcrypt (cost factor >= 12).
   - Issue HTTP-only, Secure, SameSite=Lax/Strict session cookies.
   - Enforce rate limiting on login, registration, and password reset endpoints.
`,
  },
  {
    id: 'api-architect',
    filename: 'api-architect.md',
    title: 'Robust API & Backend Architecture',
    description: 'Clean RESTful & tRPC conventions, schema validation, pagination, idempotency and error handling',
    category: 'architecture',
    content: `# Robust API & Backend Architecture Skill

## Objective
Standardize API endpoints, data models, error responses, and service communication across projects.

## 📐 API Design Guidelines
1. **Clean Resource Hierarchy**:
   - Plural nouns for resource collections (\`/api/v1/projects\`, \`/api/v1/projects/:id/members\`).
   - Proper HTTP verbs: \`GET\` (read), \`POST\` (create), \`PUT\` (full update), \`PATCH\` (partial update), \`DELETE\` (remove).
2. **Consistent Response Envelope**:
   - Success: \`{ "success": true, "data": { ... } }\`
   - Failure: \`{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }\`
3. **Safe Pagination**:
   - Always paginate collections by default (cursor-based for high frequency feeds, offset-based for static data).
   - Cap maximum page sizes (\`limit <= 100\`).
4. **Idempotency & Resiliency**:
   - Support \`Idempotency-Key\` headers for payment, mutation, and creation endpoints.
   - Implement graceful exponential backoff and circuit breakers for external third-party requests.
`,
  },
  {
    id: 'git-workflow',
    filename: 'git-workflow.md',
    title: 'Git Disciplined Workflow',
    description: 'Enforces clean branches, semantic commits, and zero secret commits',
    category: 'quality',
    content: `# Git Disciplined Workflow Skill

## Objective
Ensure all version control operations across all AI agents follow high standard engineering practices.

## Guidelines
1. **Never Commit Secrets**: Check \`.env\`, credentials, tokens, or keys before staging.
2. **Conventional Commits**: Format commit messages as \`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`, \`test:\`, or \`chore:\`.
3. **Atomic Commits**: Group related changes together; do not mix refactoring with business logic.
4. **Safety Check**: Always run \`git status\` and \`git diff\` before committing.
5. **No Blind Force Pushes**: Never use \`git push --force\` on shared or main branches.
`,
  },
  {
    id: 'code-review',
    filename: 'code-review.md',
    title: 'Security & Quality Code Review',
    description: 'Systematic code review checklist covering OWASP, types, and performance',
    category: 'quality',
    content: `# Security & Quality Code Review Skill

## Checklist
1. **Security**:
   - Are user inputs sanitized to prevent injection attacks (SQL, XSS, Command)?
   - Are authentication and authorization checks enforced at endpoint level?
   - Are sensitive credentials retrieved from environment variables instead of hardcoded?
2. **Type Safety & Contracts**:
   - Strict typing enabled; minimize \`any\` or unvalidated casts.
   - Validation at system boundaries using schemas (Zod, Pydantic, etc.).
3. **Error Handling**:
   - Graceful error states; no raw stack traces exposed to end-users.
   - Meaningful error logging with appropriate severity levels.
4. **Performance**:
   - Avoid N+1 queries in database transactions.
   - Prevent unnecessary re-renders and memory leaks.
`,
  },
  {
    id: 'bug-hunter',
    filename: 'bug-hunter.md',
    title: 'Root-Cause Bug Hunter',
    description: 'Structured 4-step debugging methodology: Reproduce, Diagnose, Minimal Fix, Verify',
    category: 'quality',
    content: `# Root-Cause Bug Hunter Skill

## Debugging Algorithm
1. **Reproduce First**:
   - Never write code based on assumptions. First formulate a reproduction step or failing automated test.
2. **Isolate Root Cause**:
   - Inspect stack traces, logs, and state transitions. Narrow down to the exact function and condition.
3. **Apply Minimal Fix**:
   - Fix the actual bug at its root rather than masking symptoms or adding fragile band-aids.
4. **Regression Check**:
   - Run existing test suites to ensure the fix does not break adjacent functionality.
`,
  },
];
