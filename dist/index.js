import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { runInitWizard } from './ui/wizard.js';
import { loadConfig, resolveKnowledgeBasePath, setActiveKnowledgeBase, getPreferredLanguage, setPreferredLanguage, listAllKnowledgeBases, unregisterKnowledgeBase, } from './core/config.js';
import { runMainMenu, runKbManager } from './ui/kb-menu.js';
import { SecretVault } from './core/vault.js';
import { LeakGuard } from './core/leak-guard.js';
import { RepoMapGenerator } from './core/repomap.js';
import { HandoffManager } from './core/handoff.js';
import { TeamSyncManager } from './core/sync.js';
import { GlobalSyncManager } from './core/global-sync.js';
import { syncAdapters } from './adapters/index.js';
import { DEFAULT_SKILLS } from './templates/default-skills.js';
import { startAgentHubMcpServer } from './mcp/server.js';
import { CLI_I18N } from './core/i18n.js';
import { checkForUpdates, renderUpdateNotice, performUpdate, setAutoUpdateSetting, getCurrentVersion, } from './core/updater.js';
export function buildCli(customLang) {
    const lang = customLang || getPreferredLanguage();
    const t = CLI_I18N[lang];
    const orange = chalk.hex('#FF8800');
    const program = new Command();
    program
        .name('agenthub')
        .description(t.programDesc)
        .version(getCurrentVersion())
        .option('--lang <language>', t.langOptionDesc);
    // Hook for non-blocking update notifications (skip on stdio MCP server)
    program.hook('postAction', async (_thisCmd, actionCmd) => {
        if (actionCmd?.name() === 'serve-mcp')
            return;
        try {
            const update = await checkForUpdates();
            if (update.updateAvailable) {
                console.log(renderUpdateNotice(update, lang));
            }
        }
        catch { }
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
        setPreferredLanguage(normalized);
        const newT = CLI_I18N[normalized];
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
            const active = kb.isActive ? chalk.green(' [ACTIVE] ') : '          ';
            const mark = kb.exists ? chalk.green('✓') : chalk.red('✕ (Missing)');
            console.log(`  ${mark} ${active} ${chalk.bold(kb.name)} - ${chalk.gray(kb.path)}`);
            if (kb.exists) {
                console.log(`     ${chalk.gray(`Skills: ${kb.skillsCount} | MCPs: ${kb.mcpsCount} | Agents: ${kb.enabledAgents.join(', ') || 'none'}`)}`);
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
        .option('--delete-files', 'Also delete files from disk')
        .action((kbPath, opts) => {
        const resolved = path.resolve(kbPath);
        unregisterKnowledgeBase(resolved, !!opts.deleteFiles);
        console.log(chalk.green(lang === 'ru' ? `✓ База Знаний '${path.basename(resolved)}' удалена.` : `✓ Knowledge Base '${path.basename(resolved)}' removed.`));
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
        .action((opts) => {
        const kbPath = resolveKnowledgeBasePath(opts.kb);
        const config = loadConfig(kbPath);
        console.log(orange(t.globalHeader(chalk.bold(kbPath))));
        const globalSync = new GlobalSyncManager(kbPath);
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
        .option('--kb <path>', t.auditKbOpt)
        .action(async (options) => {
        const kbPath = resolveKnowledgeBasePath(options.kb);
        const leakGuard = new LeakGuard(kbPath);
        console.log(orange(t.auditScanning(kbPath)));
        const findings = leakGuard.scanDirectory();
        if (findings.length === 0) {
            console.log(chalk.green(t.auditClean));
            return;
        }
        console.log(chalk.yellow(t.auditFindings(findings.length)));
        const vault = new SecretVault(kbPath);
        for (const f of findings) {
            console.log(`${chalk.red(`[${f.type}]`)} ${chalk.bold(f.relativePath)}:${f.line}` +
                `\n  ${t.auditValLabel} ${chalk.red(f.maskedSecret)}` +
                `\n  ${t.auditLineLabel} ${chalk.gray(f.snippet)}`);
            if (options.fix) {
                const envKey = `AUTO_SECRET_${f.type.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
                vault.setSecret(envKey, f.matchedSecret);
                leakGuard.redactSecretInFile(f, envKey);
                console.log(chalk.green(t.auditFixed(envKey)));
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
        const cp = {
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
            console.log(`  • ${chalk.bold(k)}: [PROTECTED / ZERO-LEAK]`);
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
        }
        else {
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
        }
        catch (err) {
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
                setAutoUpdateSetting(val);
                console.log(chalk.green(t.updateAutoSet(chalk.bold(val))));
                return;
            }
            else {
                console.log(chalk.red(lang === 'ru' ? '✕ Неверный режим. Допустимо: prompt, auto, off' : '✕ Invalid mode. Allowed: prompt, auto, off'));
                return;
            }
        }
        if (opts.check) {
            console.log(orange(t.updateChecking));
            const res = await checkForUpdates(true);
            if (res.updateAvailable) {
                console.log(renderUpdateNotice(res, lang));
            }
            else {
                console.log(chalk.green(t.updateLatest(res.currentVersion)));
            }
            return;
        }
        const res = await performUpdate(lang);
        if (res.success) {
            console.log(chalk.green(res.message));
        }
        else {
            console.log(chalk.red(res.message));
        }
    });
    return program;
}
// Default action when no arguments provided: launch interactive main menu
if (process.argv.length <= 2) {
    runMainMenu().catch(console.error);
}
else {
    const program = buildCli();
    program.parse();
}
