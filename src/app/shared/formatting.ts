export function formatErrors(errorObj: Record<string, string[]>): string[] {
    if (!errorObj) return [];
    return Object.entries(errorObj).map(([key, msgs]) => `${key} ${msgs}`);
}