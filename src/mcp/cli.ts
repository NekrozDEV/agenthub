import { startAgentHubMcpServer } from './server.js';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AgentHub MCP Server (Stdio)

Usage:
  agenthub-mcp [--kb <knowledge-base-path>]
  agenthub serve-mcp [--kb <knowledge-base-path>]

Options:
  --kb <path>    Explicit path to AgentHub Knowledge Base (defaults to active KB in ~/.agenthub/config.json)
  -h, --help     Show this help message

Description:
  Runs the built-in Model Context Protocol (MCP) server over standard I/O (JSON-RPC),
  allowing AI agents anywhere on the system (Claude Code, Windsurf, Cursor, Cline,
  Roo Code, Continue, Copilot, Antigravity) to access AgentHub skills, repo maps,
  handoffs, and the Zero-Leak security vault.
`);
  process.exit(0);
}

let kbPath: string | undefined;
const kbArgIndex = process.argv.indexOf('--kb');
if (kbArgIndex !== -1 && process.argv[kbArgIndex + 1]) {
  kbPath = process.argv[kbArgIndex + 1];
}

startAgentHubMcpServer(kbPath).catch((err) => {
  console.error('[AgentHub MCP Fatal Error]:', err);
  process.exit(1);
});
