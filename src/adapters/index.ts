import { AgentAdapter } from './base.js';
import { AntigravityAdapter } from './antigravity.js';
import { ClaudeCodeAdapter } from './claudecode.js';
import { DeepSeekAdapter } from './deepseek.js';
import { OpenCodeAdapter } from './opencode.js';
import { CursorAdapter } from './cursor.js';
import { SupportedAgent } from '../core/config.js';

export const ALL_ADAPTERS: Record<SupportedAgent, AgentAdapter> = {
  antigravity: new AntigravityAdapter(),
  'claude-code': new ClaudeCodeAdapter(),
  'deepseek-hermes': new DeepSeekAdapter(),
  opencode: new OpenCodeAdapter(),
  cursor: new CursorAdapter(),
  codex: {
    id: 'codex',
    name: 'OpenAI Codex',
    generateConfig: () => {},
    cleanup: () => {},
  },
};

export async function syncAdapters(
  knowledgeBasePath: string,
  enabledAgents: SupportedAgent[],
  skills: string[],
  mcps: string[]
): Promise<string[]> {
  const synced: string[] = [];

  for (const [agentId, adapter] of Object.entries(ALL_ADAPTERS)) {
    if (enabledAgents.includes(agentId as SupportedAgent)) {
      await adapter.generateConfig(knowledgeBasePath, skills, mcps);
      synced.push(adapter.name);
    } else {
      await adapter.cleanup(knowledgeBasePath);
    }
  }

  return synced;
}
