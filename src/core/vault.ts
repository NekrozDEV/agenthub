import fs from 'fs';
import path from 'path';

export interface SecretEntry {
  key: string;
  value: string;
  description?: string;
  services?: string[];
}

export class SecretVault {
  private vaultPath: string;
  private knowledgeBasePath: string;
  private secrets: Map<string, string> = new Map();

  constructor(knowledgeBasePath: string) {
    this.knowledgeBasePath = knowledgeBasePath;
    this.vaultPath = path.join(knowledgeBasePath, '.hub', 'vault.env');
    this.load();
    SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath);
  }

  /**
   * Load secrets from .hub/vault.env
   */
  public load(): void {
    if (!fs.existsSync(this.vaultPath)) {
      return;
    }
    const content = fs.readFileSync(this.vaultPath, 'utf8');
    const lines = content.split('\n');
    this.secrets.clear();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
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
  public save(): void {
    SecretVault.ensureGitIgnored(this.knowledgeBasePath);
    SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath);

    const dir = path.dirname(this.vaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const lines = [
      '# AgentHub Local Secret Vault',
      '# ZERO-LEAK SECURITY: This file is NEVER exposed to AI agents or committed to git.',
      '# Stored locally for AgentHub tools and pre-read sanitization; isolated from agent contexts.',
      '',
    ];

    for (const [k, v] of this.secrets.entries()) {
      lines.push(`${k}=${v}`);
    }

    fs.writeFileSync(this.vaultPath, lines.join('\n') + '\n', { mode: 0o600 });
  }

  public setSecret(key: string, value: string): void {
    SecretVault.ensureGitIgnored(this.knowledgeBasePath);
    SecretVault.ensureAgentIgnoreFiles(this.knowledgeBasePath);
    this.secrets.set(key, value);
    this.save();
  }

  public getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  public hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }

  public deleteSecret(key: string): boolean {
    const deleted = this.secrets.delete(key);
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  /**
   * Returns a sanitized list of secret keys for UI and schema definitions without disclosing the actual values.
   */
  public listKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  public static readonly AGENT_IGNORE_ENTRIES = [
    '# AgentHub Vault Isolation',
    '.hub/',
    '*.env*',
    '.env*',
    '*.bak',
  ];

  public static readonly AGENT_IGNORE_FILES = [
    '.cursorignore',
    '.codeiumignore',
    '.continueignore',
    '.zcodeignore',
  ];

  /**
   * Auto-generate and maintain agent ignore files (.cursorignore, .codeiumignore, .continueignore, .zcodeignore)
   * preventing AI models from reading internal vault files, environment files, or backups.
   */
  public static ensureAgentIgnoreFiles(knowledgeBasePath: string): void {
    for (const ignoreFile of SecretVault.AGENT_IGNORE_FILES) {
      const fullPath = path.join(knowledgeBasePath, ignoreFile);
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, SecretVault.AGENT_IGNORE_ENTRIES.join('\n') + '\n', 'utf8');
        continue;
      }

      try {
        const existing = fs.readFileSync(fullPath, 'utf8');
        const existingLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
        const toAdd: string[] = [];

        for (const entry of SecretVault.AGENT_IGNORE_ENTRIES) {
          if (!entry.startsWith('#') && !existingLines.has(entry)) {
            toAdd.push(entry);
          }
        }

        if (toAdd.length > 0) {
          const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
          fs.appendFileSync(fullPath, prefix + '# AgentHub Vault Isolation\n' + toAdd.join('\n') + '\n', 'utf8');
        }
      } catch {}
    }
  }

  /**
   * Check if gitignore in the knowledge base excludes the vault and safety backups
   */
  public static ensureGitIgnored(knowledgeBasePath: string): void {
    SecretVault.ensureAgentIgnoreFiles(knowledgeBasePath);

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
    const toAdd: string[] = [];

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
