export interface SecretEntry {
    key: string;
    value: string;
    description?: string;
    services?: string[];
}
export declare class SecretVault {
    private vaultPath;
    private secrets;
    constructor(knowledgeBasePath: string);
    /**
     * Load secrets from .hub/vault.env
     */
    load(): void;
    /**
     * Save secrets safely to .hub/vault.env with strict local file permissions
     */
    save(): void;
    setSecret(key: string, value: string): void;
    getSecret(key: string): string | undefined;
    hasSecret(key: string): boolean;
    deleteSecret(key: string): boolean;
    /**
     * Returns a sanitized list of secret keys for UI and schema definitions without disclosing the actual values.
     */
    listKeys(): string[];
    /**
     * Check if gitignore in the knowledge base excludes the vault
     */
    static ensureGitIgnored(knowledgeBasePath: string): void;
}
