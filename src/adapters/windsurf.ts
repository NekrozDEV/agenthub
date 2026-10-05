import fs from 'fs';
import path from 'path';
import { AgentAdapter } from './base.js';
import { getAgentHubBinPath } from '../core/config.js';
import { GlobalSyncManager } from '../core/global-sync.js';

export class WindsurfAdapter implements AgentAdapter {
  id = 'windsurf' as const;
  name = 'Windsurf (Codeium)';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    // 1. .windsurfrules
    const rulesPath = path.join(knowledgeBasePath, '.windsurfrules');
    const content = `# Windsurf / Cascade Rules (AgentHub Managed)

## Workspace Architecture & Token Preservation
- Projects and repositories reside in \`projects/\`.
- **CRITICAL**: Before reading entire source directories, consult \`PROJECTS_MAP.md\` to preserve context window.
- **Cross-Agent Handoff**: If resuming work started by another agent, read \`HANDOFF.md\` for the active task and next steps.

## On-Demand Skills
- Specialized engineering playbooks are located in \`skills/\`:
${skills.map((s) => `  - \`skills/${s}\``).join('\n')}
- Load skills only when required by the user's task. Always follow \`skills/agenthub-guide.md\` for core directives.

## Security & Secrets (Zero-Leak)
- NEVER expose, print, or commit API tokens, passwords, or keys.
- Credentials are isolated in AgentHub Vault.
- If an environment variable is missing, inform the user to configure it via \`agenthub vault set <KEY> <VALUE>\`.

## MCP Integration
- Use the AgentHub MCP tools (\`agenthub_list_skills\`, \`agenthub_get_project_map\`, \`agenthub_get_handoff\`) for seamless repository navigation.
`;

    fs.writeFileSync(rulesPath, content, 'utf8');

    // 2. Local workspace MCP configuration (.codeium/windsurf/mcp_config.json)
    const codeiumDir = path.join(knowledgeBasePath, '.codeium', 'windsurf');
    if (!fs.existsSync(codeiumDir)) {
      fs.mkdirSync(codeiumDir, { recursive: true });
    }
    const mcpConfigPath = path.join(codeiumDir, 'mcp_config.json');
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
    const rulesPath = path.join(knowledgeBasePath, '.windsurfrules');
    if (fs.existsSync(rulesPath)) {
      fs.unlinkSync(rulesPath);
    }

    const mcpConfigPath = path.join(knowledgeBasePath, '.codeium', 'windsurf', 'mcp_config.json');
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
