import { AgentAdapter } from './base.js';
export declare class RooCodeAdapter implements AgentAdapter {
    id: "roo-code";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
