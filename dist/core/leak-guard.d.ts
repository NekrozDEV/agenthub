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
     */
    scanDirectory(dirPath?: string): LeakFinding[];
    /**
     * Sanitizes a file by replacing the leaked secret with a placeholder env var name
     */
    redactSecretInFile(finding: LeakFinding, envVarName: string): boolean;
}
export {};
