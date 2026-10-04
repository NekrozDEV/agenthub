export interface McpTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  requiredVaultKeys: string[];
  envMapping: Record<string, string>;
}

export const DEFAULT_MCPS: Record<string, McpTemplate> = {
  github: {
    id: 'github',
    name: 'GitHub MCP Server',
    description: 'Inspect repositories, issues, PRs, and commits via GitHub API',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    requiredVaultKeys: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    envMapping: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '${VAULT:GITHUB_PERSONAL_ACCESS_TOKEN}',
    },
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram MCP Server',
    description: 'Interact with Telegram chats, messages, channels, and bots via MTProto/API',
    command: 'python',
    args: ['-m', 'telegram_mcp'],
    requiredVaultKeys: ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH'],
    envMapping: {
      TELEGRAM_API_ID: '${VAULT:TELEGRAM_API_ID}',
      TELEGRAM_API_HASH: '${VAULT:TELEGRAM_API_HASH}',
    },
  },
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare MCP Server',
    description: 'Manage Cloudflare Workers, KV, R2 storage, D1 SQL databases, Queues and DNS',
    command: 'npx',
    args: ['-y', '@cloudflare/mcp-server-cloudflare'],
    requiredVaultKeys: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
    envMapping: {
      CLOUDFLARE_API_TOKEN: '${VAULT:CLOUDFLARE_API_TOKEN}',
      CLOUDFLARE_ACCOUNT_ID: '${VAULT:CLOUDFLARE_ACCOUNT_ID}',
    },
  },
  filesystem: {
    id: 'filesystem',
    name: 'Filesystem MCP Server',
    description: 'Secure, sandboxed local file reading and writing within projects directory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', './projects'],
    requiredVaultKeys: [],
    envMapping: {},
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL MCP Server',
    description: 'Read-only or authorized schema exploration and SQL queries',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiredVaultKeys: ['DATABASE_URL'],
    envMapping: {
      POSTGRES_CONNECTION_STRING: '${VAULT:DATABASE_URL}',
    },
  },
  fetch: {
    id: 'fetch',
    name: 'Web Fetch & Document MCP',
    description: 'Scrape web pages, fetch APIs, and convert documentation HTML to clean markdown',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    requiredVaultKeys: [],
    envMapping: {},
  },
};
