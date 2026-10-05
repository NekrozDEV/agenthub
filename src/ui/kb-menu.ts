import * as p from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import readline from 'readline';
import {
  listAllKnowledgeBases,
  setActiveKnowledgeBase,
  unregisterKnowledgeBase,
  loadConfig,
  getPreferredLanguage,
  SupportedLanguage,
} from '../core/config.js';
import { runInitWizard } from './wizard.js';
import { printBanner } from './banner.js';
import { CLI_I18N } from '../core/i18n.js';
import { checkForUpdates, renderUpdateNotice, performUpdate } from '../core/updater.js';

async function pauseToReturn(lang: SupportedLanguage): Promise<void> {
  if (!process.stdin.isTTY) return;
  const message = lang === 'ru'
    ? '\n  Нажмите Enter, чтобы вернуться в меню...'
    : '\n  Press Enter to return to menu...';
  process.stdout.write(chalk.hex('#D97757')(message));

  return new Promise<void>((resolve) => {
    const wasRaw = process.stdin.isRaw;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', () => {
      rl.close();
      if (process.stdin.setRawMode && wasRaw !== undefined) {
        process.stdin.setRawMode(wasRaw);
      }
      process.stdin.resume();
      resolve();
    });
  });
}

export async function runKbManager(customLang?: SupportedLanguage): Promise<void> {
  const lang = customLang || getPreferredLanguage();
  const terracotta = chalk.hex('#D97757').bold;

  while (true) {
    const kbs = listAllKnowledgeBases();

    if (kbs.length === 0) {
      p.note(
        chalk.yellow(
          lang === 'ru'
            ? 'Базы Знаний пока не найдены. Запустите мастер настройки для создания первой базы!'
            : 'No Knowledge Bases registered yet. Run the setup wizard to create your first one!'
        ),
        terracotta(lang === 'ru' ? '📂 Управление Базами Знаний' : '📂 Knowledge Base Manager')
      );

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
      ...kbs.map((kb) => {
        const activeBadge = kb.isActive
          ? chalk.green(lang === 'ru' ? ' [АКТИВНА] ' : ' [ACTIVE] ')
          : ' ';
        const status = kb.exists
          ? chalk.gray(
              lang === 'ru'
                ? `(${kb.skillsCount} скилов, ${kb.mcpsCount} MCP)`
                : `(${kb.skillsCount} skills, ${kb.mcpsCount} mcps)`
            )
          : chalk.red(lang === 'ru' ? '(Не найдена на диске)' : '(Not found on disk)');
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
        value: 'action:back',
        label: lang === 'ru' ? '↩️ Назад в главное меню' : '↩️ Back to main menu',
      },
    ];

    const selection = await p.select({
      message:
        lang === 'ru'
          ? 'Выберите Базу Знаний для управления:'
          : 'Select a Knowledge Base to manage:',
      options,
    });

    if (p.isCancel(selection) || selection === 'action:back') {
      return;
    }

    if (selection === 'action:create') {
      await runInitWizard();
      continue;
    }

    const selectedPath = (selection as string).replace(/^kb:/, '');
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
      continue;
    }

    if (action === 'use') {
      setActiveKnowledgeBase(selectedPath);
      p.outro(chalk.green(`✓ ${lang === 'ru' ? 'Активная База Знаний переключена на:' : 'Active Knowledge Base set to:'} ${selectedPath}`));
      await pauseToReturn(lang);
      return;
    } else if (action === 'edit') {
      await runInitWizard(selectedPath);
      await pauseToReturn(lang);
      return;
    } else if (action === 'remove') {
      const deleteFiles = await p.confirm({
        message:
          lang === 'ru'
            ? `Удалить также сами файлы с диска (${selectedPath})? (Внимание: необратимо!)`
            : `Also delete files from disk (${selectedPath})? (Warning: permanent!)`,
        initialValue: false,
      });

      if (!p.isCancel(deleteFiles)) {
        unregisterKnowledgeBase(selectedPath, deleteFiles as boolean);
        p.outro(
          chalk.green(
            lang === 'ru'
              ? `✓ База Знаний '${path.basename(selectedPath)}' удалена${deleteFiles ? ' вместе с файлами.' : ' из реестра AgentHub.'}`
              : `✓ Knowledge Base '${path.basename(selectedPath)}' removed${deleteFiles ? ' including files from disk.' : ' from registry.'}`
          )
        );
        await pauseToReturn(lang);
        return;
      }
    }
  }
}

export async function runMainMenu(): Promise<void> {
  while (true) {
    const lang = getPreferredLanguage();
    printBanner({ clear: true, lang });
    const kbs = listAllKnowledgeBases();

    // Non-blocking check for updates
    try {
      const updateInfo = await checkForUpdates();
      if (updateInfo.updateAvailable) {
        console.log(renderUpdateNotice(updateInfo, lang));
      }
    } catch {}

    if (kbs.length === 0) {
      await runInitWizard();
      const afterKbs = listAllKnowledgeBases();
      if (afterKbs.length === 0) return;
      continue;
    }

    const choice = await p.select({
      message: lang === 'ru' ? 'Главное меню AgentHub:' : 'AgentHub Main Menu:',
      options: [
        {
          value: 'wizard',
          label: lang === 'ru' ? '🚀 Создать или перенастроить Базу Знаний' : '🚀 Setup or reconfigure Knowledge Base',
          hint: lang === 'ru' ? 'Пошаговый мастер настройки' : 'Step-by-step setup wizard',
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
          hint: lang === 'ru' ? 'Поиск токенов, ключей и паролей' : 'Scan for tokens, keys and passwords',
        },
        {
          value: 'repomap',
          label: lang === 'ru' ? '🗺️ Карта проектов (RepoMap)' : '🗺️ View Project Architecture Map',
          hint: lang === 'ru' ? 'Компактная архитектурная карта проектов' : 'Compact project architecture map',
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
      p.outro(chalk.gray(lang === 'ru' ? 'До встречи в AgentHub! 👋' : 'Goodbye from AgentHub! 👋'));
      return;
    }

    if (choice === 'wizard') {
      await runInitWizard();
      await pauseToReturn(lang);
    } else if (choice === 'manage') {
      await runKbManager(lang);
    } else if (choice === 'global') {
      const { GlobalSyncManager } = await import('../core/global-sync.js');
      const { resolveKnowledgeBasePath } = await import('../core/config.js');
      const kb = resolveKnowledgeBasePath();
      const gSync = new GlobalSyncManager(kb);
      const res = gSync.syncAll();
      const configuredCount = res.targets.filter((t: any) => t.configured).length;
      console.log(chalk.green(`✓ ${lang === 'ru' ? 'Синхронизировано IDE:' : 'Synced IDE targets:'} ${configuredCount} / ${res.targets.length}`));
      await pauseToReturn(lang);
    } else if (choice === 'audit') {
      const { LeakGuard } = await import('../core/leak-guard.js');
      const { resolveKnowledgeBasePath } = await import('../core/config.js');
      const kb = resolveKnowledgeBasePath();
      const guard = new LeakGuard(kb);
      const leaks = guard.scanDirectory();
      if (leaks.length === 0) {
        console.log(chalk.green(lang === 'ru' ? '✓ Утечек не обнаружено! Все проекты и конфиги чисты.' : '✓ No leaks detected! All projects and configs are clean.'));
      } else {
        console.log(chalk.yellow(`${lang === 'ru' ? '⚠️ Обнаружено утечек:' : '⚠️ Leaks detected:'} ${leaks.length}`));
        console.log(chalk.gray(lang === 'ru' ? '💡 Запустите `agenthub audit --fix` для автоматического переноса ключей в Сейф!' : '💡 Run `agenthub audit --fix` to automatically move keys to Vault!'));
      }
      await pauseToReturn(lang);
    } else if (choice === 'repomap') {
      const { RepoMapGenerator } = await import('../core/repomap.js');
      const { resolveKnowledgeBasePath } = await import('../core/config.js');
      const kb = resolveKnowledgeBasePath();
      const gen = new RepoMapGenerator(kb);
      const file = gen.saveRepoMap();
      const projects = gen.scanProjects();
      console.log(chalk.green(`✓ ${lang === 'ru' ? 'Карта проектов сформирована:' : 'Project map generated:'} ${file}`));
      console.log(chalk.hex('#D97757')(`  ${lang === 'ru' ? 'Обнаружено проектов в /projects:' : 'Projects detected in /projects:'} ${projects.length}`));
      await pauseToReturn(lang);
    } else if (choice === 'update') {
      const res = await performUpdate(lang);
      if (res.success) {
        console.log(chalk.green(res.message));
      } else {
        console.log(chalk.red(res.message));
      }
      await pauseToReturn(lang);
    }
  }
}
