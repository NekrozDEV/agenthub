import { AgentAdapter } from './base.js';
export declare class DeepSeekAdapter implements AgentAdapter {
    id: "deepseek-hermes";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
