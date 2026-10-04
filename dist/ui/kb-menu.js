import * as p from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import { listAllKnowledgeBases, setActiveKnowledgeBase, unregisterKnowledgeBase, getPreferredLanguage, } from '../core/config.js';
import { runInitWizard } from './wizard.js';
import { printBanner } from './banner.js';
import { CLI_I18N } from '../core/i18n.js';
import { checkForUpdates, renderUpdateNotice, performUpdate } from '../core/updater.js';
export async function runKbManager(customLang) {
    const lang = customLang || getPreferredLanguage();
    const t = CLI_I18N[lang];
    const orange = chalk.hex('#FF6600').bold;
    const amber = chalk.hex('#FFA500');
    const kbs = listAllKnowledgeBases();
    if (kbs.length === 0) {
        p.note(chalk.yellow(lang === 'ru'
            ? 'Базы Знаний пока не найдены. Запустите мастер настройки для создания первой базы!'
            : 'No Knowledge Bases registered yet. Run the setup wizard to create your first one!'), orange(lang === 'ru' ? '📂 Управление Базами Знаний' : '📂 Knowledge Base Manager'));
        const createNow = await p.confirm({
            message: lang === 'ru' ? 'Запустить мастер настройки сейчас?' : 'Launch setup wizard now?',
            initialValue: true,
        });
        if (createNow && !p.isCancel(createNow)) {
            await runInitWizard();
        }
        return;
    }
    const options = [
        ...kbs.map((kb, idx) => {
            const activeBadge = kb.isActive ? chalk.green(' [ACTIVE] ') : ' ';
            const status = kb.exists ? chalk.gray(`(${kb.skillsCount} skills, ${kb.mcpsCount} mcps)`) : chalk.red('(Not found on disk)');
            return {
                value: `kb:${kb.path}`,
                label: `${activeBadge}${chalk.bold(kb.name)} - ${chalk.gray(kb.path)}`,
                hint: `${status}`,
            };
        }),
        {
            value: 'action:create',
            label: lang === 'ru' ? '➕ Создать новую Базу Знаний' : '➕ Create new Knowledge Base',
            hint: lang === 'ru' ? 'Запустить мастер настройки' : 'Launch setup wizard',
        },
        {
            value: 'action:exit',
            label: lang === 'ru' ? '🚪 Выход' : '🚪 Exit',
        },
    ];
    const selection = await p.select({
        message: lang === 'ru'
            ? 'Выберите Базу Знаний для управления:'
            : 'Select a Knowledge Base to manage:',
        options,
    });
    if (p.isCancel(selection) || selection === 'action:exit') {
        return;
    }
    if (selection === 'action:create') {
        await runInitWizard();
        return;
    }
    const selectedPath = selection.replace(/^kb:/, '');
    const kbInfo = kbs.find((k) => k.path === selectedPath);
    const action = await p.select({
        message: `${lang === 'ru' ? 'Действие для' : 'Action for'} ${chalk.bold(path.basename(selectedPath))}:`,
        options: [
            {
                value: 'use',
                label: lang === 'ru' ? '🌟 Сделать активной (по умолчанию)' : '🌟 Set as active (default)',
                hint: kbInfo?.isActive ? (lang === 'ru' ? 'Уже активна' : 'Already active') : '',
            },
            {
                value: 'edit',
                label: lang === 'ru' ? '⚙️ Перенастроить (запустить мастер)' : '⚙️ Reconfigure (run wizard)',
            },
            {
                value: 'remove',
                label: lang === 'ru' ? '🗑️ Удалить из списка / с диска' : '🗑️ Remove from registry / disk',
            },
            {
                value: 'back',
                label: lang === 'ru' ? '↩️ Назад' : '↩️ Back',
            },
        ],
    });
    if (p.isCancel(action) || action === 'back') {
        return;
    }
    if (action === 'use') {
        setActiveKnowledgeBase(selectedPath);
        p.outro(chalk.green(`✓ ${lang === 'ru' ? 'Активная база переключена на:' : 'Active Knowledge Base set to:'} ${selectedPath}`));
    }
    else if (action === 'edit') {
        await runInitWizard(selectedPath);
    }
    else if (action === 'remove') {
        const deleteFiles = await p.confirm({
            message: lang === 'ru'
                ? `Удалить также сами файлы с диска (${selectedPath})? (Внимание: необратимо!)`
                : `Also delete files from disk (${selectedPath})? (Warning: permanent!)`,
            initialValue: false,
        });
        if (!p.isCancel(deleteFiles)) {
            unregisterKnowledgeBase(selectedPath, deleteFiles);
            p.outro(chalk.green(lang === 'ru'
                ? `✓ База Знаний '${path.basename(selectedPath)}' удалена${deleteFiles ? ' вместе с файлами.' : ' из реестра AgentHub.'}`
                : `✓ Knowledge Base '${path.basename(selectedPath)}' removed${deleteFiles ? ' including files from disk.' : ' from registry.'}`));
        }
    }
}
export async function runMainMenu() {
    printBanner();
    const lang = getPreferredLanguage();
    const kbs = listAllKnowledgeBases();
    // Non-blocking check for updates
    try {
        const updateInfo = await checkForUpdates();
        if (updateInfo.updateAvailable) {
            console.log(renderUpdateNotice(updateInfo, lang));
        }
    }
    catch { }
    if (kbs.length === 0) {
        await runInitWizard();
        return;
    }
    const orange = chalk.hex('#FF6600').bold;
    const choice = await p.select({
        message: lang === 'ru' ? 'Главное меню AgentHub:' : 'AgentHub Main Menu:',
        options: [
            {
                value: 'wizard',
                label: lang === 'ru' ? '🚀 Создать или перенастроить Базу Знаний' : '🚀 Setup or reconfigure Knowledge Base',
            },
            {
                value: 'manage',
                label: lang === 'ru' ? `📂 Мои Базы Знаний (${kbs.length})` : `📂 My Knowledge Bases (${kbs.length})`,
                hint: lang === 'ru' ? 'Просмотр, переключение, редактирование, удаление' : 'View, switch, edit, remove',
            },
            {
                value: 'global',
                label: lang === 'ru' ? '🌐 Глобальная синхронизация с IDE' : '🌐 Global IDE & MCP Sync',
                hint: 'Windsurf, Cursor, Cline, Roo Code, Continue, Claude, Antigravity',
            },
            {
                value: 'audit',
                label: lang === 'ru' ? '🛡️ Проверка утечек секретов (Leak Guard)' : '🛡️ Secret Leak Guard Audit',
            },
            {
                value: 'repomap',
                label: lang === 'ru' ? '🗺️ Карта проектов (RepoMap)' : '🗺️ View Project Architecture Map',
            },
            {
                value: 'update',
                label: lang === 'ru' ? '🔄 Проверить и обновить AgentHub' : '🔄 Check for updates & upgrade AgentHub',
                hint: lang === 'ru' ? 'Автоматическая установка актуальной версии' : 'Automatically install latest version',
            },
            {
                value: 'exit',
                label: lang === 'ru' ? '🚪 Выход' : '🚪 Exit',
            },
        ],
    });
    if (p.isCancel(choice) || choice === 'exit') {
        return;
    }
    if (choice === 'wizard') {
        await runInitWizard();
    }
    else if (choice === 'manage') {
        await runKbManager(lang);
    }
    else if (choice === 'global') {
        // Run global sync via child process or command
        const { GlobalSyncManager } = await import('../core/global-sync.js');
        const { resolveKnowledgeBasePath } = await import('../core/config.js');
        const kb = resolveKnowledgeBasePath();
        const gSync = new GlobalSyncManager(kb);
        const res = gSync.syncAll();
        const configuredCount = res.targets.filter((t) => t.configured).length;
        console.log(chalk.green(`✓ ${lang === 'ru' ? 'Синхронизировано IDE:' : 'Synced IDE targets:'} ${configuredCount} / ${res.targets.length}`));
    }
    else if (choice === 'audit') {
        const { LeakGuard } = await import('../core/leak-guard.js');
        const { resolveKnowledgeBasePath } = await import('../core/config.js');
        const kb = resolveKnowledgeBasePath();
        const guard = new LeakGuard(kb);
        const leaks = guard.scanDirectory();
        if (leaks.length === 0) {
            console.log(chalk.green(lang === 'ru' ? '✓ Утечек не обнаружено!' : '✓ No secret leaks found!'));
        }
        else {
            console.log(chalk.yellow(`${lang === 'ru' ? '⚠️ Обнаружено утечек:' : '⚠️ Leaks detected:'} ${leaks.length}`));
        }
    }
    else if (choice === 'repomap') {
        const { RepoMapGenerator } = await import('../core/repomap.js');
        const { resolveKnowledgeBasePath } = await import('../core/config.js');
        const kb = resolveKnowledgeBasePath();
        const gen = new RepoMapGenerator(kb);
        const file = gen.saveRepoMap();
        console.log(chalk.green(`✓ PROJECTS_MAP.md: ${file}`));
    }
    else if (choice === 'update') {
        const res = await performUpdate(lang);
        if (res.success) {
            console.log(chalk.green(res.message));
        }
        else {
            console.log(chalk.red(res.message));
        }
    }
}
