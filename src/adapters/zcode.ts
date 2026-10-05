import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';
import { getAgentHubBinPath } from '../core/config.js';
import { GlobalSyncManager } from '../core/global-sync.js';

export class ZCodeAdapter implements AgentAdapter {
  id = 'zcode' as const;
  name = 'ZCode (z.ai)';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    // 1. .zcoderules and AGENTS.md
    const zcodeRulesPath = path.join(knowledgeBasePath, '.zcoderules');
    const content = `# ZCode Rules - AgentHub Managed

- Workspaces are situated under \`projects/\`.
- Check \`PROJECTS_MAP.md\` to preserve context window.
- Consult \`HANDOFF.md\` for session handoffs from other agents.
- Follow \`skills/agenthub-guide.md\` and other active skills in \`skills/\`.
- Strictly adhere to zero-secrets policy. Credentials are stored in AgentHub Vault.
`;
    fs.writeFileSync(zcodeRulesPath, content, 'utf8');

    const agentsMdPath = path.join(knowledgeBasePath, 'AGENTS.md');
    if (!fs.existsSync(agentsMdPath)) {
      fs.writeFileSync(agentsMdPath, content, 'utf8');
    }

    // 2. .zcodeignore
    const zcodeIgnorePath = path.join(knowledgeBasePath, '.zcodeignore');
    const ignoreEntries = [
      '# AgentHub Vault Isolation',
      '.hub/',
      '*.env*',
      '.env*',
      '*.bak',
    ];

    if (!fs.existsSync(zcodeIgnorePath)) {
      fs.writeFileSync(zcodeIgnorePath, ignoreEntries.join('\n') + '\n', 'utf8');
    } else {
      const existing = fs.readFileSync(zcodeIgnorePath, 'utf8');
      const existingLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
      const toAdd: string[] = [];
      for (const entry of ignoreEntries) {
        if (!entry.startsWith('#') && !existingLines.has(entry)) {
          toAdd.push(entry);
        }
      }
      if (toAdd.length > 0) {
        const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
        fs.appendFileSync(zcodeIgnorePath, prefix + '# AgentHub Vault Isolation\n' + toAdd.join('\n') + '\n', 'utf8');
      }
    }

    // 3. .zcode/mcp.json (Safe merge with real executable path)
    const zcodeDir = path.join(knowledgeBasePath, '.zcode');
    if (!fs.existsSync(zcodeDir)) {
      fs.mkdirSync(zcodeDir, { recursive: true });
    }
    const mcpConfigPath = path.join(zcodeDir, 'mcp.json');
    const binPath = getAgentHubBinPath();

    let conf: any = { mcpServers: {} };
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const raw = fs.readFileSync(mcpConfigPath, 'utf8');
        if (raw.trim()) {
          conf = GlobalSyncManager.parseJsonc(raw) || { mcpServers: {} };
        }
      } catch {
        conf = { mcpServers: {} };
      }
    }
    if (!conf.mcpServers) conf.mcpServers = {};

    conf.mcpServers.agenthub = {
      command: process.execPath,
      args: [binPath, 'serve-mcp', '--kb', knowledgeBasePath],
    };

    fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
  }

  cleanup(knowledgeBasePath: string): void {
    const zcodeRulesPath = path.join(knowledgeBasePath, '.zcoderules');
    if (fs.existsSync(zcodeRulesPath)) {
      fs.unlinkSync(zcodeRulesPath);
    }

    const zcodeIgnorePath = path.join(knowledgeBasePath, '.zcodeignore');
    if (fs.existsSync(zcodeIgnorePath)) {
      fs.unlinkSync(zcodeIgnorePath);
    }

    const mcpConfigPath = path.join(knowledgeBasePath, '.zcode', 'mcp.json');
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const raw = fs.readFileSync(mcpConfigPath, 'utf8');
        const conf = GlobalSyncManager.parseJsonc(raw);
        if (conf?.mcpServers?.agenthub) {
          delete conf.mcpServers.agenthub;
          if (Object.keys(conf.mcpServers).length === 0) {
            fs.unlinkSync(mcpConfigPath);
          } else {
            fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
          }
        }
      } catch {
        // Safe ignore
      }
    }
  }
}
