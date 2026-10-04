import { SupportedLanguage } from './config.js';

export interface CliStrings {
  programDesc: string;
  langOptionDesc: string;
  initDesc: string;
  initDirArg: string;
  serveMcpDesc: string;
  serveMcpKbOpt: string;
  useDesc: string;
  useDirArg: string;
  useNotFound: (path: string) => string;
  useNotInit: (path: string) => string;
  useSuccess: (path: string) => string;
  useMcpHint: string;
  globalDesc: string;
  globalAllOpt: string;
  globalKbOpt: string;
  globalHeader: (path: string) => string;
  globalStatusTitle: string;
  globalConfigLabel: string;
  globalStatusLabel: string;
  globalTip: string;
  syncDesc: string;
  syncGlobalOpt: string;
  syncKbOpt: string;
  syncNotFound: (path: string) => string;
  syncStarting: (path: string) => string;
  syncRepoMapDone: string;
  syncAdaptersDone: (list: string) => string;
  syncGlobalDone: (list: string) => string;
  auditDesc: string;
  auditFixOpt: string;
  auditKbOpt: string;
  auditScanning: (path: string) => string;
  auditClean: string;
  auditFindings: (count: number) => string;
  auditValLabel: string;
  auditLineLabel: string;
  auditFixed: (key: string) => string;
  auditFixTip: string;
  repomapDesc: string;
  repomapKbOpt: string;
  repomapSuccess: (file: string) => string;
  repomapProjectsFound: (count: number) => string;
  kbDesc: string;
  kbListDesc: string;
  kbUseDesc: string;
  kbRemoveDesc: string;
  kbEditDesc: string;
  handoffDesc: string;
  handoffCreateDesc: string;
  handoffTaskOpt: string;
  handoffSummaryOpt: string;
  handoffDefaultSummary: string;
  handoffFilesOpt: string;
  handoffFromOpt: string;
  handoffToOpt: string;
  handoffDefaultNext: string;
  handoffSaved: string;
  handoffPromptDesc: string;
  handoffCopyPrompt: string;
  vaultDesc: string;
  vaultSetDesc: string;
  vaultSetSaved: (key: string) => string;
  vaultSetHint: string;
  vaultListDesc: string;
  vaultListEmpty: string;
  vaultListHeader: (count: number) => string;
  teamDesc: string;
  teamStatusDesc: string;
  teamStatusHeader: string;
  teamGitRepo: string;
  teamBranch: string;
  teamRemote: string;
  teamRemoteNone: string;
  teamUncommitted: string;
  teamYes: string;
  teamNo: string;
  teamSecurityHeader: string;
  teamSecuritySafe: string;
  teamSecurityWarn: (msg: string) => string;
  teamCommitDesc: string;
  teamCommitSuccess: string;
  teamCommitError: (msg: string) => string;
  langCmdDesc: string;
  langArgDesc: string;
  langCurrent: (lang: string) => string;
  langSwitched: (lang: string) => string;
  langInvalid: string;
}

export const CLI_I18N: Record<SupportedLanguage, CliStrings> = {
  en: {
    programDesc: 'Universal Knowledge Base & Zero-Leak Security Hub for AI Agents',
    langOptionDesc: 'Interface language (en/ru)',
    initDesc: 'Run interactive setup wizard for Knowledge Base',
    initDirArg: 'Knowledge Base directory (defaults to current directory)',
    serveMcpDesc: 'Start built-in AgentHub MCP Server (Stdio) to connect AI agents from anywhere',
    serveMcpKbOpt: 'Path to Knowledge Base (defaults to active base)',
    useDesc: 'Set active Knowledge Base default for the entire system',
    useDirArg: 'Directory path of Knowledge Base',
    useNotFound: (p) => `✕ Directory not found: ${p}`,
    useNotInit: (p) => `⚠️ No .hub/config.json found in ${p}. Initialize it: agenthub init ${p}`,
    useSuccess: (p) => `✓ Active Knowledge Base switched to: ${p}`,
    useMcpHint: '  All agents via MCP now automatically use this base.',
    globalDesc: 'Check and synchronize global IDE configurations (Windsurf, Cursor, Cline, Roo Code, Continue, Claude)',
    globalAllOpt: 'Sync all supported IDEs (not only those enabled in config)',
    globalKbOpt: 'Path to Knowledge Base',
    globalHeader: (p) => `🌐 Global AgentHub integration for Base: ${p}`,
    globalStatusTitle: '\nIDE & MCP connection status:',
    globalConfigLabel: 'Config:',
    globalStatusLabel: 'Status:',
    globalTip: '\n💡 You can now open any project in these IDEs — they are automatically connected to AgentHub!',
    syncDesc: 'Synchronize adapter configs, project map, and rules',
    syncGlobalOpt: 'Also synchronize global IDE configs and MCP servers',
    syncKbOpt: 'Path to Knowledge Base',
    syncNotFound: (p) => `✕ Knowledge Base not found at: ${p}. Run: agenthub init`,
    syncStarting: (p) => `Synchronizing AgentHub (${p})...`,
    syncRepoMapDone: '✓ Project map updated: PROJECTS_MAP.md',
    syncAdaptersDone: (list) => `✓ Local adapters synchronized for: ${list}`,
    syncGlobalDone: (list) => `✓ Global IDEs synchronized: ${list}`,
    auditDesc: 'Scan projects for leaks of API tokens, passwords, and private keys (Leak Guard)',
    auditFixOpt: 'Automatically move discovered keys to Vault and redact them',
    auditKbOpt: 'Path to Knowledge Base',
    auditScanning: (p) => `🛡️ Scanning for secret and token leaks (${p})...`,
    auditClean: '✓ No leaks detected! All projects and configs are clean.',
    auditFindings: (count) => `\n⚠️ Vulnerabilities detected: ${count}\n`,
    auditValLabel: 'Value:',
    auditLineLabel: 'Line:',
    auditFixed: (key) => `  ✓ Moved to Vault as '${key}' and redacted in file.`,
    auditFixTip: '\n💡 Run `agenthub audit --fix` to automatically move these keys to Vault!',
    repomapDesc: 'Build compact project architecture map to preserve context window',
    repomapKbOpt: 'Path to Knowledge Base',
    repomapSuccess: (file) => `✓ Project map generated: ${file}`,
    repomapProjectsFound: (count) => `  Projects detected in /projects: ${count}`,
    kbDesc: 'Manage registered Knowledge Bases (list, use, remove, edit)',
    kbListDesc: 'List all registered Knowledge Bases and their status',
    kbUseDesc: 'Switch active default Knowledge Base',
    kbRemoveDesc: 'Remove a Knowledge Base from registry or disk',
    kbEditDesc: 'Reconfigure an existing Knowledge Base',
    handoffDesc: 'Manage session handoffs and context between AI agents (Claude, Antigravity, DeepSeek, Windsurf, etc.)',
    handoffCreateDesc: 'Create task handoff checkpoint for the next agent',
    handoffTaskOpt: 'Current active task',
    handoffSummaryOpt: 'Summary of completed work',
    handoffDefaultSummary: 'Progress captured.',
    handoffFilesOpt: 'Touched files',
    handoffFromOpt: 'Source agent',
    handoffToOpt: 'Target next agent',
    handoffDefaultNext: 'Continue implementation of the assigned task.',
    handoffSaved: '✓ Handoff checkpoint saved successfully to HANDOFF.md and .hub/memory/!',
    handoffPromptDesc: 'Generate formatted context prompt to switch to another agent',
    handoffCopyPrompt: '\nCopy this context into the new agent:\n',
    vaultDesc: 'Manage secrets and API tokens in the Zero-Leak Vault',
    vaultSetDesc: 'Save token securely to isolated local Vault (.hub/vault.env)',
    vaultSetSaved: (key) => `✓ Secret '${key}' securely saved to Vault (.hub/vault.env).`,
    vaultSetHint: '  AI agents will not see its value directly.',
    vaultListDesc: 'List protected keys stored in Vault',
    vaultListEmpty: 'Vault is empty. Add a secret: agenthub vault set <KEY> <VALUE>',
    vaultListHeader: (count) => `Keys in Vault (${count}):`,
    teamDesc: 'Synchronize Knowledge Base with team Git repository (Team Sync)',
    teamStatusDesc: 'Check Git status and leak protection',
    teamStatusHeader: 'Git Team Sync Status:',
    teamGitRepo: 'Git repository:',
    teamBranch: 'Branch:',
    teamRemote: 'Remote repository:',
    teamRemoteNone: 'Not configured',
    teamUncommitted: 'Uncommitted changes:',
    teamYes: 'Yes',
    teamNo: 'No',
    teamSecurityHeader: 'Security check:',
    teamSecuritySafe: '✓ Security check: Secrets are safely isolated and will not reach Git.',
    teamSecurityWarn: (msg) => `\n✕ WARNING: ${msg}`,
    teamCommitDesc: 'Safely commit shared team skills and rules',
    teamCommitSuccess: '✓ Changes committed successfully with leak check!',
    teamCommitError: (msg) => `✕ Error: ${msg}`,
    langCmdDesc: 'Display or switch CLI interface language (en/ru)',
    langArgDesc: 'Target language (en/ru)',
    langCurrent: (lang) => `Current interface language: ${lang === 'ru' ? '🇷🇺 Русский (ru)' : '🇬🇧 English (en)'}`,
    langSwitched: (lang) => `✓ Interface language switched to: ${lang === 'ru' ? '🇷🇺 Русский (ru)' : '🇬🇧 English (en)'}`,
    langInvalid: '✕ Invalid language. Supported: en, ru',
  },
  ru: {
    programDesc: 'Единая База Знаний и Сейф Секретов (Zero-Leak) для AI-агентов',
    langOptionDesc: 'Язык интерфейса (en/ru)',
    initDesc: 'Запустить интерактивный мастер настройки Базы Знаний',
    initDirArg: 'Папка Базы Знаний (по умолчанию текущая)',
    serveMcpDesc: 'Запустить встроенный AgentHub MCP Server (Stdio) для подключения AI-агентов из любого места',
    serveMcpKbOpt: 'Путь к Базе Знаний (по умолчанию активная База)',
    useDesc: 'Установить активную Базу Знаний по умолчанию для всей системы',
    useDirArg: 'Папка Базы Знаний',
    useNotFound: (p) => `✕ Папка не найдена: ${p}`,
    useNotInit: (p) => `⚠️ В папке ${p} нет .hub/config.json. Инициализируйте: agenthub init ${p}`,
    useSuccess: (p) => `✓ Активная База Знаний переключена на: ${p}`,
    useMcpHint: '  Все агенты через MCP теперь автоматически используют эту базу.',
    globalDesc: 'Проверить и синхронизировать глобальные настройки IDE (Windsurf, Cursor, Cline, Roo Code, Continue, Claude)',
    globalAllOpt: 'Синхронизировать все поддерживаемые IDE (а не только включенные в конфиге)',
    globalKbOpt: 'Путь к Базе Знаний',
    globalHeader: (p) => `🌐 Глобальная интеграция AgentHub для Базы: ${p}`,
    globalStatusTitle: '\nСтатус подключений IDE & MCP:',
    globalConfigLabel: 'Конфиг:',
    globalStatusLabel: 'Статус:',
    globalTip: '\n💡 Теперь вы можете открывать любой проект в этих IDE — они автоматически подключены к AgentHub!',
    syncDesc: 'Синхронизировать настройки адаптеров, карту проектов и правила',
    syncGlobalOpt: 'Также синхронизировать глобальные конфиги IDE и MCP серверов',
    syncKbOpt: 'Путь к Базе Знаний',
    syncNotFound: (p) => `✕ База Знаний не найдена по пути: ${p}. Запустите: agenthub init`,
    syncStarting: (p) => `Синхронизация AgentHub (${p})...`,
    syncRepoMapDone: '✓ Карта проектов обновлена: PROJECTS_MAP.md',
    syncAdaptersDone: (list) => `✓ Локальные адаптеры синхронизированы для: ${list}`,
    syncGlobalDone: (list) => `✓ Глобальные IDE синхронизированы: ${list}`,
    auditDesc: 'Сканировать проекты на утечки API-токенов, паролей и ключей (Leak Guard)',
    auditFixOpt: 'Автоматически перенести найденные ключи в Сейф и скрыть их',
    auditKbOpt: 'Путь к Базе Знаний',
    auditScanning: (p) => `🛡️ Сканирование на утечки секретов и токенов (${p})...`,
    auditClean: '✓ Утечек не обнаружено! Все проекты и конфиги чисты.',
    auditFindings: (count) => `\n⚠️ Обнаружено уязвимостей: ${count}\n`,
    auditValLabel: 'Значение:',
    auditLineLabel: 'Строка:',
    auditFixed: (key) => `  ✓ Перенесено в Сейф как '${key}' и заменено в файле.`,
    auditFixTip: '\n💡 Запустите `agenthub audit --fix` для автоматического переноса этих ключей в Сейф!',
    repomapDesc: 'Построить компактную карту проектов для сохранения контекста',
    repomapKbOpt: 'Путь к Базе Знаний',
    repomapSuccess: (file) => `✓ Карта проектов сформирована: ${file}`,
    repomapProjectsFound: (count) => `  Обнаружено проектов в /projects: ${count}`,
    kbDesc: 'Управление зарегистрированными Базами Знаний (список, выбор, удаление, правка)',
    kbListDesc: 'Показать список всех зарегистрированных Баз Знаний',
    kbUseDesc: 'Сделать Базу Знаний активной по умолчанию',
    kbRemoveDesc: 'Удалить Базу Знаний из реестра или с диска',
    kbEditDesc: 'Перенастроить существующую Базу Знаний',
    handoffDesc: 'Управление эстафетой сессий и контекстом между разными AI (Claude, Antigravity, DeepSeek, Windsurf и др.)',
    handoffCreateDesc: 'Создать чекпоинт передачи задачи следующему агенту',
    handoffTaskOpt: 'Текущая задача',
    handoffSummaryOpt: 'Что уже сделано',
    handoffDefaultSummary: 'Прогресс зафиксирован.',
    handoffFilesOpt: 'Затронутые файлы',
    handoffFromOpt: 'Текущий агент',
    handoffToOpt: 'Целевой следующий агент',
    handoffDefaultNext: 'Продолжить реализацию поставленной задачи.',
    handoffSaved: '✓ Чекпоинт Handoff успешно сохранен в HANDOFF.md и .hub/memory/!',
    handoffPromptDesc: 'Сгенерировать готовый промпт для переключения на другого агента',
    handoffCopyPrompt: '\nСкопируйте этот контекст в нового агента:\n',
    vaultDesc: 'Управление секретами и API-токенами в Сейфе (Zero-Leak)',
    vaultSetDesc: 'Сохранить токен в изолированный локальный Сейф (.hub/vault.env)',
    vaultSetSaved: (key) => `✓ Секрет '${key}' надежно сохранен в Сейфе (.hub/vault.env).`,
    vaultSetHint: '  AI-агенты не увидят его значение напрямую.',
    vaultListDesc: 'Показать список сохраненных ключей в Сейфе',
    vaultListEmpty: 'Сейф пуст. Добавьте секрет: agenthub vault set <KEY> <VALUE>',
    vaultListHeader: (count) => `Ключи в Сейфе (${count}):`,
    teamDesc: 'Синхронизация Базы Знаний с Git-репозиторием команды (Team Sync)',
    teamStatusDesc: 'Проверить статус Git и безопасность от утечек',
    teamStatusHeader: 'Статус Git Team Sync:',
    teamGitRepo: 'Репозиторий Git:',
    teamBranch: 'Ветка:',
    teamRemote: 'Удаленный репозиторий:',
    teamRemoteNone: 'Не настроен',
    teamUncommitted: 'Несохраненные изменения:',
    teamYes: 'Да',
    teamNo: 'Нет',
    teamSecurityHeader: 'Проверка безопасности:',
    teamSecuritySafe: '✓ Проверка безопасности: Секреты надежно изолированы и не попадут в Git.',
    teamSecurityWarn: (msg) => `\n✕ ВНИМАНИЕ: ${msg}`,
    teamCommitDesc: 'Безопасно закоммитить общие скилы и правила команды',
    teamCommitSuccess: '✓ Изменения успешно закоммичены с проверкой на утечки!',
    teamCommitError: (msg) => `✕ Ошибка: ${msg}`,
    langCmdDesc: 'Показать или переключить язык интерфейса CLI (en/ru)',
    langArgDesc: 'Целевой язык (en/ru)',
    langCurrent: (lang) => `Текущий язык интерфейса: ${lang === 'ru' ? '🇷🇺 Русский (ru)' : '🇬🇧 English (en)'}`,
    langSwitched: (lang) => `✓ Язык интерфейса переключен на: ${lang === 'ru' ? '🇷🇺 Русский (ru)' : '🇬🇧 English (en)'}`,
    langInvalid: '✕ Неверный язык. Поддерживаются: en, ru',
  },
};
