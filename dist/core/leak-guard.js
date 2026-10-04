import fs from 'fs';
import path from 'path';
export const LEAK_PATTERNS = [
    {
        type: 'OpenAI API Key',
        regex: /\b(sk-[a-zA-Z0-9_-]{24,64})\b/g,
    },
    {
        type: 'Anthropic API Key',
        regex: /\b(sk-ant-[a-zA-Z0-9_-]{24,100})\b/g,
    },
    {
        type: 'GitHub Token',
        regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,90})\b/g,
    },
    {
        type: 'AWS Access Key',
        regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    },
    {
        type: 'Stripe Secret Key',
        regex: /\b(sk_live_[0-9a-zA-Z]{24,40})\b/g,
    },
    {
        type: 'Slack Token',
        regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,50})\b/g,
    },
    {
        type: 'Private Key Block',
        regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----/g,
    },
    {
        type: 'Database URI with Password',
        regex: /\b(?:postgres|mysql|mongodb|redis):\/\/[^:\s]+:([^@\s]+)@/g,
    },
];
export class LeakGuard {
    basePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    /**
     * Masks a secret string keeping only first 3 and last 3 characters
     */
    static mask(secret) {
        if (secret.length <= 8)
            return '****';
        return secret.slice(0, 3) + '...' + secret.slice(-3);
    }
    /**
     * Scans a single text content for secrets
     */
    scanContent(content, filePath) {
        const findings = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of LEAK_PATTERNS) {
                pattern.regex.lastIndex = 0;
                let match;
                while ((match = pattern.regex.exec(line)) !== null) {
                    const secret = match[1] || match[0];
                    findings.push({
                        filePath,
                        relativePath: path.relative(this.basePath, filePath),
                        line: i + 1,
                        type: pattern.type,
                        matchedSecret: secret,
                        maskedSecret: LeakGuard.mask(secret),
                        snippet: line.trim(),
                    });
                }
            }
        }
        return findings;
    }
    /**
     * Recursively scans directory while ignoring safe/binary/build folders
     */
    scanDirectory(dirPath = this.basePath) {
        const findings = [];
        const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.hub', '.next']);
        const walk = (currentDir) => {
            if (!fs.existsSync(currentDir))
                return;
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (!ignoreDirs.has(entry.name)) {
                        walk(fullPath);
                    }
                }
                else if (entry.isFile()) {
                    // Skip large binary files, images, etc.
                    const ext = path.extname(entry.name).toLowerCase();
                    const skipExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.exe', '.dll', '.bin', '.pdf']);
                    if (skipExts.has(ext))
                        continue;
                    try {
                        const stats = fs.statSync(fullPath);
                        if (stats.size > 2 * 1024 * 1024)
                            continue; // Skip files > 2MB
                        const content = fs.readFileSync(fullPath, 'utf8');
                        findings.push(...this.scanContent(content, fullPath));
                    }
                    catch {
                        // Ignore unreadable or locked files
                    }
                }
            }
        };
        walk(dirPath);
        return findings;
    }
    /**
     * Sanitizes a file by replacing the leaked secret with a placeholder env var name
     */
    redactSecretInFile(finding, envVarName) {
        try {
            const content = fs.readFileSync(finding.filePath, 'utf8');
            const updated = content.replaceAll(finding.matchedSecret, `process.env.${envVarName} || ""`);
            fs.writeFileSync(finding.filePath, updated, 'utf8');
            return true;
        }
        catch {
            return false;
        }
    }
}
