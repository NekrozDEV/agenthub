import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

export type SupportedAgent =
  | 'antigravity'
  | 'claude-code'
  | 'deepseek-hermes'
  | 'opencode'
  | 'cursor'
  | 'codex'
  | 'windsurf'
  | 'cline'
  | 'roo-code'
  | 'continue'
  | 'copilot';

export type SupportedLanguage = 'en' | 'ru';

export interface HubConfig {
  version: string;
  language?: SupportedLanguage;
  knowledgeBasePath: string;
  enabledAgents: SupportedAgent[];
  settings: {
    leakGuardAutoScan: boolean;
    repoMapAutoUpdate: boolean;
    tokenBudgetPerProject: number; // max tokens for project summary
  };
}

export interface GlobalConfig {
  language?: SupportedLanguage;
  activeKnowledgeBase?: string;
  knownKnowledgeBases: string[];
  lastSynced?: string;
  autoUpdate?: boolean | 'prompt' | 'auto' | 'off';
}

export const AGENT_INFO: Record<SupportedAgent, { name: string; description: string; configFile: string }> = {
  antigravity: {
    name: 'Antigravity (Google)',
    description: 'Skills (.gemini/antigravity), Rules & MCP integrations',
    configFile: '.gemini/rules.md',
  },
  'claude-code': {
    name: 'Claude Code (Anthropic)',
    description: 'CLAUDE.md guidelines, tools config & Claude Desktop MCP',
    configFile: 'CLAUDE.md / .claude.json',
  },
  'deepseek-hermes': {
    name: 'DeepSeek Harness & Hermes',
    description: 'Local and cloud agent prompts & function calling schemas',
    configFile: '.deepseek/system_prompt.md',
  },
  opencode: {
    name: 'OpenCode / OpenClaw',
    description: 'Open-source autonomous developer agents',
    configFile: '.opencode/config.json',
  },
  cursor: {
    name: 'Cursor AI',
    description: '.cursorrules and .cursor/mcp.json integrations',
    configFile: '.cursorrules / .cursor/mcp.json',
  },
  codex: {
    name: 'OpenAI Codex / CLI',
    description: 'OpenAI custom agent instructions and tool schemas',
    configFile: 'AGENTS.md / tools.json',
  },
  windsurf: {
    name: 'Windsurf (Codeium)',
    description: '.windsurfrules & ~/.codeium/windsurf/mcp_config.json',
    configFile: '.windsurfrules / mcp_config.json',
  },
  cline: {
    name: 'Cline (VS Code)',
    description: '.clinerules & VSCode cline_mcp_settings.json',
    configFile: '.clinerules / cline_mcp_settings.json',
  },
  'roo-code': {
    name: 'Roo Code (VS Code)',
    description: '.roomodes, .clinerules & Roo Code MCP settings',
    configFile: '.roomodes / cline_mcp_settings.json',
  },
  continue: {
    name: 'Continue.dev',
    description: 'config.yaml, slash commands & MCP integrations',
    configFile: '.continue/config.yaml',
  },
  copilot: {
    name: 'GitHub Copilot',
    description: 'Custom repository instructions & agent guidelines',
    configFile: '.github/copilot-instructions.md',
  },
};

export const DEFAULT_CONFIG: HubConfig = {
  version: '0.1.0',
  language: 'en',
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
  setActiveKnowledgeBase(basePath);
  if (config.language) {
    const globalConf = loadGlobalConfig();
    globalConf.language = config.language;
    saveGlobalConfig(globalConf);
  }
}

// Global registry helpers (enables running agents anywhere)
export function getGlobalConfigDir(): string {
  return path.join(os.homedir(), '.agenthub');
}

export function getGlobalConfigFile(): string {
  return path.join(getGlobalConfigDir(), 'config.json');
}

export function loadGlobalConfig(): GlobalConfig {
  const file = getGlobalConfigFile();
  if (!fs.existsSync(file)) {
    return { knownKnowledgeBases: [] };
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { knownKnowledgeBases: [] };
  }
}

export function saveGlobalConfig(config: GlobalConfig): void {
  const dir = getGlobalConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getGlobalConfigFile(), JSON.stringify(config, null, 2), 'utf8');
}

export function setActiveKnowledgeBase(kbPath: string): void {
  const resolved = path.resolve(kbPath);
  const globalConf = loadGlobalConfig();
  globalConf.activeKnowledgeBase = resolved;
  if (!globalConf.knownKnowledgeBases) {
    globalConf.knownKnowledgeBases = [];
  }
  if (!globalConf.knownKnowledgeBases.includes(resolved)) {
    globalConf.knownKnowledgeBases.push(resolved);
  }
  globalConf.lastSynced = new Date().toISOString();
  saveGlobalConfig(globalConf);
}

export function getActiveGlobalKnowledgeBase(): string | null {
  const conf = loadGlobalConfig();
  if (conf.activeKnowledgeBase && fs.existsSync(conf.activeKnowledgeBase)) {
    return conf.activeKnowledgeBase;
  }
  if (conf.knownKnowledgeBases && conf.knownKnowledgeBases.length > 0) {
    for (const p of conf.knownKnowledgeBases) {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

export interface KnowledgeBaseInfo {
  path: string;
  name: string;
  exists: boolean;
  isActive: boolean;
  enabledAgents: SupportedAgent[];
  skillsCount: number;
  mcpsCount: number;
}

export function listAllKnowledgeBases(): KnowledgeBaseInfo[] {
  const globalConf = loadGlobalConfig();
  const activePath = globalConf.activeKnowledgeBase ? path.resolve(globalConf.activeKnowledgeBase) : null;
  const list: KnowledgeBaseInfo[] = [];

  const rawPaths = [...(globalConf.knownKnowledgeBases || [])];
  if (activePath && !rawPaths.includes(activePath)) {
    rawPaths.unshift(activePath);
  }

  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, '.hub', 'config.json')) && !rawPaths.includes(cwd)) {
    rawPaths.push(cwd);
  }

  const seen = new Set<string>();
  for (const raw of rawPaths) {
    const resolved = path.resolve(raw);
    if (seen.has(resolved)) continue;
    seen.add(resolved);

    const exists = fs.existsSync(resolved) && fs.existsSync(path.join(resolved, '.hub', 'config.json'));
    const config = exists ? loadConfig(resolved) : null;

    let skillsCount = 0;
    let mcpsCount = 0;
    if (exists) {
      const skillsDir = path.join(resolved, 'skills');
      if (fs.existsSync(skillsDir)) {
        skillsCount = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md')).length;
      }
      const mcpDir = path.join(resolved, 'mcp');
      if (fs.existsSync(mcpDir)) {
        mcpsCount = fs.readdirSync(mcpDir).filter((f) => f.endsWith('.json')).length;
      }
    }

    list.push({
      path: resolved,
      name: path.basename(resolved),
      exists,
      isActive: resolved === activePath,
      enabledAgents: config?.enabledAgents || [],
      skillsCount,
      mcpsCount,
    });
  }

  return list;
}

export function unregisterKnowledgeBase(kbPath: string, deleteFiles = false): { success: boolean; wasActive: boolean } {
  const resolved = path.resolve(kbPath);
  const globalConf = loadGlobalConfig();
  const wasActive = globalConf.activeKnowledgeBase === resolved;

  globalConf.knownKnowledgeBases = (globalConf.knownKnowledgeBases || []).filter(
    (p) => path.resolve(p) !== resolved
  );

  if (wasActive) {
    globalConf.activeKnowledgeBase = globalConf.knownKnowledgeBases[0] || undefined;
  }

  saveGlobalConfig(globalConf);

  if (deleteFiles && fs.existsSync(resolved)) {
    try {
      fs.rmSync(resolved, { recursive: true, force: true });
    } catch {}
  }

  return { success: true, wasActive };
}

export function resolveKnowledgeBasePath(explicitPath?: string): string {
  // 1. Explicit path parameter
  if (explicitPath) {
    const resolved = path.resolve(explicitPath);
    if (fs.existsSync(resolved)) return resolved;
  }

  // 2. Environment variable AGENTHUB_PATH
  if (process.env.AGENTHUB_PATH) {
    const envResolved = path.resolve(process.env.AGENTHUB_PATH);
    if (fs.existsSync(envResolved)) return envResolved;
  }

  // 3. Current directory or parent directory traversal looking for .hub/config.json
  let curr = process.cwd();
  while (curr) {
    if (fs.existsSync(path.join(curr, '.hub', 'config.json'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }

  // 4. Global registry
  const globalKb = getActiveGlobalKnowledgeBase();
  if (globalKb && fs.existsSync(globalKb)) {
    return globalKb;
  }

  // 5. Fallback to cwd
  return process.cwd();
}

/**
 * Returns the resolved absolute path to bin/agenthub.js
 */
export function getAgentHubBinPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../bin/agenthub.js');
}

/**
 * Returns the resolved absolute path to bin/agenthub-mcp.js
 */
export function getAgentHubMcpBinPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../bin/agenthub-mcp.js');
}

/**
 * Resolves the user's preferred interface language (en or ru)
 * Priority: --lang CLI argument > AGENTHUB_LANG env > local .hub/config.json > ~/.agenthub/config.json > system locale > 'en'
 */
export function getPreferredLanguage(customPath?: string): SupportedLanguage {
  // 1. Explicit command line option
  const langArgIdx = process.argv.findIndex((arg) => arg === '--lang');
  if (langArgIdx !== -1 && process.argv[langArgIdx + 1]) {
    const val = process.argv[langArgIdx + 1].toLowerCase();
    if (val === 'ru' || val === 'en') return val as SupportedLanguage;
  }

  // 2. Environment variable
  if (process.env.AGENTHUB_LANG === 'ru' || process.env.AGENTHUB_LANG === 'en') {
    return process.env.AGENTHUB_LANG as SupportedLanguage;
  }

  // 3. Local knowledge base config
  try {
    const kbPath = customPath || resolveKnowledgeBasePath();
    const local = loadConfig(kbPath);
    if (local?.language) return local.language;
  } catch {}

  // 4. Global agenthub config
  try {
    const globalConf = loadGlobalConfig();
    if (globalConf.language) return globalConf.language;
    if (globalConf.activeKnowledgeBase) {
      const activeConf = loadConfig(globalConf.activeKnowledgeBase);
      if (activeConf?.language) return activeConf.language;
    }
  } catch {}

  // 5. System locale check
  const envLang = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  if (envLang.toLowerCase().startsWith('ru')) {
    return 'ru';
  }

  return 'en';
}

/**
 * Persists the preferred language to global config and active/local KB
 */
export function setPreferredLanguage(lang: SupportedLanguage, kbPath?: string): void {
  const globalConf = loadGlobalConfig();
  globalConf.language = lang;
  saveGlobalConfig(globalConf);

  try {
    const targetPath = kbPath || resolveKnowledgeBasePath();
    const localConfig = loadConfig(targetPath);
    if (localConfig) {
      localConfig.language = lang;
      saveConfig(targetPath, localConfig);
    }
  } catch {}
}
