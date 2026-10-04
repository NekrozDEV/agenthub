import fs from 'fs';
import path from 'path';

export interface ProjectSummary {
  name: string;
  path: string;
  relativePath: string;
  type: string;
  description: string;
  techStack: string[];
  keyFiles: string[];
  structureSnippet: string;
}

export class RepoMapGenerator {
  private knowledgeBasePath: string;
  private projectsDir: string;

  constructor(knowledgeBasePath: string) {
    this.knowledgeBasePath = knowledgeBasePath;
    this.projectsDir = path.join(knowledgeBasePath, 'projects');
  }

  public detectProjectType(dir: string): { type: string; tech: string[]; desc: string } {
    const tech: string[] = [];
    let type = 'Generic Project';
    let desc = '';

    const pkgJson = path.join(dir, 'package.json');
    if (fs.existsSync(pkgJson)) {
      type = 'Node.js / TypeScript';
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
        if (pkg.description) desc = pkg.description;
        tech.push('Node.js');
        if (pkg.dependencies) {
          if (pkg.dependencies.react) tech.push('React');
          if (pkg.dependencies.next) tech.push('Next.js');
          if (pkg.dependencies.vue) tech.push('Vue');
          if (pkg.dependencies.express) tech.push('Express');
          if (pkg.dependencies.typescript || pkg.devDependencies?.typescript) tech.push('TypeScript');
        }
      } catch {}
    } else if (fs.existsSync(path.join(dir, 'requirements.txt')) || fs.existsSync(path.join(dir, 'pyproject.toml'))) {
      type = 'Python Application';
      tech.push('Python');
    } else if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
      type = 'Rust Crate';
      tech.push('Rust');
    } else if (fs.existsSync(path.join(dir, 'go.mod'))) {
      type = 'Go Module';
      tech.push('Go');
    }

    return { type, tech, desc };
  }

  private collectKeyFiles(dir: string, depth = 0, maxDepth = 2): string[] {
    if (depth > maxDepth || !fs.existsSync(dir)) return [];
    const files: string[] = [];
    const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'target']);

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (ignore.has(entry.name)) continue;
        if (entry.isDirectory()) {
          const sub = this.collectKeyFiles(path.join(dir, entry.name), depth + 1, maxDepth);
          files.push(...sub.map((f) => `${entry.name}/${f}`));
        } else {
          files.push(entry.name);
        }
      }
    } catch {}

    return files.slice(0, 20); // Cap at 20 key files per project
  }

  public scanProjects(): ProjectSummary[] {
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
      return [];
    }

    const projects: ProjectSummary[] = [];
    const entries = fs.readdirSync(this.projectsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projPath = path.join(this.projectsDir, entry.name);
      const { type, tech, desc } = this.detectProjectType(projPath);
      const keyFiles = this.collectKeyFiles(projPath);

      projects.push({
        name: entry.name,
        path: projPath,
        relativePath: path.relative(this.knowledgeBasePath, projPath),
        type,
        description: desc || 'Project workspace in AgentHub',
        techStack: tech,
        keyFiles,
        structureSnippet: keyFiles.slice(0, 10).join(', '),
      });
    }

    return projects;
  }

  /**
   * Generates a compact markdown file for all agents with low token usage
   */
  public generateRepoMapMarkdown(): string {
    const projects = this.scanProjects();
    const lines: string[] = [
      '# AgentHub Unified Project Map',
      '> Auto-generated token-efficient overview of all workspaces in this Knowledge Base.',
      '> Agents: Inspect individual files only when required for a specific task.',
      '',
    ];

    if (projects.length === 0) {
      lines.push('*(No projects found in `projects/` directory yet. Place your repositories inside `projects/`)*');
      return lines.join('\n');
    }

    for (const p of projects) {
      lines.push(`## 📦 ${p.name}`);
      lines.push(`- **Location**: \`${p.relativePath}\``);
      lines.push(`- **Type**: ${p.type}`);
      if (p.techStack.length > 0) {
        lines.push(`- **Stack**: ${p.techStack.join(', ')}`);
      }
      if (p.description) {
        lines.push(`- **Overview**: ${p.description}`);
      }
      lines.push(`- **Key Files**: \`${p.structureSnippet}\``);
      lines.push('');
    }

    return lines.join('\n');
  }

  public saveRepoMap(): string {
    const content = this.generateRepoMapMarkdown();
    const targetFile = path.join(this.knowledgeBasePath, 'PROJECTS_MAP.md');
    fs.writeFileSync(targetFile, content, 'utf8');
    return targetFile;
  }
}
