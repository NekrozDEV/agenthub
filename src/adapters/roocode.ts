import fs from 'fs';
import path from 'path';
import { AgentAdapter, MANAGED_MARKER, hasAgentHubMarker, safeWriteManagedRuleFile, safeCleanupManagedFile } from './base.js';

export class RooCodeAdapter implements AgentAdapter {
  id = 'roo-code' as const;
  name = 'Roo Code (VS Code)';

  generateConfig(knowledgeBasePath: string, skills: string[], mcps: string[]): void {
    // 1. .roomodes custom instructions
    const roomodesPath = path.join(knowledgeBasePath, '.roomodes');
    const agentHubMode = {
      slug: 'agenthub-engineer',
      name: 'AgentHub Engineer',
      roleDefinition:
        'You are an expert autonomous software engineer operating within the AgentHub Knowledge Base ecosystem. You respect token limits, consult PROJECTS_MAP.md, load skills on demand, and uphold zero-leak secret security.',
      groups: ['read', 'edit', 'browser', 'command', 'mcp'],
      customInstructions:
        'Always consult skills/agenthub-guide.md. For multi-project orientation, check PROJECTS_MAP.md. For task state across agent sessions, inspect HANDOFF.md. Secrets are stored in AgentHub Vault and must never be echoed or committed.',
    };

    let modeData: any = {
      _comment: MANAGED_MARKER,
      customModes: [agentHubMode],
    };

    if (fs.existsSync(roomodesPath)) {
      try {
        const raw = fs.readFileSync(roomodesPath, 'utf8');
        if (!hasAgentHubMarker(raw)) {
          const bakPath = `${roomodesPath}.bak`;
          if (!fs.existsSync(bakPath)) {
            try { fs.copyFileSync(roomodesPath, bakPath); } catch {}
          }
        }
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.customModes)) {
          const userModes = parsed.customModes.filter((m: any) => m.slug !== 'agenthub-engineer');
          modeData = {
            _comment: MANAGED_MARKER,
            ...parsed,
            customModes: [...userModes, agentHubMode],
          };
        }
      } catch {}
    }

    fs.writeFileSync(roomodesPath, JSON.stringify(modeData, null, 2), 'utf8');

    // Also support .clinerules if not present
    const clineRulesPath = path.join(knowledgeBasePath, '.clinerules');
    if (!fs.existsSync(clineRulesPath)) {
      const clineContent = `${MANAGED_MARKER}
# Roo Code Rules
- Consult \`PROJECTS_MAP.md\` to preserve context.
- Read \`HANDOFF.md\` for cross-agent task checkpoints.
- Follow \`skills/agenthub-guide.md\` and loaded skills.
- Strictly adhere to zero-secrets policy. Credentials live in AgentHub Vault.
`;
      safeWriteManagedRuleFile(clineRulesPath, clineContent);
    }
  }

  cleanup(knowledgeBasePath: string): void {
    const roomodesPath = path.join(knowledgeBasePath, '.roomodes');
    if (fs.existsSync(roomodesPath)) {
      try {
        const raw = fs.readFileSync(roomodesPath, 'utf8');
        if (hasAgentHubMarker(raw)) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.customModes)) {
            const userModes = parsed.customModes.filter((m: any) => m.slug !== 'agenthub-engineer');
            if (userModes.length > 0) {
              const bakPath = `${roomodesPath}.bak`;
              if (!fs.existsSync(bakPath)) {
                try { fs.copyFileSync(roomodesPath, bakPath); } catch {}
              }
              delete parsed._comment;
              parsed.customModes = userModes;
              fs.writeFileSync(roomodesPath, JSON.stringify(parsed, null, 2), 'utf8');
              return;
            }
          }
        }
      } catch {}
    }
    safeCleanupManagedFile(roomodesPath);

    const clineRulesPath = path.join(knowledgeBasePath, '.clinerules');
    if (fs.existsSync(clineRulesPath)) {
      try {
        const raw = fs.readFileSync(clineRulesPath, 'utf8');
        if (raw.includes('# Roo Code Rules') && hasAgentHubMarker(raw)) {
          safeCleanupManagedFile(clineRulesPath);
        }
      } catch {}
    }
  }
}

