import { AgentAdapter } from './base.js';
export declare class CursorAdapter implements AgentAdapter {
    id: "cursor";
    name: string;
    generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void;
    cleanup(knowledgeBasePath: string): void;
}
