import { SupportedAgent } from './config.js';
export interface GlobalSyncTarget {
    name: string;
    path: string;
    configured: boolean;
    details: string;
}
export interface GlobalSyncSummary {
    activeKnowledgeBase: string;
    targets: GlobalSyncTarget[];
}
export declare class GlobalSyncManager {
    private knowledgeBasePath;
    private binPath;
    constructor(knowledgeBasePath: string);
    private getAppDataDir;
    /**
     * Safely parses JSON text, stripping single-line comments, block comments, and trailing commas (JSONC support)
     */
    static parseJsonc(text: string): any;
    safeReadJson(filePath: string): {
        data: any;
        parseError?: boolean;
    };
    private safeWriteJson;
    private safeWriteFile;
    /**
     * Sync Claude Code CLI global configuration (~/.claude.json)
     */
    syncClaudeCode(): GlobalSyncTarget;
    /**
     * Sync Claude Desktop configuration
     */
    syncClaudeDesktop(): GlobalSyncTarget;
    /**
     * Sync Windsurf (Codeium) global configuration
     */
    syncWindsurf(): GlobalSyncTarget;
    /**
     * Sync Cline (VS Code extension) global MCP settings
     */
    syncCline(): GlobalSyncTarget;
    /**
     * Sync Roo Code (VS Code extension) global MCP settings
     */
    syncRooCode(): GlobalSyncTarget;
    /**
     * Sync Cursor AI global MCP settings
     */
    syncCursor(): GlobalSyncTarget;
    /**
     * Sync Continue.dev global config
     */
    syncContinue(): GlobalSyncTarget;
    /**
     * Sync Antigravity (Gemini) global rules and native skill
     */
    syncAntigravity(): GlobalSyncTarget;
    /**
     * Sync ZCode (z.ai) global MCP settings
     */
    syncZCode(): GlobalSyncTarget;
    /**
     * Restores original IDE configuration files from .bak backups
     */
    restoreAllBackups(): {
        restored: string[];
        notFound: string[];
    };
    /**
     * Sync all global IDE environments
     */
    syncAll(filterAgents?: SupportedAgent[]): GlobalSyncSummary;
}
