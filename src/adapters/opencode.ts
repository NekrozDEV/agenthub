import fs from 'fs';
import path from 'path';
import { AgentAdapter, MANAGED_MARKER, hasAgentHubMarker, safeCleanupManagedFile, safeRemoveEmptyDir } from './base.js';

export class OpenCodeAdapter implements AgentAdapter {
  id = 'opencode' as const;
  name = 'OpenCode / OpenClaw';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    const dir = path.join(knowledgeBasePath, '.opencode');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const configPath = path.join(dir, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf8');
        if (!hasAgentHubMarker(raw)) {
          const bakPath = `${configPath}.bak`;
          if (!fs.existsSync(bakPath)) {
            try { fs.copyFileSync(configPath, bakPath); } catch {}
          }
        }
      } catch {}
    }

    const config = {
      _comment: MANAGED_MARKER,
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

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const dir = path.join(knowledgeBasePath, '.opencode');
    const configPath = path.join(dir, 'config.json');

    safeCleanupManagedFile(configPath);
    safeRemoveEmptyDir(dir);
  }
}

