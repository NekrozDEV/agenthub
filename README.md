<a id="-openagenthub"></a>
<a id="openagenthub"></a>
<a id="english-version"></a>

# 🚀 OpenAgentHub

<div align="center">

[🇷🇺 **Перейти к версии на русском языке**](#-openagenthub-на-русском) &nbsp;&nbsp;|&nbsp;&nbsp; [🇬🇧 **English version**](#-openagenthub)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18.0.0](https://img.shields.io/badge/Node->=18.0.0-green.svg)](https://nodejs.org/)
[![MCP: Built-in](https://img.shields.io/badge/MCP-Server%20Built--in-blueviolet.svg)](https://modelcontextprotocol.io/)
[![Zero-Leak Security](https://img.shields.io/badge/Security-Zero--Leak%20Vault-brightgreen.svg)]()
[![Context Optimization](https://img.shields.io/badge/Context-Smart%20On--Demand-orange.svg)]()
[![GitHub: NekrozDEV](https://img.shields.io/badge/GitHub-NekrozDEV%2Fagenthub-181717.svg?logo=github)](https://github.com/NekrozDEV/agenthub)

<p align="center">
  <b>Universal Knowledge Base, Zero-Leak Security Vault, Context Optimizer & Multi-IDE MCP Server for AI Coding Agents</b>
</p>

*Connect once — empower all your AI agents across Windsurf, Cursor, Google Antigravity, Claude Code, Cline, Roo Code, Continue.dev, GitHub Copilot, DeepSeek, and OpenAI Codex.*

</div>

---

<a id="english-version"></a>

## 🌟 Why AgentHub?

Modern AI software development is suffering from **severe fragmentation, token bloat, and security risks**:

1. **Rule & Configuration Chaos**: Every AI tool invents its own rule format — Claude Code requires `CLAUDE.md`, Windsurf uses `.windsurfrules`, Cursor relies on `.cursorrules`, Cline needs `.clinerules`, Continue uses `config.yaml`, and Antigravity uses proprietary skill directories. Maintaining them across multiple projects is a nightmare.
2. **Brutal Context & Token Bloat**: Shoveling hundreds of lines of instructions and tools into every prompt burns unnecessary tokens per turn, degrades model attention, slows response times, and blows through API budgets.
3. **Catastrophic Secret Leaks**: Developers accidentally paste API keys, database credentials, and production tokens into agent prompts or commit them into rule files and git history.
4. **Context Loss on Agent Handoff**: When your Claude Code session runs out of quota or context limit, switching over to Cursor, Antigravity, or DeepSeek forces you to re-explain the entire task, architecture, and current progress from scratch.

### 💡 The Solution: AgentHub
**AgentHub** unifies everything into **one smart, secure, and shared Knowledge Base**:
- **Zero-Leak Vault**: Secrets stay on your machine, never leaked into model contexts or git repositories.
- **Smart Context Preservation**: Compact on-demand indexes instead of dumping megabytes of documentation.
- **Cross-Agent Handoff**: Seamlessly pass tasks and session state between different AI models and IDEs.
- **Built-in Stdio MCP Server**: 9 native tools and resources available directly inside any MCP-compatible IDE.
- **Global IDE Sync**: Automatically configure all your installed editors with a single command.

---

## ⚡ Quick Start & Installation

### Option 1: Global Installation via Git & npm (Recommended)

You can install **AgentHub** globally on your system directly from GitHub in a single command:

```bash
# Recommended: Install globally from GitHub archive (works reliably on Windows, macOS, Linux)
npm install -g https://github.com/NekrozDEV/agenthub/archive/refs/heads/main.tar.gz

# Or install via Git repository (add --force if overwriting an existing link or install):
npm install -g --force git+https://github.com/NekrozDEV/agenthub.git

# Run the interactive setup wizard in any directory
agenthub init

# Or launch the interactive Main TUI Menu
agenthub
```

> [!TIP]
> **Automatic Updates**: When a new version is released, AgentHub will automatically notify you. You can upgrade at any time with a single command:
> ```bash
> agenthub update
> ```

### Option 2: Clone & Build from Source

```bash
# Clone the repository
git clone https://github.com/NekrozDEV/agenthub.git
cd agenthub

# Install dependencies, build and link globally
npm install
npm run build
npm link
```

---

## 🌐 Two Operational Modes: Work From Anywhere

You are **not locked into a single directory**. OpenAgentHub supports two flexible modes:

1. **Central Hub Mode (Mono-Hub)**:  
   Store your active repositories inside `projects/` (e.g. `~/AiKnowledgeBase/projects/my-app`). Agents running directly in this workspace benefit from local rules, shared meta-skills, and `PROJECTS_MAP.md`.
2. **Global Mode (Any Project Anywhere via MCP)**:  
   Keep your projects anywhere on your filesystem (e.g. `C:\dev\ecommerce` or `/home/user/backend`). Thanks to the built-in **AgentHub MCP Server**, your agents in **Windsurf, Cursor, VS Code (Cline/Roo Code), Continue, and Claude Desktop** automatically access your central skills, project map, vault keys, and session checkpoints on the fly!

---

## 🛠️ Interactive Bilingual Setup Wizard

When you run `agenthub init` (or simply `agenthub`), the CLI wizard greets you with **language selection**:

```text
? Select language / Выберите язык:
  ● 🇬🇧 English (English interface)
  ○ 🇷🇺 Русский (Русскоязычный интерфейс)
```

The wizard guides you through:
1. **Selecting your Knowledge Base directory**
2. **Choosing your active AI systems & IDEs** (Windsurf, Cursor, Antigravity, Cline, Roo Code, Continue, Claude Code, Copilot, DeepSeek)
3. **Automatic Global IDE & MCP Configuration**: Seamlessly configures config files across your operating system.

Your preferred language is saved to `.hub/config.json`.

---

## 🚀 Key Features in Detail

### 1. 🔌 Built-in MCP Server (`agenthub serve-mcp` / `agenthub-mcp`)
A standards-compliant Model Context Protocol (MCP) server communicating over `stdio`. It exposes **9 powerful tools**:
* `agenthub_list_skills`: Lists all available engineering skills in compact format.
* `agenthub_get_skill`: Fetches full skill content on demand with strict directory-traversal protection.
* `agenthub_get_project_map`: Returns the condensed multi-project architectural overview (`PROJECTS_MAP.md`).
* `agenthub_create_handoff`: Creates a task checkpoint for the next agent.
* `agenthub_get_handoff`: Reads the latest task checkpoint and current status.
* `agenthub_list_vault_keys`: Lists stored secret key names without leaking their values.
* `agenthub_check_vault_secret`: Confirms if a specific secret exists.
* `agenthub_list_mcps`: Discovers configured external MCP tool definitions.
* `agenthub_audit_code`: Inspects code snippets for exposed credentials and masks them.
* **Resources & Prompts**: `agenthub://projects-map`, `agenthub://handoff`, `agenthub://guide`, and the `agenthub_resume_task` prompt.

### 2. 🛡️ Zero-Leak Security Vault
* All sensitive credentials (API tokens, database strings, private keys) reside in `.hub/vault.env`.
* Protected with strict filesystem permissions (`0600`) and **guaranteed Git exclusion** (`.gitignore`).
* Agents only receive boolean confirmations or masked snippets (`sk-...def`), preventing prompt injection leaks.

### 3. 📉 Smart On-Demand Context Loading
* Traditional setups inject thousands of lines of documentation on every interaction.
* AgentHub provides a lightweight Table of Contents (~200 tokens) and lets the AI pull detailed documentation only when directly relevant, avoiding unnecessary upfront token burn.

### 4. 🔄 Cross-Agent Handoff Relay
* Running low on credits or hit token limits in one AI model?
* Simply create a checkpoint:
  ```bash
  agenthub handoff create -t "Implement Auth Flow" -s "Completed DB schema & JWT middleware; remaining: OAuth2 routes"
  ```
* Open a new session in any other IDE or model — the agent instantly resumes via `HANDOFF.md` or `agenthub_get_handoff`!

### 5. 🤖 Built-in Meta-Skill (`skills/agenthub-guide.md`)
* Automatically seeded into every Knowledge Base.
* Educates agents on token conservation, vault usage, handoff protocol, and safe multi-project navigation.

### 6. 🔍 Secret Inspector & Leak Guard
* Automatically scans codebases and configs for high-entropy tokens and API key patterns (OpenAI, Anthropic, GitHub, AWS, Stripe, Postgres, private keys).
* Run `agenthub audit --fix` to detect plain-text secrets and safely migrate them into the Vault.

### 7. 🗺️ Smart RepoMap (`PROJECTS_MAP.md`)
* Automatically indexes all repositories under `projects/` and builds a high-density architectural summary under 500 tokens.

### 8. 🌐 One-Command Global IDE Sync (`agenthub global --all`)
* Automatically writes MCP server registrations and global rules into:
  * **Windsurf**: `~/.codeium/windsurf/mcp_config.json`, `global_rules.md`
  * **Cursor**: `~/.cursor/mcp.json`, `.cursorrules`
  * **VS Code / Cline**: `cline_mcp_settings.json`
  * **VS Code / Roo Code**: `cline_mcp_settings.json`, `.roomodes`
  * **Continue.dev**: `~/.continue/config.yaml`
  * **Claude Code & Desktop**: `~/.claude.json`, `claude_desktop_config.json`
  * **Google Antigravity**: `~/.gemini/antigravity/` rule file & native skill

---

## 💻 CLI Commands Reference

| Command | Description |
|---|---|
| `agenthub init [dir]` | Launch the interactive bilingual setup wizard |
| `agenthub serve-mcp [--kb <path>]` | Run the built-in Stdio MCP Server for IDEs |
| `agenthub use <dir>` | Set active default Knowledge Base globally across the OS |
| `agenthub kb [list\|use\|remove\|edit]` | Manage, switch, edit, or delete registered Knowledge Bases |
| `agenthub global [--all\|--restore]` | Check, sync, or restore IDE configurations from backups (`.bak`) |
| `agenthub sync [-g, --global]` | Synchronize adapters, RepoMap, skills, and IDE configs |
| `agenthub audit [--fix]` | Run Leak Guard secret audit with optional auto-migration to Vault |
| `agenthub repomap` | Rebuild `PROJECTS_MAP.md` project architecture map |
| `agenthub handoff create -t "Task"` | Create a cross-agent task checkpoint |
| `agenthub handoff prompt <Agent>` | Generate resumption prompt for a new AI session |
| `agenthub vault set <KEY> <VALUE>` | Store a secret securely in the local Zero-Leak Vault |
| `agenthub vault list` | List stored secret keys (values masked) |
| `agenthub lang [en\|ru]` | Display or switch CLI interface language (en/ru) |
| `agenthub update [--check\|--auto]` | Check for updates and automatically upgrade AgentHub |
| `agenthub team status` | Verify Git status and leak safety |
| `agenthub team commit "msg"` | Safe commit of shared skills with pre-flight leak check |

---

## 📁 Knowledge Base Architecture

```text
📁 MyKnowledgeBase/
│
├── 📂 projects/              # Your repositories and codebases
│   ├── 📁 backend-api/
│   └── 📁 web-frontend/
│
├── 📂 skills/                # Shared engineering skills for all AI agents
│   ├── 📄 agenthub-guide.md  # 🤖 Meta-skill: agent usage guidelines
│   ├── 📄 git-workflow.md
│   ├── 📄 code-review.md
│   └── 📄 bug-hunter.md
│
├── 📂 mcp/                   # Sanitized MCP tool configurations (zero secrets)
│   ├── 📄 github.json
│   └── 📄 postgres.json
│
├── 📄 PROJECTS_MAP.md        # Condensed multi-project architecture map
├── 📄 HANDOFF.md             # Active cross-agent task checkpoint
│
└── 📂 .hub/                  # Internal hub control directory (protected)
    ├── 🔒 vault.env          # ZERO-LEAK VAULT: never exposed to AI or Git
    ├── ⚙️ config.json        # User configuration & selected language
    └── 📂 memory/            # Handoff session history
```

---

## ☕ Support & Donations

If **AgentHub** saves your tokens, time, and simplifies your multi-agent workflow, consider supporting the creator!

- 🇷🇺 **From Russian Banks / SBP (Zero fee, any bank)**:
  - **Direct Payment Link**: [Ozon Bank Pay / SBP (Recipient: Евгений В.)](https://finance.ozon.ru/apps/sbp/ozonbankpay/01a03f54-75c0-7054-9a9e-bf20c44547ac)
  - **Scan QR Code with your Banking App**:
    <br/>
    <a href="https://finance.ozon.ru/apps/sbp/ozonbankpay/01a03f54-75c0-7054-9a9e-bf20c44547ac"><img src="assets/ozon_sbp_qr.png" width="180" alt="Ozon Bank SBP QR Code" /></a>

- 🌍 **International / Crypto (Any coin, anonymous)**:
  - **Pay via Telegram CryptoBot**: [t.me/send?start=IVj4UTox7JMD](https://t.me/send?start=IVj4UTox7JMD)
  - [![Donate via CryptoBot](https://img.shields.io/badge/Donate-CryptoBot-2EA5FF?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/send?start=IVj4UTox7JMD)
  - Supports: **USDT, TON, SOL, TRX, BTC, ETH, DOGE, LTC, BNB, USDC, XAUT**

---

<br/>

<a id="openagenthub-на-русском"></a>
<a id="-openagenthub-на-русском"></a>

# 🚀 OpenAgentHub (на русском)

[🇬🇧 **Switch to English version**](#-openagenthub) &nbsp;&nbsp;|&nbsp;&nbsp; [🇷🇺 **Версия на русском языке**](#-openagenthub-на-русском)

> **Единая База Знаний, Сейф Секретов (Zero-Leak), Оптимизатор Контекста и Мульти-IDE MCP Сервер для AI-агентов**  
> Один центр управления для всех ваших проектов, скилов и инструментов — с поддержкой **Windsurf**, **Cursor**, **Google Antigravity**, **Claude Code / Desktop**, **Cline**, **Roo Code**, **Continue.dev**, **GitHub Copilot**, **DeepSeek Harness**, **Hermes**, **OpenCode** и **OpenAI Codex**.

---

## 💡 Зачем нужен OpenAgentHub и почему это круто?

В современной AI-разработке царит хаос и перерасход ресурсов:

1. **Зоопарк правил и конфигов**: Каждому инструменту нужно всё объяснять заново. У Claude Code свой `CLAUDE.md`, у Windsurf `.windsurfrules`, у Cursor `.cursorrules`, у Continue `config.yaml`, у Cline `.clinerules`, у Antigravity папка скилов, у DeepSeek системные промпты. Поддерживать их вручную для десятка проектов невозможно.
2. **Раздувание контекста (Token Bloat)**: Загрузка мегабайтов инструкций съедает тысячи лишних токенов на старте каждого диалога, замедляет ответы, размывает внимание модели и опустошает баланс API.
3. **Утечки секретов**: API-ключи, токены баз данных и пароли постоянно случайно попадают в промпты, контексты чатов и публичные коммиты.
4. **Потеря контекста при смене AI**: Лимиты Claude Code закончились? При переходе в Cursor или Antigravity приходится заново объяснять всю архитектуру, что уже сделано и что осталось.

### 🌟 Как AgentHub решает эти проблемы:
- 🛡️ **Сейф Zero-Leak**: Все секреты хранятся локально в изолированном файле под защитой прав `0600` и **никогда не попадают в контекст модели или Git**.
- 📉 **Умная экономия контекста**: Модели видят компактное оглавление и запрашивают полный текст навыка только тогда, когда это действительно нужно для задачи.
- 🔄 **Эстафета между AI (Cross-Agent Handoff)**: Мгновенная передача задачи от одной модели к другой без потери контекста.
- 🔌 **Встроенный Stdio MCP Server**: 9 нативных инструментов и 4 ресурса доступны прямо внутри вашей любимой IDE.
- 🌐 **Глобальная синхронизация IDE**: Одной командой связывает все редакторы на вашем компьютере с Базой Знаний.

---

## ⚡ Быстрая установка

### Вариант 1: Глобальная установка через Git & npm (Рекомендуется)

Вы можете установить **AgentHub** глобально в систему напрямую из официального GitHub-репозитория одной командой:

```bash
# Рекомендуется: Быстрая установка напрямую из архива GitHub (Windows, macOS, Linux)
npm install -g https://github.com/NekrozDEV/agenthub/archive/refs/heads/main.tar.gz

# Либо через Git (если обновляете существующую установку, добавьте --force):
npm install -g --force git+https://github.com/NekrozDEV/agenthub.git

# Запуск интерактивного мастера настройки в любой папке
agenthub init

# Либо запуск интерактивного Главного меню
agenthub
```

> [!TIP]
> **Автообновления**: Когда выйдет свежий релиз (например, v1.1.0), утилита сама уведомит вас при запуске. Вы можете обновить её в 1 команду:
> ```bash
> agenthub update
> ```

### Вариант 2: Установка из исходного кода

```bash
# Клонирование репозитория
git clone https://github.com/NekrozDEV/agenthub.git
cd agenthub

# Установка зависимостей, сборка и глобальный линк
npm install
npm run build
npm link
```

---

## 🌐 Два режима работы: Где запускать агентов?

Вам **НЕ нужно** ограничиваться только одной папкой! OpenAgentHub поддерживает два режима:

1. **Режим Центрального Хаба (Mono-Hub)**:  
   Все ваши репозитории и проекты находятся внутри директории `projects/` Базы Знаний (например, `D:\AiBase\projects\my-app`). Агенты работают прямо в этой папке, автоматически используя общие скилы и `PROJECTS_MAP.md`.
2. **Глобальный режим (В любом проекте через MCP)**:  
   Вы открываете **любой свой проект в любой папке на диске** (например, `C:\Work\my-project` или `/home/dev/api`) в Windsurf, Cursor, VS Code (Cline / Roo Code), Continue или Claude Desktop.  
   Благодаря встроенному **AgentHub MCP Server** ваши агенты на лету получают доступ к общим скилам, карте проектов, эстафете сессий (`HANDOFF.md`) и Сейфу без копирования конфигов!

---

## 🛠️ Интерактивный двуязычный мастер настройки

При первом запуске утилиты (`agenthub init` или просто `agenthub`) мастер первым делом предлагает **выбрать язык интерфейса**:

```text
? Select language / Выберите язык:
  ● 🇬🇧 English (English interface)
  ○ 🇷🇺 Русский (Русскоязычный интерфейс)
```

Мастер помогает:
1. Выбрать папку Единой Базы Знаний.
2. Отметить используемые AI-системы и IDE (Windsurf, Cursor, Antigravity, Cline, Roo Code, Continue, Claude Code, Copilot, DeepSeek).
3. Включить автоматическую глобальную привязку IDE и регистрацию MCP-сервера.

Выбранный язык и настройки сохраняются в `.hub/config.json`.

---

## 🌟 Ключевые возможности

### 1. 🔌 Встроенный MCP Server (`agenthub serve-mcp` / `agenthub-mcp`)
Полноценная поддержка протокола **Model Context Protocol (MCP)** через Stdio с **9 инструментами**:
* `agenthub_list_skills`: компактный список доступных скилов команды.
* `agenthub_get_skill`: чтение нужного скила на лету (только по запросу, с защитой от traversal).
* `agenthub_get_project_map`: архитектурный обзор всех проектов (`PROJECTS_MAP.md`).
* `agenthub_create_handoff`: создание чекпоинта текущей задачи.
* `agenthub_get_handoff`: получение контекста и статуса текущей задачи.
* `agenthub_list_vault_keys`: список названий ключей в Сейфе без раскрытия значений.
* `agenthub_check_vault_secret`: проверка наличия секрета в Сейфе.
* `agenthub_list_mcps`: список настроенных внешних MCP инструментов.
* `agenthub_audit_code`: инспекция кода на случайные утечки токенов с маскированием.
* **Ресурсы MCP**: `agenthub://projects-map`, `agenthub://handoff`, `agenthub://guide` и промпт `agenthub_resume_task`.

### 2. 🛡️ Zero-Leak Security Vault (Сейф секретов)
* Все ключи и токены (OpenAI, GitHub, DB URIs, Stripe) хранятся в `.hub/vault.env`.
* Файл защищен правами `0600` и **гарантированно исключен из Git**.
* Агенты видят только факт наличия ключа или маскированное значение (`sk-...abc`), исключая утечки через промпт-инъекции.

### 3. 📉 Умная экономия контекста (On-Demand Loading)
* Вместо загрузки тяжелых инструкций в каждый запрос агенты получают компактное оглавление (~200 токенов) и подгружают детали только при необходимости, предотвращая раздувание контекста.

### 4. 🔄 Cross-Agent Handoff («Эстафета» между AI)
* Закончился контекст или лимит в одном агенте?
* Сохраните состояние:
  ```bash
  agenthub handoff create -t "Авторизация" -s "Сделал JWT middleware; осталось написать OAuth2 роуты"
  ```
* Запустите следующего агента в любой IDE — он мгновенно подхватит задачу из `HANDOFF.md` или через MCP-метод `agenthub_get_handoff`!

### 5. 🤖 Встроенный Мета-Скил (`skills/agenthub-guide.md`)
* Предустановлен в каждой Базе Знаний.
* Служит универсальной инструкцией для любых LLM по контекстной дисциплине, безопасной работе с секретами и передаче задач.

### 6. 🔍 Secret Inspector & Leak Guard (Защита от утечек)
* Сканирует репозитории на случайные токены (OpenAI, Anthropic, GitHub, AWS, Stripe, DB URIs, приватные ключи).
* Команда `agenthub audit --fix` находит открытые ключи, маскирует их в исходниках и безопасно переносит в Сейф.

### 7. 🗺️ RepoMap (Умная карта всех проектов)
* Сканирует директорию `projects/` и генерирует сжатую архитектурную карту `PROJECTS_MAP.md` (< 500 токенов).

### 8. 🌐 Global IDE Sync (Автоматическая привязка IDE)
* Команда `agenthub global --all` находит установленные IDE и регистрирует AgentHub MCP Server и правила в:
  * **Windsurf**: `~/.codeium/windsurf/mcp_config.json`, `global_rules.md`
  * **Cursor**: `~/.cursor/mcp.json`, `.cursorrules`
  * **VS Code / Cline**: `cline_mcp_settings.json`
  * **VS Code / Roo Code**: `cline_mcp_settings.json`, `.roomodes`
  * **Continue.dev**: `~/.continue/config.yaml`
  * **Claude Code & Desktop**: `~/.claude.json`, `claude_desktop_config.json`
  * **Google Antigravity**: `~/.gemini/antigravity/` и нативный скил

---

## 🛠️ Справочник команд CLI

| Команда | Описание |
|---|---|
| `agenthub init [dir]` | Интерактивный двуязычный мастер настройки |
| `agenthub serve-mcp [--kb <path>]` | Запуск Stdio MCP сервера для IDE и агентов |
| `agenthub use <dir>` | Установить активную Базу Знаний по умолчанию для всей системы |
| `agenthub kb [list\|use\|remove\|edit]` | Управление, переключение, редактирование и удаление Баз Знаний |
| `agenthub global [--all\|--restore]` | Проверить, синхронизировать или восстановить настройки IDE из копий (`.bak`) |
| `agenthub sync [-g, --global]` | Синхронизация адаптеров, карты проектов, скилов и IDE |
| `agenthub audit [--fix]` | Проверка на утечки ключей (Leak Guard) с авто-переносом в Сейф |
| `agenthub repomap` | Перестроение карты проектов `PROJECTS_MAP.md` |
| `agenthub handoff create -t "Задача"` | Фиксация чекпоинта для передачи другому AI |
| `agenthub handoff prompt <Agent>` | Генерация стартового промпта для нового агента |
| `agenthub vault set <KEY> <VALUE>` | Сохранение секрета в защищенный локальный Сейф |
| `agenthub vault list` | Просмотр списка защищенных ключей (значения скрыты) |
| `agenthub lang [en\|ru]` | Показать или переключить язык интерфейса CLI (en/ru) |
| `agenthub update [--check\|--auto]` | Проверка обновлений и автообновление AgentHub до свежей версии |
| `agenthub team status` | Проверка статуса Git и безопасности от утечек |
| `agenthub team commit "msg"` | Безопасный коммит общих скилов с pre-flight проверкой |

---

## 🔌 Поддерживаемые AI-системы и адаптеры

| Система | Адаптер / Интеграция | Особенности |
|---|---|---|
| **Windsurf (Codeium)** | `.windsurfrules`, `mcp_config.json`, `global_rules.md` | Полная поддержка MCP, глобальные правила |
| **Cursor AI** | `.cursorrules`, `.cursor/mcp.json`, `~/.cursor/mcp.json` | Подключение MCP-сервера, контекстные правила |
| **Google Antigravity** | `.gemini/rules.md`, `~/.gemini/antigravity/` | Изоляция секретов, передача скилов |
| **Cline (VS Code)** | `.clinerules`, `cline_mcp_settings.json` | Авто-одобрение безопасных инструментов MCP |
| **Roo Code (VS Code)**| `.roomodes`, `.clinerules`, `cline_mcp_settings.json` | Специализированный режим `AgentHub Engineer` |
| **Continue.dev** | `.continue/config.yaml`, `~/.continue/config.yaml` | Интеграция документов и MCP инструментов |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Стандарты чистого кода и запрет хардкода токенов |
| **Anthropic Claude Code** | `CLAUDE.md`, `.claude.json`, `claude_desktop_config.json` | Оглавление скилов, MCP в Claude Desktop |
| **DeepSeek Harness & Hermes**| `.deepseek/system_prompt.md` | Промпты с оптимизацией токенов |
| **OpenCode / OpenClaw** | `.opencode/config.json` | Автономный режим с песочницей `projects/` |
| **OpenAI Codex** | Инструкции агентов | Унифицированные описания инструментов |

---

## 📁 Структура Единой Базы Знаний

```text
📁 MyKnowledgeBase/
│
├── 📂 projects/              # Все ваши репозитории и проекты
│   ├── 📁 backend-api/
│   └── 📁 web-frontend/
│
├── 📂 skills/                # Общие скилы для всех агентов
│   ├── 📄 agenthub-guide.md  # 🤖 Мета-скил: руководство для AI по работе с хабом
│   ├── 📄 git-workflow.md
│   ├── 📄 code-review.md
│   └── 📄 bug-hunter.md
│
├── 📂 mcp/                   # Манифесты инструментов MCP без секретов
│   ├── 📄 github.json
│   └── 📄 postgres.json
│
├── 📄 PROJECTS_MAP.md        # Сжатая карта архитектуры проектов (< 500 токенов)
├── 📄 HANDOFF.md             # Чекпоинт текущей задачи для следующего AI
│
└── 📂 .hub/                  # Системная папка (защищена)
    ├── 🔒 vault.env          # СЕКРЕТЫ: никогда не передаются в AI и Git
    ├── ⚙️ config.json        # Выбранные пользователем агенты и язык
    └── 📂 memory/            # Чекпоинты сессий (handoff.json)
```

---

## 🔒 Безопасность

Проект разработан по принципу **Secure by Default**:
* Файлы секретов (`.hub/vault.env`, `*.env.local`) автоматически добавляются в `.gitignore`.
* Команда `team commit` проводит обязательную pre-flight проверку: если в `skills/` или `mcp/` случайно оказался открытый ключ, коммит блокируется.

---

## 🤝 Тестирование

```bash
npm run build
npm test
```

---

## ☕ Поддержать автора / Донаты
 
Если **AgentHub** бережёт ваши токены, время и нервы — автор (Евгений В.) будет очень благодарен за любую поддержку проекта! Любой донат мотивирует развивать экосистему дальше.

- 🇷🇺 **Для пользователей из России (любой банк, СБП без комиссии)**:
  - **Прямая ссылка для перевода**: [Пополнение без комиссии через Ozon Банк / СБП (Получатель: Евгений В.)](https://finance.ozon.ru/apps/sbp/ozonbankpay/01a03f54-75c0-7054-9a9e-bf20c44547ac)
  - **QR-код для быстрой оплаты из мобильного приложения любого банка**:
    <br/>
    <a href="https://finance.ozon.ru/apps/sbp/ozonbankpay/01a03f54-75c0-7054-9a9e-bf20c44547ac"><img src="assets/ozon_sbp_qr.png" width="180" alt="QR-код Ozon Банк СБП" /></a>

- 🌍 **Международные переводы / Криптовалюта (Любая монета, анонимно)**:
  - **Оплата через Telegram CryptoBot**: [t.me/send?start=IVj4UTox7JMD](https://t.me/send?start=IVj4UTox7JMD)
  - [![Оплатить через CryptoBot](https://img.shields.io/badge/Оплатить-CryptoBot-2EA5FF?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/send?start=IVj4UTox7JMD)
  - Поддерживает: **USDT, TON, SOL, TRX, BTC, ETH, DOGE, LTC, BNB, USDC, XAUT**

---

## 📄 Лицензия

Распространяется под лицензией [MIT](LICENSE).
