import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { AGENT_INFO, saveConfig, loadConfig, getVaultPath, setActiveKnowledgeBase, getPreferredLanguage, } from '../core/config.js';
import { SecretVault } from '../core/vault.js';
import { LeakGuard } from '../core/leak-guard.js';
import { RepoMapGenerator } from '../core/repomap.js';
import { GlobalSyncManager } from '../core/global-sync.js';
import { DEFAULT_SKILLS } from '../templates/default-skills.js';
import { DEFAULT_MCPS } from '../templates/default-mcps.js';
import { syncAdapters } from '../adapters/index.js';
import { printBanner } from './banner.js';
import { getCurrentVersion } from '../core/updater.js';
const I18N = {
    en: {
        title: ' AgentHub Setup Wizard ',
        folderMessage: 'Select your Unified Knowledge Base folder:',
        folderEmptyError: 'Path cannot be empty',
        cancelMessage: 'Setup cancelled.',
        agentsMessage: 'Which AI systems and IDEs do you use? (Space to select, Enter to confirm):',
        skillsMessage: 'Select starter engineering skills to install (or deselect all to skip):',
        mcpsMessage: 'Select MCP tool templates to configure (or deselect all to skip):',
        globalSyncMessage: 'Configure global IDE & AI integration (Claude Code ~/.claude.json, Claude Desktop, Windsurf, Cursor, Cline, Roo Code, Continue, Antigravity, ZCode) via MCP?',
        spinnerInit: 'Initializing Knowledge Base structure...',
        spinnerRepoMap: 'Building smart project map (RepoMap)...',
        spinnerLocalSync: 'Synchronizing local adapters for selected AI systems...',
        spinnerGlobalSync: 'Configuring global IDE and MCP integrations...',
        spinnerDone: '✓ Knowledge Base configured successfully!',
        leakWarning: (count) => `Warning! Detected ${count} potential secret(s) in knowledge base files!\nRun 'agenthub audit' to safely move them to Vault.`,
        leakTitle: '🛡️ Secret Inspector & Leak Guard',
        summaryTitle: '📋 Setup Summary',
        summaryFolder: 'Knowledge Base folder',
        summaryAgents: 'Active AI systems',
        summaryGlobalSync: 'Global MCP integrations',
        summaryVault: 'Zero-Leak Secret Vault',
        summaryRepoMap: 'Project Map: PROJECTS_MAP.md (smart on-demand context)',
        summaryMetaSkill: 'Meta-Skill for agents: skills/agenthub-guide.md',
        summarySkillsCount: (count) => `Installed Skills: ${count}`,
        summaryMcpsCount: (count) => `Configured MCP Templates: ${count}`,
        outroSuccess: 'All set! You can launch agents directly in this folder, OR work across any of your projects via AgentHub MCP!',
        agentHints: {
            antigravity: 'Skills (.gemini/antigravity), Rules & MCP integrations',
            'claude-code': 'CLAUDE.md guidelines, tools config & Claude Desktop MCP',
            'deepseek-hermes': 'Local and cloud agent prompts & function calling schemas',
            opencode: 'Open-source autonomous developer agents',
            cursor: '.cursorrules and .cursor/mcp.json integrations',
            codex: 'OpenAI custom agent instructions and tool schemas',
            windsurf: '.windsurfrules & ~/.codeium/windsurf/mcp_config.json',
            cline: '.clinerules & VSCode cline_mcp_settings.json',
            'roo-code': '.roomodes, .clinerules & Roo Code MCP settings',
            continue: 'config.yaml, slash commands & MCP integrations',
            copilot: 'Custom repository instructions & agent guidelines',
            zcode: '.zcoderules, AGENTS.md & .zcode/mcp.json integrations',
        },
    },
    ru: {
        title: ' Мастер настройки AgentHub ',
        folderMessage: 'Выберите папку вашей Единой Базы Знаний (Knowledge Base):',
        folderEmptyError: 'Путь не может быть пустым',
        cancelMessage: 'Настройка отменена.',
        agentsMessage: 'Какими AI-системами и IDE вы пользуетесь? (Пробел — выбор, Enter — подтвердить):',
        skillsMessage: 'Выберите стартовые инженерные скилы (или снимите выбор, чтобы пропустить):',
        mcpsMessage: 'Выберите шаблоны MCP-инструментов (или снимите выбор, чтобы пропустить):',
        globalSyncMessage: 'Настроить глобальную интеграцию IDE и AI (Claude Code ~/.claude.json, Claude Desktop, Windsurf, Cursor, Cline, Roo Code, Continue, Antigravity, ZCode) через MCP?',
        spinnerInit: 'Инициализация структуры Базы Знаний...',
        spinnerRepoMap: 'Построение умной карты проектов (RepoMap)...',
        spinnerLocalSync: 'Синхронизация локальных адаптеров для выбранных AI-систем...',
        spinnerGlobalSync: 'Подключение глобальных конфигураций IDE и MCP...',
        spinnerDone: '✓ База Знаний успешно сконфигурирована!',
        leakWarning: (count) => `Внимание! Обнаружено ${count} потенциальных секретов в файлах базы знаний!\nЗапустите 'agenthub audit' для безопасного переноса их в Сейф.`,
        leakTitle: '🛡️ Инспектор Секретов (Leak Guard)',
        summaryTitle: '📋 Итоги настройки',
        summaryFolder: 'Папка базы знаний',
        summaryAgents: 'Активные AI-системы',
        summaryGlobalSync: 'Глобальные MCP интеграции',
        summaryVault: 'Сейф секретов (Zero-Leak)',
        summaryRepoMap: 'Карта проектов: PROJECTS_MAP.md (умная загрузка контекста)',
        summaryMetaSkill: 'Мета-скил для агентов: skills/agenthub-guide.md',
        summarySkillsCount: (count) => `Установлено скилов: ${count}`,
        summaryMcpsCount: (count) => `Настроено MCP-шаблонов: ${count}`,
        outroSuccess: 'Все готово! Вы можете запускать агентов прямо в этой папке, ЛИБО работать в любых ваших проектах через AgentHub MCP!',
        agentHints: {
            antigravity: 'Навыки (.gemini/antigravity), правила и MCP интеграции',
            'claude-code': 'CLAUDE.md инструкции, конфиг инструментов и Claude Desktop MCP',
            'deepseek-hermes': 'Промпты для локальных/облачных агентов и схемы вызова функций',
            opencode: 'Автономные open-source агенты-разработчики',
            cursor: 'Интеграции .cursorrules и .cursor/mcp.json',
            codex: 'Инструкции для кастомных агентов OpenAI и схемы инструментов',
            windsurf: '.windsurfrules и ~/.codeium/windsurf/mcp_config.json',
            cline: '.clinerules и cline_mcp_settings.json для VS Code',
            'roo-code': '.roomodes, .clinerules и настройки Roo Code MCP',
            continue: 'config.yaml, слэш-команды и MCP интеграции',
            copilot: 'Инструкции репозитория и руководства для агентов',
            zcode: 'Интеграции .zcoderules, AGENTS.md и .zcode/mcp.json',
        },
    },
};
export async function runInitWizard(initialTargetDir) {
    const defaultDir = initialTargetDir || process.cwd();
    const existingConfig = loadConfig(defaultDir);
    const initialLang = existingConfig?.language || getPreferredLanguage(defaultDir);
    printBanner({ clear: true, lang: initialLang });
    // 0. Language selection
    const langChoice = await p.select({
        message: 'Select language / Выберите язык:',
        options: [
            { value: 'en', label: '🇬🇧 English', hint: 'English interface' },
            { value: 'ru', label: '🇷🇺 Русский', hint: 'Русскоязычный интерфейс' },
        ],
        initialValue: initialLang,
    });
    if (p.isCancel(langChoice)) {
        p.cancel('Setup cancelled / Настройка отменена.');
        return;
    }
    const lang = langChoice;
    const t = I18N[lang];
    p.intro(chalk.bgHex('#D97757').black.bold(t.title));
    // 1. Choose Knowledge Base Folder
    const folderInput = await p.text({
        message: t.folderMessage,
        initialValue: defaultDir,
        validate: (val) => {
            if (!val || val.trim().length === 0)
                return t.folderEmptyError;
        },
    });
    if (p.isCancel(folderInput)) {
        p.cancel(t.cancelMessage);
        return;
    }
    const kbPath = path.resolve(folderInput);
    // 2. Select Active AI Systems
    const agentOptions = Object.keys(AGENT_INFO).map((key) => ({
        value: key,
        label: AGENT_INFO[key].name,
        hint: t.agentHints[key] || AGENT_INFO[key].description,
    }));
    const initialAgents = existingConfig?.enabledAgents || [
        'antigravity',
        'deepseek-hermes',
        'opencode',
        'windsurf',
        'cursor',
    ];
    const selectedAgents = await p.multiselect({
        message: t.agentsMessage,
        options: agentOptions,
        initialValues: initialAgents,
        required: true,
    });
    if (p.isCancel(selectedAgents)) {
        p.cancel(t.cancelMessage);
        return;
    }
    // 3. Optional Starter Skills Catalog
    const skillHintsRu = {
        'agenthub-guide': {
            label: 'AgentHub Universal Guide (Мета-скил)',
            hint: 'Основное руководство: обнаружение скилов, экономия токенов, безопасность и передача задач',
        },
        'frontend-design': {
            label: 'Modern Frontend Design & UI Excellence',
            hint: 'Создание красивых, отзывчивых интерфейсов с чистой типографикой и Tailwind CSS',
        },
        'cybersecurity-guidelines': {
            label: 'Cybersecurity & Vulnerability Prevention',
            hint: 'Защита по OWASP Top 10, санитизация данных, изоляция секретов и безопасная авторизация',
        },
        'git-workflow': {
            label: 'Conventional Git Workflow & Team Collaboration',
            hint: 'Чистая история коммитов, ветвление, семантические сообщения и командная работа',
        },
        'code-review': {
            label: 'Rigorous Code Review & Clean Architecture',
            hint: 'Глубокий анализ кода, выявление скрытых багов, проверка типизации и архитектуры',
        },
    };
    const skillOptions = DEFAULT_SKILLS.map((s) => ({
        value: s.id,
        label: lang === 'ru' && skillHintsRu[s.id] ? skillHintsRu[s.id].label : s.title,
        hint: lang === 'ru' && skillHintsRu[s.id] ? skillHintsRu[s.id].hint : s.description,
    }));
    const selectedSkillIds = (await p.multiselect({
        message: t.skillsMessage,
        options: skillOptions,
        initialValues: ['agenthub-guide', 'frontend-design', 'cybersecurity-guidelines', 'git-workflow', 'code-review'],
        required: false,
    }));
    if (p.isCancel(selectedSkillIds)) {
        p.cancel(t.cancelMessage);
        return;
    }
    // 4. Optional Starter MCP Catalog
    const mcpHintsRu = {
        github: {
            name: 'GitHub Интеграция',
            description: 'Управление репозиториями, пулл-реквестами, задачами и коммитами через MCP',
        },
        telegram: {
            name: 'Telegram Бот',
            description: 'Отправка сообщений, алертов и команд боту в реальном времени',
        },
        cloudflare: {
            name: 'Cloudflare Workers & DNS',
            description: 'Управление бессерверными воркерами, DNS и Edge-инфраструктурой',
        },
        filesystem: {
            name: 'Локальная Файловая Система',
            description: 'Безопасное чтение и запись локальных файлов и директорий проекта',
        },
    };
    const mcpOptions = Object.values(DEFAULT_MCPS).map((m) => ({
        value: m.id,
        label: lang === 'ru' && mcpHintsRu[m.id] ? mcpHintsRu[m.id].name : m.name,
        hint: lang === 'ru' && mcpHintsRu[m.id] ? mcpHintsRu[m.id].description : m.description,
    }));
    const selectedMcpIds = (await p.multiselect({
        message: t.mcpsMessage,
        options: mcpOptions,
        initialValues: ['github', 'telegram', 'cloudflare', 'filesystem'],
        required: false,
    }));
    if (p.isCancel(selectedMcpIds)) {
        p.cancel(t.cancelMessage);
        return;
    }
    // 5. Ask for Global IDE / MCP Registration
    const enableGlobalSync = await p.confirm({
        message: t.globalSyncMessage,
        initialValue: true,
    });
    if (p.isCancel(enableGlobalSync)) {
        p.cancel(t.cancelMessage);
        return;
    }
    const s = p.spinner();
    s.start(t.spinnerInit);
    // Ensure folders
    const projectsDir = path.join(kbPath, 'projects');
    const skillsDir = path.join(kbPath, 'skills');
    const mcpDir = path.join(kbPath, 'mcp');
    const hubDir = path.join(kbPath, '.hub');
    const memoryDir = path.join(kbPath, '.hub', 'memory');
    for (const d of [projectsDir, skillsDir, mcpDir, hubDir, memoryDir]) {
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d, { recursive: true });
        }
    }
    // Install selected skills (or agenthub-guide by default)
    const installedSkills = [];
    const skillsToInstall = DEFAULT_SKILLS.filter((skill) => selectedSkillIds.includes(skill.id) || skill.id === 'agenthub-guide');
    for (const skill of skillsToInstall) {
        const skillPath = path.join(skillsDir, skill.filename);
        if (!fs.existsSync(skillPath)) {
            fs.writeFileSync(skillPath, skill.content, 'utf8');
        }
        installedSkills.push(skill.filename);
    }
    // Install selected MCP configs
    const installedMcps = [];
    for (const mcpId of selectedMcpIds) {
        const mcp = DEFAULT_MCPS[mcpId];
        if (mcp) {
            const mcpPath = path.join(mcpDir, `${mcpId}.json`);
            if (!fs.existsSync(mcpPath)) {
                fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2), 'utf8');
            }
            installedMcps.push(mcpId);
        }
    }
    // Initialize Vault and ensure gitignore
    const vault = new SecretVault(kbPath);
    vault.save();
    SecretVault.ensureGitIgnored(kbPath);
    // Save Config & register as active KB globally
    const config = {
        version: getCurrentVersion(),
        language: lang,
        knowledgeBasePath: kbPath,
        enabledAgents: selectedAgents,
        settings: {
            leakGuardAutoScan: true,
            repoMapAutoUpdate: true,
            tokenBudgetPerProject: 800,
        },
    };
    saveConfig(kbPath, config);
    setActiveKnowledgeBase(kbPath);
    s.message(t.spinnerRepoMap);
    const repoMapGen = new RepoMapGenerator(kbPath);
    repoMapGen.saveRepoMap();
    s.message(t.spinnerLocalSync);
    const synced = await syncAdapters(kbPath, config.enabledAgents, installedSkills, installedMcps);
    let globalSyncSummary = [];
    if (enableGlobalSync) {
        s.message(t.spinnerGlobalSync);
        const globalSync = new GlobalSyncManager(kbPath);
        const gResult = globalSync.syncAll(config.enabledAgents);
        globalSyncSummary = gResult.targets.filter((target) => target.configured).map((target) => target.name);
    }
    s.stop(chalk.green(t.spinnerDone));
    // Run Leak Guard check
    const leakGuard = new LeakGuard(kbPath);
    const leaks = leakGuard.scanDirectory();
    if (leaks.length > 0) {
        p.note(chalk.yellow(t.leakWarning(leaks.length)), t.leakTitle);
    }
    const orangeText = chalk.hex('#FFA500');
    const orangeBullet = chalk.hex('#D97757').bold;
    p.note(orangeText(`${orangeBullet('•')} ${t.summaryFolder}: ${chalk.white.bold(kbPath)}\n` +
        `${orangeBullet('•')} ${t.summaryAgents}: ${chalk.white(synced.join(', '))}\n` +
        `${orangeBullet('•')} ${t.summarySkillsCount(installedSkills.length)}: ${chalk.gray(installedSkills.join(', '))}\n` +
        `${orangeBullet('•')} ${t.summaryMcpsCount(installedMcps.length)}: ${chalk.gray(installedMcps.join(', ') || (lang === 'ru' ? 'нет' : 'none'))}\n` +
        (globalSyncSummary.length > 0
            ? `${orangeBullet('•')} ${t.summaryGlobalSync}: ${chalk.white(globalSyncSummary.join(', '))}\n`
            : '') +
        `${orangeBullet('•')} ${t.summaryVault}: ${chalk.white(getVaultPath(kbPath))}\n` +
        `${orangeBullet('•')} ${t.summaryRepoMap}`), chalk.hex('#D97757').bold(t.summaryTitle));
    p.outro(chalk.bold.hex('#F08B6B')('🔥 ' + t.outroSuccess));
}
