import fs from 'fs';
import path from 'path';
import os from 'os';
import { setActiveKnowledgeBase, getAgentHubBinPath } from './config.js';
export class GlobalSyncManager {
    knowledgeBasePath;
    binPath;
    constructor(knowledgeBasePath) {
        this.knowledgeBasePath = path.resolve(knowledgeBasePath);
        this.binPath = getAgentHubBinPath();
    }
    getAppDataDir() {
        if (process.platform === 'win32') {
            return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        }
        if (process.platform === 'darwin') {
            return path.join(os.homedir(), 'Library', 'Application Support');
        }
        return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    }
    /**
     * Safely parses JSON text, stripping single-line comments, block comments, and trailing commas (JSONC support)
     */
    static parseJsonc(text) {
        let clean = '';
        let inString = false;
        let quoteChar = '';
        let escape = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];
            if (inString) {
                clean += ch;
                if (escape) {
                    escape = false;
                }
                else if (ch === '\\') {
                    escape = true;
                }
                else if (ch === quoteChar) {
                    inString = false;
                }
            }
            else {
                if (ch === '"' || ch === "'") {
                    inString = true;
                    quoteChar = ch;
                    clean += ch;
                }
                else if (ch === '/' && next === '/') {
                    while (i < text.length && text[i] !== '\n') {
                        i++;
                    }
                    clean += '\n';
                }
                else if (ch === '/' && next === '*') {
                    i += 2;
                    while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) {
                        i++;
                    }
                    i++;
                }
                else {
                    clean += ch;
                }
            }
        }
        clean = clean.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(clean);
    }
    safeReadJson(filePath) {
        if (!fs.existsSync(filePath))
            return { data: null };
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            if (!raw.trim())
                return { data: {} };
            return { data: GlobalSyncManager.parseJsonc(raw) };
        }
        catch {
            return { data: null, parseError: true };
        }
    }
    safeWriteJson(filePath, data) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    /**
     * Sync Claude Code CLI global configuration (~/.claude.json)
     */
    syncClaudeCode() {
        const configPath = path.join(os.homedir(), '.claude.json');
        const target = {
            name: 'Claude Code (CLI ~/.claude.json)',
            path: configPath,
            configured: false,
            details: '',
        };
        try {
            const { data, parseError } = this.safeReadJson(configPath);
            if (parseError) {
                target.details = 'Skipped: Failed to safely parse ~/.claude.json (original file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
            };
            this.safeWriteJson(configPath, conf);
            target.configured = true;
            target.details = 'Registered AgentHub MCP server in ~/.claude.json';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Claude Desktop configuration
     */
    syncClaudeDesktop() {
        const configPath = path.join(this.getAppDataDir(), 'Claude', 'claude_desktop_config.json');
        const target = {
            name: 'Claude Desktop',
            path: configPath,
            configured: false,
            details: '',
        };
        try {
            const { data, parseError } = this.safeReadJson(configPath);
            if (parseError) {
                target.details = 'Skipped: Failed to safely parse claude_desktop_config.json (file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
            };
            this.safeWriteJson(configPath, conf);
            target.configured = true;
            target.details = 'Registered AgentHub MCP server in claude_desktop_config.json';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Windsurf (Codeium) global configuration
     */
    syncWindsurf() {
        const mcpConfigPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
        const rulesPath = path.join(os.homedir(), '.codeium', 'windsurf', 'memories', 'global_rules.md');
        const target = {
            name: 'Windsurf (Codeium)',
            path: mcpConfigPath,
            configured: false,
            details: '',
        };
        try {
            // 1. MCP server registration
            const { data, parseError } = this.safeReadJson(mcpConfigPath);
            if (parseError) {
                target.details = 'Skipped: Failed to parse mcp_config.json (file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
            };
            this.safeWriteJson(mcpConfigPath, conf);
            // 2. Global rules injection
            const rulesDir = path.dirname(rulesPath);
            if (!fs.existsSync(rulesDir)) {
                fs.mkdirSync(rulesDir, { recursive: true });
            }
            const agenthubRule = `\n# AgentHub Global Knowledge Base\n- Active Knowledge Base: \`${this.knowledgeBasePath}\`\n- Use AgentHub MCP tools (\`agenthub_list_skills\`, \`agenthub_get_project_map\`, \`agenthub_get_handoff\`) for skills, project architecture, and cross-agent task continuity.\n- Secret Vault: Credentials are kept in AgentHub Vault. Never hardcode or leak secrets.\n`;
            if (!fs.existsSync(rulesPath)) {
                fs.writeFileSync(rulesPath, `# Windsurf Global Memories\n${agenthubRule}`, 'utf8');
            }
            else {
                const existing = fs.readFileSync(rulesPath, 'utf8');
                if (!existing.includes('AgentHub Global Knowledge Base')) {
                    fs.appendFileSync(rulesPath, agenthubRule, 'utf8');
                }
            }
            target.configured = true;
            target.details = 'Registered MCP server & updated global_rules.md in ~/.codeium/windsurf/';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Cline (VS Code extension) global MCP settings
     */
    syncCline() {
        const configPath = path.join(this.getAppDataDir(), 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
        const target = {
            name: 'Cline (VS Code)',
            path: configPath,
            configured: false,
            details: '',
        };
        try {
            const { data, parseError } = this.safeReadJson(configPath);
            if (parseError) {
                target.details = 'Skipped: Failed to parse cline_mcp_settings.json (file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
                disabled: false,
                autoApprove: [
                    'agenthub_list_skills',
                    'agenthub_get_skill',
                    'agenthub_get_project_map',
                    'agenthub_get_handoff',
                ],
            };
            this.safeWriteJson(configPath, conf);
            target.configured = true;
            target.details = 'Registered AgentHub MCP in cline_mcp_settings.json';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Roo Code (VS Code extension) global MCP settings
     */
    syncRooCode() {
        const configPath = path.join(this.getAppDataDir(), 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
        const target = {
            name: 'Roo Code (VS Code)',
            path: configPath,
            configured: false,
            details: '',
        };
        try {
            const { data, parseError } = this.safeReadJson(configPath);
            if (parseError) {
                target.details = 'Skipped: Failed to parse Roo Code settings (file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
                disabled: false,
                autoApprove: [
                    'agenthub_list_skills',
                    'agenthub_get_skill',
                    'agenthub_get_project_map',
                    'agenthub_get_handoff',
                ],
            };
            this.safeWriteJson(configPath, conf);
            target.configured = true;
            target.details = 'Registered AgentHub MCP in Roo Code global storage';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Cursor AI global MCP settings
     */
    syncCursor() {
        const configPath = path.join(os.homedir(), '.cursor', 'mcp.json');
        const target = {
            name: 'Cursor AI',
            path: configPath,
            configured: false,
            details: '',
        };
        try {
            const { data, parseError } = this.safeReadJson(configPath);
            if (parseError) {
                target.details = 'Skipped: Failed to parse ~/.cursor/mcp.json (file preserved)';
                return target;
            }
            let conf = data || {};
            if (!conf.mcpServers)
                conf.mcpServers = {};
            conf.mcpServers.agenthub = {
                command: process.execPath,
                args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
            };
            this.safeWriteJson(configPath, conf);
            target.configured = true;
            target.details = 'Registered AgentHub MCP in ~/.cursor/mcp.json';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Continue.dev global config
     */
    syncContinue() {
        const continueDir = path.join(os.homedir(), '.continue');
        const configYamlPath = path.join(continueDir, 'config.yaml');
        const configJsonPath = path.join(continueDir, 'config.json');
        const target = {
            name: 'Continue.dev',
            path: fs.existsSync(configJsonPath) ? configJsonPath : configYamlPath,
            configured: false,
            details: '',
        };
        try {
            if (!fs.existsSync(continueDir)) {
                fs.mkdirSync(continueDir, { recursive: true });
            }
            if (fs.existsSync(configJsonPath)) {
                const { data, parseError } = this.safeReadJson(configJsonPath);
                if (parseError) {
                    target.details = 'Skipped: Failed to parse ~/.continue/config.json (file preserved)';
                    return target;
                }
                let conf = data || {};
                if (!conf.mcpServers)
                    conf.mcpServers = [];
                const existingIdx = conf.mcpServers.findIndex((s) => s.name === 'agenthub');
                const entry = {
                    name: 'agenthub',
                    command: process.execPath,
                    args: [this.binPath, 'serve-mcp', '--kb', this.knowledgeBasePath],
                };
                if (existingIdx !== -1) {
                    conf.mcpServers[existingIdx] = entry;
                }
                else {
                    conf.mcpServers.push(entry);
                }
                this.safeWriteJson(configJsonPath, conf);
                target.configured = true;
                target.details = 'Registered AgentHub MCP server in ~/.continue/config.json';
            }
            else {
                const agenthubYamlBlock = `  - name: agenthub\n    command: "${process.execPath.replace(/\\/g, '/')}"\n    args:\n      - "${this.binPath.replace(/\\/g, '/')}"\n      - "serve-mcp"\n      - "--kb"\n      - "${this.knowledgeBasePath.replace(/\\/g, '/')}"`;
                if (!fs.existsSync(configYamlPath)) {
                    fs.writeFileSync(configYamlPath, `# Continue.dev Configuration\nmcpServers:\n${agenthubYamlBlock}\n`, 'utf8');
                }
                else {
                    const content = fs.readFileSync(configYamlPath, 'utf8');
                    if (!content.includes('name: agenthub')) {
                        if (/mcpServers:\s*$/m.test(content) || /mcpServers:\s*\n/m.test(content)) {
                            const updated = content.replace(/(mcpServers:\s*\n)/, `$1${agenthubYamlBlock}\n`);
                            fs.writeFileSync(configYamlPath, updated, 'utf8');
                        }
                        else {
                            fs.appendFileSync(configYamlPath, `\n# AgentHub MCP Integration\nmcpServers:\n${agenthubYamlBlock}\n`, 'utf8');
                        }
                    }
                }
                target.configured = true;
                target.details = 'Registered AgentHub MCP server in ~/.continue/config.yaml';
            }
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync Antigravity (Gemini) global rules and native skill
     */
    syncAntigravity() {
        const antigravityDir = path.join(os.homedir(), '.gemini', 'antigravity');
        const rulesPath = path.join(antigravityDir, 'agenthub_rules.md');
        const target = {
            name: 'Google Antigravity',
            path: rulesPath,
            configured: false,
            details: '',
        };
        try {
            if (!fs.existsSync(antigravityDir)) {
                fs.mkdirSync(antigravityDir, { recursive: true });
            }
            // 1. Write agenthub_rules.md in antigravity dir
            const content = `# Antigravity AgentHub Global Integration
- Active Knowledge Base: \`${this.knowledgeBasePath}\`
- High-level project structure: \`${path.join(this.knowledgeBasePath, 'PROJECTS_MAP.md')}\`
- Cross-agent session continuity: \`${path.join(this.knowledgeBasePath, 'HANDOFF.md')}\`
- Vault security: All secrets isolated in AgentHub Vault (\`${path.join(this.knowledgeBasePath, '.hub', 'vault.env')}\`).
- Skills directory: \`${path.join(this.knowledgeBasePath, 'skills')}\`
`;
            fs.writeFileSync(rulesPath, content, 'utf8');
            // 2. Pre-install native skill for Antigravity/Gemini in ~/.gemini/config/skills/agenthub/SKILL.md
            const geminiSkillsDir = path.join(os.homedir(), '.gemini', 'config', 'skills', 'agenthub');
            if (!fs.existsSync(geminiSkillsDir)) {
                fs.mkdirSync(geminiSkillsDir, { recursive: true });
            }
            const skillPath = path.join(geminiSkillsDir, 'SKILL.md');
            const skillContent = `---
name: agenthub
description: Universal Knowledge Base, Zero-Leak Security Vault, and Cross-Agent Session Continuity (PROJECTS_MAP.md, HANDOFF.md, Vault, skills).
---

# AgentHub Global Knowledge Base & Security Vault

You are connected to an AgentHub Knowledge Base at \`${this.knowledgeBasePath}\`.

## Available Resources & Workflows
- **Project Map**: \`${path.join(this.knowledgeBasePath, 'PROJECTS_MAP.md')}\` — inspect first before large directory explorations.
- **Cross-Agent Handoff**: \`${path.join(this.knowledgeBasePath, 'HANDOFF.md')}\` — read for active task continuity across different AI systems.
- **Skills Directory**: \`${path.join(this.knowledgeBasePath, 'skills')}\` — on-demand engineering playbooks.
- **Meta-Skill Guide**: \`${path.join(this.knowledgeBasePath, 'skills', 'agenthub-guide.md')}\`.
- **Zero-Leak Vault**: Secrets reside in AgentHub Vault (\`${path.join(this.knowledgeBasePath, '.hub', 'vault.env')}\`). Never leak raw tokens.

## Tools & Commands
- Start MCP Server: \`agenthub serve-mcp --kb "${this.knowledgeBasePath}"\`
- Audit secrets: \`agenthub audit\`
- Handoff task: \`agenthub handoff create -t "<task>" -s "<summary>"\`
`;
            fs.writeFileSync(skillPath, skillContent, 'utf8');
            target.configured = true;
            target.details = 'Updated agenthub_rules.md & installed native skill in ~/.gemini/config/skills/agenthub/';
        }
        catch (err) {
            target.details = `Failed: ${err.message}`;
        }
        return target;
    }
    /**
     * Sync all global IDE environments
     */
    syncAll(filterAgents) {
        setActiveKnowledgeBase(this.knowledgeBasePath);
        const targets = [];
        const shouldSync = (agentKey) => {
            if (!filterAgents || filterAgents.length === 0)
                return true;
            return filterAgents.includes(agentKey);
        };
        if (shouldSync('claude-code')) {
            targets.push(this.syncClaudeDesktop());
            targets.push(this.syncClaudeCode());
        }
        if (shouldSync('windsurf')) {
            targets.push(this.syncWindsurf());
        }
        if (shouldSync('cline')) {
            targets.push(this.syncCline());
        }
        if (shouldSync('roo-code')) {
            targets.push(this.syncRooCode());
        }
        if (shouldSync('cursor')) {
            targets.push(this.syncCursor());
        }
        if (shouldSync('continue')) {
            targets.push(this.syncContinue());
        }
        if (shouldSync('antigravity')) {
            targets.push(this.syncAntigravity());
        }
        return {
            activeKnowledgeBase: this.knowledgeBasePath,
            targets,
        };
    }
}
