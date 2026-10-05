import fs from 'fs';
import path from 'path';
import { AgentAdapter, MANAGED_MARKER, safeWriteManagedRuleFile, safeCleanupManagedFile, safeCleanupIgnoreFile, safeRemoveEmptyDir } from './base.js';
import { getAgentHubBinPath } from '../core/config.js';
import { GlobalSyncManager } from '../core/global-sync.js';
import { SecretVault } from '../core/vault.js';

export class ZCodeAdapter implements AgentAdapter {
  id = 'zcode' as const;
  name = 'ZCode (z.ai)';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    // 1. .zcoderules and AGENTS.md
    const zcodeRulesPath = path.join(knowledgeBasePath, '.zcoderules');
    const content = `${MANAGED_MARKER}
# ZCode Rules

- Workspaces are situated under \`projects/\`.
- Check \`PROJECTS_MAP.md\` to preserve context window.
- Consult \`HANDOFF.md\` for session handoffs from other agents.
- Follow \`skills/agenthub-guide.md\` and other active skills in \`skills/\`.
- Strictly adhere to zero-secrets policy. Credentials are stored in AgentHub Vault.
`;
    safeWriteManagedRuleFile(zcodeRulesPath, content);

    const agentsMdPath = path.join(knowledgeBasePath, 'AGENTS.md');
    if (!fs.existsSync(agentsMdPath)) {
      safeWriteManagedRuleFile(agentsMdPath, content);
    }

    // 2. .zcodeignore
    SecretVault.ensureIgnoreFile(knowledgeBasePath, '.zcodeignore');

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
      const bakPath = `${mcpConfigPath}.bak`;
      if (!fs.existsSync(bakPath)) {
        try { fs.copyFileSync(mcpConfigPath, bakPath); } catch {}
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
    safeCleanupManagedFile(zcodeRulesPath);

    const agentsMdPath = path.join(knowledgeBasePath, 'AGENTS.md');
    safeCleanupManagedFile(agentsMdPath);

    const zcodeIgnorePath = path.join(knowledgeBasePath, '.zcodeignore');
    safeCleanupIgnoreFile(zcodeIgnorePath);

    const zcodeDir = path.join(knowledgeBasePath, '.zcode');
    const mcpConfigPath = path.join(zcodeDir, 'mcp.json');
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const raw = fs.readFileSync(mcpConfigPath, 'utf8');
        const conf = GlobalSyncManager.parseJsonc(raw);
        if (conf?.mcpServers?.agenthub) {
          delete conf.mcpServers.agenthub;
          if (Object.keys(conf.mcpServers).length === 0 && Object.keys(conf).length === 1) {
            const bakPath = `${mcpConfigPath}.bak`;
            if (!fs.existsSync(bakPath)) {
              try { fs.copyFileSync(mcpConfigPath, bakPath); } catch {}
            }
            fs.unlinkSync(mcpConfigPath);
          } else {
            fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
          }
        }
      } catch {
        // Safe ignore
      }
    }

    safeRemoveEmptyDir(zcodeDir);
  }
}

