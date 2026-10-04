import fs from 'fs';
import path from 'path';
export class SecretVault {
    vaultPath;
    secrets = new Map();
    constructor(knowledgeBasePath) {
        this.vaultPath = path.join(knowledgeBasePath, '.hub', 'vault.env');
        this.load();
    }
    /**
     * Load secrets from .hub/vault.env
     */
    load() {
        if (!fs.existsSync(this.vaultPath)) {
            return;
        }
        const content = fs.readFileSync(this.vaultPath, 'utf8');
        const lines = content.split('\n');
        this.secrets.clear();
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
                const key = trimmed.slice(0, eqIdx).trim();
                let val = trimmed.slice(eqIdx + 1).trim();
                // Strip quotes if present
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                this.secrets.set(key, val);
            }
        }
    }
    /**
     * Save secrets safely to .hub/vault.env with strict local file permissions
     */
    save() {
        const dir = path.dirname(this.vaultPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const lines = [
            '# AgentHub Local Secret Vault',
            '# ZERO-LEAK SECURITY: This file is NEVER exposed to AI agents or committed to git.',
            '# Tokens here are injected into MCP processes by AgentHub Proxy.',
            '',
        ];
        for (const [k, v] of this.secrets.entries()) {
            lines.push(`${k}=${v}`);
        }
        fs.writeFileSync(this.vaultPath, lines.join('\n') + '\n', { mode: 0o600 });
    }
    setSecret(key, value) {
        this.secrets.set(key, value);
        this.save();
    }
    getSecret(key) {
        return this.secrets.get(key);
    }
    hasSecret(key) {
        return this.secrets.has(key);
    }
    deleteSecret(key) {
        const deleted = this.secrets.delete(key);
        if (deleted) {
            this.save();
        }
        return deleted;
    }
    /**
     * Returns a sanitized list of secret keys for UI and schema definitions without disclosing the actual values.
     */
    listKeys() {
        return Array.from(this.secrets.keys());
    }
    /**
     * Check if gitignore in the knowledge base excludes the vault
     */
    static ensureGitIgnored(knowledgeBasePath) {
        const gitignorePath = path.join(knowledgeBasePath, '.gitignore');
        const ignoreEntries = [
            '# AgentHub Security Vault',
            '.hub/vault.env',
            '.hub/*.key',
            '.hub/secrets/',
            '*.env.local',
            'node_modules/',
        ];
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, ignoreEntries.join('\n') + '\n', 'utf8');
            return;
        }
        const existing = fs.readFileSync(gitignorePath, 'utf8');
        const toAdd = [];
        for (const entry of ignoreEntries) {
            if (!existing.includes(entry) && !entry.startsWith('#')) {
                toAdd.push(entry);
            }
        }
        if (toAdd.length > 0) {
            fs.appendFileSync(gitignorePath, '\n# AgentHub Vault Isolation\n' + toAdd.join('\n') + '\n', 'utf8');
        }
    }
}
