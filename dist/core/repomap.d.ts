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
export declare class RepoMapGenerator {
    private knowledgeBasePath;
    private projectsDir;
    constructor(knowledgeBasePath: string);
    detectProjectType(dir: string): {
        type: string;
        tech: string[];
        desc: string;
    };
    private collectKeyFiles;
    scanProjects(): ProjectSummary[];
    /**
     * Generates a compact markdown file for all agents with low token usage
     */
    generateRepoMapMarkdown(): string;
    saveRepoMap(): string;
}
