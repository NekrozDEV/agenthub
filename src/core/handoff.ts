import fs from 'fs';
import path from 'path';

export interface HandoffCheckpoint {
  id: string;
  timestamp: string;
  activeTask: string;
  status: 'in_progress' | 'blocked' | 'ready_for_review' | 'completed';
  sourceAgent: string;
  targetAgent?: string;
  summary: string;
  modifiedFiles: string[];
  nextSteps: string[];
  notes?: string;
}

export class HandoffManager {
  private knowledgeBasePath: string;
  private memoryDir: string;
  private handoffJsonPath: string;
  private handoffMdPath: string;

  constructor(knowledgeBasePath: string) {
    this.knowledgeBasePath = knowledgeBasePath;
    this.memoryDir = path.join(knowledgeBasePath, '.hub', 'memory');
    this.handoffJsonPath = path.join(this.memoryDir, 'handoff.json');
    this.handoffMdPath = path.join(knowledgeBasePath, 'HANDOFF.md');
  }

  public ensureDir(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  public getLatest(): HandoffCheckpoint | null {
    if (!fs.existsSync(this.handoffJsonPath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(this.handoffJsonPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public saveCheckpoint(checkpoint: HandoffCheckpoint): void {
    this.ensureDir();
    fs.writeFileSync(this.handoffJsonPath, JSON.stringify(checkpoint, null, 2), 'utf8');

    // Generate markdown version for instant ingestion by any AI system
    const mdLines = [
      '# 🔄 AgentHub Cross-Agent Handoff',
      `> Checkpoint created at **${checkpoint.timestamp}** by **${checkpoint.sourceAgent}**`,
      '',
      `### 🎯 Active Task: ${checkpoint.activeTask}`,
      `- **Status**: \`${checkpoint.status.toUpperCase()}\``,
      checkpoint.targetAgent ? `- **Intended Next Agent**: ${checkpoint.targetAgent}` : '',
      '',
      '### 📝 Progress Summary',
      checkpoint.summary,
      '',
      '### 📂 Files Touched / Modified',
      checkpoint.modifiedFiles.length > 0
        ? checkpoint.modifiedFiles.map((f) => `- \`${f}\``).join('\n')
        : '- *(None recorded)*',
      '',
      '### ⏭️ Immediate Next Steps for Next AI',
      checkpoint.nextSteps.length > 0
        ? checkpoint.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : '- Continue task execution.',
      '',
    ];

    if (checkpoint.notes) {
      mdLines.push('### 💡 Context & Gotchas');
      mdLines.push(checkpoint.notes);
      mdLines.push('');
    }

    fs.writeFileSync(this.handoffMdPath, mdLines.filter(Boolean).join('\n'), 'utf8');
  }

  public generatePromptForAgent(agentName: string): string {
    const cp = this.getLatest();
    if (!cp) {
      return 'No active handoff checkpoint found in this Knowledge Base.';
    }

    return `[AgentHub Handoff from ${cp.sourceAgent} to ${agentName}]
Task: ${cp.activeTask}
Status: ${cp.status}
Summary: ${cp.summary}
Files modified: ${cp.modifiedFiles.join(', ')}
Next steps:
${cp.nextSteps.map((s, idx) => `  ${idx + 1}. ${s}`).join('\n')}
${cp.notes ? `Notes: ${cp.notes}` : ''}`;
  }
}
