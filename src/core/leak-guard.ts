import fs from 'fs';
import path from 'path';

export interface LeakFinding {
  filePath: string;
  relativePath: string;
  line: number;
  type: string;
  matchedSecret: string;
  maskedSecret: string;
  snippet: string;
}

interface PatternDef {
  type: string;
  regex: RegExp;
}

export const LEAK_PATTERNS: PatternDef[] = [
  {
    type: 'OpenAI API Key',
    regex: /\b(sk-(?!ant-)[a-zA-Z0-9_-]{24,64})\b/g,
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
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Masks a secret string keeping only first 3 and last 3 characters
   */
  public static mask(secret: string): string {
    if (secret.length <= 8) return '****';
    return secret.slice(0, 3) + '...' + secret.slice(-3);
  }

  /**
   * Scans a single text content for secrets
   */
  public scanContent(content: string, filePath: string): LeakFinding[] {
    const findings: LeakFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineMatches: Array<{ type: string; secret: string; masked: string }> = [];

      for (const pattern of LEAK_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(line)) !== null) {
          const secret = match[1] || match[0];
          if (!lineMatches.some((lm) => lm.secret === secret)) {
            lineMatches.push({
              type: pattern.type,
              secret,
              masked: LeakGuard.mask(secret),
            });
          }
        }
      }

      if (lineMatches.length === 0) continue;

      // Fully sanitize the line by masking EVERY detected secret on this line
      let fullySanitizedSnippet = line;
      for (const lm of lineMatches) {
        fullySanitizedSnippet = fullySanitizedSnippet.replaceAll(lm.secret, lm.masked);
      }
      fullySanitizedSnippet = fullySanitizedSnippet.trim();

      for (const lm of lineMatches) {
        findings.push({
          filePath,
          relativePath: path.relative(this.basePath, filePath),
          line: i + 1,
          type: lm.type,
          matchedSecret: lm.secret,
          maskedSecret: lm.masked,
          snippet: fullySanitizedSnippet,
        });
      }
    }

    return findings;
  }

  /**
   * Recursively scans directory while ignoring safe/binary/build folders
   * @param dirPath Directory to scan (defaults to basePath)
   * @param includeBackups If true, include *.bak backup files in scan (default: false)
   */
  public scanDirectory(dirPath: string = this.basePath, includeBackups = false): LeakFinding[] {
    const findings: LeakFinding[] = [];
    const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.hub', '.next']);

    const walk = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!ignoreDirs.has(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          // Skip large binary files, images, archives, and backup/temp files
          const ext = path.extname(entry.name).toLowerCase();
          const skipExts = new Set([
            '.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz',
            '.exe', '.dll', '.bin', '.pdf', '.tmp', '.swp',
          ]);
          if (!includeBackups) {
            skipExts.add('.bak');
            skipExts.add('.backup');
          }
          if (skipExts.has(ext)) continue;
          if (!includeBackups && (entry.name.endsWith('.bak') || entry.name.endsWith('.backup'))) continue;

          try {
            const stats = fs.statSync(fullPath);
            if (stats.size > 2 * 1024 * 1024) continue; // Skip files > 2MB
            const content = fs.readFileSync(fullPath, 'utf8');
            findings.push(...this.scanContent(content, fullPath));
          } catch {
            // Ignore unreadable or locked files
          }
        }
      }
    };

    walk(dirPath);
    return findings;
  }

  public static readonly ENV_BLACKLIST_EXTENSIONS = [
    '.yaml',
    '.yml',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.mjs',
    '.cjs',
    '.py',
    '.bak',
    '.backup',
    '.go',
    '.rs',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.md',
    '.markdown',
    '.txt',
    '.xml',
    '.toml',
    '.ini',
    '.conf',
    '.sh',
    '.bash',
    '.zsh',
    '.tar',
    '.gz',
    '.zip',
    '.7z',
    '.rar',
    '.tmp',
    '.temp',
    '.swp',
    '.lock',
    '.log',
    '.sql',
    '.php',
    '.rb',
  ];

  /**
   * Validates whether a file is an authentic .env configuration file.
   * Rejects structured and code files like deploy.env.yaml, production.env.backup, config.env.json
   * while accepting true .env variants such as .env, .env.local, production.env, config.env.local.
   */
  public static isEnvFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath).toLowerCase();

    const looksLikeEnv =
      base === '.env' ||
      base.startsWith('.env.') ||
      base.endsWith('.env') ||
      base.includes('.env.') ||
      ext === '.env';

    if (!looksLikeEnv) return false;

    if (LeakGuard.ENV_BLACKLIST_EXTENSIONS.includes(ext) || ext === '.bak' || ext === '.backup') {
      return false;
    }

    // Inspect all dot-separated segments to reject compound extensions like deploy.env.yaml.local, test.env.js.bak
    const segments = base.split('.');
    for (const segment of segments) {
      if (segment && segment !== 'env' && LeakGuard.ENV_BLACKLIST_EXTENSIONS.includes('.' + segment)) {
        return false;
      }
    }

    return true;
  }

  public static readonly SUPPORTED_EXTENSIONS = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.mjs',
    '.cjs',
    '.py',
    '.json',
  ];

  /**
   * Checks if the file format is supported for safe automated secret redaction
   * (.js, .ts, .jsx, .tsx, .mjs, .cjs, .py, .json, and verified .env files)
   */
  public static isSupportedFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (LeakGuard.isEnvFile(filePath)) {
      return true;
    }
    return LeakGuard.SUPPORTED_EXTENSIONS.includes(ext);
  }

  /**
   * Sanitizes a file by safely replacing the leaked secret with an environment variable reference
   * Automatically creates a .bak backup before modifying any file.
   * Strips surrounding quotes in JS/TS/Python code to prevent literal string quotes around process.env.
   */
  public redactSecretInFile(finding: LeakFinding, envVarName: string): boolean {
    try {
      if (!fs.existsSync(finding.filePath)) return false;

      // Whitelist check: prevent corrupting syntax in unsupported languages (Go, Java, Rust, etc.)
      if (!LeakGuard.isSupportedFile(finding.filePath)) {
        console.warn(
          `⚠️ Unsupported file type for auto-redaction: ${finding.relativePath || finding.filePath}:${finding.line}. Please rotate this secret manually.`
        );
        return false;
      }

      // 1. Create a safety backup (.bak) only if not already present to preserve pristine pre-redaction content
      try {
        const bakPath = `${finding.filePath}.bak`;
        if (!fs.existsSync(bakPath)) {
          fs.copyFileSync(finding.filePath, bakPath);
        }
      } catch {}

      const content = fs.readFileSync(finding.filePath, 'utf8');
      const ext = path.extname(finding.filePath).toLowerCase();
      const isJsTs = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext);
      const isPython = ext === '.py';
      const isJson = ext === '.json';
      const isEnv = LeakGuard.isEnvFile(finding.filePath);

      let replacement: string;
      if (isJsTs) {
        replacement = `process.env.${envVarName} || ""`;
      } else if (isPython) {
        replacement = `os.environ.get("${envVarName}", "")`;
      } else if (isJson || isEnv) {
        replacement = `\${${envVarName}}`;
      } else {
        return false;
      }

      // Check if secret is surrounded by quotes: "secret", 'secret', `secret`
      const doubleQuoted = `"${finding.matchedSecret}"`;
      const singleQuoted = `'${finding.matchedSecret}'`;
      const backtickQuoted = `\`${finding.matchedSecret}\``;

      let updated = content;
      if (isJson || isEnv) {
        updated = updated.replaceAll(finding.matchedSecret, replacement);
      } else {
        // Redact across all quoting styles so no secret occurrence is missed
        if (updated.includes(doubleQuoted)) {
          updated = updated.replaceAll(doubleQuoted, replacement);
        }
        if (updated.includes(singleQuoted)) {
          updated = updated.replaceAll(singleQuoted, replacement);
        }
        if (updated.includes(backtickQuoted)) {
          updated = updated.replaceAll(backtickQuoted, replacement);
        }
        if (updated.includes(finding.matchedSecret)) {
          updated = updated.replaceAll(finding.matchedSecret, replacement);
        }
      }

      fs.writeFileSync(finding.filePath, updated, 'utf8');
      return true;
    } catch {
      return false;
    }
  }
}
