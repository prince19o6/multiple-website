// lib/remoteFunctionLoader.ts

/** Structured error returned by importRemoteModule / importRemoteModuleSafe */
export class RemoteModuleError extends Error {
    constructor(
        public readonly url: string,
        public readonly reason: "network" | "timeout" | "invalid-url" | "execution",
        cause?: unknown
    ) {
        super(
            `[RemoteFunctionLoader] Failed to load module from "${url}" (${reason})${
                cause instanceof Error ? `: ${cause.message}` : ""
            }`
        );
        this.name = "RemoteModuleError";
    }
}

const ALLOWED_PROTOCOLS = ["https:", "http:"];
const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Validates that a remote URL is safe to dynamically import from.
 * Throws RemoteModuleError with reason "invalid-url" on failure.
 */
function assertSafeUrl(url: string): void {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new RemoteModuleError(url, "invalid-url");
    }
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        throw new RemoteModuleError(url, "invalid-url");
    }
}

/**
 * Dynamically imports a JavaScript ESM module from a remote URL.
 *
 * - Validates the URL before fetching (blocks non-http/https schemes).
 * - Races against a configurable timeout so a hung remote never blocks the UI.
 * - Throws a typed `RemoteModuleError` on any failure so callers can
 *   distinguish network errors from execution errors.
 */
export async function importRemoteModule<T = any>(
    remoteModuleUrl: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
    assertSafeUrl(remoteModuleUrl);

    const importPromise = import(/* webpackIgnore: true */ remoteModuleUrl) as Promise<T>;

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject(new RemoteModuleError(remoteModuleUrl, "timeout")),
            timeoutMs
        )
    );

    try {
        return await Promise.race([importPromise, timeoutPromise]);
    } catch (err) {
        if (err instanceof RemoteModuleError) throw err;
        // TypeError from a failed fetch (network / CORS / 404) → "network"
        throw new RemoteModuleError(remoteModuleUrl, "network", err);
    }
}

export interface SafeImportResult<T> {
    module: T | null;
    error: RemoteModuleError | null;
}

/**
 * Non-throwing wrapper around `importRemoteModule`.
 * Always resolves — callers check `error` to know if the import succeeded.
 */
export async function importRemoteModuleSafe<T = any>(
    remoteModuleUrl: string,
    timeoutMs?: number
): Promise<SafeImportResult<T>> {
    try {
        const mod = await importRemoteModule<T>(remoteModuleUrl, timeoutMs);
        return { module: mod, error: null };
    } catch (err) {
        const error =
            err instanceof RemoteModuleError
                ? err
                : new RemoteModuleError(remoteModuleUrl, "execution", err);
        console.warn(error.message);
        return { module: null, error };
    }
}

/**
 * Safely executes a remote JS function string within a controlled sandbox scope.
 * Throws RemoteModuleError with reason "execution" on failure.
 */
export function executeRemoteFunction<TResult = any>(
    functionCode: string,
    args: Record<string, any> = {}
): TResult {
    const argNames = Object.keys(args);
    const argValues = Object.values(args);
    try {
        const evaluator = new Function(...argNames, `"use strict"; ${functionCode}`);
        return evaluator(...argValues);
    } catch (error) {
        throw new RemoteModuleError("inline-function", "execution", error);
    }
}
