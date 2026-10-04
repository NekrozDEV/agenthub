export declare class AgentHubMcpServer {
    private server;
    private knowledgeBasePath;
    private vault;
    private leakGuard;
    private handoffManager;
    private repoMapGen;
    constructor(customKnowledgeBasePath?: string);
    private setupTools;
    private setupResources;
    private setupPrompts;
    start(): Promise<void>;
}
export declare function startAgentHubMcpServer(customKnowledgeBasePath?: string): Promise<void>;
