import fs from 'fs';
import path from 'path';
import { getAgentHubBinPath } from '../core/config.js';
import { GlobalSyncManager } from '../core/global-sync.js';
export class CursorAdapter {
    id = 'cursor';
    name = 'Cursor AI';
    generateConfig(knowledgeBasePath, skills, mcps) {
        // 1. .cursorrules
        const cursorRulesPath = path.join(knowledgeBasePath, '.cursorrules');
        const content = `# Cursor Rules - AgentHub Managed

- Workspaces are situated under \`projects/\`.
- Check \`PROJECTS_MAP.md\` to preserve context window.
- Consult \`HANDOFF.md\` for session handoffs from other agents.
- Follow \`skills/agenthub-guide.md\` and other active skills in \`skills/\`.
- Strictly adhere to zero-secrets policy. Credentials are stored in AgentHub Vault.
`;
        fs.writeFileSync(cursorRulesPath, content, 'utf8');
        // 2. .cursor/mcp.json (Safe merge with real executable path)
        const cursorDir = path.join(knowledgeBasePath, '.cursor');
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
        }
        const mcpConfigPath = path.join(cursorDir, 'mcp.json');
        const binPath = getAgentHubBinPath();
        let conf = { mcpServers: {} };
        if (fs.existsSync(mcpConfigPath)) {
            try {
                const raw = fs.readFileSync(mcpConfigPath, 'utf8');
                if (raw.trim()) {
                    conf = GlobalSyncManager.parseJsonc(raw) || { mcpServers: {} };
                }
            }
            catch {
                conf = { mcpServers: {} };
            }
        }
        if (!conf.mcpServers)
            conf.mcpServers = {};
        conf.mcpServers.agenthub = {
            command: process.execPath,
            args: [binPath, 'serve-mcp', '--kb', knowledgeBasePath],
        };
        fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
    }
    cleanup(knowledgeBasePath) {
        const cursorRulesPath = path.join(knowledgeBasePath, '.cursorrules');
        if (fs.existsSync(cursorRulesPath)) {
            fs.unlinkSync(cursorRulesPath);
        }
        const mcpConfigPath = path.join(knowledgeBasePath, '.cursor', 'mcp.json');
        if (fs.existsSync(mcpConfigPath)) {
            try {
                const raw = fs.readFileSync(mcpConfigPath, 'utf8');
                const conf = GlobalSyncManager.parseJsonc(raw);
                if (conf?.mcpServers?.agenthub) {
                    delete conf.mcpServers.agenthub;
                    if (Object.keys(conf.mcpServers).length === 0) {
                        fs.unlinkSync(mcpConfigPath);
                    }
                    else {
                        fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
                    }
                }
            }
            catch {
                // Safe ignore
            }
        }
    }
}
