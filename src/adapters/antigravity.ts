import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class AntigravityAdapter implements AgentAdapter {
  id = 'antigravity' as const;
  name = 'Google Antigravity';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const rulesDir = path.join(knowledgeBasePath, '.gemini');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    const rulesContent = `# Antigravity Workspace Rules (AgentHub Managed)
- All user repositories reside inside \`projects/\`.
- Refer to \`PROJECTS_MAP.md\` for high-level structure to conserve token budget.
- For task continuation across agents, check \`HANDOFF.md\`.
- Available Skills: ${skills.length > 0 ? skills.map((s) => `\`${s}\``).join(', ') : 'None'}.
- Secrets are securely managed in AgentHub Vault and not exposed in conversation transcripts.
`;

    fs.writeFileSync(path.join(rulesDir, 'rules.md'), rulesContent, 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const rulesFile = path.join(knowledgeBasePath, '.gemini', 'rules.md');
    if (fs.existsSync(rulesFile)) {
      fs.unlinkSync(rulesFile);
    }
  }
}
