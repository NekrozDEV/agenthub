import fs from 'fs';
import path from 'path';
import { AgentAdapter, MANAGED_MARKER, safeWriteManagedRuleFile, safeCleanupManagedFile, safeRemoveEmptyDir } from './base.js';

export class DeepSeekAdapter implements AgentAdapter {
  id = 'deepseek-hermes' as const;
  name = 'DeepSeek Harness & Hermes';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const configDir = path.join(knowledgeBasePath, '.deepseek');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const promptPath = path.join(configDir, 'system_prompt.md');
    const promptContent = `${MANAGED_MARKER}
# System Prompt for DeepSeek Harness / Hermes

You are an expert autonomous software engineer operating inside an AgentHub Knowledge Base.

### Context Optimization
1. Multiple projects live in \`projects/\`.
2. Do not scan whole repositories into context. Consult \`PROJECTS_MAP.md\` first.
3. Review \`HANDOFF.md\` if resuming an active workflow.
4. Active skills repository is located at \`skills/\`.
5. Secrets and credentials are isolated in AgentHub Vault. Do not attempt to access or mirror raw secrets.
`;

    safeWriteManagedRuleFile(promptPath, promptContent);
  }

  cleanup(knowledgeBasePath: string): void {
    const configDir = path.join(knowledgeBasePath, '.deepseek');
    const promptPath = path.join(configDir, 'system_prompt.md');

    safeCleanupManagedFile(promptPath);
    safeRemoveEmptyDir(configDir);
  }
}

