import { AgentAdapter } from './base.js';
import { SupportedAgent } from '../core/config.js';
export declare const ALL_ADAPTERS: Record<SupportedAgent, AgentAdapter>;
export declare function syncAdapters(knowledgeBasePath: string, enabledAgents: SupportedAgent[], skills: string[], mcps: string[]): Promise<string[]>;
