import path from 'path';
import fs from 'fs';

export type SupportedAgent =
  | 'antigravity'
  | 'claude-code'
  | 'deepseek-hermes'
  | 'opencode'
  | 'cursor'
  | 'codex';

export interface HubConfig {
  version: string;
  knowledgeBasePath: string;
  enabledAgents: SupportedAgent[];
  settings: {
    leakGuardAutoScan: boolean;
    repoMapAutoUpdate: boolean;
    tokenBudgetPerProject: number; // max tokens for project summary
  };
}

export const AGENT_INFO: Record<SupportedAgent, { name: string; description: string; configFile: string }> = {
  antigravity: {
    name: 'Antigravity (Google)',
    description: 'Skills (.gemini/antigravity), Rules & MCP integrations',
    configFile: '.gemini/antigravity/mcp',
  },
  'claude-code': {
    name: 'Claude Code (Anthropic)',
    description: 'CLAUDE.md guidelines, tools config & slash commands',
    configFile: 'CLAUDE.md / .claude/config.json',
  },
  'deepseek-hermes': {
    name: 'DeepSeek Harness & Hermes',
    description: 'Local and cloud agent prompts & function calling schemas',
    configFile: 'agent-config.json / prompts',
  },
  opencode: {
    name: 'OpenCode / OpenClaw',
    description: 'Open-source autonomous developer agents',
    configFile: '.opencode/config.json',
  },
  cursor: {
    name: 'Cursor AI',
    description: '.cursorrules and mcp.json integrations',
    configFile: '.cursorrules / .cursor/mcp.json',
  },
  codex: {
    name: 'OpenAI Codex / CLI',
    description: 'OpenAI custom agent instructions and tool schemas',
    configFile: 'AGENTS.md / tools.json',
  },
};

export const DEFAULT_CONFIG: HubConfig = {
  version: '0.1.0',
  knowledgeBasePath: '',
  enabledAgents: ['antigravity', 'deepseek-hermes', 'opencode'],
  settings: {
    leakGuardAutoScan: true,
    repoMapAutoUpdate: true,
    tokenBudgetPerProject: 800,
  },
};

export function getHubConfigPath(basePath: string): string {
  return path.join(basePath, '.hub', 'config.json');
}

export function getVaultPath(basePath: string): string {
  return path.join(basePath, '.hub', 'vault.env');
}

export function loadConfig(basePath: string): HubConfig | null {
  const configPath = getHubConfigPath(basePath);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConfig(basePath: string, config: HubConfig): void {
  const hubDir = path.join(basePath, '.hub');
  if (!fs.existsSync(hubDir)) {
    fs.mkdirSync(hubDir, { recursive: true });
  }
  fs.writeFileSync(getHubConfigPath(basePath), JSON.stringify(config, null, 2), 'utf8');
}
