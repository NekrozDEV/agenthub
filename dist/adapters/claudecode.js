import fs from 'fs';
import path from 'path';
export class ClaudeCodeAdapter {
    id = 'claude-code';
    name = 'Anthropic Claude Code';
    generateConfig(knowledgeBasePath, skills, mcps) {
        const claudeMdPath = path.join(knowledgeBasePath, 'CLAUDE.md');
        const content = `# CLAUDE.md - AgentHub Managed Workspace

## Workspace Navigation & Token Efficiency
- User projects are stored in \`projects/\`.
- **CRITICAL**: Before reading entire source directories, read \`PROJECTS_MAP.md\` to understand project boundaries and architectures.
- **Cross-Agent Handoff**: If continuing a prior session from another agent, check \`HANDOFF.md\` for latest checkpoint and remaining tasks.

## Active Skills (Load as needed)
${skills.map((s) => `- \`skills/${s}\``).join('\n')}

## Security & Secrets
- Never request, write, or leak API keys in chat or git.
- Sensitive environment variables and tokens are securely isolated in AgentHub Vault.
`;
        fs.writeFileSync(claudeMdPath, content, 'utf8');
        // Create .claude directory with safe config
        const claudeDir = path.join(knowledgeBasePath, '.claude');
        if (!fs.existsSync(claudeDir)) {
            fs.mkdirSync(claudeDir, { recursive: true });
        }
    }
    cleanup(knowledgeBasePath) {
        const claudeMdPath = path.join(knowledgeBasePath, 'CLAUDE.md');
        if (fs.existsSync(claudeMdPath)) {
            fs.unlinkSync(claudeMdPath);
        }
    }
}
