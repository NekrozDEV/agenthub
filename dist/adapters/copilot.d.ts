import { AgentAdapter } from './base.js';
export declare class CopilotAdapter implements AgentAdapter {
    id: "copilot";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
