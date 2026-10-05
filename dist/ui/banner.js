import chalk from 'chalk';
import { getPreferredLanguage } from '../core/config.js';
export function printBanner(options) {
    if (options?.clear ?? true) {
        try {
            console.clear();
        }
        catch { }
    }
    const lang = options?.lang || getPreferredLanguage();
    // Anthropic Claude terracotta palette & 3D shadow
    const claudeLight = chalk.hex('#F08B6B'); // Top warm highlight (Row 0)
    const claudeMain = chalk.hex('#D97757'); // Main Claude terracotta (Rows 1-2)
    const claudeWarm = chalk.hex('#B85536'); // Lower edge terracotta (Rows 3-4)
    const claudeShadow = chalk.hex('#5C2818'); // Right shadow (dark terracotta)
    const claudeDark = chalk.hex('#3E180D'); // Deep base shadow (Row 5)
    // Variant 1: Claude Monolith with extra space gap between AGENT and HUB
    const v1_lines = [
        '  █████▌   ██████▌  ███████▌  ███   ██▌  ████████▌     ██   ██▌  ██   ██▌  ██████▌ ',
        ' ██   ██▌  ██▌       ██▌      ████  ██▌     ██▌        ██   ██▌  ██   ██▌  ██   ██▌',
        ' ███████▌  ██   ███▌ █████▌   ██ ██ ██▌     ██▌        ███████▌  ██   ██▌  ██████▌ ',
        ' ██   ██▌  ██    ██▌ ██▌      ██  ████▌     ██▌        ██   ██▌  ██   ██▌  ██   ██▌',
        ' ██   ██▌   ██████▌  ███████▌ ██   ███▌     ██▌        ██   ██▌   █████▌   ██████▌ ',
        ' ▀▀▘  ▀▀▘   ▀▀▀▀▀▀▘  ▀▀▀▀▀▀▀▘ ▀▀▘  ▀▀▀▘     ▀▀▘        ▀▀▘  ▀▀▘   ▀▀▀▀▀▘   ▀▀▀▀▀▀▘ ',
    ];
    const renderedLines = v1_lines.map((line, r) => {
        let out = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '▌' || ch === '▘') {
                out += claudeShadow(ch);
            }
            else if (r === 5) {
                out += claudeDark(ch);
            }
            else if (ch === ' ') {
                out += ' ';
            }
            else {
                const col = (r === 0 ? claudeLight : r <= 2 ? claudeMain : claudeWarm);
                out += col(ch);
            }
        }
        return out;
    });
    console.log('\n' + renderedLines.join('\n'));
    const tagVault = lang === 'ru' ? 'Сейф Zero-Leak' : 'Zero-Leak Vault';
    const tagMcp = 'Multi-IDE MCP';
    const tagMemory = lang === 'ru' ? 'Память Агентов' : 'Cross-Agent Memory';
    const tagContext = lang === 'ru' ? 'Экономия Контекста' : 'Smart Context Saver';
    console.log(claudeLight('  ⚡ ') +
        chalk.white.bold(tagVault) +
        chalk.gray('  •  ') +
        claudeMain('⚡ ') +
        chalk.white.bold(tagMcp) +
        chalk.gray('  •  ') +
        claudeWarm('⚡ ') +
        chalk.white.bold(tagMemory) +
        chalk.gray('  •  ') +
        claudeMain('⚡ ') +
        chalk.white.bold(tagContext) +
        '\n');
}
