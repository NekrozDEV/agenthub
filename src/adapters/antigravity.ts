import path from 'path';
import { AgentAdapter, MANAGED_MARKER, safeWriteManagedRuleFile, safeCleanupManagedFile, safeRemoveEmptyDir } from './base.js';

export class AntigravityAdapter implements AgentAdapter {
  id = 'antigravity' as const;
  name = 'Google Antigravity';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const rulesDir = path.join(knowledgeBasePath, '.gemini');
    const rulesContent = `${MANAGED_MARKER}
# Antigravity Workspace Rules
- All user repositories reside inside \`projects/\`.
- Refer to \`PROJECTS_MAP.md\` for high-level structure to conserve token budget.
- For task continuation across agents, check \`HANDOFF.md\`.
- Core Guide: Follow \`skills/agenthub-guide.md\`.
- Available Skills: ${skills.length > 0 ? skills.map((s) => `\`${s}\``).join(', ') : 'None'}.
- Secrets are securely managed in AgentHub Vault and not exposed in conversation transcripts.
`;

    safeWriteManagedRuleFile(path.join(rulesDir, 'rules.md'), rulesContent);
  }

  cleanup(knowledgeBasePath: string): void {
    const rulesDir = path.join(knowledgeBasePath, '.gemini');
    const rulesFile = path.join(rulesDir, 'rules.md');
    safeCleanupManagedFile(rulesFile);

    safeRemoveEmptyDir(rulesDir);
  }
}

