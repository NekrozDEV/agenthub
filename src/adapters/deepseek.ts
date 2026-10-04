import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class DeepSeekAdapter implements AgentAdapter {
  id = 'deepseek-hermes' as const;
  name = 'DeepSeek Harness & Hermes';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const configDir = path.join(knowledgeBasePath, '.deepseek');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const promptPath = path.join(configDir, 'system_prompt.md');
    const promptContent = `# System Prompt for DeepSeek Harness / Hermes (AgentHub Managed)

You are an expert autonomous software engineer operating inside an AgentHub Knowledge Base.

### Context Optimization
1. Multiple projects live in \`projects/\`.
2. Do not scan whole repositories into context. Consult \`PROJECTS_MAP.md\` first.
3. Review \`HANDOFF.md\` if resuming an active workflow.
4. Active skills repository is located at \`skills/\`.
5. Secrets and credentials are isolated in AgentHub Vault. Do not attempt to access or mirror raw secrets.
`;

    fs.writeFileSync(promptPath, promptContent, 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const configDir = path.join(knowledgeBasePath, '.deepseek');
    if (fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  }
}
