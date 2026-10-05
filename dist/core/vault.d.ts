import { SupportedAgent } from './config.js';
export interface SecretEntry {
    key: string;
    value: string;
    description?: string;
    services?: string[];
}
export declare class SecretVault {
    private vaultPath;
    private knowledgeBasePath;
    private secrets;
    constructor(knowledgeBasePath: string, enabledAgents?: SupportedAgent[]);
    /**
     * Load secrets from .hub/vault.env
     */
    load(): void;
    /**
     * Save secrets safely to .hub/vault.env with strict local file permissions
     */
    save(enabledAgents?: SupportedAgent[]): void;
    setSecret(key: string, value: string, enabledAgents?: SupportedAgent[]): void;
    getSecret(key: string): string | undefined;
    hasSecret(key: string): boolean;
    deleteSecret(key: string): boolean;
    /**
     * Returns a sanitized list of secret keys for UI and schema definitions without disclosing the actual values.
     */
    listKeys(): string[];
    static readonly AGENT_IGNORE_ENTRIES: string[];
    static readonly AGENT_IGNORE_FILES: string[];
    static readonly AGENT_TO_IGNORE_FILE: Partial<Record<SupportedAgent, string>>;
    /**
     * Auto-generate and maintain agent ignore files (.cursorignore, .codeiumignore, .continueignore, .zcodeignore)
     * preventing AI models from reading internal vault files, environment files, or backups.
     * If enabledAgents is specified, only ignore files for those agents are generated.
     */
    static ensureAgentIgnoreFiles(knowledgeBasePath: string, enabledAgents?: SupportedAgent[]): void;
    static ensureIgnoreFile(knowledgeBasePath: string, ignoreFileName: string): void;
    /**
     * Check if gitignore in the knowledge base excludes the vault and safety backups
     */
    static ensureGitIgnored(knowledgeBasePath: string): void;
}
