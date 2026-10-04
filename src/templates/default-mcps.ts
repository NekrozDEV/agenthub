export interface McpTemplate {
  name: string;
  description: string;
  command: string;
  args: string[];
  requiredVaultKeys: string[];
  envMapping: Record<string, string>;
}

export const DEFAULT_MCPS: Record<string, McpTemplate> = {
  github: {
    name: 'GitHub MCP Server',
    description: 'Inspect repositories, issues, PRs, and commits via GitHub API',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    requiredVaultKeys: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    envMapping: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '${VAULT:GITHUB_PERSONAL_ACCESS_TOKEN}',
    },
  },
  postgres: {
    name: 'PostgreSQL MCP Server',
    description: 'Read-only or authorized schema exploration and SQL queries',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiredVaultKeys: ['DATABASE_URL'],
    envMapping: {
      POSTGRES_CONNECTION_STRING: '${VAULT:DATABASE_URL}',
    },
  },
  filesystem: {
    name: 'Filesystem MCP Server',
    description: 'Secure, sandboxed local file reading and writing within projects directory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', './projects'],
    requiredVaultKeys: [],
    envMapping: {},
  },
};
