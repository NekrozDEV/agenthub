import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import * as p from '@clack/prompts';
import { runInitWizard } from './ui/wizard.js';
import { printBanner } from './ui/banner.js';
import {
  loadConfig,
  saveConfig,
  AGENT_INFO,
  resolveKnowledgeBasePath,
  setActiveKnowledgeBase,
  loadGlobalConfig,
  getPreferredLanguage,
  setPreferredLanguage,
  SupportedLanguage,
  listAllKnowledgeBases,
  unregisterKnowledgeBase,
  isCriticalSystemPath,
} from './core/config.js';
import { runMainMenu, runKbManager } from './ui/kb-menu.js';
import { SecretVault } from './core/vault.js';
import { LeakGuard } from './core/leak-guard.js';
import { RepoMapGenerator } from './core/repomap.js';
import { HandoffManager, HandoffCheckpoint } from './core/handoff.js';
import { TeamSyncManager } from './core/sync.js';
import { GlobalSyncManager } from './core/global-sync.js';
import { syncAdapters } from './adapters/index.js';
import { DEFAULT_SKILLS } from './templates/default-skills.js';
import { startAgentHubMcpServer } from './mcp/server.js';
import { CLI_I18N } from './core/i18n.js';
import {
  checkForUpdates,
  renderUpdateNotice,
  performUpdate,
  setAutoUpdateSetting,
  getAutoUpdateSetting,
  getCurrentVersion,
} from './core/updater.js';

export function buildCli(customLang?: SupportedLanguage): Command {
  const lang = customLang || getPreferredLanguage();
  const t = CLI_I18N[lang];
  const orange = chalk.hex('#FF8800');
  const program = new Command();

  program
    .name('agenthub')
    .description(t.programDesc)
    .version(getCurrentVersion())
    .option('--lang <language>', t.langOptionDesc);

  // Hook for non-blocking update notifications (skip on stdio MCP server or when autoUpdate is off)
  program.hook('postAction', async (_thisCmd, actionCmd) => {
    if (actionCmd?.name() === 'serve-mcp') return;
    if (getAutoUpdateSetting() === 'off') return;
    try {
      const update = await checkForUpdates();
      if (update.updateAvailable) {
        console.log(renderUpdateNotice(update, lang));
      }
    } catch {}
  });

  // Language management command
  program
    .command('lang')
    .alias('language')
    .description(t.langCmdDesc)
    .argument('[language]', t.langArgDesc)
    .action((newLang) => {
      if (!newLang) {
        console.log(orange(t.langCurrent(lang)));
        return;
      }
      const normalized = newLang.toLowerCase();
      if (normalized !== 'en' && normalized !== 'ru') {
        console.log(chalk.red(t.langInvalid));
        return;
      }
      setPreferredLanguage(normalized as SupportedLanguage);
      const newT = CLI_I18N[normalized as SupportedLanguage];
      console.log(chalk.green(newT.langSwitched(normalized)));
    });

  // Default / Init Command
  program
    .command('init')
    .description(t.initDesc)
    .argument('[directory]', t.initDirArg)
    .action(async (directory) => {
      await runInitWizard(directory);
    });

  // Serve MCP Command
  program
    .command('serve-mcp')
    .description(t.serveMcpDesc)
    .option('--kb <path>', t.serveMcpKbOpt)
    .action(async (opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      await startAgentHubMcpServer(kbPath);
    });

  // Use / Switch active KB command
  program
    .command('use')
    .description(t.useDesc)
    .argument('<directory>', t.useDirArg)
    .action((directory) => {
      const resolved = path.resolve(directory);
      if (!fs.existsSync(resolved)) {
        console.log(chalk.red(t.useNotFound(resolved)));
        return;
      }
      const config = loadConfig(resolved);
      if (!config) {
        console.log(chalk.yellow(t.useNotInit(resolved)));
      }
      setActiveKnowledgeBase(resolved);
      console.log(chalk.green(t.useSuccess(chalk.bold(resolved))));
      console.log(chalk.gray(t.useMcpHint));
    });

  // Knowledge Base Management Command Group
  const kbCmd = program
    .command('kb')
    .alias('kbs')
    .description(t.kbDesc);

  kbCmd
    .command('list')
    .description(t.kbListDesc)
    .action(() => {
      const kbs = listAllKnowledgeBases();
      if (kbs.length === 0) {
        console.log(chalk.gray(lang === 'ru' ? 'Баз Знаний не найдено. Запустите: agenthub init' : 'No Knowledge Bases registered. Run: agenthub init'));
        return;
      }
      console.log(orange(lang === 'ru' ? `Зарегистрированные Базы Знаний (${kbs.length}):` : `Registered Knowledge Bases (${kbs.length}):`));
      for (const kb of kbs) {
        const active = kb.isActive
          ? chalk.green(lang === 'ru' ? ' [АКТИВНА] ' : ' [ACTIVE] ')
          : '          ';
        const mark = kb.exists ? chalk.green('✓') : chalk.red(lang === 'ru' ? '✕ (Не найдена)' : '✕ (Missing)');
        console.log(`  ${mark} ${active} ${chalk.bold(kb.name)} - ${chalk.gray(kb.path)}`);
        if (kb.exists) {
          const skillsLabel = lang === 'ru' ? 'Скилы' : 'Skills';
          const mcpsLabel = lang === 'ru' ? 'MCP' : 'MCPs';
          const agentsLabel = lang === 'ru' ? 'Агенты' : 'Agents';
          const noneLabel = lang === 'ru' ? 'нет' : 'none';
          console.log(
            `     ${chalk.gray(`${skillsLabel}: ${kb.skillsCount} | ${mcpsLabel}: ${kb.mcpsCount} | ${agentsLabel}: ${kb.enabledAgents.join(', ') || noneLabel}`)}`
          );
        }
      }
    });

  kbCmd
    .command('use <path>')
    .description(t.kbUseDesc)
    .action((kbPath) => {
      const resolved = path.resolve(kbPath);
      if (!fs.existsSync(resolved) || !fs.existsSync(path.join(resolved, '.hub', 'config.json'))) {
        console.log(chalk.red(lang === 'ru' ? `✕ Папка '${resolved}' не является инициализированной Базой Знаний!` : `✕ Folder '${resolved}' is not an initialized Knowledge Base!`));
        return;
      }
      setActiveKnowledgeBase(resolved);
      console.log(chalk.green(t.useSuccess(chalk.bold(resolved))));
    });

  kbCmd
    .command('remove <path>')
    .description(t.kbRemoveDesc)
    .option('--delete-files', t.kbRemoveDeleteFilesOpt)
    .option('-y, --yes', t.kbRemoveYesOpt)
    .action(async (kbPath, opts) => {
      const resolved = path.resolve(kbPath);

      if (opts.deleteFiles) {
        if (isCriticalSystemPath(resolved)) {
          console.log(chalk.red(t.kbRemoveCriticalError(resolved)));
          process.exitCode = 1;
          return;
        }

        if (!opts.yes) {
          if (!process.stdin.isTTY) {
            console.log(chalk.red(t.kbRemoveNonInteractivePromptError));
            process.exitCode = 1;
            return;
          }

          const confirmed = await p.confirm({
            message: t.kbRemoveConfirmPrompt(resolved),
            initialValue: false,
          });

          if (p.isCancel(confirmed) || !confirmed) {
            console.log(chalk.yellow(t.kbRemoveCancelled));
            return;
          }
        }
      }

      const res = unregisterKnowledgeBase(resolved, !!opts.deleteFiles);
      if (!res.success) {
        console.log(chalk.red(res.error || (lang === 'ru' ? '✕ Ошибка удаления Базы Знаний.' : '✕ Error removing Knowledge Base.')));
        process.exitCode = 1;
        return;
      }

      if (opts.deleteFiles) {
        console.log(chalk.green(t.kbRemoveSuccessWithFiles(path.basename(resolved))));
      } else {
        console.log(chalk.green(t.kbRemoveSuccessRegistryOnly(path.basename(resolved))));
      }
    });

  kbCmd
    .command('manage')
    .description(t.kbDesc)
    .action(async () => {
      await runKbManager(lang);
    });

  kbCmd
    .command('edit [path]')
    .description(t.kbEditDesc)
    .action(async (kbPath) => {
      const resolved = kbPath ? path.resolve(kbPath) : resolveKnowledgeBasePath();
      await runInitWizard(resolved);
    });

  // Global IDE Sync & Status Command
  program
    .command('global')
    .description(t.globalDesc)
    .option('-a, --all', t.globalAllOpt)
    .option('--kb <path>', t.globalKbOpt)
    .option('--restore', lang === 'ru' ? 'Восстановить конфигурации IDE из резервных копий (.bak)' : 'Restore IDE configs from backups (.bak)')
    .action((opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const globalSync = new GlobalSyncManager(kbPath);

      if (opts.restore) {
        console.log(orange(lang === 'ru' ? '🔄 Восстановление резервных копий IDE...' : '🔄 Restoring IDE configurations from backups...'));
        const { restored, notFound } = globalSync.restoreAllBackups();
        if (restored.length === 0) {
          console.log(chalk.gray(lang === 'ru' ? 'Резервные копии (.bak) не найдены.' : 'No backup files (.bak) found.'));
        } else {
          for (const f of restored) {
            console.log(chalk.green(`  ✓ ${lang === 'ru' ? 'Восстановлен' : 'Restored'}: ${f}`));
          }
        }
        if (notFound.length > 0) {
          for (const err of notFound) {
            console.log(chalk.red(`  ✕ ${err}`));
          }
        }
        return;
      }

      const config = loadConfig(kbPath);
      console.log(orange(t.globalHeader(chalk.bold(kbPath))));

      const agentsToSync = opts.all ? undefined : config?.enabledAgents;
      const res = globalSync.syncAll(agentsToSync);

      console.log(t.globalStatusTitle);
      for (const target of res.targets) {
        const mark = target.configured ? chalk.green('✓') : chalk.red('✕');
        console.log(`  ${mark} ${chalk.bold(target.name)}`);
        console.log(`     ${t.globalConfigLabel} ${chalk.gray(target.path)}`);
        console.log(`     ${t.globalStatusLabel} ${target.configured ? chalk.green(target.details) : chalk.red(target.details)}`);
      }

      console.log(orange(t.globalTip));
    });

  // Sync Command
  program
    .command('sync')
    .description(t.syncDesc)
    .option('-g, --global', t.syncGlobalOpt)
    .option('--kb <path>', t.syncKbOpt)
    .action(async (opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const config = loadConfig(kbPath);
      if (!config) {
        console.log(chalk.red(t.syncNotFound(kbPath)));
        return;
      }

      console.log(orange(t.syncStarting(kbPath)));

      // 1. RepoMap
      const repoMapGen = new RepoMapGenerator(kbPath);
      repoMapGen.saveRepoMap();
      console.log(chalk.green(t.syncRepoMapDone));

      // 2. Secret Vault check
      SecretVault.ensureGitIgnored(kbPath);

      // 3. Ensure agenthub-guide.md meta-skill exists
      const skillsDir = path.join(kbPath, 'skills');
      if (!fs.existsSync(skillsDir)) {
        fs.mkdirSync(skillsDir, { recursive: true });
      }
      for (const defSkill of DEFAULT_SKILLS) {
        const sPath = path.join(skillsDir, defSkill.filename);
        if (!fs.existsSync(sPath)) {
          fs.writeFileSync(sPath, defSkill.content, 'utf8');
        }
      }

      // 4. Collect active skills & MCPs
      const skills = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
      const mcps = fs.existsSync(path.join(kbPath, 'mcp'))
        ? fs.readdirSync(path.join(kbPath, 'mcp')).map((f) => f.replace(/\.json$/, ''))
        : [];

      const synced = await syncAdapters(kbPath, config.enabledAgents, skills, mcps);
      console.log(chalk.green(t.syncAdaptersDone(synced.join(', '))));

      // 5. Global sync if requested
      if (opts.global) {
        const globalSync = new GlobalSyncManager(kbPath);
        const gRes = globalSync.syncAll(config.enabledAgents);
        const configuredNames = gRes.targets.filter((item) => item.configured).map((item) => item.name);
        console.log(chalk.green(t.syncGlobalDone(configuredNames.join(', '))));
      }
    });

  // Audit / Leak-Guard Command (Feature 4)
  program
    .command('audit')
    .description(t.auditDesc)
    .option('--fix', t.auditFixOpt)
    .option('--include-backups', t.auditIncludeBackupsOpt)
    .option('--kb <path>', t.auditKbOpt)
    .action(async (options) => {
      const kbPath = resolveKnowledgeBasePath(options.kb);
      const leakGuard = new LeakGuard(kbPath);
      console.log(orange(t.auditScanning(kbPath)));

      const findings = leakGuard.scanDirectory(kbPath, !!options.includeBackups);
      if (findings.length === 0) {
        console.log(chalk.green(t.auditClean));
        return;
      }

      console.log(chalk.yellow(t.auditFindings(findings.length)));
      const vault = new SecretVault(kbPath);
      const envKeyBySecret = new Map<string, string>();

      for (const f of findings) {
        console.log(
          `${chalk.red(`[${f.type}]`)} ${chalk.bold(f.relativePath)}:${f.line}` +
          `\n  ${t.auditValLabel} ${chalk.red(f.maskedSecret)}` +
          `\n  ${t.auditLineLabel} ${chalk.gray(f.snippet)}`
        );

        if (options.fix) {
          if (!LeakGuard.isSupportedFile(f.filePath)) {
            const warnMsg = lang === 'ru'
              ? `  ⚠️ Неподдерживаемый формат (${path.extname(f.filePath) || path.basename(f.filePath)}): ${f.relativePath}:${f.line} — выполните ротацию секрета вручную.`
              : `  ⚠️ Unsupported file format (${path.extname(f.filePath) || path.basename(f.filePath)}): ${f.relativePath}:${f.line} — please rotate secret manually.`;
            console.log(chalk.yellow(warnMsg));
            continue;
          }

          let envKey = envKeyBySecret.get(f.matchedSecret);
          if (!envKey) {
            for (const existingKey of vault.listKeys()) {
              if (vault.getSecret(existingKey) === f.matchedSecret) {
                envKey = existingKey;
                break;
              }
            }
          }
          if (!envKey) {
            let keySuffix = (envKeyBySecret.size + 1).toString().padStart(2, '0');
            envKey = `AUTO_SECRET_${f.type.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${keySuffix}`;
            let counter = envKeyBySecret.size + 1;
            while (vault.hasSecret(envKey)) {
              counter++;
              envKey = `AUTO_SECRET_${f.type.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${counter.toString().padStart(2, '0')}`;
            }
            vault.setSecret(envKey, f.matchedSecret);
          }
          envKeyBySecret.set(f.matchedSecret, envKey);

          const redacted = leakGuard.redactSecretInFile(f, envKey);
          if (redacted) {
            console.log(chalk.green(t.auditFixed(envKey)));
            const bakPath = `${f.filePath}.bak`;
            console.log(chalk.gray(t.auditBackupNotice(bakPath)));
          }
        }
      }

      if (!options.fix) {
        console.log(orange(t.auditFixTip));
      }
    });

  // RepoMap Command (Feature 5)
  program
    .command('repomap')
    .description(t.repomapDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const gen = new RepoMapGenerator(kbPath);
      const file = gen.saveRepoMap();
      const projects = gen.scanProjects();
      console.log(chalk.green(t.repomapSuccess(file)));
      console.log(orange(t.repomapProjectsFound(projects.length)));
      for (const p of projects) {
        console.log(`  - ${chalk.bold(p.name)} (${p.type}) [${p.techStack.join(', ')}]`);
      }
    });

  // Cross-Agent Handoff Command (Feature 1)
  const handoffCmd = program
    .command('handoff')
    .description(t.handoffDesc);

  handoffCmd
    .command('create')
    .description(t.handoffCreateDesc)
    .requiredOption('-t, --task <task>', t.handoffTaskOpt)
    .option('-s, --summary <summary>', t.handoffSummaryOpt, t.handoffDefaultSummary)
    .option('-f, --files <files...>', t.handoffFilesOpt, [])
    .option('--from <agent>', t.handoffFromOpt, 'manual')
    .option('--to <agent>', t.handoffToOpt)
    .option('--kb <path>', t.repomapKbOpt)
    .action((opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const mgr = new HandoffManager(kbPath);
      const cp: HandoffCheckpoint = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        activeTask: opts.task,
        status: 'in_progress',
        sourceAgent: opts.from,
        targetAgent: opts.to,
        summary: opts.summary,
        modifiedFiles: opts.files,
        nextSteps: [t.handoffDefaultNext],
      };
      mgr.saveCheckpoint(cp);
      console.log(chalk.green(t.handoffSaved));
    });

  handoffCmd
    .command('prompt <targetAgent>')
    .description(t.handoffPromptDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((targetAgent, opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const mgr = new HandoffManager(kbPath);
      const prompt = mgr.generatePromptForAgent(targetAgent);
      console.log(orange(t.handoffCopyPrompt));
      console.log(chalk.yellow(prompt));
    });

  // Vault Command (Zero-Leak Security)
  const vaultCmd = program
    .command('vault')
    .description(t.vaultDesc);

  vaultCmd
    .command('set <key> <value>')
    .description(t.vaultSetDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((key, value, opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const vault = new SecretVault(kbPath);
      vault.setSecret(key, value);
      console.log(chalk.green(t.vaultSetSaved(key)));
      console.log(chalk.gray(t.vaultSetHint));
    });

  vaultCmd
    .command('list')
    .description(t.vaultListDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const vault = new SecretVault(kbPath);
      const keys = vault.listKeys();
      if (keys.length === 0) {
        console.log(chalk.gray(t.vaultListEmpty));
        return;
      }
      console.log(orange(t.vaultListHeader(keys.length)));
      for (const k of keys) {
        const protLabel = lang === 'ru' ? '[ЗАЩИЩЕНО / ZERO-LEAK]' : '[PROTECTED / ZERO-LEAK]';
        console.log(`  • ${chalk.bold(k)}: ${protLabel}`);
      }
    });

  // Team Sync Command (Feature 6)
  const teamCmd = program
    .command('team')
    .description(t.teamDesc);

  teamCmd
    .command('status')
    .description(t.teamStatusDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const sync = new TeamSyncManager(kbPath);
      const st = sync.checkGit();
      console.log(orange(t.teamStatusHeader));
      console.log(`  ${t.teamGitRepo} ${st.isGitRepo ? chalk.green(t.teamYes) : chalk.red(t.teamNo)}`);
      console.log(`  ${t.teamBranch} ${chalk.bold(st.branch || '-')}`);
      console.log(`  ${t.teamRemote} ${st.hasRemote ? chalk.green(st.remoteUrl) : chalk.yellow(t.teamRemoteNone)}`);
      console.log(`  ${t.teamUncommitted} ${st.hasUncommittedChanges ? chalk.yellow(t.teamYes) : chalk.green(t.teamNo)}`);

      const pre = sync.preFlightSecurityCheck();
      if (!pre.safe) {
        console.log(chalk.red(t.teamSecurityWarn(pre.error || '')));
      } else {
        console.log(chalk.green(t.teamSecuritySafe));
      }
    });

  teamCmd
    .command('commit <message>')
    .description(t.teamCommitDesc)
    .option('--kb <path>', t.repomapKbOpt)
    .action((msg, opts) => {
      const kbPath = resolveKnowledgeBasePath(opts.kb);
      const sync = new TeamSyncManager(kbPath);
      try {
        sync.commitSharedChanges(msg);
        console.log(chalk.green(t.teamCommitSuccess));
      } catch (err: any) {
        console.log(chalk.red(t.teamCommitError(err.message)));
      }
    });

  // Update Command
  program
    .command('update')
    .alias('upgrade')
    .description(t.updateDesc)
    .option('-c, --check', t.updateCheckOpt)
    .option('--auto <mode>', t.updateAutoOpt)
    .action(async (opts) => {
      if (opts.auto) {
        const val = opts.auto.toLowerCase();
        if (val === 'auto' || val === 'prompt' || val === 'off') {
          setAutoUpdateSetting(val as any);
          console.log(chalk.green(t.updateAutoSet(chalk.bold(val))));
          return;
        } else {
          console.log(chalk.red(lang === 'ru' ? '✕ Неверный режим. Допустимо: prompt, auto, off' : '✕ Invalid mode. Allowed: prompt, auto, off'));
          return;
        }
      }

      if (opts.check) {
        console.log(orange(t.updateChecking));
        const res = await checkForUpdates(true);
        if (res.updateAvailable) {
          console.log(renderUpdateNotice(res, lang));
        } else {
          console.log(chalk.green(t.updateLatest(res.currentVersion)));
        }
        return;
      }

      const res = await performUpdate(lang);
      if (res.success) {
        console.log(chalk.green(res.message));
      } else {
        console.log(chalk.red(res.message));
      }
    });

  return program;
}

// Default action when no arguments provided: launch interactive main menu
if (process.argv.length <= 2) {
  runMainMenu().catch(console.error);
} else {
  const program = buildCli();
  program.parse();
}
