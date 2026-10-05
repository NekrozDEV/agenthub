import fs from 'fs';
import path from 'path';
import { AgentAdapter, MANAGED_MARKER, safeWriteManagedRuleFile, safeCleanupManagedFile, safeRemoveEmptyDir } from './base.js';

export class ClaudeCodeAdapter implements AgentAdapter {
  id = 'claude-code' as const;
  name = 'Anthropic Claude Code';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const claudeMdPath = path.join(knowledgeBasePath, 'CLAUDE.md');
    const content = `${MANAGED_MARKER}
# CLAUDE.md - Workspace Instructions

## Workspace Navigation & Token Efficiency
- User projects are stored in \`projects/\`.
- **CRITICAL**: Before reading entire source directories, read \`PROJECTS_MAP.md\` to understand project boundaries and architectures.
- **Cross-Agent Handoff**: If continuing a prior session from another agent, check \`HANDOFF.md\` for latest checkpoint and remaining tasks.

## Active Skills (Load as needed)
${skills.map((s) => `- \`skills/${s}\``).join('\n')}

## Security & Secrets
- Never request, write, or leak API keys in chat or git.
- Sensitive environment variables and tokens are securely isolated in AgentHub Vault.
`;

    safeWriteManagedRuleFile(claudeMdPath, content);

    // Create .claude directory with safe config
    const claudeDir = path.join(knowledgeBasePath, '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
  }

  cleanup(knowledgeBasePath: string): void {
    const claudeMdPath = path.join(knowledgeBasePath, 'CLAUDE.md');
    safeCleanupManagedFile(claudeMdPath);

    const claudeDir = path.join(knowledgeBasePath, '.claude');
    safeRemoveEmptyDir(claudeDir);
  }
}

