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
    let userConf: any = null;
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf8');
        if (!hasAgentHubMarker(raw)) {
          const bakPath = `${configPath}.bak`;
          if (!fs.existsSync(bakPath)) {
            try { fs.copyFileSync(configPath, bakPath); } catch {}
          }
        }
        userConf = JSON.parse(raw);
      } catch {}
    }

    const config = {
      _comment: MANAGED_MARKER,
      ...(userConf || {}),
      version: '1.0',
      workspaceRoot: './projects',
      rulesFile: '../PROJECTS_MAP.md',
      skillsDirectory: '../skills',
      handoffFile: '../HANDOFF.md',
      security: {
        secretsIsolated: true,
        vaultActive: true,
        ...((userConf && userConf.security) || {}),
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const dir = path.join(knowledgeBasePath, '.opencode');
    const configPath = path.join(dir, 'config.json');

    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf8');
        if (hasAgentHubMarker(raw)) {
          const parsed = JSON.parse(raw);
          const managedKeys = new Set(['_comment', 'version', 'workspaceRoot', 'rulesFile', 'skillsDirectory', 'handoffFile', 'security']);
          const userKeys = Object.keys(parsed).filter((k) => !managedKeys.has(k));
          if (userKeys.length > 0) {
            const bakPath = `${configPath}.bak`;
            if (!fs.existsSync(bakPath)) {
              try { fs.copyFileSync(configPath, bakPath); } catch {}
            }
            delete parsed._comment;
            delete parsed.workspaceRoot;
            delete parsed.rulesFile;
            delete parsed.skillsDirectory;
            delete parsed.handoffFile;
            delete parsed.security;
            fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');
            return;
          }
        }
      } catch {}
    }

    safeCleanupManagedFile(configPath);
    safeRemoveEmptyDir(dir);
  }
}

