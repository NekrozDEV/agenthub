# Changelog

All notable changes to **OpenAgentHub** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.1] - 2026-10-05

### Added
- **SECURITY.md**: Comprehensive security policy, disclosure SLA, and zero-leak architecture specification.
- **Auto-Backups on Code Fix**: `agenthub audit --fix` now automatically creates a `.bak` backup copy of any modified file before editing.
- **Smart Quoting Replacement**: `redactSecretInFile` now strips outer string quotes (`"..."`, `'...'`, `` `...` ``) in JS/TS/Python code so that `process.env.VAR || ""` or `os.environ.get()` is inserted as valid executable expressions rather than a string literal.

### Fixed
- **Multi-Secret Line Sanitization**: Fixed an issue where lines containing multiple secrets only masked the first occurrence in the snippet; all secrets on the line are now simultaneously masked.
- **Vulnerability Remediation**: Removed unused `fast-glob` dependency from `package.json`, completely eliminating transitive `braces`/`micromatch` high-severity advisory (`npm audit` now reports 0 vulnerabilities).
- **Package Unification**: Officially deprecated legacy `@nekrozdev/agenthub` in favor of official `open-agenthub`.
- **Reproducible Build Alignment**: Synchronized `updater.ts` with `open-agenthub` npm registry URL and aligned git tag `v0.1.1` with the published npm artifact.

---

## [0.1.0] - 2026-10-05

### Added
- Initial public release of **OpenAgentHub**.
- Universal Knowledge Base (`skills/`, `projects/`, `mcp/`).
- Built-in Stdio MCP Server exposing 9 tools and 4 resources.
- Zero-Leak Vault (`.hub/vault.env`) with strict file system isolation and `0600` permissions.
- Leak Guard scanner for high-entropy API keys and private certificates.
- Cross-Agent Handoff protocol (`HANDOFF.md`, `agenthub handoff`).
- Compact architecture RepoMap generator (`PROJECTS_MAP.md`).
- Multi-IDE adapters and global configuration sync for Cursor, Windsurf, VS Code (Cline/Roo Code), Continue.dev, Claude Desktop, Claude Code, and Google Antigravity.
- Interactive bilingual CLI setup wizard (`en` / `ru`).
- Rollback capability via `agenthub global --restore`.
