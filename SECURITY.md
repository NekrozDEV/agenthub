# Security Policy

## Supported Versions

Only the latest release of OpenAgentHub receives security updates and patches.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Zero-Leak Security Architecture

OpenAgentHub is designed from the ground up around strict data isolation principles:

1. **Vault Isolation**:
   - Secrets are stored in `.hub/vault.env` with `0600` permissions.
   - The `.hub` folder and `vault.env` are automatically added to `.gitignore`.
   - The Stdio MCP server only exposes key names via `agenthub_list_vault_keys` and never outputs raw values to AI agent contexts.

2. **Path Traversal Defense**:
   - All MCP tool calls (including `agenthub_get_skill`, `agenthub_audit_code`) validate target paths against the root Knowledge Base directory using `path.relative()`.
   - Any path traversal escape attempts (e.g., `../../..`) are immediately rejected with MCP error `-32602`.

3. **Leak Masking Guarantee**:
   - `LeakGuard` scans files and text snippets for high-entropy secrets (OpenAI, Anthropic, GitHub, AWS, Stripe, Slack, database credentials, and private keys).
   - In all CLI outputs and MCP responses, detected secrets are masked (`***...***`).
   - Multiple secrets on a single line are all masked simultaneously in generated snippets.

4. **Non-Destructive IDE Configuration**:
   - All IDE configuration writes create `.bak` backups before modifying any files.
   - You can roll back configurations at any time with `agenthub global --restore`.
   - File edits performed during `agenthub audit --fix` create `.bak` backups and properly adjust syntax without breaking string quoting.

## Reporting a Vulnerability

If you discover a security vulnerability in OpenAgentHub, please do **NOT** open a public issue.

Instead, please report it privately:
- **Email**: `nekrozaiqq@gmail.com`
- **GitHub**: Use [GitHub Private Vulnerability Reporting](https://github.com/NekrozDEV/agenthub/security/advisories/new)

Please include:
- A description of the issue and potential impact
- Steps to reproduce or proof-of-concept
- Proposed mitigation if available

### Response Timeline
- **Initial Response**: Within 24 hours
- **Assessment & Triage**: Within 48 hours
- **Fix & Advisory Release**: Within 7 days
