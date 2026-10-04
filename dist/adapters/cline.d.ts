import { AgentAdapter } from './base.js';
export declare class ClineAdapter implements AgentAdapter {
    id: "cline";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
