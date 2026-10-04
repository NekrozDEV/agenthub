import chalk from 'chalk';

export function printBanner(): void {
  const o1 = chalk.hex('#FF4500'); // Deep Orange / Red-Orange
  const o2 = chalk.hex('#FF6600'); // Pure Vibrant Orange
  const o3 = chalk.hex('#FF8800'); // Bright Orange
  const o4 = chalk.hex('#FFA500'); // Amber Orange
  const o5 = chalk.hex('#FFBF00'); // Warm Gold / Amber

  const logoLines = [
    o1('   █████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗  ██╗██╗   ██╗██████╗ '),
    o2('  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗'),
    o3('  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████║██║   ██║██████╔╝'),
    o4('  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██║   ██║██╔══██╗'),
    o5('  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║  ██║╚██████╔╝██████╔╝'),
    o5('  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ '),
  ];

  console.log('\n' + logoLines.join('\n'));
  console.log(
    o3('  ⚡ ') +
    chalk.white.bold('Zero-Leak Vault') +
    chalk.gray(' • ') +
    o4('⚡ ') +
    chalk.white.bold('Multi-IDE MCP') +
    chalk.gray(' • ') +
    o5('⚡ ') +
    chalk.white.bold('Cross-Agent Memory') +
    chalk.gray(' • ') +
    o2('⚡ ') +
    chalk.white.bold('Smart Context Saver') +
    '\n'
  );
}
