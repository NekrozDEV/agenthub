import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';

export class OpenCodeAdapter implements AgentAdapter {
  id = 'opencode' as const;
  name = 'OpenCode / OpenClaw';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const dir = path.join(knowledgeBasePath, '.opencode');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const config = {
      version: '1.0',
      workspaceRoot: './projects',
      rulesFile: '../PROJECTS_MAP.md',
      skillsDirectory: '../skills',
      handoffFile: '../HANDOFF.md',
      security: {
        secretsIsolated: true,
        vaultActive: true,
      },
    };

    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const dir = path.join(knowledgeBasePath, '.opencode');
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}
