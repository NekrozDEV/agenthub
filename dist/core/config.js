import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
export const AGENT_INFO = {
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
    zcode: {
        name: 'ZCode (z.ai)',
        description: '.zcoderules, AGENTS.md & .zcode/mcp.json integrations',
        configFile: '.zcoderules / .zcode/mcp.json',
    },
};
export const DEFAULT_CONFIG = {
    version: '0.1.2',
    language: 'en',
    knowledgeBasePath: '',
    enabledAgents: ['antigravity', 'deepseek-hermes', 'opencode'],
    settings: {
        leakGuardAutoScan: true,
        repoMapAutoUpdate: true,
        tokenBudgetPerProject: 800,
    },
};
export function getHubConfigPath(basePath) {
    return path.join(basePath, '.hub', 'config.json');
}
export function getVaultPath(basePath) {
    return path.join(basePath, '.hub', 'vault.env');
}
export function loadConfig(basePath) {
    const configPath = getHubConfigPath(basePath);
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function saveConfig(basePath, config) {
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
export function getGlobalConfigDir() {
    return path.join(os.homedir(), '.agenthub');
}
export function getGlobalConfigFile() {
    return path.join(getGlobalConfigDir(), 'config.json');
}
export function loadGlobalConfig() {
    const file = getGlobalConfigFile();
    if (!fs.existsSync(file)) {
        return { knownKnowledgeBases: [] };
    }
    try {
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return { knownKnowledgeBases: [] };
    }
}
export function saveGlobalConfig(config) {
    const dir = getGlobalConfigDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getGlobalConfigFile(), JSON.stringify(config, null, 2), 'utf8');
}
export function setActiveKnowledgeBase(kbPath) {
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
export function getActiveGlobalKnowledgeBase() {
    const conf = loadGlobalConfig();
    if (conf.activeKnowledgeBase && fs.existsSync(conf.activeKnowledgeBase)) {
        return conf.activeKnowledgeBase;
    }
    if (conf.knownKnowledgeBases && conf.knownKnowledgeBases.length > 0) {
        for (const p of conf.knownKnowledgeBases) {
            if (fs.existsSync(p))
                return p;
        }
    }
    return null;
}
export function listAllKnowledgeBases() {
    const globalConf = loadGlobalConfig();
    const activePath = globalConf.activeKnowledgeBase ? path.resolve(globalConf.activeKnowledgeBase) : null;
    const list = [];
    const rawPaths = [...(globalConf.knownKnowledgeBases || [])];
    if (activePath && !rawPaths.includes(activePath)) {
        rawPaths.unshift(activePath);
    }
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, '.hub', 'config.json')) && !rawPaths.includes(cwd)) {
        rawPaths.push(cwd);
    }
    const seen = new Set();
    for (const raw of rawPaths) {
        const resolved = path.resolve(raw);
        if (seen.has(resolved))
            continue;
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
/**
 * Critical system and workspace path protector
 * Rejects root ('/', 'C:\'), user home dir, user directories, process.cwd(), and OS system dirs
 */
export function isCriticalSystemPath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string')
        return true;
    const trimmed = targetPath.trim().replace(/^["']|["']$/g, '');
    if (!trimmed)
        return true;
    const resolved = path.resolve(trimmed);
    const normalized = path.normalize(resolved).replace(/[\\/]+$/, '').toLowerCase();
    // 1. Root directory check (Unix '/' or Windows 'C:\', 'D:\', UNC roots, etc.)
    const parsedRoot = path.parse(resolved).root;
    const normalizedRoot = path.normalize(parsedRoot).replace(/[\\/]+$/, '').toLowerCase();
    if (normalized === normalizedRoot ||
        normalized === '' ||
        /^[a-z]:$/i.test(normalized) ||
        /^[\\/]+$/.test(trimmed)) {
        return true;
    }
    // 2. Current working directory
    const cwdNormalized = path.normalize(process.cwd()).replace(/[\\/]+$/, '').toLowerCase();
    if (normalized === cwdNormalized) {
        return true;
    }
    // 3. User home directory ($HOME / os.homedir())
    const home = os.homedir();
    const homeNormalized = path.normalize(home).replace(/[\\/]+$/, '').toLowerCase();
    if (normalized === homeNormalized) {
        return true;
    }
    // 4. Parent of home directory (/home, /Users, C:\Users)
    const homeParent = path.dirname(home);
    const homeParentNormalized = path.normalize(homeParent).replace(/[\\/]+$/, '').toLowerCase();
    if (normalized === homeParentNormalized) {
        return true;
    }
    // 5. Standard user directories
    const userDirs = [
        path.join(home, 'Desktop'),
        path.join(home, 'Documents'),
        path.join(home, 'Downloads'),
        path.join(home, 'Pictures'),
        path.join(home, 'Music'),
        path.join(home, 'Videos'),
        path.join(home, '.config'),
        path.join(home, '.agenthub'),
        path.join(home, '.gemini'),
    ];
    if (process.env.APPDATA)
        userDirs.push(process.env.APPDATA);
    if (process.env.LOCALAPPDATA)
        userDirs.push(process.env.LOCALAPPDATA);
    if (process.env.USERPROFILE)
        userDirs.push(process.env.USERPROFILE);
    for (const ud of userDirs) {
        if (ud && path.normalize(ud).replace(/[\\/]+$/, '').toLowerCase() === normalized) {
            return true;
        }
    }
    // 6. Cross-platform Unix system directories (evaluated via POSIX path without drive prefix)
    const normalizedPosix = normalized.replace(/^[a-z]:/i, '').replace(/\\/g, '/');
    const exactUnixSystemDirs = new Set([
        '/bin',
        '/sbin',
        '/usr',
        '/usr/bin',
        '/usr/sbin',
        '/usr/local',
        '/usr/local/bin',
        '/usr/lib',
        '/lib',
        '/lib64',
        '/etc',
        '/var',
        '/var/log',
        '/var/tmp',
        '/tmp',
        '/dev',
        '/proc',
        '/sys',
        '/opt',
        '/boot',
        '/root',
        '/library',
        '/system',
        '/applications',
        '/system32',
        '/syswow64',
        '/windows',
    ]);
    if (exactUnixSystemDirs.has(normalizedPosix)) {
        return true;
    }
    // Block any paths inside essential OS system folders (e.g. /etc/..., /bin/..., /usr/..., /boot/..., /sys/...)
    const systemPrefixes = ['/bin/', '/sbin/', '/usr/', '/etc/', '/lib/', '/lib64/', '/boot/', '/proc/', '/sys/', '/dev/', '/system/'];
    for (const prefix of systemPrefixes) {
        if (normalizedPosix.startsWith(prefix)) {
            return true;
        }
    }
    // 7. Windows system directories (SystemRoot, WINDIR, ProgramFiles, ProgramData)
    const winDirsToCheck = [];
    const winDir = process.env.WINDIR || process.env.SystemRoot || (process.platform === 'win32' ? 'C:\\Windows' : '');
    if (winDir) {
        winDirsToCheck.push(winDir);
        winDirsToCheck.push(path.join(winDir, 'System32'));
        winDirsToCheck.push(path.join(winDir, 'SysWOW64'));
    }
    if (process.env.ProgramFiles)
        winDirsToCheck.push(process.env.ProgramFiles);
    if (process.env['ProgramFiles(x86)'])
        winDirsToCheck.push(process.env['ProgramFiles(x86)']);
    if (process.env.ProgramData)
        winDirsToCheck.push(process.env.ProgramData);
    if (process.env.CommonProgramFiles)
        winDirsToCheck.push(process.env.CommonProgramFiles);
    if (process.env['CommonProgramFiles(x86)'])
        winDirsToCheck.push(process.env['CommonProgramFiles(x86)']);
    for (const wd of winDirsToCheck) {
        if (!wd)
            continue;
        const wdNormalized = path.normalize(path.resolve(wd)).replace(/[\\/]+$/, '').toLowerCase();
        if (normalized === wdNormalized || normalized.startsWith(wdNormalized + path.sep.toLowerCase())) {
            return true;
        }
    }
    return false;
}
export function unregisterKnowledgeBase(kbPath, deleteFiles = false) {
    const normalizePath = (p) => {
        const res = path.resolve(p);
        return process.platform === 'win32' ? res.toLowerCase() : res;
    };
    const resolved = path.resolve(kbPath);
    const normalizedTarget = normalizePath(resolved);
    const globalConf = loadGlobalConfig();
    const wasActive = globalConf.activeKnowledgeBase
        ? normalizePath(globalConf.activeKnowledgeBase) === normalizedTarget
        : false;
    const isRegistered = (globalConf.knownKnowledgeBases || []).some((p) => normalizePath(p) === normalizedTarget) ||
        wasActive;
    if (deleteFiles) {
        if (isCriticalSystemPath(resolved)) {
            return {
                success: false,
                wasActive,
                error: `Refused to delete files: '${resolved}' is a critical system or workspace path.`,
            };
        }
        if (!isRegistered) {
            return {
                success: false,
                wasActive,
                error: `Refused to delete files: '${resolved}' is not registered in knownKnowledgeBases.`,
            };
        }
        if (fs.existsSync(resolved)) {
            try {
                fs.rmSync(resolved, { recursive: true, force: true });
            }
            catch (err) {
                return {
                    success: false,
                    wasActive,
                    error: `Failed to delete files at '${resolved}': ${err.message}`,
                };
            }
        }
    }
    globalConf.knownKnowledgeBases = (globalConf.knownKnowledgeBases || []).filter((p) => normalizePath(p) !== normalizedTarget);
    if (wasActive) {
        globalConf.activeKnowledgeBase = globalConf.knownKnowledgeBases[0] || undefined;
    }
    saveGlobalConfig(globalConf);
    return { success: true, wasActive };
}
export function resolveKnowledgeBasePath(explicitPath) {
    // 1. Explicit path parameter
    if (explicitPath) {
        const resolved = path.resolve(explicitPath);
        if (fs.existsSync(resolved))
            return resolved;
    }
    // 2. Environment variable AGENTHUB_PATH
    if (process.env.AGENTHUB_PATH) {
        const envResolved = path.resolve(process.env.AGENTHUB_PATH);
        if (fs.existsSync(envResolved))
            return envResolved;
    }
    // 3. Current directory or parent directory traversal looking for .hub/config.json
    let curr = process.cwd();
    while (curr) {
        if (fs.existsSync(path.join(curr, '.hub', 'config.json'))) {
            return curr;
        }
        const parent = path.dirname(curr);
        if (parent === curr)
            break;
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
export function getAgentHubBinPath() {
    const currentFile = fileURLToPath(import.meta.url);
    return path.resolve(path.dirname(currentFile), '../../bin/agenthub.js');
}
/**
 * Returns the resolved absolute path to bin/agenthub-mcp.js
 */
export function getAgentHubMcpBinPath() {
    const currentFile = fileURLToPath(import.meta.url);
    return path.resolve(path.dirname(currentFile), '../../bin/agenthub-mcp.js');
}
/**
 * Resolves the user's preferred interface language (en or ru)
 * Priority: --lang CLI argument > AGENTHUB_LANG env > local .hub/config.json > ~/.agenthub/config.json > system locale > 'en'
 */
export function getPreferredLanguage(customPath) {
    // 1. Explicit command line option
    const langArgIdx = process.argv.findIndex((arg) => arg === '--lang');
    if (langArgIdx !== -1 && process.argv[langArgIdx + 1]) {
        const val = process.argv[langArgIdx + 1].toLowerCase();
        if (val === 'ru' || val === 'en')
            return val;
    }
    // 2. Environment variable
    if (process.env.AGENTHUB_LANG === 'ru' || process.env.AGENTHUB_LANG === 'en') {
        return process.env.AGENTHUB_LANG;
    }
    // 3. Local knowledge base config
    try {
        const kbPath = customPath || resolveKnowledgeBasePath();
        const local = loadConfig(kbPath);
        if (local?.language)
            return local.language;
    }
    catch { }
    // 4. Global agenthub config
    try {
        const globalConf = loadGlobalConfig();
        if (globalConf.language)
            return globalConf.language;
        if (globalConf.activeKnowledgeBase) {
            const activeConf = loadConfig(globalConf.activeKnowledgeBase);
            if (activeConf?.language)
                return activeConf.language;
        }
    }
    catch { }
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
export function setPreferredLanguage(lang, kbPath) {
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
    }
    catch { }
}
