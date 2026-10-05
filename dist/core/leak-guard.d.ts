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
export declare const LEAK_PATTERNS: PatternDef[];
export declare class LeakGuard {
    private basePath;
    constructor(basePath: string);
    /**
     * Masks a secret string keeping only first 3 and last 3 characters
     */
    static mask(secret: string): string;
    /**
     * Scans a single text content for secrets
     */
    scanContent(content: string, filePath: string): LeakFinding[];
    /**
     * Recursively scans directory while ignoring safe/binary/build folders
     * @param dirPath Directory to scan (defaults to basePath)
     * @param includeBackups If true, include *.bak backup files in scan (default: false)
     */
    scanDirectory(dirPath?: string, includeBackups?: boolean): LeakFinding[];
    static readonly ENV_BLACKLIST_EXTENSIONS: string[];
    /**
     * Validates whether a file is an authentic .env configuration file.
     * Rejects structured and code files like deploy.env.yaml, production.env.backup, config.env.json
     * while accepting true .env variants such as .env, .env.local, production.env, config.env.local.
     */
    static isEnvFile(filePath: string): boolean;
    static readonly SUPPORTED_EXTENSIONS: string[];
    /**
     * Checks if the file format is supported for safe automated secret redaction
     * (.js, .ts, .jsx, .tsx, .mjs, .cjs, .py, .json, and verified .env files)
     */
    static isSupportedFile(filePath: string): boolean;
    /**
     * Sanitizes a file by safely replacing the leaked secret with an environment variable reference
     * Automatically creates a .bak backup before modifying any file.
     * Strips surrounding quotes in JS/TS/Python code to prevent literal string quotes around process.env.
     */
    redactSecretInFile(finding: LeakFinding, envVarName: string): boolean;
}
export {};
