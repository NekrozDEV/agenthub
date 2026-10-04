export interface SkillTemplate {
  filename: string;
  title: string;
  description: string;
  content: string;
}

export const DEFAULT_SKILLS: SkillTemplate[] = [
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
