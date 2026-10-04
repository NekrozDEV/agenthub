export interface SyncStatus {
    isGitRepo: boolean;
    hasUncommittedChanges: boolean;
    branch: string;
    hasRemote: boolean;
    remoteUrl?: string;
    leaksPrevented: number;
}
export declare class TeamSyncManager {
    private knowledgeBasePath;
    constructor(knowledgeBasePath: string);
    private runGit;
    checkGit(): SyncStatus;
    preFlightSecurityCheck(): {
        safe: boolean;
        error?: string;
    };
    initGit(): void;
    commitSharedChanges(message: string): {
        success: boolean;
        output: string;
    };
    pullShared(): string;
    pushShared(): string;
}
