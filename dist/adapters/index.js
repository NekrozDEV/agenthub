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
export const ALL_ADAPTERS = {
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
    codex: {
        id: 'codex',
        name: 'OpenAI Codex',
        generateConfig: () => { },
        cleanup: () => { },
    },
};
export async function syncAdapters(knowledgeBasePath, enabledAgents, skills, mcps) {
    const synced = [];
    for (const [agentId, adapter] of Object.entries(ALL_ADAPTERS)) {
        if (enabledAgents.includes(agentId)) {
            await adapter.generateConfig(knowledgeBasePath, skills, mcps);
            synced.push(adapter.name);
        }
        else {
            await adapter.cleanup(knowledgeBasePath);
        }
    }
    return synced;
}
