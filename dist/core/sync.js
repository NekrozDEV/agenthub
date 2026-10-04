import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { SecretVault } from './vault.js';
import { LeakGuard } from './leak-guard.js';
export class TeamSyncManager {
    knowledgeBasePath;
    constructor(knowledgeBasePath) {
        this.knowledgeBasePath = knowledgeBasePath;
    }
    runGit(cmd) {
        return execSync(`git ${cmd}`, {
            cwd: this.knowledgeBasePath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    }
    checkGit() {
        const gitDir = path.join(this.knowledgeBasePath, '.git');
        if (!fs.existsSync(gitDir)) {
            return {
                isGitRepo: false,
                hasUncommittedChanges: false,
                branch: '',
                hasRemote: false,
                leaksPrevented: 0,
            };
        }
        try {
            const branch = this.runGit('branch --show-current') || 'master';
            const status = this.runGit('status --porcelain');
            let remoteUrl;
            let hasRemote = false;
            try {
                remoteUrl = this.runGit('remote get-url origin');
                hasRemote = !!remoteUrl;
            }
            catch { }
            return {
                isGitRepo: true,
                hasUncommittedChanges: status.length > 0,
                branch,
                hasRemote,
                remoteUrl,
                leaksPrevented: 0,
            };
        }
        catch {
            return {
                isGitRepo: true,
                hasUncommittedChanges: false,
                branch: 'unknown',
                hasRemote: false,
                leaksPrevented: 0,
            };
        }
    }
    preFlightSecurityCheck() {
        // 1. Ensure vault is gitignored
        SecretVault.ensureGitIgnored(this.knowledgeBasePath);
        // 2. Scan staged files for secrets with LeakGuard
        const leakGuard = new LeakGuard(this.knowledgeBasePath);
        const findings = leakGuard.scanDirectory(path.join(this.knowledgeBasePath, 'skills'));
        const mcpFindings = leakGuard.scanDirectory(path.join(this.knowledgeBasePath, 'mcp'));
        const allFindings = [...findings, ...mcpFindings];
        if (allFindings.length > 0) {
            return {
                safe: false,
                error: `Found ${allFindings.length} unprotected secret(s) in shared directories (skills/ or mcp/). Redact them before syncing with the team!`,
            };
        }
        return { safe: true };
    }
    initGit() {
        if (!fs.existsSync(path.join(this.knowledgeBasePath, '.git'))) {
            this.runGit('init');
        }
        SecretVault.ensureGitIgnored(this.knowledgeBasePath);
    }
    commitSharedChanges(message) {
        const check = this.preFlightSecurityCheck();
        if (!check.safe) {
            throw new Error(check.error);
        }
        this.runGit('add skills/ mcp/ .gitignore PROJECTS_MAP.md HANDOFF.md');
        const out = this.runGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
        return { success: true, output: out };
    }
    pullShared() {
        return this.runGit('pull --rebase');
    }
    pushShared() {
        const check = this.preFlightSecurityCheck();
        if (!check.safe) {
            throw new Error(check.error);
        }
        return this.runGit('push');
    }
}
