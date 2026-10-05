import { AgentAdapter } from './base.js';
export declare class ZCodeAdapter implements AgentAdapter {
    id: "zcode";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
