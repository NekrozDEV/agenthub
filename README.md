# 🚀 OpenAgentHub

> **Universal Knowledge Base & Zero-Leak Security Hub for AI Agents**  
> One folder for all your projects, skills, and tools — pluggable into **Windsurf**, **Cursor**, **Google Antigravity**, **Claude Code / Desktop**, **Cline**, **Roo Code**, **Continue.dev**, **GitHub Copilot**, **DeepSeek Harness**, **Hermes**, **OpenCode**, and **OpenAI Codex**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18.0.0](https://img.shields.io/badge/Node->=18.0.0-green.svg)](https://nodejs.org/)
[![MCP: Supported](https://img.shields.io/badge/MCP-Server%20Built--in-blueviolet.svg)](https://modelcontextprotocol.io/)
[![Zero-Leak Security](https://img.shields.io/badge/Security-Zero--Leak%20Vault-brightgreen.svg)]()
[![Context Optimization](https://img.shields.io/badge/Tokens-80%25%2B%20Saved-orange.svg)]()

---

## 💡 Зачем нужен OpenAgentHub?

Сейчас в экосистеме AI-разработки царит фрагментация и перерасход ресурсов:
1. **Каждой модели нужно объяснять всё заново**: у Claude Code свой `CLAUDE.md`, у Windsurf `.windsurfrules`, у Cursor `.cursorrules`, у Continue `config.yaml`, у Cline `.clinerules`, у Antigravity папка скилов, у DeepSeek свои JSON-промпты.
2. **Раздувание контекста (Token Bloat)**: загрузка десятков инструментов и правил съедает десятки тысяч токенов на старте каждого запроса, замедляет работу и размывает внимание модели.
3. **Утечки секретов**: API-ключи и пароли часто светятся в конфигах, логах и контексте чатов.
4. **Потеря контекста при смене модели**: переходя с исчерпавшего лимит Claude Code на Antigravity или DeepSeek, приходится пересказывать весь прогресс с нуля.

**OpenAgentHub решает это раз и навсегда.**

---

## 🌐 Два режима работы: Где запускать агентов?

Вам **НЕ нужно** обязательно запускать всех агентов только в одной папке! OpenAgentHub поддерживает два режима:

1. **Режим Центрального Хаба (Mono-Hub)**:  
   Все ваши репозитории и проекты лежат внутри `projects/` Базы Знаний (например, `D:\AiBase\projects\my-app`). Агенты запускаются прямо в этой папке, пользуясь локальными правилами и `PROJECTS_MAP.md`.
2. **Глобальный режим (Global / Anywhere через MCP)**:  
   Вы открываете **абсолютно любой свой проект в любой папке** (например, `C:\Work\web-service`) в Windsurf, Cursor, VS Code (Cline / Roo Code), Continue или Claude Desktop.  
   Благодаря встроенному **AgentHub MCP Server** ваши агенты на лету получают доступ к общим скилам, карте проектов, эстафете сессий (`HANDOFF.md`) и Сейфу без необходимости копировать конфиги!

---

## 🌟 Ключевые возможности

### 1. 🔌 Встроенный MCP Server (`agenthub serve-mcp` / `agenthub-mcp`)
* Полноценная поддержка протокола **Model Context Protocol (MCP)** через Stdio.
* Агенты в любой IDE вызывают нативные инструменты:
  * `agenthub_list_skills`: обзор доступных инженерных скилов
  * `agenthub_get_skill`: чтение нужного скила на лету (только когда требуется!)
  * `agenthub_get_project_map`: архитектурный обзор всех проектов (`PROJECTS_MAP.md`)
  * `agenthub_get_handoff` / `agenthub_create_handoff`: бесшовное переключение между AI
  * `agenthub_list_vault_keys` / `agenthub_check_vault_secret`: безопасная проверка секретов
  * `agenthub_audit_code`: инспекция кода на утечки токенов
* Ресурсы MCP: `agenthub://projects-map`, `agenthub://handoff`, `agenthub://guide`.

### 2. 🤖 Встроенный Мета-Скил (`skills/agenthub-guide.md`)
* Автоматически предустановлен в каждой Базе Знаний.
* Служит универсальной «инструкцией по эксплуатации» для любых AI-агентов: регламентирует контекстную дисциплину, работу с секретами, протокол передачи задач (Handoff) и многопроектную навигацию.

### 3. 🛡️ Zero-Leak Security Vault (Сейф секретов)
* Все токены (GitHub, Stripe, DB credentials) хранятся локально в изолированном хранилище `.hub/vault.env`.
* Файл защищен системными правами `0600` и **автоматически исключен из Git**.
* Агенты видят только факт наличия ключа или маскированное значение (`sk-...abc`), но никогда не сливают секреты в контекст.

### 4. ⚡ Экономия 80%+ токенов (Token-Aware Architecture)
* Вместо загрузки мегабайт документации модели получают **компактное оглавление** (`Table of Contents`) и обращаются к полному описанию скила только тогда, когда задача этого требует.

### 5. 🔄 Cross-Agent Handoff («Эстафета» между AI)
* Закончились лимиты в одной модели?  
* Команда `agenthub handoff create -t "Фича X" -s "Сделал модели и тесты"` сохраняет состояние задачи.
* Новый агент в любой среде мгновенно подхватывает контекст из `HANDOFF.md` или MCP-инструмента `agenthub_get_handoff`!

### 6. 🔍 Secret Inspector & Leak Guard (Защита от утечек)
* Сканер кода и конфигов на случайные токены (OpenAI, Anthropic, GitHub, AWS, Stripe, DB URIs, приватные ключи).
* Команда `agenthub audit --fix` автоматически находит открытые ключи в проектах, маскирует их и перемещает в защищенный Сейф.

### 7. 🗺️ RepoMap (Умная карта всех проектов)
* Сканирует директорию `projects/` и автоматически генерирует компактную структурную сводку `PROJECTS_MAP.md` (< 500 токенов).

### 8. 🌐 Global IDE Sync (Автоматическая «прошивка» IDE)
* Команда `agenthub global --all` находит установленные IDE на вашем компьютере и автоматически регистрирует MCP-сервер и глобальные правила в:
  * **Windsurf** (`~/.codeium/windsurf/mcp_config.json`, `global_rules.md`)
  * **Cursor** (`~/.cursor/mcp.json`, `.cursorrules`)
  * **VS Code / Cline** (`cline_mcp_settings.json`)
  * **VS Code / Roo Code** (`cline_mcp_settings.json`, `.roomodes`)
  * **Continue.dev** (`~/.continue/config.yaml`)
  * **Claude Code (CLI)** (`~/.claude.json`) & **Claude Desktop** (`claude_desktop_config.json`)
  * **Google Antigravity** (`agenthub_rules.md` & нативный скил `~/.gemini/config/skills/agenthub/SKILL.md`)

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
├── 📄 PROJECTS_MAP.md        # Сжатая карта архитектуры проектов
├── 📄 HANDOFF.md             # Чекпоинт текущей задачи для следующего AI
│
└── 📂 .hub/                  # Системная папка (защищена)
    ├── 🔒 vault.env          # СЕКРЕТЫ: никогда не передаются в AI и Git
    ├── ⚙️ config.json        # Выбранные пользователем агенты
    └── 📂 memory/            # Чекпоинты сессий (handoff.json)
```

---

## 🚀 Быстрый старт

### Установка и запуск

```bash
npx open-agenthub
```
*(или склонируйте репозиторий и запустите `npm start`)*

### Интерактивный мастер:
1. **Укажите путь к папке Базы Знаний** (например, `D:\AiBase`).
2. **Выберите используемые AI-системы и IDE** (Windsurf, Cursor, Antigravity, Cline, Roo Code, Continue, Claude, Copilot, DeepSeek).
3. **Подтвердите глобальную привязку IDE**: утилита сама настроит конфиги в вашей системе!

---

## 🛠️ Команды CLI

| Команда | Описание |
|---|---|
| `agenthub init [dir]` | Запуск интерактивного мастера настройки |
| `agenthub serve-mcp [--kb <path>]` | Запуск Stdio MCP сервера для интеграции с агентами |
| `agenthub use <dir>` | Установить активную Базу Знаний по умолчанию для всей системы |
| `agenthub global [--all]` | Проверить и синхронизировать глобальные настройки IDE |
| `agenthub sync [-g, --global]` | Синхронизация адаптеров, карты проектов, скилов и IDE |
| `agenthub audit [--fix]` | Проверка на утечки ключей (Leak Guard) с авто-переносом в Сейф |
| `agenthub repomap` | Перестроение карты проектов `PROJECTS_MAP.md` |
| `agenthub handoff create -t "Задача"` | Фиксация чекпоинта для передачи другому AI |
| `agenthub handoff prompt <Agent>` | Генерация стартового промпта для нового агента |
| `agenthub vault set <KEY> <VALUE>` | Сохранение секрета в защищенный локальный Сейф |
| `agenthub vault list` | Просмотр списка защищенных ключей (без раскрытия значений) |
| `agenthub team status` | Проверка статуса Git и безопасности от утечек |
| `agenthub team commit "msg"` | Безопасный коммит общих скилов с pre-flight проверкой |

---

## 🔌 Поддерживаемые AI-системы и адаптеры

| Система | Адаптер / Интеграция | Особенности |
|---|---|---|
| **Windsurf (Codeium)** | `.windsurfrules`, `mcp_config.json`, `global_rules.md` | Полная поддержка MCP, глобальные воспоминания |
| **Cursor AI** | `.cursorrules`, `.cursor/mcp.json`, `~/.cursor/mcp.json` | Подключение MCP-сервера, правила контекста |
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

## 🔒 Безопасность

Проект разработан по принципу **Secure by Default**:
* Файлы секретов (`.hub/vault.env`, `*.env.local`) автоматически добавляются в `.gitignore`.
* Встроенная команда `team commit` осуществляет pre-flight проверку: если в `skills/` или `mcp/` случайно оказался открытый ключ, коммит будет немедленно заблокирован.

---

## 🤝 Тестирование

```bash
npm run build
npm test
```

---

## 📄 Лицензия

Распространяется под лицензией [MIT](LICENSE).
