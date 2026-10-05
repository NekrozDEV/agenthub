# Security Policy

## Supported Versions

Only the latest release of OpenAgentHub receives security updates and patches.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Zero-Leak Security Architecture

OpenAgentHub is designed from the ground up around strict data isolation principles:

1. **Vault Isolation & Pre-Read Sanitization**:
   - Secrets are stored in `.hub/vault.env` with strict `0600` filesystem permissions and are stored locally for AgentHub tools and sanitization.
   - The `.hub` folder, `vault.env`, and `*.bak` backups are automatically added to `.gitignore`.
   - Auto-generated agent ignore files (`.cursorignore`, `.codeiumignore`, `.continueignore`, and `.zcodeignore`) strictly prevent AI editors from reading `.hub/`, `*.env*`, `.env*`, and `*.bak`.
   - Global Claude Code integration automatically injects deny permissions: `permissions.deny: ["Read(.hub/**)", "Read(**/.env*)", "Glob(.hub/**)", "Grep(.hub/**)"]`.
   - Stdio MCP server tools (`agenthub_list_vault_keys`, `agenthub_check_vault_secret`) return strictly safe metadata (`{ key, exists, status, length }`). No raw values, token previews, or masked token fragments are ever exposed to AI agents.

2. **Path Traversal Defense**:
   - All MCP tool calls (including `agenthub_get_skill`, `agenthub_audit_code`) validate target paths against the root Knowledge Base directory using `path.relative()`.
   - Any path traversal escape attempts (e.g., `../../..`) are immediately rejected with MCP error `-32602`.

3. **Leak Guard vs. Static Scanners (e.g. Gitleaks)**:
   - Unlike static git history scanners like Gitleaks that only inspect git commits or run in CI pipelines, AgentHub's `LeakGuard` operates actively across both runtime MCP tool calls (`agenthub_audit_code`) and live workspace files (`agenthub audit`), automatically migrating exposed credentials into the Zero-Leak Vault.
   - In all CLI outputs and MCP responses, detected secrets are sanitized and masked (`***...***`).
   - Multiple secrets on a single line are all masked simultaneously in generated snippets.

4. **Safe Auto-Redaction Whitelist & Non-Destructive Backups**:
   - Automated secret migration (`agenthub audit --fix`) enforces a strict whitelist of supported formats: JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`), Python (`.py`), JSON (`.json`), and verified `.env` files.
   - Compiled languages (such as Go, Rust, Java, C++) and structured markup/config files (such as YAML) are safeguarded against syntax corruption and require manual secret rotation.
   - All file edits create `.bak` backups before modifying any files on disk. Users can inspect backups via `agenthub audit --include-backups` and restore configurations at any time with `agenthub global --restore`.

5. **Critical System & Workspace Path Protection**:
   - File deletion commands (`agenthub kb remove --delete-files`) enforce strict path validation (`isCriticalSystemPath`), preventing accidental deletion of filesystem roots (`/`, `C:\`), user home directories, `process.cwd()`, or OS system folders.
   - Interactive confirmation or explicit `-y, --yes` flags are strictly required when removing files.

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
