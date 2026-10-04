import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { runInitWizard } from './ui/wizard.js';
import { printBanner } from './ui/banner.js';
import { loadConfig, saveConfig, AGENT_INFO } from './core/config.js';
import { SecretVault } from './core/vault.js';
import { LeakGuard } from './core/leak-guard.js';
import { RepoMapGenerator } from './core/repomap.js';
import { HandoffManager, HandoffCheckpoint } from './core/handoff.js';
import { TeamSyncManager } from './core/sync.js';
import { syncAdapters } from './adapters/index.js';

const program = new Command();

program
  .name('agenthub')
  .description('Universal Knowledge Base & Zero-Leak Security Hub for AI Agents')
  .version('0.1.0');

// Default / Init Command
program
  .command('init')
  .description('Запустить интерактивный мастер настройки Базы Знаний')
  .argument('[directory]', 'Папка Базы Знаний (по умолчанию текущая)')
  .action(async (directory) => {
    await runInitWizard(directory);
  });

// Sync Command
program
  .command('sync')
  .description('Синхронизировать настройки адаптеров, карту проектов и правила')
  .action(async () => {
    const cwd = process.cwd();
    const config = loadConfig(cwd);
    if (!config) {
      console.log(chalk.red('✕ База Знаний не найдена в текущей папке. Запустите: agenthub init'));
      return;
    }

    console.log(chalk.cyan('Синхронизация AgentHub...'));

    // 1. RepoMap
    const repoMapGen = new RepoMapGenerator(cwd);
    repoMapGen.saveRepoMap();
    console.log(chalk.green('✓ Карта проектов обновлена: PROJECTS_MAP.md'));

    // 2. Secret Vault check
    SecretVault.ensureGitIgnored(cwd);

    // 3. Collect active skills & MCPs
    const skills = fs.existsSync(path.join(cwd, 'skills'))
      ? fs.readdirSync(path.join(cwd, 'skills')).filter((f) => f.endsWith('.md'))
      : [];
    const mcps = fs.existsSync(path.join(cwd, 'mcp'))
      ? fs.readdirSync(path.join(cwd, 'mcp')).map((f) => f.replace(/\.json$/, ''))
      : [];

    const synced = await syncAdapters(cwd, config.enabledAgents, skills, mcps);
    console.log(chalk.green(`✓ Адаптеры синхронизированы для: ${synced.join(', ')}`));
  });

// Audit / Leak-Guard Command (Feature 4)
program
  .command('audit')
  .description('Сканировать проекты на утечки API-токенов, паролей и ключей (Leak Guard)')
  .option('--fix', 'Автоматически перенести найденные ключи в Сейф и скрыть их')
  .action(async (options) => {
    const cwd = process.cwd();
    const leakGuard = new LeakGuard(cwd);
    console.log(chalk.cyan('🛡️ Сканирование на утечки секретов и токенов...'));

    const findings = leakGuard.scanDirectory();
    if (findings.length === 0) {
      console.log(chalk.green('✓ Утечек не обнаружено! Все проекты и конфиги чисты.'));
      return;
    }

    console.log(chalk.yellow(`\n⚠️ Обнаружено уязвимостей: ${findings.length}\n`));
    const vault = new SecretVault(cwd);

    for (const f of findings) {
      console.log(
        `${chalk.red(`[${f.type}]`)} ${chalk.bold(f.relativePath)}:${f.line}` +
        `\n  Значение: ${chalk.red(f.maskedSecret)}` +
        `\n  Строка: ${chalk.gray(f.snippet)}`
      );

      if (options.fix) {
        const envKey = `AUTO_SECRET_${f.type.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
        vault.setSecret(envKey, f.matchedSecret);
        leakGuard.redactSecretInFile(f, envKey);
        console.log(chalk.green(`  ✓ Перенесено в Сейф как '${envKey}' и заменено в файле.`));
      }
    }

    if (!options.fix) {
      console.log(
        chalk.cyan('\n💡 Запустите `agenthub audit --fix` для автоматического переноса этих ключей в Сейф!')
      );
    }
  });

// RepoMap Command (Feature 5)
program
  .command('repomap')
  .description('Построить компактную карту проектов для экономии токенов')
  .action(() => {
    const cwd = process.cwd();
    const gen = new RepoMapGenerator(cwd);
    const file = gen.saveRepoMap();
    const projects = gen.scanProjects();
    console.log(chalk.green(`✓ Карта проектов сформирована: ${file}`));
    console.log(chalk.cyan(`  Обнаружено проектов в /projects: ${projects.length}`));
    for (const p of projects) {
      console.log(`  - ${chalk.bold(p.name)} (${p.type}) [${p.techStack.join(', ')}]`);
    }
  });

// Cross-Agent Handoff Command (Feature 1)
const handoffCmd = program
  .command('handoff')
  .description('Управление эстафетой сессий и контекстом между разными AI (Claude, Antigravity, DeepSeek и др.)');

handoffCmd
  .command('create')
  .description('Создать чекпоинт передачи задачи следующему агенту')
  .requiredOption('-t, --task <task>', 'Текущая задача')
  .option('-s, --summary <summary>', 'Что уже сделано', 'Прогресс зафиксирован.')
  .option('-f, --files <files...>', 'Затронутые файлы', [])
  .option('--from <agent>', 'Текущий агент', 'manual')
  .option('--to <agent>', 'Целевой следующий агент')
  .action((opts) => {
    const cwd = process.cwd();
    const mgr = new HandoffManager(cwd);
    const cp: HandoffCheckpoint = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      activeTask: opts.task,
      status: 'in_progress',
      sourceAgent: opts.from,
      targetAgent: opts.to,
      summary: opts.summary,
      modifiedFiles: opts.files,
      nextSteps: ['Продолжить реализацию поставленной задачи.'],
    };
    mgr.saveCheckpoint(cp);
    console.log(chalk.green('✓ Чекпоинт Handoff успешно сохранен в HANDOFF.md и .hub/memory/!'));
  });

handoffCmd
  .command('prompt <targetAgent>')
  .description('Сгенерировать готовый промпт для переключения на другого агента')
  .action((targetAgent) => {
    const cwd = process.cwd();
    const mgr = new HandoffManager(cwd);
    const prompt = mgr.generatePromptForAgent(targetAgent);
    console.log(chalk.cyan('\nСкопируйте этот контекст в нового агента:\n'));
    console.log(chalk.yellow(prompt));
  });

// Vault Command (Zero-Leak Security)
const vaultCmd = program
  .command('vault')
  .description('Управление секретами и API-токенами в Сейфе (Zero-Leak)');

vaultCmd
  .command('set <key> <value>')
  .description('Сохранить токен в изолированный локальный Сейф')
  .action((key, value) => {
    const cwd = process.cwd();
    const vault = new SecretVault(cwd);
    vault.setSecret(key, value);
    console.log(chalk.green(`✓ Секрет '${key}' надежно сохранен в Сейфе (.hub/vault.env).`));
    console.log(chalk.gray('  AI-агенты не увидят его значение напрямую.'));
  });

vaultCmd
  .command('list')
  .description('Показать список сохраненных ключей в Сейфе')
  .action(() => {
    const cwd = process.cwd();
    const vault = new SecretVault(cwd);
    const keys = vault.listKeys();
    if (keys.length === 0) {
      console.log(chalk.gray('Сейф пуст. Добавьте секрет: agenthub vault set <KEY> <VALUE>'));
      return;
    }
    console.log(chalk.cyan(`Ключи в Сейфе (${keys.length}):`));
    for (const k of keys) {
      console.log(`  • ${chalk.bold(k)}: [PROTECTED / ZERO-LEAK]`);
    }
  });

// Team Sync Command (Feature 6)
const teamCmd = program
  .command('team')
  .description('Синхронизация Базы Знаний с Git-репозиторием команды (Team Sync)');

teamCmd
  .command('status')
  .description('Проверить статус Git и безопасность от утечек')
  .action(() => {
    const cwd = process.cwd();
    const sync = new TeamSyncManager(cwd);
    const st = sync.checkGit();
    console.log(chalk.cyan('Статус Git Team Sync:'));
    console.log(`  Репозиторий Git: ${st.isGitRepo ? chalk.green('Да') : chalk.red('Нет')}`);
    console.log(`  Ветка: ${chalk.bold(st.branch || '-')}`);
    console.log(`  Удаленный репозиторий: ${st.hasRemote ? chalk.green(st.remoteUrl) : chalk.yellow('Не настроен')}`);
    console.log(`  Несохраненные изменения: ${st.hasUncommittedChanges ? chalk.yellow('Есть') : chalk.green('Нет')}`);

    const pre = sync.preFlightSecurityCheck();
    if (!pre.safe) {
      console.log(chalk.red(`\n✕ ВНИМАНИЕ: ${pre.error}`));
    } else {
      console.log(chalk.green('✓ Проверка безопасности: Секреты надежно изолированы и не попадут в Git.'));
    }
  });

teamCmd
  .command('commit <message>')
  .description('Безопасно закоммитить общие скилы и правила команды')
  .action((msg) => {
    const cwd = process.cwd();
    const sync = new TeamSyncManager(cwd);
    try {
      sync.commitSharedChanges(msg);
      console.log(chalk.green(`✓ Изменения успешно закоммичены с проверкой на утечки!`));
    } catch (err: any) {
      console.log(chalk.red(`✕ Ошибка: ${err.message}`));
    }
  });

// Default action when no arguments provided: launch wizard
if (process.argv.length <= 2) {
  runInitWizard().catch(console.error);
} else {
  program.parse();
}
