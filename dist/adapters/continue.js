import fs from 'fs';
import path from 'path';
import { MANAGED_MARKER, hasAgentHubMarker, safeCleanupManagedFile, safeCleanupIgnoreFile, safeRemoveEmptyDir } from './base.js';
import { getAgentHubBinPath } from '../core/config.js';
import { SecretVault } from '../core/vault.js';
export class ContinueAdapter {
    id = 'continue';
    name = 'Continue.dev';
    generateConfig(knowledgeBasePath, skills, mcps) {
        const continueDir = path.join(knowledgeBasePath, '.continue');
        if (!fs.existsSync(continueDir)) {
            fs.mkdirSync(continueDir, { recursive: true });
        }
        // Ensure .continueignore
        SecretVault.ensureIgnoreFile(knowledgeBasePath, '.continueignore');
        const binPath = getAgentHubBinPath();
        const configYamlPath = path.join(continueDir, 'config.yaml');
        const nodeExec = process.execPath.replace(/\\/g, '/');
        const agenthubBin = binPath.replace(/\\/g, '/');
        const kbPathNormalized = knowledgeBasePath.replace(/\\/g, '/');
        const agenthubEntry = `  - name: agenthub\n    command: "${nodeExec}"\n    args:\n      - "${agenthubBin}"\n      - "serve-mcp"\n      - "--kb"\n      - "${kbPathNormalized}"`;
        if (!fs.existsSync(configYamlPath)) {
            const yamlContent = `${MANAGED_MARKER}
# Continue.dev Configuration
name: AgentHub Knowledge Base

systemMessage: |
  You are an expert autonomous software engineer operating inside an AgentHub Knowledge Base.
  1. All projects are stored under projects/. Consult PROJECTS_MAP.md before exploring large directories.
  2. For session continuity across multiple agents, check HANDOFF.md.
  3. Load specialized skills from skills/ (e.g. skills/agenthub-guide.md) on demand.
  4. Never output or commit secrets. Credentials are kept in AgentHub Vault.

docs:
  - title: AgentHub Project Map
    startUrl: file://${path.join(knowledgeBasePath, 'PROJECTS_MAP.md').replace(/\\/g, '/')}
  - title: AgentHub Handoff
    startUrl: file://${path.join(knowledgeBasePath, 'HANDOFF.md').replace(/\\/g, '/')}

mcpServers:
${agenthubEntry}
`;
            fs.writeFileSync(configYamlPath, yamlContent, 'utf8');
        }
        else {
            const content = fs.readFileSync(configYamlPath, 'utf8');
            if (!hasAgentHubMarker(content)) {
                const bakPath = `${configYamlPath}.bak`;
                if (!fs.existsSync(bakPath)) {
                    try {
                        fs.copyFileSync(configYamlPath, bakPath);
                    }
                    catch { }
                }
            }
            if (!content.includes('name: agenthub')) {
                if (/mcpServers:\s*$/m.test(content) || /mcpServers:\s*\n/m.test(content)) {
                    const updated = content.replace(/(mcpServers:\s*\n)/, `$1${agenthubEntry}\n`);
                    fs.writeFileSync(configYamlPath, updated, 'utf8');
                }
                else {
                    fs.appendFileSync(configYamlPath, `\nmcpServers:\n${agenthubEntry}\n`, 'utf8');
                }
            }
        }
    }
    cleanup(knowledgeBasePath) {
        const continueIgnorePath = path.join(knowledgeBasePath, '.continueignore');
        safeCleanupIgnoreFile(continueIgnorePath);
        const continueDir = path.join(knowledgeBasePath, '.continue');
        const configYamlPath = path.join(continueDir, 'config.yaml');
        if (fs.existsSync(configYamlPath)) {
            try {
                const content = fs.readFileSync(configYamlPath, 'utf8');
                if (hasAgentHubMarker(content)) {
                    safeCleanupManagedFile(configYamlPath);
                }
                else if (content.includes('name: agenthub')) {
                    const bakPath = `${configYamlPath}.bak`;
                    if (!fs.existsSync(bakPath)) {
                        try {
                            fs.copyFileSync(configYamlPath, bakPath);
                        }
                        catch { }
                    }
                    const cleaned = content.replace(/\s*- name: agenthub\s*\n\s*command:[^\n]*\n\s*args:\s*\n(\s*-[^\n]*\n){4}/g, '');
                    fs.writeFileSync(configYamlPath, cleaned, 'utf8');
                }
            }
            catch { }
        }
        safeRemoveEmptyDir(continueDir);
    }
}
