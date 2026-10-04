import fs from 'fs';
import path from 'path';
import { getAgentHubBinPath } from '../core/config.js';
import { GlobalSyncManager } from '../core/global-sync.js';
export class ClineAdapter {
    id = 'cline';
    name = 'Cline (VS Code)';
    generateConfig(knowledgeBasePath, skills, mcps) {
        // 1. .clinerules
        const clineRulesPath = path.join(knowledgeBasePath, '.clinerules');
        const content = `# Cline Custom Instructions (AgentHub Managed)

## Context & Workspace Navigation
- Repositories are located inside \`projects/\`.
- Check \`PROJECTS_MAP.md\` first to inspect project boundaries without blowing your context window.
- If resuming an ongoing task from another AI, read \`HANDOFF.md\` for the latest checkpoint.

## Skills & Operating Rules
- Follow \`skills/agenthub-guide.md\` as your primary meta-operating guide.
- Check \`skills/\` for specialized playbooks (${skills.map((s) => `\`${s}\``).join(', ')}). Load them only when relevant.

## Security & Secrets
- Never print or commit credentials. Sensitive keys reside in AgentHub Vault (\`.hub/vault.env\`).
- Run or recommend \`agenthub audit\` before committing changes.
`;
        fs.writeFileSync(clineRulesPath, content, 'utf8');
        // 2. Local workspace MCP configuration (.vscode/cline_mcp_settings.json)
        const vscodeDir = path.join(knowledgeBasePath, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        const mcpConfigPath = path.join(vscodeDir, 'cline_mcp_settings.json');
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
            disabled: false,
            autoApprove: [
                'agenthub_list_skills',
                'agenthub_get_skill',
                'agenthub_get_project_map',
                'agenthub_get_handoff',
            ],
        };
        fs.writeFileSync(mcpConfigPath, JSON.stringify(conf, null, 2), 'utf8');
    }
    cleanup(knowledgeBasePath) {
        const clineRulesPath = path.join(knowledgeBasePath, '.clinerules');
        if (fs.existsSync(clineRulesPath)) {
            fs.unlinkSync(clineRulesPath);
        }
        const mcpConfigPath = path.join(knowledgeBasePath, '.vscode', 'cline_mcp_settings.json');
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
