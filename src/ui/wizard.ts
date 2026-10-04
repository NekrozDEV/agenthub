import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
  HubConfig,
  SupportedAgent,
  AGENT_INFO,
  saveConfig,
  getVaultPath,
  setActiveKnowledgeBase,
} from '../core/config.js';
import { SecretVault } from '../core/vault.js';
import { LeakGuard } from '../core/leak-guard.js';
import { RepoMapGenerator } from '../core/repomap.js';
import { GlobalSyncManager } from '../core/global-sync.js';
import { DEFAULT_SKILLS } from '../templates/default-skills.js';
import { DEFAULT_MCPS } from '../templates/default-mcps.js';
import { syncAdapters } from '../adapters/index.js';
import { printBanner } from './banner.js';

export async function runInitWizard(initialTargetDir?: string): Promise<void> {
  printBanner();
  p.intro(chalk.bgCyan.black(' AgentHub Setup Wizard '));

  // 1. Choose Knowledge Base Folder
  const defaultDir = initialTargetDir || process.cwd();
  const folderInput = await p.text({
    message: 'Выберите папку вашей Единой Базы Знаний (Knowledge Base):',
    initialValue: defaultDir,
    validate: (val) => {
      if (!val || val.trim().length === 0) return 'Путь не может быть пустым';
    },
  });

  if (p.isCancel(folderInput)) {
    p.cancel('Настройка отменена.');
    process.exit(0);
  }

  const kbPath = path.resolve(folderInput as string);

  // 2. Select Active AI Systems
  const agentOptions = (Object.keys(AGENT_INFO) as SupportedAgent[]).map((key) => ({
    value: key,
    label: AGENT_INFO[key].name,
    hint: AGENT_INFO[key].description,
  }));

  const selectedAgents = await p.multiselect({
    message: 'Какими AI-системами и IDE вы пользуетесь? (Пробел — выбор, Enter — подтвердить):',
    options: agentOptions,
    initialValues: ['antigravity', 'deepseek-hermes', 'opencode', 'windsurf', 'cursor'],
    required: true,
  });

  if (p.isCancel(selectedAgents)) {
    p.cancel('Настройка отменена.');
    process.exit(0);
  }

  // 3. Ask for Global IDE / MCP Registration
  const enableGlobalSync = await p.confirm({
    message:
      'Настроить глобальную интеграцию IDE и AI (Claude Code ~/.claude.json, Claude Desktop, Windsurf, Cursor, Cline, Roo Code, Continue, Antigravity) через MCP?',
    initialValue: true,
  });

  if (p.isCancel(enableGlobalSync)) {
    p.cancel('Настройка отменена.');
    process.exit(0);
  }

  const s = p.spinner();
  s.start('Инициализация структуры Базы Знаний...');

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

  // Install default skills (including agenthub-guide.md meta-skill)
  const installedSkills: string[] = [];
  for (const skill of DEFAULT_SKILLS) {
    const skillPath = path.join(skillsDir, skill.filename);
    if (!fs.existsSync(skillPath)) {
      fs.writeFileSync(skillPath, skill.content, 'utf8');
    }
    installedSkills.push(skill.filename);
  }

  // Install default MCP configs
  const installedMcps: string[] = [];
  for (const [key, mcp] of Object.entries(DEFAULT_MCPS)) {
    const mcpPath = path.join(mcpDir, `${key}.json`);
    if (!fs.existsSync(mcpPath)) {
      fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2), 'utf8');
    }
    installedMcps.push(key);
  }

  // Initialize Vault and ensure gitignore
  const vault = new SecretVault(kbPath);
  vault.save();
  SecretVault.ensureGitIgnored(kbPath);

  // Save Config & register as active KB globally
  const config: HubConfig = {
    version: '0.1.0',
    knowledgeBasePath: kbPath,
    enabledAgents: selectedAgents as SupportedAgent[],
    settings: {
      leakGuardAutoScan: true,
      repoMapAutoUpdate: true,
      tokenBudgetPerProject: 800,
    },
  };
  saveConfig(kbPath, config);
  setActiveKnowledgeBase(kbPath);

  s.message('Построение умной карты проектов (RepoMap)...');
  const repoMapGen = new RepoMapGenerator(kbPath);
  repoMapGen.saveRepoMap();

  s.message('Синхронизация локальных адаптеров для выбранных AI-систем...');
  const synced = await syncAdapters(
    kbPath,
    config.enabledAgents,
    installedSkills,
    installedMcps
  );

  let globalSyncSummary: string[] = [];
  if (enableGlobalSync) {
    s.message('Подключение глобальных конфигураций IDE и MCP...');
    const globalSync = new GlobalSyncManager(kbPath);
    const gResult = globalSync.syncAll(config.enabledAgents);
    globalSyncSummary = gResult.targets.filter((t) => t.configured).map((t) => t.name);
  }

  s.stop(chalk.green('✓ База Знаний успешно сконфигурирована!'));

  // Run Leak Guard check
  const leakGuard = new LeakGuard(kbPath);
  const leaks = leakGuard.scanDirectory();

  if (leaks.length > 0) {
    p.note(
      chalk.yellow(
        `Внимание! Обнаружено ${leaks.length} потенциальных секретов в файлах базы знаний!\nЗапустите 'agenthub audit' для безопасного переноса их в Сейф.`
      ),
      '🛡️ Secret Inspector & Leak Guard'
    );
  }

  p.note(
    chalk.cyan(
      `• Папка базы знаний: ${kbPath}\n` +
      `• Активные AI-системы: ${synced.join(', ')}\n` +
      (globalSyncSummary.length > 0
        ? `• Глобальные MCP интеграции: ${globalSyncSummary.join(', ')}\n`
        : '') +
      `• Сейф секретов (Zero-Leak): ${getVaultPath(kbPath)}\n` +
      `• Карта проектов: PROJECTS_MAP.md (экономит 80%+ токенов)\n` +
      `• Мета-скил для агентов: skills/agenthub-guide.md`
    ),
    '📋 Итоги настройки'
  );

  p.outro(
    chalk.bold.green(
      'Все готово! Вы можете запускать агентов прямо в этой папке, ЛИБО работать в любых ваших проектах через AgentHub MCP!'
    )
  );
}
