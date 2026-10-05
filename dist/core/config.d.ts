export type SupportedAgent = 'antigravity' | 'claude-code' | 'deepseek-hermes' | 'opencode' | 'cursor' | 'codex' | 'windsurf' | 'cline' | 'roo-code' | 'continue' | 'copilot' | 'zcode';
export type SupportedLanguage = 'en' | 'ru';
export interface HubConfig {
    version: string;
    language?: SupportedLanguage;
    knowledgeBasePath: string;
    enabledAgents: SupportedAgent[];
    settings: {
        leakGuardAutoScan: boolean;
        repoMapAutoUpdate: boolean;
        tokenBudgetPerProject: number;
    };
}
export interface GlobalConfig {
    language?: SupportedLanguage;
    activeKnowledgeBase?: string;
    knownKnowledgeBases: string[];
    lastSynced?: string;
    autoUpdate?: boolean | 'prompt' | 'auto' | 'off';
}
export declare const AGENT_INFO: Record<SupportedAgent, {
    name: string;
    description: string;
    configFile: string;
}>;
export declare const DEFAULT_CONFIG: HubConfig;
export declare function getHubConfigPath(basePath: string): string;
export declare function getVaultPath(basePath: string): string;
export declare function loadConfig(basePath: string): HubConfig | null;
export declare function saveConfig(basePath: string, config: HubConfig): void;
export declare function getGlobalConfigDir(): string;
export declare function getGlobalConfigFile(): string;
export declare function loadGlobalConfig(): GlobalConfig;
export declare function saveGlobalConfig(config: GlobalConfig): void;
export declare function setActiveKnowledgeBase(kbPath: string): void;
export declare function getActiveGlobalKnowledgeBase(): string | null;
export interface KnowledgeBaseInfo {
    path: string;
    name: string;
    exists: boolean;
    isActive: boolean;
    enabledAgents: SupportedAgent[];
    skillsCount: number;
    mcpsCount: number;
}
export declare function listAllKnowledgeBases(): KnowledgeBaseInfo[];
/**
 * Critical system and workspace path protector
 * Rejects root ('/', 'C:\'), user home dir, user directories, process.cwd(), and OS system dirs
 */
export declare function isCriticalSystemPath(targetPath: string): boolean;
export declare function unregisterKnowledgeBase(kbPath: string, deleteFiles?: boolean): {
    success: boolean;
    wasActive: boolean;
    error?: string;
};
export declare function resolveKnowledgeBasePath(explicitPath?: string): string;
/**
 * Returns the resolved absolute path to bin/agenthub.js
 */
export declare function getAgentHubBinPath(): string;
/**
 * Returns the resolved absolute path to bin/agenthub-mcp.js
 */
export declare function getAgentHubMcpBinPath(): string;
/**
 * Resolves the user's preferred interface language (en or ru)
 * Priority: --lang CLI argument > AGENTHUB_LANG env > local .hub/config.json > ~/.agenthub/config.json > system locale > 'en'
 */
export declare function getPreferredLanguage(customPath?: string): SupportedLanguage;
/**
 * Persists the preferred language to global config and active/local KB
 */
export declare function setPreferredLanguage(lang: SupportedLanguage, kbPath?: string): void;
