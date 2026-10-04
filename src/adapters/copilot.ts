import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class CopilotAdapter implements AgentAdapter {
  id = 'copilot' as const;
  name = 'GitHub Copilot';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const githubDir = path.join(knowledgeBasePath, '.github');
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    const instructionsPath = path.join(githubDir, 'copilot-instructions.md');
    const content = `# GitHub Copilot Custom Instructions (AgentHub Managed)

## Workspace Architecture & Token Discipline
- Multi-project workspaces live under \`projects/\`.
- **CRITICAL**: Before suggesting architecture or file modifications, inspect \`PROJECTS_MAP.md\` to preserve context.
- When continuing prior work, consult \`HANDOFF.md\` for the active task and next steps.

## Engineering Standards & Skills
- Follow the universal operating guidelines in \`skills/agenthub-guide.md\`.
- Active skills are available in \`skills/\`:
${skills.map((s) => `  - \`skills/${s}\``).join('\n')}

## Zero-Leak Security Vault
- **NEVER** generate code with hardcoded API keys, secrets, private keys, or passwords.
- Always use environment variables for sensitive parameters.
- Secrets are stored in AgentHub Vault (\`.hub/vault.env\`).
`;

    fs.writeFileSync(instructionsPath, content, 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const instructionsPath = path.join(knowledgeBasePath, '.github', 'copilot-instructions.md');
    if (fs.existsSync(instructionsPath)) {
      fs.unlinkSync(instructionsPath);
    }
  }
}
