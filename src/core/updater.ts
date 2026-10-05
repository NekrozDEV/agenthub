import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { loadGlobalConfig, saveGlobalConfig, SupportedLanguage } from './config.js';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  source: 'cache' | 'network';
}

interface UpdateCache {
  lastChecked: number;
  latestVersion: string;
}

const GITHUB_REPO = 'NekrozDEV/agenthub';
const RAW_PACKAGE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/open-agenthub/latest';

const CACHE_FILE = path.join(os.homedir(), '.agenthub', 'update_cache.json');
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Returns current version of AgentHub from package.json
 */
export function getCurrentVersion(): string {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const pkgPath = path.resolve(path.dirname(currentFile), '../../package.json');
    if (fs.existsSync(pkgPath)) {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.version) return parsed.version;
    }
  } catch {}
  return '0.1.0';
}

/**
 * Compares two semver strings: a and b.
 * Returns:
 *   1 if a > b
 *  -1 if a < b
 *   0 if a == b
 */
export function compareSemver(a: string, b: string): number {
  const clean = (v: string) => v.replace(/^v/, '').trim();
  const pa = clean(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = clean(b).split('.').map((x) => parseInt(x, 10) || 0);

  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Fetches the latest version available remotely
 */
export async function fetchRemoteVersion(): Promise<string | null> {
  // 1. Try raw github package.json (fastest, no rate limits, immediate upon commit/tag)
  try {
    const res = await fetch(RAW_PACKAGE_URL, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'agenthub-cli' },
    });
    if (res.ok) {
      const data = (await res.json()) as { version?: string };
      if (data.version) return data.version.trim();
    }
  } catch {}

  // 2. Try GitHub Releases API
  try {
    const res = await fetch(GITHUB_API_URL, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'agenthub-cli' },
    });
    if (res.ok) {
      const data = (await res.json()) as { tag_name?: string };
      if (data.tag_name) return data.tag_name.replace(/^v/, '').trim();
    }
  } catch {}

  // 3. Try npm registry
  try {
    const res = await fetch(NPM_REGISTRY_URL, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'agenthub-cli' },
    });
    if (res.ok) {
      const data = (await res.json()) as { version?: string };
      if (data.version) return data.version.trim();
    }
  } catch {}

  return null;
}

/**
 * Reads the cached update check
 */
function readCache(): UpdateCache | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

/**
 * Writes the update check cache
 */
function writeCache(latestVersion: string): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data: UpdateCache = {
      lastChecked: Date.now(),
      latestVersion,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

/**
 * Checks if a newer version of AgentHub is available.
 * Cached for 24 hours unless force is true.
 */
export async function checkForUpdates(force = false): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion();

  // Respect user preference: if autoUpdate is 'off', never make unsolicited network requests
  if (!force && getAutoUpdateSetting() === 'off') {
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: currentVersion,
      source: 'cache',
    };
  }

  if (!force) {
    const cache = readCache();
    if (cache && Date.now() - cache.lastChecked < CHECK_INTERVAL_MS) {
      return {
        updateAvailable: compareSemver(cache.latestVersion, currentVersion) > 0,
        currentVersion,
        latestVersion: cache.latestVersion,
        source: 'cache',
      };
    }
  }

  const latestVersion = await fetchRemoteVersion();
  if (!latestVersion) {
    // If network fails, fallback to cache if available
    const cache = readCache();
    const ver = cache?.latestVersion || currentVersion;
    return {
      updateAvailable: compareSemver(ver, currentVersion) > 0,
      currentVersion,
      latestVersion: ver,
      source: 'cache',
    };
  }

  writeCache(latestVersion);
  return {
    updateAvailable: compareSemver(latestVersion, currentVersion) > 0,
    currentVersion,
    latestVersion,
    source: 'network',
  };
}

/**
 * Renders a stylish orange update notification box
 */
export function renderUpdateNotice(result: UpdateCheckResult, lang: SupportedLanguage = 'en'): string {
  const orange = chalk.hex('#FF8800');
  const amber = chalk.hex('#FFA500');
  const fire = chalk.hex('#FF4500');

  const title =
    lang === 'ru'
      ? `🚀 Доступно обновление AgentHub: ${chalk.gray(result.currentVersion)} → ${fire.bold(result.latestVersion)}`
      : `🚀 AgentHub update available: ${chalk.gray(result.currentVersion)} → ${fire.bold(result.latestVersion)}`;

  const cmdHint =
    lang === 'ru'
      ? `Запустите: ${orange.bold('agenthub update')} для быстрого обновления`
      : `Run: ${orange.bold('agenthub update')} to upgrade now`;

  const border = amber('─'.repeat(58));

  return [
    '',
    amber('╭─') + border + amber('─╮'),
    `${amber('│')}  ${title.padEnd(67)} ${amber('│')}`,
    `${amber('│')}  ${cmdHint.padEnd(67)} ${amber('│')}`,
    amber('╰─') + border + amber('─╯'),
    '',
  ].join('\n');
}

/**
 * Executes the update process via git or npm
 */
export async function performUpdate(lang: SupportedLanguage = 'en'): Promise<{ success: boolean; message: string }> {
  const orange = chalk.hex('#FF8800');
  const currentVersion = getCurrentVersion();

  console.log(orange(lang === 'ru' ? '🔄 Проверка обновлений...' : '🔄 Checking for updates...'));
  const check = await checkForUpdates(true);

  if (!check.updateAvailable) {
    const msg =
      lang === 'ru'
        ? `✓ У вас уже установлена актуальная версия AgentHub (v${currentVersion}).`
        : `✓ You are already using the latest version of AgentHub (v${currentVersion}).`;
    return { success: true, message: msg };
  }

  console.log(
    orange(
      lang === 'ru'
        ? `⬇️  Обновление AgentHub: ${check.currentVersion} → ${check.latestVersion}...`
        : `⬇️  Upgrading AgentHub: ${check.currentVersion} → ${check.latestVersion}...`
    )
  );

  // Check if we are running in a local cloned git repo
  let isGitRepo = false;
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const repoRoot = path.resolve(path.dirname(currentFile), '../../');
    if (fs.existsSync(path.join(repoRoot, '.git'))) {
      isGitRepo = true;
    }
  } catch {}

  if (isGitRepo) {
    try {
      const currentFile = fileURLToPath(import.meta.url);
      const repoRoot = path.resolve(path.dirname(currentFile), '../../');
      console.log(chalk.gray(`git pull origin main in ${repoRoot}...`));
      const pull = spawnSync('git', ['pull', 'origin', 'main'], { cwd: repoRoot, stdio: 'inherit' });
      if (pull.status === 0) {
        console.log(chalk.gray(`npm run build...`));
        const build = spawnSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit' });
        if (build.status === 0) {
          // Update cache
          writeCache(check.latestVersion);
          const msg =
            lang === 'ru'
              ? `🎉 AgentHub успешно обновлен до версии ${check.latestVersion}!`
              : `🎉 AgentHub successfully upgraded to v${check.latestVersion}!`;
          return { success: true, message: msg };
        }
      }
    } catch (err: any) {
      console.log(chalk.yellow(`Git pull failed, falling back to global npm install...`));
    }
  }

  // Global npm install from GitHub archive: prioritize pinned release tag over main branch
  const releaseTag = check.latestVersion.startsWith('v') ? check.latestVersion : `v${check.latestVersion}`;
  const taggedTarball = `https://github.com/${GITHUB_REPO}/archive/refs/tags/${releaseTag}.tar.gz`;
  const mainTarball = `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.tar.gz`;
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  console.log(chalk.gray(`Attempting install from pinned release tag (${releaseTag})...`));
  let res = spawnSync(npmCmd, ['install', '-g', '--force', taggedTarball], {
    stdio: 'inherit',
    shell: true,
  });

  // If tag archive fails (e.g. tag not yet created on GitHub), fall back to main branch archive
  if (res.status !== 0) {
    console.log(chalk.yellow(`Release tag ${releaseTag} archive not found. Falling back to main branch...`));
    res = spawnSync(npmCmd, ['install', '-g', '--force', mainTarball], {
      stdio: 'inherit',
      shell: true,
    });
  }

  if (res.status === 0) {
    writeCache(check.latestVersion);
    const msg =
      lang === 'ru'
        ? `🎉 AgentHub успешно обновлен до версии ${check.latestVersion}!`
        : `🎉 AgentHub successfully upgraded to v${check.latestVersion}!`;
    return { success: true, message: msg };
  } else {
    const errMsg =
      lang === 'ru'
        ? `✕ Не удалось выполнить автоматическое обновление. Попробуйте вручную:\n  npm install -g git+https://github.com/${GITHUB_REPO}.git`
        : `✕ Auto-upgrade failed. Please try running manually:\n  npm install -g git+https://github.com/${GITHUB_REPO}.git`;
    return { success: false, message: errMsg };
  }
}

/**
 * Gets the auto-update preference from global config
 */
export function getAutoUpdateSetting(): 'prompt' | 'auto' | 'off' {
  const conf = loadGlobalConfig();
  if (conf.autoUpdate === true) return 'auto';
  if (conf.autoUpdate === false || conf.autoUpdate === 'off') return 'off';
  return conf.autoUpdate || 'prompt';
}

/**
 * Sets the auto-update preference in global config
 */
export function setAutoUpdateSetting(setting: 'prompt' | 'auto' | 'off'): void {
  const conf = loadGlobalConfig();
  conf.autoUpdate = setting;
  saveGlobalConfig(conf);
}
