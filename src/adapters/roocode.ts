import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class RooCodeAdapter implements AgentAdapter {
  id = 'roo-code' as const;
  name = 'Roo Code (VS Code)';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    // 1. .roomodes custom instructions
    const roomodesPath = path.join(knowledgeBasePath, '.roomodes');
    const content = JSON.stringify(
      {
        customModes: [
          {
            slug: 'agenthub-engineer',
            name: 'AgentHub Engineer',
            roleDefinition:
              'You are an expert autonomous software engineer operating within the AgentHub Knowledge Base ecosystem. You respect token limits, consult PROJECTS_MAP.md, load skills on demand, and uphold zero-leak secret security.',
            groups: ['read', 'edit', 'browser', 'command', 'mcp'],
            customInstructions:
              'Always consult skills/agenthub-guide.md. For multi-project orientation, check PROJECTS_MAP.md. For task state across agent sessions, inspect HANDOFF.md. Secrets are stored in .hub/vault.env and must never be echoed or committed.',
          },
        ],
      },
      null,
      2
    );
    fs.writeFileSync(roomodesPath, content, 'utf8');

    // Also support .clinerules if not present
    const clineRulesPath = path.join(knowledgeBasePath, '.clinerules');
    if (!fs.existsSync(clineRulesPath)) {
      const clineContent = `# Roo Code Rules (AgentHub Managed)
- Consult \`PROJECTS_MAP.md\` to preserve context.
- Read \`HANDOFF.md\` for cross-agent task checkpoints.
- Follow \`skills/agenthub-guide.md\` and loaded skills.
- Strictly adhere to zero-secrets policy. Credentials live in AgentHub Vault.
`;
      fs.writeFileSync(clineRulesPath, clineContent, 'utf8');
    }
  }

  cleanup(knowledgeBasePath: string): void {
    const roomodesPath = path.join(knowledgeBasePath, '.roomodes');
    if (fs.existsSync(roomodesPath)) {
      fs.unlinkSync(roomodesPath);
    }
  }
}
