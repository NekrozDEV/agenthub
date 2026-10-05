import fs from 'fs';
import path from 'path';
export const MANAGED_MARKER = '# AgentHub Managed';
export function hasAgentHubMarker(content) {
    return content.includes(MANAGED_MARKER) || content.includes('AgentHub Managed');
}
export function safeWriteManagedRuleFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
        try {
            const existing = fs.readFileSync(filePath, 'utf8');
            if (!hasAgentHubMarker(existing)) {
                // User's custom file: preserve user content and make backup
                const bakPath = `${filePath}.bak`;
                if (!fs.existsSync(bakPath)) {
                    fs.copyFileSync(filePath, bakPath);
                }
                const merged = `${existing.trim()}\n\n${content}`;
                fs.writeFileSync(filePath, merged, 'utf8');
                return;
            }
            else {
                // Check if there was preserved user content before the marker
                const markerIdx = existing.indexOf(MANAGED_MARKER);
                if (markerIdx > 0) {
                    const userPrefix = existing.substring(0, markerIdx).trim();
                    if (userPrefix) {
                        fs.writeFileSync(filePath, `${userPrefix}\n\n${content}`, 'utf8');
                        return;
                    }
                }
            }
        }
        catch { }
    }
    fs.writeFileSync(filePath, content, 'utf8');
}
export function safeCleanupManagedFile(filePath, extraMarkers) {
    if (!fs.existsSync(filePath))
        return false;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isManaged = hasAgentHubMarker(content) || (extraMarkers && extraMarkers.some((m) => content.includes(m)));
        if (!isManaged) {
            // NEVER delete or modify custom files!
            return false;
        }
        const bakPath = `${filePath}.bak`;
        if (!fs.existsSync(bakPath)) {
            try {
                fs.copyFileSync(filePath, bakPath);
            }
            catch { }
        }
        fs.unlinkSync(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export function safeRemoveEmptyDir(dirPath) {
    if (!fs.existsSync(dirPath))
        return false;
    try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
            fs.rmdirSync(dirPath);
            return true;
        }
    }
    catch { }
    return false;
}
export function safeCleanupIgnoreFile(filePath) {
    if (!fs.existsSync(filePath))
        return false;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('# AgentHub Vault Isolation') && !hasAgentHubMarker(content)) {
            return false;
        }
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        const managedLines = new Set([
            '# AgentHub Vault Isolation',
            '# AgentHub Managed',
            '.hub/',
            '*.env*',
            '.env*',
            '!.env.example',
            '!*.env.example',
            '*.bak',
        ]);
        const hasUserLines = lines.some((l) => !managedLines.has(l));
        const bakPath = `${filePath}.bak`;
        if (!fs.existsSync(bakPath)) {
            try {
                fs.copyFileSync(filePath, bakPath);
            }
            catch { }
        }
        if (!hasUserLines) {
            fs.unlinkSync(filePath);
            return true;
        }
        else {
            const stripped = lines.filter((l) => !managedLines.has(l));
            fs.writeFileSync(filePath, stripped.join('\n') + '\n', 'utf8');
            return true;
        }
    }
    catch {
        return false;
    }
}
