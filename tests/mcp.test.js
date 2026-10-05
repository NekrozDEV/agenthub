import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { GlobalSyncManager } from '../dist/core/global-sync.js';
import { CursorAdapter } from '../dist/adapters/cursor.js';
import { ClineAdapter } from '../dist/adapters/cline.js';
import { ContinueAdapter } from '../dist/adapters/continue.js';
import { WindsurfAdapter } from '../dist/adapters/windsurf.js';
import { ZCodeAdapter } from '../dist/adapters/zcode.js';
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  getPreferredLanguage,
  setPreferredLanguage,
  loadGlobalConfig,
  saveGlobalConfig,
  isCriticalSystemPath,
  unregisterKnowledgeBase,
  AGENT_INFO,
} from '../dist/core/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'dist', 'mcp', 'cli.js');
const mainBinPath = path.join(__dirname, '..', 'bin', 'agenthub.js');
const repoRoot = path.join(__dirname, '..');

// 1. Verify build exists
if (!fs.existsSync(cliPath)) {
  console.error('dist/mcp/cli.js not found. Please run npm run build first.');
  process.exit(1);
}

// 2. Test CLI --help argument
console.log('Test 1: Testing agenthub-mcp CLI --help flag...');
const helpOutput = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
if (!helpOutput.includes('AgentHub MCP Server') || !helpOutput.includes('--kb')) {
  throw new Error(`CLI --help output was unexpected: ${helpOutput}`);
}
console.log('✓ agenthub-mcp --help prints usage cleanly and exits 0');

// 3. Test GlobalSyncManager.parseJsonc robustness against comments and trailing commas
console.log('Test 2: Testing JSONC comment and trailing comma parser...');
const jsoncSample = `
{
  // Single line comment
  "mcpServers": {
    /* Multi-line
       comment */
    "test-server": {
      "command": "node",
      "args": ["http://test.com//not-a-comment", "arg2",],
      "url": "/* also not a comment */",
    },
  },
}
`;
const parsed = GlobalSyncManager.parseJsonc(jsoncSample);
if (!parsed?.mcpServers?.['test-server'] || parsed.mcpServers['test-server'].args[0] !== 'http://test.com//not-a-comment') {
  throw new Error('Failed to correctly parse JSONC with comments and trailing commas');
}
console.log('✓ JSONC parser successfully strips comments and trailing commas without touching string literals');

// 4. Test Adapters generate configs with real executable and no broken node_modules
console.log('Test 3: Testing Adapters generateConfig MCP paths...');
const tempTestDir = path.join(__dirname, 'temp_test_kb');
if (fs.existsSync(tempTestDir)) fs.rmSync(tempTestDir, { recursive: true, force: true });
fs.mkdirSync(tempTestDir, { recursive: true });

try {
  // Cursor
  const cursorAdapter = new CursorAdapter();
  cursorAdapter.generateConfig(tempTestDir, ['agenthub-guide.md'], []);
  const cursorMcp = JSON.parse(fs.readFileSync(path.join(tempTestDir, '.cursor', 'mcp.json'), 'utf8'));
  if (!cursorMcp.mcpServers?.agenthub || !cursorMcp.mcpServers.agenthub.args.includes('serve-mcp')) {
    throw new Error('CursorAdapter failed to generate valid mcp.json');
  }
  if (cursorMcp.mcpServers.agenthub.args.some((a) => a.includes('node_modules'))) {
    throw new Error('CursorAdapter still contains broken node_modules path!');
  }

  // Cline
  const clineAdapter = new ClineAdapter();
  clineAdapter.generateConfig(tempTestDir, ['agenthub-guide.md'], []);
  const clineMcp = JSON.parse(fs.readFileSync(path.join(tempTestDir, '.vscode', 'cline_mcp_settings.json'), 'utf8'));
  if (!clineMcp.mcpServers?.agenthub || !clineMcp.mcpServers.agenthub.autoApprove) {
    throw new Error('ClineAdapter failed to generate valid cline_mcp_settings.json');
  }

  // Continue
  const continueAdapter = new ContinueAdapter();
  continueAdapter.generateConfig(tempTestDir, ['agenthub-guide.md'], []);
  const continueYaml = fs.readFileSync(path.join(tempTestDir, '.continue', 'config.yaml'), 'utf8');
  if (!continueYaml.includes('name: agenthub') || !continueYaml.includes('serve-mcp')) {
    throw new Error('ContinueAdapter failed to generate valid config.yaml');
  }

  // Windsurf
  const windsurfAdapter = new WindsurfAdapter();
  windsurfAdapter.generateConfig(tempTestDir, ['agenthub-guide.md'], []);
  const windsurfRules = fs.readFileSync(path.join(tempTestDir, '.windsurfrules'), 'utf8');
  if (!windsurfRules.includes('Windsurf / Cascade Rules')) {
    throw new Error('WindsurfAdapter failed to generate .windsurfrules');
  }
  console.log('✓ All adapters generate valid configs with real executable paths and zero broken node_modules');
} finally {
  if (fs.existsSync(tempTestDir)) fs.rmSync(tempTestDir, { recursive: true, force: true });
}

// 4.5. Test HubConfig language support and persistence
console.log('Test 3.5: Testing HubConfig language support and persistence...');
const tempConfigDir = path.join(__dirname, 'temp_config_test');
if (fs.existsSync(tempConfigDir)) fs.rmSync(tempConfigDir, { recursive: true, force: true });
try {
  if (DEFAULT_CONFIG.language !== 'en') {
    throw new Error(`Expected DEFAULT_CONFIG.language to be 'en', got '${DEFAULT_CONFIG.language}'`);
  }
  const testConf = {
    ...DEFAULT_CONFIG,
    knowledgeBasePath: tempConfigDir,
    language: 'ru',
  };
  saveConfig(tempConfigDir, testConf);
  const loaded = loadConfig(tempConfigDir);
  if (!loaded || loaded.language !== 'ru') {
    throw new Error(`Failed to persist language in config. Expected 'ru', got '${loaded?.language}'`);
  }
  console.log('✓ HubConfig bilingual language configuration and persistence verified');
} finally {
  if (fs.existsSync(tempConfigDir)) fs.rmSync(tempConfigDir, { recursive: true, force: true });
}

// 4.6. Test AgentHub CLI bilingual commands, flags, and global language resolution
console.log('Test 3.6: Testing AgentHub CLI bilingual execution (--lang en/ru, lang command)...');
const enCliHelp = execSync(`node "${mainBinPath}" --lang en --help`, { encoding: 'utf8' });
if (!enCliHelp.includes('Universal Knowledge Base') || !enCliHelp.includes('Interface language') || !enCliHelp.includes('Zero-Leak Vault')) {
  throw new Error(`Expected English CLI help output, got: ${enCliHelp}`);
}

const ruCliHelp = execSync(`node "${mainBinPath}" --lang ru --help`, { encoding: 'utf8' });
if (!ruCliHelp.includes('Единая База Знаний') || !ruCliHelp.includes('Язык интерфейса') || !ruCliHelp.includes('Сейф')) {
  throw new Error(`Expected Russian CLI help output, got: ${ruCliHelp}`);
}

const langCheckOutput = execSync(`node "${mainBinPath}" lang`, { encoding: 'utf8' });
if (!langCheckOutput.includes('Current interface language') && !langCheckOutput.includes('Текущий язык интерфейса')) {
  throw new Error(`Expected lang status output, got: ${langCheckOutput}`);
}
console.log('✓ AgentHub CLI bilingual support (--lang en/ru, lang command, help output) verified');

// 4.7. Test README.md bilingual navigation and package.json metadata
console.log('Test 3.7: Testing README.md bilingual anchors and package.json metadata...');
const readmeContent = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
if (!readmeContent.includes('<a id="-openagenthub">') || !readmeContent.includes('<a id="openagenthub">')) {
  throw new Error('README.md missing top anchor <a id="-openagenthub"> or <a id="openagenthub">');
}
if (!readmeContent.includes('openagenthub-на-русском') || !readmeContent.includes('-openagenthub-на-русском')) {
  throw new Error('README.md missing Russian section anchor tags');
}
const pkgJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
if (!pkgJson.repository?.url || !pkgJson.homepage || !pkgJson.files || !pkgJson.bin?.['open-agenthub']) {
  throw new Error('package.json missing repository, homepage, files, or open-agenthub bin');
}
console.log('✓ README.md navigation anchors and package.json publishing metadata verified');

// 4.8. Test updater semver logic and CLI update command
console.log('Test 3.8: Testing updater module and agenthub update CLI...');
const { compareSemver, renderUpdateNotice } = await import('../dist/core/updater.js');
if (compareSemver('0.1.0', '1.1.0') >= 0 || compareSemver('1.1.0', '0.1.0') <= 0 || compareSemver('1.0.0', '1.0.0') !== 0) {
  throw new Error('Semver comparison test failed');
}
const mockNotice = renderUpdateNotice({ updateAvailable: true, currentVersion: '0.1.0', latestVersion: '1.1.0', source: 'network' }, 'ru');
if (!mockNotice.includes('0.1.0') || !mockNotice.includes('1.1.0') || !mockNotice.includes('agenthub update')) {
  throw new Error('Update notice rendering failed');
}
const updateHelp = execSync(`node "${mainBinPath}" update --help`, { encoding: 'utf8' });
if (!updateHelp.includes('--check') || !updateHelp.includes('--auto')) {
  throw new Error(`Expected agenthub update --help output, got: ${updateHelp}`);
}
console.log('✓ Updater semver logic, notification rendering, and agenthub update CLI verified');

// 5. Test Live MCP Server Protocol and all 9 tools
console.log('Test 4: Testing live MCP Server protocol over stdio...');
const testKbDir = path.join(__dirname, 'test_kb_runtime');
if (fs.existsSync(testKbDir)) fs.rmSync(testKbDir, { recursive: true, force: true });
fs.mkdirSync(path.join(testKbDir, 'skills'), { recursive: true });
fs.mkdirSync(path.join(testKbDir, 'mcp'), { recursive: true });
fs.writeFileSync(
  path.join(testKbDir, 'skills', 'agenthub-guide.md'),
  '# AgentHub Universal Guide\nUniversal agent instructions for token economy.',
  'utf8'
);
fs.writeFileSync(
  path.join(testKbDir, 'mcp', 'filesystem.json'),
  JSON.stringify({ name: 'Filesystem MCP', command: 'npx' }, null, 2),
  'utf8'
);

const proc = spawn('node', [cliPath, '--kb', testKbDir], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
let responseResolver = null;

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (responseResolver) {
        responseResolver(msg);
        responseResolver = null;
      }
    } catch {}
  }
});

proc.stderr.on('data', (data) => {
  // Stderr is allowed for diagnostics
});

function send(req) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${req.method || req.params?.name}`));
    }, 5000);
    responseResolver = (res) => {
      clearTimeout(timer);
      resolve(res);
    };
    proc.stdin.write(JSON.stringify(req) + '\n');
  });
}

async function runMcpSuite() {
  // Initialize
  const initRes = await send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'comprehensive-test-runner', version: '1.0' },
    },
  });

  if (!initRes?.result?.serverInfo) {
    throw new Error('Failed to initialize MCP Server');
  }
  console.log(`✓ Initialized MCP Server: ${initRes.result.serverInfo.name} v${initRes.result.serverInfo.version}`);

  // 1. List tools
  const toolsRes = await send({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const tools = toolsRes.result?.tools || [];
  const expectedTools = [
    'agenthub_list_skills',
    'agenthub_get_skill',
    'agenthub_get_project_map',
    'agenthub_get_handoff',
    'agenthub_create_handoff',
    'agenthub_list_vault_keys',
    'agenthub_check_vault_secret',
    'agenthub_list_mcps',
    'agenthub_audit_code',
  ];
  for (const exp of expectedTools) {
    if (!tools.find((t) => t.name === exp)) {
      throw new Error(`Missing expected tool: ${exp}`);
    }
  }
  console.log(`✓ Verified all ${tools.length} MCP tools registered`);

  // 2. Call agenthub_list_skills
  const listSkillsRes = await send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'agenthub_list_skills', arguments: {} },
  });
  if (!listSkillsRes?.result?.content?.[0]?.text) {
    throw new Error('agenthub_list_skills returned empty response');
  }
  console.log('✓ agenthub_list_skills succeeded');

  // 3. Call agenthub_get_skill
  const getSkillRes = await send({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'agenthub_get_skill', arguments: { skillName: 'agenthub-guide.md' } },
  });
  if (!getSkillRes?.result?.content?.[0]?.text?.includes('AgentHub Universal Guide')) {
    throw new Error(`agenthub_get_skill failed or returned unexpected content: ${JSON.stringify(getSkillRes)}`);
  }
  console.log('✓ agenthub_get_skill succeeded and returned correct skill text');

  // 4. Test agenthub_get_skill path traversal rejection
  const traversalRes = await send({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: { name: 'agenthub_get_skill', arguments: { skillName: '../../package.json' } },
  });
  if (!traversalRes?.error) {
    throw new Error('agenthub_get_skill should have rejected traversal path!');
  }
  console.log('✓ agenthub_get_skill safely rejected traversal attempt');

  // 5. Call agenthub_get_project_map
  const projectMapRes = await send({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: { name: 'agenthub_get_project_map', arguments: {} },
  });
  if (!projectMapRes?.result?.content?.[0]?.text) {
    throw new Error('agenthub_get_project_map returned empty content');
  }
  console.log('✓ agenthub_get_project_map succeeded');

  // 6. Call agenthub_create_handoff
  const createHandoffRes = await send({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'agenthub_create_handoff',
      arguments: {
        task: 'Automated test suite verification',
        summary: 'Verifying all MCP tools live',
        status: 'in_progress',
        fromAgent: 'test-agent',
        modifiedFiles: ['tests/mcp.test.js'],
        nextSteps: ['Run npm test'],
      },
    },
  });
  if (!createHandoffRes?.result?.content?.[0]?.text?.includes('successfully')) {
    throw new Error('agenthub_create_handoff failed');
  }
  console.log('✓ agenthub_create_handoff succeeded');

  // 7. Call agenthub_get_handoff
  const getHandoffRes = await send({
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: { name: 'agenthub_get_handoff', arguments: {} },
  });
  const handoffData = JSON.parse(getHandoffRes?.result?.content?.[0]?.text || '{}');
  if (!handoffData.hasActiveCheckpoint || handoffData.checkpoint?.activeTask !== 'Automated test suite verification') {
    throw new Error('agenthub_get_handoff did not return recorded checkpoint');
  }
  console.log('✓ agenthub_get_handoff round-trip verified');

  // 8. Call agenthub_list_vault_keys
  const listVaultRes = await send({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: { name: 'agenthub_list_vault_keys', arguments: {} },
  });
  if (!listVaultRes?.result?.content?.[0]?.text?.includes('Zero-Leak')) {
    throw new Error('agenthub_list_vault_keys failed or missing Zero-Leak notice');
  }
  console.log('✓ agenthub_list_vault_keys succeeded');

  // 9. Call agenthub_check_vault_secret
  const checkVaultRes = await send({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: { name: 'agenthub_check_vault_secret', arguments: { key: 'TEST_SECRET' } },
  });
  const checkData = JSON.parse(checkVaultRes?.result?.content?.[0]?.text || '{}');
  if (checkData.key !== 'TEST_SECRET') {
    throw new Error('agenthub_check_vault_secret failed');
  }
  if (checkData.maskedPreview !== undefined) {
    throw new Error('Security flaw: agenthub_check_vault_secret exposed maskedPreview!');
  }
  if (checkData.exists !== false || checkData.status !== 'MISSING' || checkData.length !== 0) {
    throw new Error(`agenthub_check_vault_secret unexpected response for missing secret: ${JSON.stringify(checkData)}`);
  }
  console.log('✓ agenthub_check_vault_secret succeeded without exposing maskedPreview');

  // 10. Call agenthub_list_mcps
  const listMcpsRes = await send({
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/call',
    params: { name: 'agenthub_list_mcps', arguments: {} },
  });
  if (!listMcpsRes?.result?.content?.[0]?.text) {
    throw new Error('agenthub_list_mcps returned empty');
  }
  console.log('✓ agenthub_list_mcps succeeded');

  // 11. Call agenthub_audit_code with deliberate secret leak
  const auditRes = await send({
    jsonrpc: '2.0',
    id: 12,
    method: 'tools/call',
    params: {
      name: 'agenthub_audit_code',
      arguments: {
        text: 'const openai_key = "sk-12345678901234567890123456";',
      },
    },
  });
  const auditData = JSON.parse(auditRes?.result?.content?.[0]?.text || '{}');
  if (auditData.leaksDetected !== 1 || !auditData.findings[0]?.masked.includes('...')) {
    throw new Error(`agenthub_audit_code failed to detect or mask leak: ${JSON.stringify(auditData)}`);
  }
  if (auditData.findings[0]?.snippet?.includes('sk-12345678901234567890123456')) {
    throw new Error('Security flaw: auditData snippet contained raw secret!');
  }
  console.log('✓ agenthub_audit_code successfully detected and masked secret leak (snippet sanitized)');

  // 11b. Test path traversal rejection in agenthub_audit_code
  const auditTraversalRes = await send({
    jsonrpc: '2.0',
    id: 121,
    method: 'tools/call',
    params: {
      name: 'agenthub_audit_code',
      arguments: {
        directory: '../../..',
      },
    },
  });
  if (!auditTraversalRes?.error?.message?.includes('directory traversal outside Knowledge Base')) {
    throw new Error(`Path traversal was not rejected! Response: ${JSON.stringify(auditTraversalRes)}`);
  }
  console.log('✓ Path traversal escape strictly blocked by agenthub_audit_code');

  // 11c. Test multi-secret single-line masking in agenthub_audit_code
  const multiSecretRes = await send({
    jsonrpc: '2.0',
    id: 122,
    method: 'tools/call',
    params: {
      name: 'agenthub_audit_code',
      arguments: {
        text: 'const a = "sk-111111111111111111111111"; const b = "sk-ant-222222222222222222222222";',
      },
    },
  });
  const multiData = JSON.parse(multiSecretRes?.result?.content?.[0]?.text || '{}');
  if (multiData.leaksDetected !== 2) {
    throw new Error(`Expected 2 leaks, found: ${multiData.leaksDetected}`);
  }
  for (const f of multiData.findings) {
    if (f.snippet.includes('sk-111111111111111111111111') || f.snippet.includes('sk-ant-222222222222222222222222')) {
      throw new Error(`Security flaw: multi-secret snippet still contained raw secret: ${f.snippet}`);
    }
  }
  console.log('✓ Multiple secrets on the same line are all strictly masked in snippets');

  // 11d. Test LeakGuard.redactSecretInFile quote stripping and .bak creation
  const { LeakGuard } = await import('../dist/core/leak-guard.js');
  const tempAuditFile = path.join(testKbDir, 'sample_auth.js');
  fs.writeFileSync(tempAuditFile, 'const secretKey = "sk-333333333333333333333333";\n', 'utf8');
  const guardInstance = new LeakGuard(testKbDir);
  const sampleFindings = guardInstance.scanContent(fs.readFileSync(tempAuditFile, 'utf8'), tempAuditFile);
  if (sampleFindings.length !== 1) {
    throw new Error('Failed to find secret in sample_auth.js');
  }
  const redacted = guardInstance.redactSecretInFile(sampleFindings[0], 'AUTO_SECRET_OPENAI');
  if (!redacted) throw new Error('redactSecretInFile returned false');
  const updatedCode = fs.readFileSync(tempAuditFile, 'utf8');
  if (updatedCode.includes('"process.env') || updatedCode.includes('process.env.AUTO_SECRET_OPENAI || ""') === false) {
    throw new Error(`redactSecretInFile produced broken quoted syntax: ${updatedCode}`);
  }
  if (!fs.existsSync(`${tempAuditFile}.bak`)) {
    throw new Error('.bak backup file was not created by redactSecretInFile!');
  }
  console.log('✓ redactSecretInFile creates .bak backup and strips quotes for valid process.env JS syntax');

  // 11e. Test SecretVault.ensureGitIgnored includes *.bak and auto-triggers on save() & setSecret()
  const { SecretVault } = await import('../dist/core/vault.js');
  const tempVaultDir = path.join(testKbDir, 'temp_vault_test');
  fs.mkdirSync(tempVaultDir, { recursive: true });
  const testVault = new SecretVault(tempVaultDir);
  testVault.setSecret('TEST_KEY', 'test_value');
  const gitignoreContent = fs.readFileSync(path.join(tempVaultDir, '.gitignore'), 'utf8');
  if (!gitignoreContent.includes('*.bak') || !gitignoreContent.includes('.hub/vault.env')) {
    throw new Error(`ensureGitIgnored did not add *.bak or .hub/vault.env: ${gitignoreContent}`);
  }
  console.log('✓ SecretVault.ensureGitIgnored includes *.bak and is auto-called in setSecret() & save()');

  // 11f. Test LeakGuard.isSupportedFile whitelist & safe handling of unsupported files
  if (!LeakGuard.isSupportedFile('app.ts') || !LeakGuard.isSupportedFile('.env.production') || !LeakGuard.isSupportedFile('config.json') || !LeakGuard.isSupportedFile('script.py')) {
    throw new Error('LeakGuard.isSupportedFile rejected valid supported extension');
  }
  if (LeakGuard.isSupportedFile('main.go') || LeakGuard.isSupportedFile('lib.rs') || LeakGuard.isSupportedFile('App.java')) {
    throw new Error('LeakGuard.isSupportedFile accepted unsupported extension');
  }
  const unsupportedGoFile = path.join(testKbDir, 'server.go');
  const goCode = 'package main\nvar apiKey = "sk-444444444444444444444444";\n';
  fs.writeFileSync(unsupportedGoFile, goCode, 'utf8');
  const goFindings = guardInstance.scanContent(goCode, unsupportedGoFile);
  const goRedactResult = guardInstance.redactSecretInFile(goFindings[0], 'AUTO_SECRET_GO');
  if (goRedactResult !== false) {
    throw new Error('LeakGuard.redactSecretInFile should return false for unsupported file');
  }
  if (fs.existsSync(`${unsupportedGoFile}.bak`)) {
    throw new Error('LeakGuard.redactSecretInFile should not create .bak for unsupported file');
  }
  if (fs.readFileSync(unsupportedGoFile, 'utf8') !== goCode) {
    throw new Error('LeakGuard.redactSecretInFile modified an unsupported file!');
  }
  console.log('✓ LeakGuard strictly protects unsupported code files (Go, Rust, Java) from syntax corruption');

  // 11g. Test agenthub audit --fix secret deduplication across multiple files
  const dupFile1 = path.join(testKbDir, 'file1.js');
  const dupFile2 = path.join(testKbDir, 'file2.js');
  const identicalSecret = 'sk-555555555555555555555555';
  fs.writeFileSync(dupFile1, `const token1 = "${identicalSecret}";\n`, 'utf8');
  fs.writeFileSync(dupFile2, `const token2 = "${identicalSecret}";\n`, 'utf8');
  execSync(`node "${mainBinPath}" audit --fix --kb "${testKbDir}"`, { encoding: 'utf8' });
  const auditVault = new SecretVault(testKbDir);
  const vaultKeys = auditVault.listKeys();
  const matchingKeys = vaultKeys.filter(k => auditVault.getSecret(k) === identicalSecret);
  if (matchingKeys.length !== 1) {
    throw new Error(`Expected exactly 1 deduplicated vault key for identical secret, found ${matchingKeys.length}: ${JSON.stringify(matchingKeys)}`);
  }
  const code1 = fs.readFileSync(dupFile1, 'utf8');
  const code2 = fs.readFileSync(dupFile2, 'utf8');
  if (!code1.includes(matchingKeys[0]) || !code2.includes(matchingKeys[0])) {
    throw new Error(`Both files did not receive deduplicated key ${matchingKeys[0]}`);
  }
  console.log(`✓ agenthub audit --fix successfully deduplicated secret under single key: ${matchingKeys[0]}`);

  // 11h. Test LeakGuard.scanDirectory() strictly skips *.bak backup files
  const allDirFindings = guardInstance.scanDirectory(testKbDir);
  const bakFindings = allDirFindings.filter(f => f.filePath.endsWith('.bak'));
  if (bakFindings.length > 0) {
    throw new Error(`LeakGuard.scanDirectory() scanned .bak backup files as leaks: ${JSON.stringify(bakFindings)}`);
  }
  console.log('✓ LeakGuard.scanDirectory strictly ignores *.bak backup files to avoid false positive audits');

  // 11i. Test redactSecretInFile preserves pristine original .bak across multiple secrets in same file
  const multiSecretFile = path.join(testKbDir, 'multi_sec.js');
  const pristineCode = 'const secA = "sk-666666666666666666666666";\nconst secB = \'sk-777777777777777777777777\';\n';
  fs.writeFileSync(multiSecretFile, pristineCode, 'utf8');
  const multiFindings = guardInstance.scanContent(pristineCode, multiSecretFile);
  if (multiFindings.length !== 2) throw new Error(`Expected 2 findings in multi_sec.js, got ${multiFindings.length}`);
  guardInstance.redactSecretInFile(multiFindings[0], 'AUTO_SECRET_A');
  guardInstance.redactSecretInFile(multiFindings[1], 'AUTO_SECRET_B');
  const backupCode = fs.readFileSync(`${multiSecretFile}.bak`, 'utf8');
  if (backupCode !== pristineCode) {
    throw new Error(`.bak backup was corrupted or overwritten on second redaction pass: ${backupCode}`);
  }
  const finalMultiCode = fs.readFileSync(multiSecretFile, 'utf8');
  if (finalMultiCode.includes('sk-6666') || finalMultiCode.includes('sk-7777')) {
    throw new Error(`Failed to redact both mixed-quote secrets in multi_sec.js: ${finalMultiCode}`);
  }
  console.log('✓ redactSecretInFile preserves pristine .bak backup and cleanly redacts mixed quoting styles');

  // 11j. Test isSupportedFile with .env variants
  if (!LeakGuard.isSupportedFile('config.env.local') || !LeakGuard.isSupportedFile('production.env') || !LeakGuard.isSupportedFile('.env.staging')) {
    throw new Error('LeakGuard.isSupportedFile failed on valid .env variants');
  }
  console.log('✓ LeakGuard.isSupportedFile correctly recognizes all .env file variants');

  // 12. List resources
  const resourcesListRes = await send({
    jsonrpc: '2.0',
    id: 13,
    method: 'resources/list',
    params: {},
  });
  const resList = resourcesListRes?.result?.resources || [];
  if (resList.length < 3) {
    throw new Error(`Expected at least 3 resources, got ${resList.length}`);
  }
  console.log(`✓ Verified ${resList.length} resources exposed`);

  // 13. Read resource
  const readRes = await send({
    jsonrpc: '2.0',
    id: 14,
    method: 'resources/read',
    params: { uri: 'agenthub://handoff' },
  });
  if (!readRes?.result?.contents?.[0]?.text?.includes('Automated test suite verification')) {
    throw new Error('resources/read failed to retrieve active handoff resource');
  }
  console.log('✓ resources/read agenthub://handoff verified');

  // 14. List prompts & get prompt
  const promptsListRes = await send({
    jsonrpc: '2.0',
    id: 15,
    method: 'prompts/list',
    params: {},
  });
  if (!promptsListRes?.result?.prompts?.[0]?.name) {
    throw new Error('prompts/list returned empty prompts');
  }
  const getPromptRes = await send({
    jsonrpc: '2.0',
    id: 16,
    method: 'prompts/get',
    params: { name: 'agenthub_resume_task' },
  });
  if (!getPromptRes?.result?.messages?.[0]?.content?.text?.includes('Automated test suite verification')) {
    throw new Error('prompts/get failed to generate resume prompt');
  }
  console.log('✓ prompts/list and prompts/get agenthub_resume_task verified');

  // =========================================================================
  // Test Suite 12: Security Hardening & Zero-Leak Isolation Verification
  // =========================================================================
  console.log('\n--- Test Suite 12: Security Hardening & Isolation ---');

  // 12a. Verify isCriticalSystemPath guards against critical roots and paths
  console.log('Test 12a: Testing isCriticalSystemPath...');
  const rootPath = path.parse(process.cwd()).root;
  if (!isCriticalSystemPath(rootPath)) {
    throw new Error(`isCriticalSystemPath failed to reject root: ${rootPath}`);
  }
  if (!isCriticalSystemPath('/')) {
    throw new Error('isCriticalSystemPath failed to reject /');
  }
  if (!isCriticalSystemPath('C:\\') && process.platform === 'win32') {
    throw new Error('isCriticalSystemPath failed to reject C:\\');
  }
  if (!isCriticalSystemPath(os.homedir())) {
    throw new Error('isCriticalSystemPath failed to reject os.homedir()');
  }
  if (!isCriticalSystemPath(process.cwd())) {
    throw new Error('isCriticalSystemPath failed to reject process.cwd()');
  }
  if (!isCriticalSystemPath(path.dirname(os.homedir()))) {
    throw new Error('isCriticalSystemPath failed to reject parent of homedir');
  }
  if (!isCriticalSystemPath(path.join(os.homedir(), 'Desktop'))) {
    throw new Error('isCriticalSystemPath failed to reject Desktop');
  }
  if (!isCriticalSystemPath('/bin')) {
    throw new Error('isCriticalSystemPath failed to reject /bin');
  }
  if (!isCriticalSystemPath('/etc')) {
    throw new Error('isCriticalSystemPath failed to reject /etc');
  }
  if (!isCriticalSystemPath('/usr')) {
    throw new Error('isCriticalSystemPath failed to reject /usr');
  }
  if (!isCriticalSystemPath('/usr/bin')) {
    throw new Error('isCriticalSystemPath failed to reject /usr/bin');
  }
  if (!isCriticalSystemPath('/tmp')) {
    throw new Error('isCriticalSystemPath failed to reject /tmp');
  }
  if (process.platform === 'win32') {
    const winDir = process.env.WINDIR || 'C:\\Windows';
    if (!isCriticalSystemPath(winDir)) {
      throw new Error(`isCriticalSystemPath failed to reject WINDIR: ${winDir}`);
    }
    if (!isCriticalSystemPath(path.join(winDir, 'System32'))) {
      throw new Error(`isCriticalSystemPath failed to reject System32`);
    }
    if (process.env.ProgramFiles && !isCriticalSystemPath(process.env.ProgramFiles)) {
      throw new Error(`isCriticalSystemPath failed to reject ProgramFiles`);
    }
  }
  const safeCustomPath = path.join(testKbDir, 'safe_subfolder_kb');
  if (isCriticalSystemPath(safeCustomPath)) {
    throw new Error(`isCriticalSystemPath incorrectly flagged safe subfolder as critical: ${safeCustomPath}`);
  }
  console.log('✓ isCriticalSystemPath strictly rejects root, homedir, cwd, and system paths while allowing safe subdirectories');

  // 12b. Verify unregisterKnowledgeBase guards against deletion of unregistered / critical paths
  console.log('Test 12b: Testing unregisterKnowledgeBase safeguards...');
  const fakeUnregisteredDir = path.join(testKbDir, 'unregistered_dir');
  fs.mkdirSync(fakeUnregisteredDir, { recursive: true });
  const unregDeleteRes = unregisterKnowledgeBase(fakeUnregisteredDir, true);
  if (unregDeleteRes.success !== false || !unregDeleteRes.error?.includes('not registered in knownKnowledgeBases')) {
    throw new Error(`unregisterKnowledgeBase should refuse deletion of unregistered directory: ${JSON.stringify(unregDeleteRes)}`);
  }
  if (!fs.existsSync(fakeUnregisteredDir)) {
    throw new Error('unregisterKnowledgeBase deleted unregistered directory despite refusal!');
  }

  const critDeleteRes = unregisterKnowledgeBase(process.cwd(), true);
  if (critDeleteRes.success !== false || !critDeleteRes.error?.includes('critical system or workspace path')) {
    throw new Error(`unregisterKnowledgeBase should refuse deletion of critical path: ${JSON.stringify(critDeleteRes)}`);
  }

  // Test safe deletion of registered path
  const originalGlobalConf = loadGlobalConfig();
  try {
    const safeRegisteredDir = path.join(testKbDir, 'registered_temp_kb');
    fs.mkdirSync(safeRegisteredDir, { recursive: true });
    fs.writeFileSync(path.join(safeRegisteredDir, 'test.txt'), 'hello', 'utf8');

    const tempGlobalConf = loadGlobalConfig();
    if (!tempGlobalConf.knownKnowledgeBases) tempGlobalConf.knownKnowledgeBases = [];
    tempGlobalConf.knownKnowledgeBases.push(safeRegisteredDir);
    saveGlobalConfig(tempGlobalConf);

    // Unregister without deleting files
    const unregNoDelete = unregisterKnowledgeBase(safeRegisteredDir, false);
    if (!unregNoDelete.success || !fs.existsSync(safeRegisteredDir)) {
      throw new Error(`unregisterKnowledgeBase failed or deleted files when deleteFiles=false: ${JSON.stringify(unregNoDelete)}`);
    }

    // Re-register and unregister with deleting files
    tempGlobalConf.knownKnowledgeBases.push(safeRegisteredDir);
    saveGlobalConfig(tempGlobalConf);
    const unregWithDelete = unregisterKnowledgeBase(safeRegisteredDir, true);
    if (!unregWithDelete.success || fs.existsSync(safeRegisteredDir)) {
      throw new Error(`unregisterKnowledgeBase failed to delete registered files when deleteFiles=true: ${JSON.stringify(unregWithDelete)}`);
    }
  } finally {
    saveGlobalConfig(originalGlobalConf);
  }
  console.log('✓ unregisterKnowledgeBase strictly enforces registration and system path guards before file deletion');

  // 12c. Verify SecretVault.ensureAgentIgnoreFiles and vault.env truthful comments
  console.log('Test 12c: Testing SecretVault agent ignore files and vault.env comment...');
  const ignoreTestDir = path.join(testKbDir, 'ignore_test_kb');
  fs.mkdirSync(ignoreTestDir, { recursive: true });
  SecretVault.ensureAgentIgnoreFiles(ignoreTestDir);

  const expectedIgnoreFiles = ['.cursorignore', '.codeiumignore', '.continueignore', '.zcodeignore'];
  for (const ignFile of expectedIgnoreFiles) {
    const fullIgnPath = path.join(ignoreTestDir, ignFile);
    if (!fs.existsSync(fullIgnPath)) {
      throw new Error(`Missing expected ignore file: ${ignFile}`);
    }
    const ignContent = fs.readFileSync(fullIgnPath, 'utf8');
    if (!ignContent.includes('.hub/') || !ignContent.includes('*.env*') || !ignContent.includes('.env*') || !ignContent.includes('*.bak') || !ignContent.includes('!.env.example') || !ignContent.includes('!*.env.example')) {
      throw new Error(`Ignore file ${ignFile} missing required patterns: ${ignContent}`);
    }
  }

  // Test idempotency: calling ensureAgentIgnoreFiles again should not duplicate entries
  SecretVault.ensureAgentIgnoreFiles(ignoreTestDir);
  const cursorIgnContent = fs.readFileSync(path.join(ignoreTestDir, '.cursorignore'), 'utf8');
  const hubMatches = cursorIgnContent.match(/\.hub\//g) || [];
  if (hubMatches.length !== 1) {
    throw new Error(`.cursorignore duplicated entries after second call: count=${hubMatches.length}`);
  }

  // Verify truthful comment in vault.env
  const vaultInstance = new SecretVault(ignoreTestDir);
  vaultInstance.setSecret('SAMPLE_KEY', 'sample_val');
  const vaultFileContent = fs.readFileSync(path.join(ignoreTestDir, '.hub', 'vault.env'), 'utf8');
  if (vaultFileContent.toLowerCase().includes('never stored in plain text on disk')) {
    throw new Error('Misleading comment still present in vault.env!');
  }
  if (vaultFileContent.includes('injected into MCP processes by AgentHub Proxy')) {
    throw new Error('Old misleading MCP proxy comment still present in vault.env!');
  }
  if (vaultFileContent.includes('pre-read sanitization')) {
    throw new Error('Misleading pre-read sanitization comment still present in vault.env!');
  }
  if (!vaultFileContent.includes('ZERO-LEAK SECURITY') || !vaultFileContent.includes('Stored locally; never send these values to a model.')) {
    throw new Error(`vault.env missing truthful security comment: ${vaultFileContent}`);
  }
  console.log('✓ SecretVault creates and maintains all agent ignore files idempotently with truthful comments');

  // 12d. Verify LeakGuard.isEnvFile extension blacklist and whitelist
  console.log('Test 12d: Testing LeakGuard.isEnvFile with blacklist/whitelist...');
  const blacklistedEnvFiles = [
    'deploy.env.yaml',
    'deploy.env.yml',
    'production.env.backup',
    'config.env.json',
    'index.env.js',
    'settings.env.ts',
    'script.env.py',
    'data.env.bak',
    'service.env.sh',
    'deploy.env.yaml.local',
    '.env.yaml.local',
    'test.env.js.local',
    'app.env.ts.bak',
    'data.env.tar.gz',
  ];
  for (const bf of blacklistedEnvFiles) {
    if (LeakGuard.isEnvFile(bf)) {
      throw new Error(`Security flaw: LeakGuard.isEnvFile incorrectly accepted blacklisted file: ${bf}`);
    }
    if (bf.endsWith('.bak') || bf.endsWith('.backup')) {
      if (LeakGuard.isSupportedFile(bf)) {
        throw new Error(`LeakGuard.isSupportedFile accepted backup file: ${bf}`);
      }
    }
  }

  const validEnvFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.staging',
    '.env.production',
    '.env.test',
    'config.env.local',
    'production.env',
    'local.env',
  ];
  for (const vf of validEnvFiles) {
    if (!LeakGuard.isEnvFile(vf)) {
      throw new Error(`LeakGuard.isEnvFile rejected valid env file: ${vf}`);
    }
    if (!LeakGuard.isSupportedFile(vf)) {
      throw new Error(`LeakGuard.isSupportedFile rejected valid env file: ${vf}`);
    }
  }
  console.log('✓ LeakGuard.isEnvFile strictly blacklists code/backup extensions and accepts valid .env variants');

  // 12e. Verify LeakGuard.scanDirectory with includeBackups flag
  console.log('Test 12e: Testing LeakGuard.scanDirectory includeBackups option...');
  const bakDir = path.join(testKbDir, 'bak_scan_test');
  fs.mkdirSync(bakDir, { recursive: true });
  fs.writeFileSync(path.join(bakDir, 'leaky.js.bak'), 'const leak = "sk-888888888888888888888888";\n', 'utf8');

  const noBakFindings = guardInstance.scanDirectory(bakDir, false);
  if (noBakFindings.some(f => f.filePath.endsWith('.bak'))) {
    throw new Error('LeakGuard.scanDirectory(..., false) included .bak file!');
  }

  const withBakFindings = guardInstance.scanDirectory(bakDir, true);
  if (!withBakFindings.some(f => f.filePath.endsWith('.bak') && f.matchedSecret.includes('sk-888888888888888888888888'))) {
    throw new Error('LeakGuard.scanDirectory(..., true) failed to detect leak in .bak file!');
  }
  console.log('✓ LeakGuard.scanDirectory honors includeBackups parameter accurately');

  // 12f. Verify ZCodeAdapter configuration and cleanup
  console.log('Test 12f: Testing ZCodeAdapter...');
  if (!AGENT_INFO.zcode || !AGENT_INFO.zcode.name.includes('ZCode')) {
    throw new Error(`AGENT_INFO missing zcode metadata: ${JSON.stringify(AGENT_INFO.zcode)}`);
  }
  const zcodeTestDir = path.join(testKbDir, 'zcode_test_kb');
  fs.mkdirSync(zcodeTestDir, { recursive: true });
  const zcodeAdapter = new ZCodeAdapter();
  await zcodeAdapter.generateConfig(zcodeTestDir, ['agenthub-guide.md'], []);

  if (!fs.existsSync(path.join(zcodeTestDir, '.zcoderules'))) {
    throw new Error('ZCodeAdapter failed to generate .zcoderules');
  }
  if (!fs.existsSync(path.join(zcodeTestDir, 'AGENTS.md'))) {
    throw new Error('ZCodeAdapter failed to generate AGENTS.md');
  }
  if (!fs.existsSync(path.join(zcodeTestDir, '.zcodeignore'))) {
    throw new Error('ZCodeAdapter failed to generate .zcodeignore');
  }
  const zcodeMcpFile = path.join(zcodeTestDir, '.zcode', 'mcp.json');
  if (!fs.existsSync(zcodeMcpFile)) {
    throw new Error('ZCodeAdapter failed to generate .zcode/mcp.json');
  }
  const zcodeMcp = JSON.parse(fs.readFileSync(zcodeMcpFile, 'utf8'));
  if (!zcodeMcp.mcpServers?.agenthub || !zcodeMcp.mcpServers.agenthub.args.includes('serve-mcp')) {
    throw new Error(`ZCodeAdapter produced invalid mcp.json: ${JSON.stringify(zcodeMcp)}`);
  }
  if (zcodeMcp.mcpServers.agenthub.args.some((a) => a.includes('node_modules'))) {
    throw new Error('ZCodeAdapter contains broken node_modules path!');
  }

  // Test ZCode cleanup
  await zcodeAdapter.cleanup(zcodeTestDir);
  if (fs.existsSync(path.join(zcodeTestDir, '.zcoderules'))) {
    throw new Error('ZCodeAdapter cleanup did not remove .zcoderules');
  }

  // Test GlobalSyncManager.syncZCode
  const syncMgr = new GlobalSyncManager(zcodeTestDir);
  const zcodeSyncResult = syncMgr.syncZCode();
  if (!zcodeSyncResult.name.includes('ZCode')) {
    throw new Error(`GlobalSyncManager.syncZCode failed: ${JSON.stringify(zcodeSyncResult)}`);
  }
  console.log('✓ ZCodeAdapter and syncZCode generate valid configurations with mcp.json, ignore rules, and clean up properly');

  // 12g. Verify GlobalSyncManager Claude Code permissions.deny and install check
  console.log('Test 12g: Testing GlobalSyncManager Claude Code permissions.deny...');
  const globalSyncCode = fs.readFileSync(path.join(__dirname, '..', 'dist', 'core', 'global-sync.js'), 'utf8');
  if (!globalSyncCode.includes('permissions.deny') || !globalSyncCode.includes('Read(.hub/**)')) {
    throw new Error('GlobalSyncManager.syncClaudeCode does not configure permissions.deny for .hub/**');
  }
  if (!globalSyncCode.includes('.claude') && !globalSyncCode.includes('fs.existsSync')) {
    throw new Error('GlobalSyncManager.syncClaudeCode does not check for ~/.claude existence');
  }

  // Live execution test of syncClaudeCode with temporary directory
  const tempClaudeHome = path.join(testKbDir, 'mock_claude_home');
  const tempClaudeDir = path.join(tempClaudeHome, '.claude');
  fs.mkdirSync(tempClaudeDir, { recursive: true });
  const originalHomedir = os.homedir;
  try {
    os.homedir = () => tempClaudeHome;
    const claudeSyncMgr = new GlobalSyncManager(zcodeTestDir);
    const claudeRes = claudeSyncMgr.syncClaudeCode();
    if (!claudeRes.configured) {
      throw new Error(`syncClaudeCode failed to configure mock claude home: ${JSON.stringify(claudeRes)}`);
    }
    const writtenClaudeConf = JSON.parse(fs.readFileSync(path.join(tempClaudeHome, '.claude.json'), 'utf8'));
    if (!writtenClaudeConf.permissions?.deny?.includes('Read(.hub/**)')) {
      throw new Error(`syncClaudeCode failed to write permissions.deny in config: ${JSON.stringify(writtenClaudeConf)}`);
    }

    // Verify pristine backup retention on second sync
    fs.writeFileSync(path.join(tempClaudeHome, '.claude.json.bak'), 'PRISTINE_ORIGINAL', 'utf8');
    claudeSyncMgr.syncClaudeCode();
    const retainedBackup = fs.readFileSync(path.join(tempClaudeHome, '.claude.json.bak'), 'utf8');
    if (retainedBackup !== 'PRISTINE_ORIGINAL') {
      throw new Error('syncClaudeCode overwritten pristine .bak backup on second sync pass!');
    }
  } finally {
    os.homedir = originalHomedir;
  }
  console.log('✓ GlobalSyncManager enforces Claude Code permissions.deny isolation for .hub and checks installation');

  // 12h. Test agenthub_check_vault_secret with configured secret (no maskedPreview, schema { key, exists, status, length })
  console.log('Test 12h: Testing agenthub_check_vault_secret on configured secret...');
  const configuredCheckRes = await send({
    jsonrpc: '2.0',
    id: 17,
    method: 'tools/call',
    params: { name: 'agenthub_check_vault_secret', arguments: { key: matchingKeys[0] } },
  });
  const configuredData = JSON.parse(configuredCheckRes?.result?.content?.[0]?.text || '{}');
  if (configuredData.exists !== true || configuredData.status !== 'AVAILABLE' || configuredData.length !== identicalSecret.length) {
    throw new Error(`agenthub_check_vault_secret returned invalid data for configured secret: ${JSON.stringify(configuredData)}`);
  }
  if (configuredData.maskedPreview !== undefined) {
    throw new Error(`Security leak: agenthub_check_vault_secret returned maskedPreview on configured secret: ${JSON.stringify(configuredData)}`);
  }
  console.log('✓ agenthub_check_vault_secret on configured secret returns safe metadata with zero token exposure');

  // 12i. Verify CLI flags in help output
  console.log('Test 12i: Testing CLI flags in help output...');
  const auditHelp = execSync(`node "${mainBinPath}" audit --help`, { encoding: 'utf8' });
  if (!auditHelp.includes('--include-backups')) {
    throw new Error(`agenthub audit --help missing --include-backups flag: ${auditHelp}`);
  }
  const kbRemoveHelp = execSync(`node "${mainBinPath}" kb remove --help`, { encoding: 'utf8' });
  if (!kbRemoveHelp.includes('-y, --yes') || !kbRemoveHelp.includes('--delete-files')) {
    throw new Error(`agenthub kb remove --help missing -y or --delete-files flag: ${kbRemoveHelp}`);
  }
  console.log('✓ CLI commands support --include-backups, -y/--yes, and --delete-files flags cleanly');

  // 12j. Verify SecretVault constructor does not pollute empty KB with ignore files, and selective ensureAgentIgnoreFiles works
  console.log('Test 12j: Testing SecretVault selective ignore file generation & clean KB...');
  const cleanKbDir = path.join(testKbDir, 'clean_empty_kb');
  fs.mkdirSync(cleanKbDir, { recursive: true });
  const cleanVault = new SecretVault(cleanKbDir);
  cleanVault.setSecret('FOO', 'bar');
  for (const ignFile of expectedIgnoreFiles) {
    if (fs.existsSync(path.join(cleanKbDir, ignFile))) {
      throw new Error(`SecretVault polluted empty KB with unexpected ignore file: ${ignFile}`);
    }
  }
  // Test selective generation: only cursor
  SecretVault.ensureAgentIgnoreFiles(cleanKbDir, ['cursor']);
  if (!fs.existsSync(path.join(cleanKbDir, '.cursorignore'))) {
    throw new Error('SecretVault failed to generate selective .cursorignore');
  }
  if (fs.existsSync(path.join(cleanKbDir, '.codeiumignore')) || fs.existsSync(path.join(cleanKbDir, '.continueignore')) || fs.existsSync(path.join(cleanKbDir, '.zcodeignore'))) {
    throw new Error('SecretVault generated non-enabled agent ignore files during selective generation');
  }
  console.log('✓ SecretVault does not unconditionally pollute KB and honors enabledAgents selectively');

  // 12k. Verify syncAdapters & adapter cleanup NEVER delete custom user files without # AgentHub Managed marker
  console.log('Test 12k: Testing custom user file preservation and safe cleanup with backups...');
  const customUserKb = path.join(testKbDir, 'custom_user_kb');
  fs.mkdirSync(customUserKb, { recursive: true });
  const customClaude = path.join(customUserKb, 'CLAUDE.md');
  const customCursor = path.join(customUserKb, '.cursorrules');
  const customOpencodeDir = path.join(customUserKb, '.opencode');
  const customOpencodeConfig = path.join(customOpencodeDir, 'config.json');
  const customDeepseekDir = path.join(customUserKb, '.deepseek');
  const customDeepseekPrompt = path.join(customDeepseekDir, 'system_prompt.md');
  const customUserExtraFile = path.join(customOpencodeDir, 'my_custom_extra.json');

  fs.writeFileSync(customClaude, '# МОЙ CLAUDE.md\nCustom prompt here\n', 'utf8');
  fs.writeFileSync(customCursor, '# МОЙ .cursorrules\nCustom rules here\n', 'utf8');
  fs.mkdirSync(customOpencodeDir, { recursive: true });
  fs.writeFileSync(customOpencodeConfig, '{"my":"config"}', 'utf8');
  fs.writeFileSync(customUserExtraFile, '{"extra":"keep_me"}', 'utf8');
  fs.mkdirSync(customDeepseekDir, { recursive: true });
  fs.writeFileSync(customDeepseekPrompt, '# My custom prompt\n', 'utf8');

  // Run syncAdapters with disabled agents (empty list) -> triggers cleanup for all
  const { syncAdapters } = await import('../dist/adapters/index.js');
  await syncAdapters(customUserKb, [], [], []);

  // Assert user custom files were NOT deleted
  if (!fs.existsSync(customClaude)) {
    throw new Error('P0 regression: syncAdapters cleanup deleted user CLAUDE.md!');
  }
  if (fs.readFileSync(customClaude, 'utf8') !== '# МОЙ CLAUDE.md\nCustom prompt here\n') {
    throw new Error('P0 regression: syncAdapters cleanup corrupted user CLAUDE.md!');
  }
  if (!fs.existsSync(customCursor)) {
    throw new Error('P0 regression: syncAdapters cleanup deleted user .cursorrules!');
  }
  if (!fs.existsSync(customOpencodeConfig)) {
    throw new Error('P0 regression: syncAdapters cleanup deleted user .opencode/config.json!');
  }
  if (!fs.existsSync(customUserExtraFile)) {
    throw new Error('P0 regression: syncAdapters cleanup deleted user .opencode extra files!');
  }
  if (!fs.existsSync(customDeepseekPrompt)) {
    throw new Error('P0 regression: syncAdapters cleanup deleted user .deepseek/system_prompt.md!');
  }

  // Now test generateConfig on existing user files: creates .bak and preserves user content
  await syncAdapters(customUserKb, ['claude-code', 'cursor'], [], []);
  if (!fs.existsSync(`${customClaude}.bak`)) {
    throw new Error('generateConfig failed to create .bak backup for custom CLAUDE.md');
  }
  const mergedClaude = fs.readFileSync(customClaude, 'utf8');
  if (!mergedClaude.includes('# МОЙ CLAUDE.md') || !mergedClaude.includes('# AgentHub Managed')) {
    throw new Error(`generateConfig did not preserve user content with # AgentHub Managed marker: ${mergedClaude}`);
  }

  // Now test cleanup on AgentHub-managed file: creates .bak and removes cleanly
  await syncAdapters(customUserKb, [], [], []);
  if (fs.existsSync(customClaude)) {
    throw new Error('cleanup failed to unlink AgentHub-managed CLAUDE.md');
  }
  if (!fs.existsSync(`${customClaude}.bak`)) {
    throw new Error('cleanup did not ensure .bak existed before unlinking managed file');
  }
  console.log('✓ Custom user files without marker are strictly protected; managed files create .bak before cleanup');

  proc.kill();
  if (fs.existsSync(testKbDir)) fs.rmSync(testKbDir, { recursive: true, force: true });
  console.log('\n========================================');
  console.log('🎉 ALL COMPREHENSIVE AUTOMATED TESTS PASSED!');
  console.log('========================================');
  process.exit(0);
}

runMcpSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  proc.kill();
  if (fs.existsSync(testKbDir)) fs.rmSync(testKbDir, { recursive: true, force: true });
  process.exit(1);
});
