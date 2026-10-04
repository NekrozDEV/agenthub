export interface SkillTemplate {
    id: string;
    filename: string;
    title: string;
    description: string;
    category: 'core' | 'frontend' | 'security' | 'architecture' | 'quality';
    content: string;
}
export declare const DEFAULT_SKILLS: SkillTemplate[];
