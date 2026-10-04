import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class CursorAdapter implements AgentAdapter {
  id = 'cursor' as const;
  name = 'Cursor AI';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const cursorRulesPath = path.join(knowledgeBasePath, '.cursorrules');
    const content = `# Cursor Rules - AgentHub Managed

- Workspaces are situated under \`projects/\`.
- Check \`PROJECTS_MAP.md\` to preserve context window.
- Consult \`HANDOFF.md\` for session handoffs from other agents.
- Follow active skills in \`skills/\`.
- Strictly adhere to zero-secrets policy. Credentials are stored in AgentHub Vault.
`;

    fs.writeFileSync(cursorRulesPath, content, 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const cursorRulesPath = path.join(knowledgeBasePath, '.cursorrules');
    if (fs.existsSync(cursorRulesPath)) {
      fs.unlinkSync(cursorRulesPath);
    }
  }
}
