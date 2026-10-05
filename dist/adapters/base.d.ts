import { SupportedAgent } from '../core/config.js';
export interface AgentAdapter {
    id: SupportedAgent;
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): Promise<void> | void;
    cleanup(knowledgeBasePath: string): Promise<void> | void;
}
export declare const MANAGED_MARKER = "# AgentHub Managed";
export declare function hasAgentHubMarker(content: string): boolean;
export declare function safeWriteManagedRuleFile(filePath: string, content: string): void;
export declare function safeCleanupManagedFile(filePath: string, extraMarkers?: string[]): boolean;
export declare function safeRemoveEmptyDir(dirPath: string): boolean;
export declare function safeCleanupIgnoreFile(filePath: string): boolean;
