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
export declare class HandoffManager {
    private knowledgeBasePath;
    private memoryDir;
    private handoffJsonPath;
    private handoffMdPath;
    constructor(knowledgeBasePath: string);
    ensureDir(): void;
    getLatest(): HandoffCheckpoint | null;
    saveCheckpoint(checkpoint: HandoffCheckpoint): void;
    generatePromptForAgent(agentName: string): string;
}
