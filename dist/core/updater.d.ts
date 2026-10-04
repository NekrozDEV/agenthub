import { SupportedLanguage } from './config.js';
export interface UpdateCheckResult {
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion: string;
    source: 'cache' | 'network';
}
/**
 * Returns current version of AgentHub from package.json
 */
export declare function getCurrentVersion(): string;
/**
 * Compares two semver strings: a and b.
 * Returns:
 *   1 if a > b
 *  -1 if a < b
 *   0 if a == b
 */
export declare function compareSemver(a: string, b: string): number;
/**
 * Fetches the latest version available remotely
 */
export declare function fetchRemoteVersion(): Promise<string | null>;
/**
 * Checks if a newer version of AgentHub is available.
 * Cached for 24 hours unless force is true.
 */
export declare function checkForUpdates(force?: boolean): Promise<UpdateCheckResult>;
/**
 * Renders a stylish orange update notification box
 */
export declare function renderUpdateNotice(result: UpdateCheckResult, lang?: SupportedLanguage): string;
/**
 * Executes the update process via git or npm
 */
export declare function performUpdate(lang?: SupportedLanguage): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Gets the auto-update preference from global config
 */
export declare function getAutoUpdateSetting(): 'prompt' | 'auto' | 'off';
/**
 * Sets the auto-update preference in global config
 */
export declare function setAutoUpdateSetting(setting: 'prompt' | 'auto' | 'off'): void;
