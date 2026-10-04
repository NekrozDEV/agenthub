import { AgentAdapter } from './base.js';
export declare class ContinueAdapter implements AgentAdapter {
    id: "continue";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
