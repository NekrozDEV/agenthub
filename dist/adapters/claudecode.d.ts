import { AgentAdapter } from './base.js';
export declare class ClaudeCodeAdapter implements AgentAdapter {
    id: "claude-code";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
