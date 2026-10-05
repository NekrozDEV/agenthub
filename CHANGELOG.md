# Changelog

All notable changes to **OpenAgentHub** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.2] - 2026-10-05

### Added
- **Claude Monolith Terracotta Banner**: Brand new CLI banner design featuring Anthropic Claude terracotta palette (`#F08B6B`, `#D97757`, `#B85536`, `#5C2818`, `#3E180D`) with clear separation between AGENT and HUB.
- **Interactive Menu Looping & Terminal UX**: Interactive menus in `agenthub` now remain active after actions, prompting to return to menu instead of terminating the process; added screen clearing before banner display.
- **100% Russian Translations**: Complete Russian localization coverage for setup wizard, interactive menus, banners, and CLI messages.

### Security & Hardening
- **Backup File Git Isolation**: `*.bak` backup files containing pre-redaction credentials are now strictly added to `.gitignore` via `SecretVault.ensureGitIgnored()` to prevent accidental git staging.
- **Automatic Git Protection**: `SecretVault.ensureGitIgnored()` is automatically invoked upon `save()` and `setSecret()`.
- **File Extension Whitelist for Redaction**: `LeakGuard.redactSecretInFile()` and `agenthub audit --fix` now safely restrict string replacement to supported extensions (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.py`, `.json`, `.env*`), issuing clear warnings for unsupported files (e.g., Go, Rust, Java) to prevent code syntax corruption.
- **Secret Vault Deduplication**: `agenthub audit --fix` now deduplicates secret environment variable assignments across multiple occurrences of identical credentials.
- **Dynamic MCP Server Version**: Replaced hardcoded version in MCP Server with dynamic runtime `getCurrentVersion()`.

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
