import fs from 'fs';
import path from 'path';
export class SecretVault {
    vaultPath;
    knowledgeBasePath;
    secrets = new Map();
    constructor(knowledgeBasePath, enabledAgents) {
        this.knowledgeBasePath = knowledgeBasePath;
        this.vaultPath = path.join(knowledgeBasePath, '.hub', 'vault.env');
        this.load();
        if (enabledAgents && enabledAgents.length > 0) {
            SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath, enabledAgents);
        }
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
    save(enabledAgents) {
        SecretVault.ensureGitIgnored(this.knowledgeBasePath);
        if (enabledAgents && enabledAgents.length > 0) {
            SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath, enabledAgents);
        }
        const dir = path.dirname(this.vaultPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const lines = [
            '# AgentHub Local Secret Vault',
            '# ZERO-LEAK SECURITY: This file is NEVER exposed to AI agents or committed to git.',
            '# Stored locally; never send these values to a model.',
            '',
        ];
        for (const [k, v] of this.secrets.entries()) {
            lines.push(`${k}=${v}`);
        }
        fs.writeFileSync(this.vaultPath, lines.join('\n') + '\n', { mode: 0o600 });
    }
    setSecret(key, value, enabledAgents) {
        SecretVault.ensureGitIgnored(this.knowledgeBasePath);
        if (enabledAgents && enabledAgents.length > 0) {
            SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath, enabledAgents);
        }
        this.secrets.set(key, value);
        this.save(enabledAgents);
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
    static AGENT_IGNORE_ENTRIES = [
        '# AgentHub Vault Isolation',
        '.hub/',
        '*.env*',
        '.env*',
        '!.env.example',
        '!*.env.example',
        '*.bak',
    ];
    static AGENT_IGNORE_FILES = [
        '.cursorignore',
        '.codeiumignore',
        '.continueignore',
        '.zcodeignore',
    ];
    static AGENT_TO_IGNORE_FILE = {
        cursor: '.cursorignore',
        windsurf: '.codeiumignore',
        continue: '.continueignore',
        zcode: '.zcodeignore',
    };
    /**
     * Auto-generate and maintain agent ignore files (.cursorignore, .codeiumignore, .continueignore, .zcodeignore)
     * preventing AI models from reading internal vault files, environment files, or backups.
     * If enabledAgents is specified, only ignore files for those agents are generated.
     */
    static ensureAgentIgnoreFiles(knowledgeBasePath, enabledAgents) {
        const targetFiles = enabledAgents !== undefined
            ? enabledAgents.map((a) => SecretVault.AGENT_TO_IGNORE_FILE[a]).filter((f) => Boolean(f))
            : SecretVault.AGENT_IGNORE_FILES;
        for (const ignoreFile of targetFiles) {
            SecretVault.ensureIgnoreFile(knowledgeBasePath, ignoreFile);
        }
    }
    static ensureIgnoreFile(knowledgeBasePath, ignoreFileName) {
        const fullPath = path.join(knowledgeBasePath, ignoreFileName);
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, SecretVault.AGENT_IGNORE_ENTRIES.join('\n') + '\n', 'utf8');
            return;
        }
        try {
            const existing = fs.readFileSync(fullPath, 'utf8');
            const existingLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
            const toAdd = [];
            for (const entry of SecretVault.AGENT_IGNORE_ENTRIES) {
                if (!entry.startsWith('#') && !existingLines.has(entry)) {
                    toAdd.push(entry);
                }
            }
            if (toAdd.length > 0) {
                const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
                fs.appendFileSync(fullPath, prefix + '# AgentHub Vault Isolation\n' + toAdd.join('\n') + '\n', 'utf8');
            }
        }
        catch { }
    }
    /**
     * Check if gitignore in the knowledge base excludes the vault and safety backups
     */
    static ensureGitIgnored(knowledgeBasePath) {
        const gitignorePath = path.join(knowledgeBasePath, '.gitignore');
        const ignoreEntries = [
            '# AgentHub Security Vault',
            '.hub/vault.env',
            '.hub/*.key',
            '.hub/secrets/',
            '*.env.local',
            '*.bak',
            'node_modules/',
        ];
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, ignoreEntries.join('\n') + '\n', 'utf8');
            return;
        }
        const existing = fs.readFileSync(gitignorePath, 'utf8');
        const existingLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
        const toAdd = [];
        for (const entry of ignoreEntries) {
            if (!entry.startsWith('#') && !existingLines.has(entry)) {
                toAdd.push(entry);
            }
        }
        if (toAdd.length > 0) {
            const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
            fs.appendFileSync(gitignorePath, prefix + '# AgentHub Vault Isolation\n' + toAdd.join('\n') + '\n', 'utf8');
        }
    }
}
