import { AgentAdapter } from './base.js';
import { AntigravityAdapter } from './antigravity.js';
import { ClaudeCodeAdapter } from './claudecode.js';
import { DeepSeekAdapter } from './deepseek.js';
import { OpenCodeAdapter } from './opencode.js';
import { CursorAdapter } from './cursor.js';
import { WindsurfAdapter } from './windsurf.js';
import { ClineAdapter } from './cline.js';
import { RooCodeAdapter } from './roocode.js';
import { ContinueAdapter } from './continue.js';
import { CopilotAdapter } from './copilot.js';
import { ZCodeAdapter } from './zcode.js';
import { SupportedAgent } from '../core/config.js';

export const ALL_ADAPTERS: Record<SupportedAgent, AgentAdapter> = {
  antigravity: new AntigravityAdapter(),
  'claude-code': new ClaudeCodeAdapter(),
  'deepseek-hermes': new DeepSeekAdapter(),
  opencode: new OpenCodeAdapter(),
  cursor: new CursorAdapter(),
  windsurf: new WindsurfAdapter(),
  cline: new ClineAdapter(),
  'roo-code': new RooCodeAdapter(),
  continue: new ContinueAdapter(),
  copilot: new CopilotAdapter(),
  zcode: new ZCodeAdapter(),
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
