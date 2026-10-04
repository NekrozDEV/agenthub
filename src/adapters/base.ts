import { SupportedAgent } from '../core/config.js';

export interface AgentAdapter {
  id: SupportedAgent;
  name: string;
  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): Promise<void> | void;
  cleanup(knowledgeBasePath: string): Promise<void> | void;
}
