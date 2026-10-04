import { AgentAdapter } from './base.js';
export declare class OpenCodeAdapter implements AgentAdapter {
    id: "opencode";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
