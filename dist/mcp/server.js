import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { SecretVault } from '../core/vault.js';
import { LeakGuard } from '../core/leak-guard.js';
import { RepoMapGenerator } from '../core/repomap.js';
import { HandoffManager } from '../core/handoff.js';
import { resolveKnowledgeBasePath } from '../core/config.js';
export class AgentHubMcpServer {
    server;
    knowledgeBasePath;
    vault;
    leakGuard;
    handoffManager;
    repoMapGen;
    constructor(customKnowledgeBasePath) {
        this.knowledgeBasePath = resolveKnowledgeBasePath(customKnowledgeBasePath);
        this.vault = new SecretVault(this.knowledgeBasePath);
        this.leakGuard = new LeakGuard(this.knowledgeBasePath);
        this.handoffManager = new HandoffManager(this.knowledgeBasePath);
        this.repoMapGen = new RepoMapGenerator(this.knowledgeBasePath);
        this.server = new Server({
            name: 'open-agenthub',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        });
        this.setupTools();
        this.setupResources();
        this.setupPrompts();
    }
    setupTools() {
        // 1. List Tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'agenthub_list_skills',
                        description: 'List all available engineering skills/playbooks in the AgentHub Knowledge Base with short descriptions.',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'agenthub_get_skill',
                        description: 'Fetch full content of a specific skill on-demand from AgentHub Knowledge Base (conserves tokens by loading only when required).',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                skillName: {
                                    type: 'string',
                                    description: 'Name or filename of the skill (e.g., "agenthub-guide.md", "git-workflow.md", "code-review.md", "bug-hunter.md")',
                                },
                            },
                            required: ['skillName'],
                        },
                    },
                    {
                        name: 'agenthub_get_project_map',
                        description: 'Fetch the compact, token-efficient architecture overview of all workspaces/projects in AgentHub (PROJECTS_MAP.md).',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                refresh: {
                                    type: 'boolean',
                                    description: 'Whether to re-scan the projects/ directory and refresh PROJECTS_MAP.md',
                                },
                            },
                        },
                    },
                    {
                        name: 'agenthub_get_handoff',
                        description: 'Read the latest cross-agent session handoff checkpoint (HANDOFF.md) to seamlessly resume work started by another AI.',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'agenthub_create_handoff',
                        description: 'Record a cross-agent handoff checkpoint when completing a milestone or switching between models/sessions.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                task: {
                                    type: 'string',
                                    description: 'The current active task or goal being worked on',
                                },
                                summary: {
                                    type: 'string',
                                    description: 'Progress achieved and what has been completed so far',
                                },
                                status: {
                                    type: 'string',
                                    enum: ['in_progress', 'blocked', 'ready_for_review', 'completed'],
                                    description: 'Status of the task',
                                },
                                fromAgent: {
                                    type: 'string',
                                    description: 'Name of the current AI agent recording the checkpoint',
                                },
                                toAgent: {
                                    type: 'string',
                                    description: 'Name of the next intended agent (optional)',
                                },
                                modifiedFiles: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'List of files modified or created during this session',
                                },
                                nextSteps: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Ordered list of concrete next steps for the next agent',
                                },
                                notes: {
                                    type: 'string',
                                    description: 'Important architectural context, caveats, or decisions',
                                },
                            },
                            required: ['task', 'summary'],
                        },
                    },
                    {
                        name: 'agenthub_list_vault_keys',
                        description: 'List all secret/token keys available in AgentHub Zero-Leak Vault without exposing sensitive values.',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'agenthub_check_vault_secret',
                        description: 'Verify whether a required secret key exists in the Vault and return its masked preview. NEVER leaks the raw value.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                key: {
                                    type: 'string',
                                    description: 'Secret key name to verify (e.g. GITHUB_TOKEN, OPENAI_API_KEY)',
                                },
                            },
                            required: ['key'],
                        },
                    },
                    {
                        name: 'agenthub_list_mcps',
                        description: 'List configured MCP tool templates and integrations in the AgentHub Knowledge Base (e.g. github, postgres, filesystem).',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'agenthub_audit_code',
                        description: 'Scan code text or workspace directory for accidental API tokens, passwords, and private keys (Leak Guard).',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                text: {
                                    type: 'string',
                                    description: 'Code snippet or text to scan for secret leaks',
                                },
                                directory: {
                                    type: 'string',
                                    description: 'Relative or absolute directory path to scan (defaults to projects/)',
                                },
                            },
                        },
                    },
                ],
            };
        });
        // 2. Call Tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'agenthub_list_skills': {
                    const skillsDir = path.join(this.knowledgeBasePath, 'skills');
                    if (!fs.existsSync(skillsDir)) {
                        return {
                            content: [{ type: 'text', text: 'No skills directory found in knowledge base.' }],
                        };
                    }
                    const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
                    const skillList = files.map((f) => {
                        const content = fs.readFileSync(path.join(skillsDir, f), 'utf8');
                        const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
                        const firstHeading = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || f;
                        return {
                            file: f,
                            title: firstHeading,
                            path: path.join('skills', f),
                        };
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    knowledgeBase: this.knowledgeBasePath,
                                    totalSkills: skillList.length,
                                    skills: skillList,
                                    instruction: 'To load full instructions for any skill, call agenthub_get_skill with the skill filename.',
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'agenthub_get_skill': {
                    const rawSkillName = String(args?.skillName || '').trim();
                    if (!rawSkillName) {
                        throw new McpError(ErrorCode.InvalidParams, 'skillName parameter is required');
                    }
                    const cleanName = path.basename(rawSkillName);
                    const filename = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`;
                    const skillsDir = path.join(this.knowledgeBasePath, 'skills');
                    const skillPath = path.join(skillsDir, filename);
                    if (!fs.existsSync(skillPath)) {
                        const availableSkills = fs.existsSync(skillsDir)
                            ? fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'))
                            : [];
                        throw new McpError(ErrorCode.InvalidParams, `Skill '${cleanName}' not found in ${skillsDir}. Available skills: [${availableSkills.join(', ')}]`);
                    }
                    const content = fs.readFileSync(skillPath, 'utf8');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: content,
                            },
                        ],
                    };
                }
                case 'agenthub_get_project_map': {
                    if (args?.refresh) {
                        this.repoMapGen.saveRepoMap();
                    }
                    const mapPath = path.join(this.knowledgeBasePath, 'PROJECTS_MAP.md');
                    let content = '';
                    if (fs.existsSync(mapPath)) {
                        content = fs.readFileSync(mapPath, 'utf8');
                    }
                    else {
                        content = this.repoMapGen.generateRepoMapMarkdown();
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: content,
                            },
                        ],
                    };
                }
                case 'agenthub_get_handoff': {
                    const latest = this.handoffManager.getLatest();
                    const mdPath = path.join(this.knowledgeBasePath, 'HANDOFF.md');
                    const mdContent = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    hasActiveCheckpoint: !!latest,
                                    checkpoint: latest,
                                    markdownDocument: mdContent,
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'agenthub_create_handoff': {
                    const rawStatus = String(args?.status || 'in_progress').toLowerCase();
                    const validStatuses = ['in_progress', 'blocked', 'ready_for_review', 'completed'];
                    const status = validStatuses.includes(rawStatus) ? rawStatus : 'in_progress';
                    const cp = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        activeTask: String(args?.task || 'Unnamed task'),
                        status,
                        sourceAgent: String(args?.fromAgent || 'mcp-agent'),
                        targetAgent: args?.toAgent ? String(args.toAgent) : undefined,
                        summary: String(args?.summary || 'Progress updated via AgentHub MCP'),
                        modifiedFiles: Array.isArray(args?.modifiedFiles) ? args.modifiedFiles : [],
                        nextSteps: Array.isArray(args?.nextSteps)
                            ? args.nextSteps
                            : ['Continue implementation.'],
                        notes: args?.notes ? String(args.notes) : undefined,
                    };
                    this.handoffManager.saveCheckpoint(cp);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Handoff checkpoint saved successfully! Updated HANDOFF.md and .hub/memory/handoff.json.`,
                            },
                        ],
                    };
                }
                case 'agenthub_list_vault_keys': {
                    this.vault.load();
                    const keys = this.vault.listKeys();
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    totalKeys: keys.length,
                                    availableKeys: keys,
                                    notice: 'Values are protected under Zero-Leak security policy. Tokens are injected into subprocesses or environment.',
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'agenthub_check_vault_secret': {
                    this.vault.load();
                    const key = String(args?.key || '');
                    const has = this.vault.hasSecret(key);
                    const raw = this.vault.getSecret(key);
                    const masked = raw ? LeakGuard.mask(raw) : null;
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    key,
                                    exists: has,
                                    maskedPreview: masked,
                                    status: has ? 'AVAILABLE' : 'MISSING',
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'agenthub_list_mcps': {
                    const mcpDir = path.join(this.knowledgeBasePath, 'mcp');
                    if (!fs.existsSync(mcpDir)) {
                        return {
                            content: [{ type: 'text', text: 'No MCP directory found in knowledge base.' }],
                        };
                    }
                    const files = fs.readdirSync(mcpDir).filter((f) => f.endsWith('.json'));
                    const mcps = files.map((f) => {
                        try {
                            const parsed = JSON.parse(fs.readFileSync(path.join(mcpDir, f), 'utf8'));
                            return { id: f.replace(/\.json$/, ''), ...parsed };
                        }
                        catch {
                            return { id: f.replace(/\.json$/, ''), file: f };
                        }
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ total: mcps.length, mcps }, null, 2),
                            },
                        ],
                    };
                }
                case 'agenthub_audit_code': {
                    if (args?.text) {
                        const findings = this.leakGuard.scanContent(String(args.text), 'snippet.txt');
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        leaksDetected: findings.length,
                                        findings: findings.map((f) => ({
                                            type: f.type,
                                            line: f.line,
                                            masked: f.maskedSecret,
                                            snippet: f.snippet,
                                        })),
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    const kbRoot = path.resolve(this.knowledgeBasePath);
                    let targetDir;
                    if (args?.directory) {
                        const requested = path.resolve(kbRoot, String(args.directory));
                        const rel = path.relative(kbRoot, requested);
                        if (rel.startsWith('..') || path.isAbsolute(rel)) {
                            throw new McpError(ErrorCode.InvalidParams, `Security violation: Directory path '${args.directory}' attempts directory traversal outside Knowledge Base (${kbRoot})`);
                        }
                        targetDir = requested;
                    }
                    else {
                        targetDir = path.join(kbRoot, 'projects');
                    }
                    if (!fs.existsSync(targetDir)) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        scannedPath: path.relative(kbRoot, targetDir) || '.',
                                        leaksDetected: 0,
                                        findings: [],
                                        message: `Directory does not exist: ${path.relative(kbRoot, targetDir)}`,
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    const findings = this.leakGuard.scanDirectory(targetDir);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    scannedPath: path.relative(kbRoot, targetDir) || '.',
                                    leaksDetected: findings.length,
                                    findings: findings.map((f) => ({
                                        file: path.relative(kbRoot, f.filePath),
                                        type: f.type,
                                        line: f.line,
                                        masked: f.maskedSecret,
                                        snippet: f.snippet,
                                    })),
                                }, null, 2),
                            },
                        ],
                    };
                }
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        });
    }
    setupResources() {
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = [
                {
                    uri: 'agenthub://projects-map',
                    name: 'Unified Project Architecture Map',
                    mimeType: 'text/markdown',
                    description: 'Compact overview of all workspaces in projects/',
                },
                {
                    uri: 'agenthub://handoff',
                    name: 'Cross-Agent Session Handoff',
                    mimeType: 'text/markdown',
                    description: 'Active session handoff checkpoint and remaining next steps',
                },
                {
                    uri: 'agenthub://guide',
                    name: 'AgentHub Universal Agent Guide',
                    mimeType: 'text/markdown',
                    description: 'Meta-skill instructions for operating in AgentHub',
                },
            ];
            const skillsDir = path.join(this.knowledgeBasePath, 'skills');
            if (fs.existsSync(skillsDir)) {
                const skillFiles = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
                for (const sf of skillFiles) {
                    resources.push({
                        uri: `agenthub://skills/${sf}`,
                        name: `Skill Playbook: ${sf.replace(/\.md$/, '')}`,
                        mimeType: 'text/markdown',
                        description: `On-demand playbook instructions for ${sf}`,
                    });
                }
            }
            return { resources };
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            if (uri === 'agenthub://projects-map') {
                const file = path.join(this.knowledgeBasePath, 'PROJECTS_MAP.md');
                const text = fs.existsSync(file)
                    ? fs.readFileSync(file, 'utf8')
                    : this.repoMapGen.generateRepoMapMarkdown();
                return {
                    contents: [{ uri, mimeType: 'text/markdown', text }],
                };
            }
            if (uri === 'agenthub://handoff') {
                const file = path.join(this.knowledgeBasePath, 'HANDOFF.md');
                const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# No handoff recorded yet.';
                return {
                    contents: [{ uri, mimeType: 'text/markdown', text }],
                };
            }
            if (uri === 'agenthub://guide') {
                const file = path.join(this.knowledgeBasePath, 'skills', 'agenthub-guide.md');
                const text = fs.existsSync(file)
                    ? fs.readFileSync(file, 'utf8')
                    : '# AgentHub Guide\nConsult PROJECTS_MAP.md and HANDOFF.md.';
                return {
                    contents: [{ uri, mimeType: 'text/markdown', text }],
                };
            }
            if (uri.startsWith('agenthub://skills/')) {
                const skillFile = path.basename(uri.replace('agenthub://skills/', ''));
                const safeSkillFile = skillFile.endsWith('.md') ? skillFile : `${skillFile}.md`;
                const file = path.join(this.knowledgeBasePath, 'skills', safeSkillFile);
                if (fs.existsSync(file)) {
                    const text = fs.readFileSync(file, 'utf8');
                    return {
                        contents: [{ uri, mimeType: 'text/markdown', text }],
                    };
                }
            }
            throw new McpError(ErrorCode.InvalidParams, `Unknown resource URI: ${uri}`);
        });
    }
    setupPrompts() {
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: [
                    {
                        name: 'agenthub_resume_task',
                        description: 'Generate a comprehensive starting prompt for resuming an in-flight task from HANDOFF.md',
                    },
                ],
            };
        });
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name } = request.params;
            if (name === 'agenthub_resume_task') {
                const prompt = this.handoffManager.generatePromptForAgent('AI Assistant');
                return {
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: prompt,
                            },
                        },
                    ],
                };
            }
            throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
        });
    }
    async start() {
        const transport = new StdioServerTransport();
        // Do NOT write to stdout! Use stderr for diagnostics.
        console.error(`[AgentHub MCP Server] Connected to Knowledge Base: ${this.knowledgeBasePath}`);
        await this.server.connect(transport);
    }
}
export async function startAgentHubMcpServer(customKnowledgeBasePath) {
    const server = new AgentHubMcpServer(customKnowledgeBasePath);
    await server.start();
}
