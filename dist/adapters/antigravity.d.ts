import { AgentAdapter } from './base.js';
export declare class AntigravityAdapter implements AgentAdapter {
    id: "antigravity";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
