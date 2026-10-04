export interface McpTemplate {
    id: string;
    name: string;
    description: string;
    command: string;
    args: string[];
    requiredVaultKeys: string[];
    envMapping: Record<string, string>;
}
export declare const DEFAULT_MCPS: Record<string, McpTemplate>;
