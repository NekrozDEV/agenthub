export interface SkillTemplate {
  filename: string;
  title: string;
  description: string;
  content: string;
}

export const DEFAULT_SKILLS: SkillTemplate[] = [
  {
    filename: 'agenthub-guide.md',
    title: 'AgentHub Universal Agent Guide (Meta-Skill)',
    description: 'Core operating manual: how AI agents discover skills, preserve token budget, manage secrets & handle handoffs',
    content: `# 🤖 AgentHub Universal Agent Operating Guide

Welcome to the AgentHub ecosystem. You are operating as an autonomous or semi-autonomous AI engineer within an AgentHub-managed environment. Follow these core protocols strictly.

---

## 1. ⚡ Token Preservation & Context Discipline
- **DO NOT read entire directory trees blindly.**
- **First Step**: Check \`PROJECTS_MAP.md\` (or call \`agenthub_get_project_map\`). It provides a concise, high-level map of all projects, tech stacks, and architectures designed to consume less than 500 tokens.
- Only inspect specific source files directly required for the current user task.
- Summarize findings concisely rather than dumping full file listings.

---

## 2. 🧠 Skill Discovery (Load On-Demand)
- Skills in \`skills/\` contain standardized engineering playbooks.
- **Progressive Disclosure**:
  - Do not load all skills into context at once.
  - Check the available skills list (e.g. via \`agenthub_list_skills\` or looking at \`skills/\`).
  - Read full skill documents (e.g. \`skills/code-review.md\`, \`skills/bug-hunter.md\`, \`skills/git-workflow.md\`) only when your current task demands that methodology.

---

## 3. 🛡️ Zero-Leak Security Vault
- **NEVER** output raw credentials, API tokens, passwords, database strings, or private keys in chat messages, commit messages, or source code.
- If a project needs credentials:
  - Check if the key exists in AgentHub Vault (\`.hub/vault.env\` or call \`agenthub_list_vault_keys\`).
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
    filename: 'git-workflow.md',
    title: 'Git Disciplined Workflow',
    description: 'Enforces clean branches, semantic commits, and zero secret commits',
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
    filename: 'code-review.md',
    title: 'Security & Quality Code Review',
    description: 'Systematic code review checklist covering OWASP, types, and performance',
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
    filename: 'bug-hunter.md',
    title: 'Root-Cause Bug Hunter',
    description: 'Structured 4-step debugging methodology: Reproduce, Diagnose, Minimal Fix, Verify',
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
