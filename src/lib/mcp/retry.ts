export type RetryDelaySource<T> = {
  result?: T;
  error?: unknown;
  attempt: number;
  fallbackDelayMs: number;
};

export type RetryOptions<T> = {
  delaysMs: readonly number[];
  shouldRetryResult?: (result: T) => boolean;
  shouldRetryError?: (err: unknown) => boolean;
  getDelayMs?: (source: RetryDelaySource<T>) => number;
  onAttempt?: (attempt: number) => void;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetriableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "TimeoutError") return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ENOTFOUND";
}

export function retryAfterDelayMs(
  retryAfterHeader: string | null,
  fallbackDelayMs: number
): number {
  if (!retryAfterHeader) return fallbackDelayMs;

  const seconds = Number.parseInt(retryAfterHeader, 10);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(retryAfterHeader);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return fallbackDelayMs;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions<T>
): Promise<T> {
  const maxAttempts = options.delaysMs.length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    options.onAttempt?.(attempt + 1);

    try {
      const result = await operation();
      if (
        attempt < maxAttempts - 1 &&
        options.shouldRetryResult?.(result)
      ) {
        const fallbackDelayMs = options.delaysMs[attempt] ?? 0;
        await sleep(
          options.getDelayMs?.({ result, attempt, fallbackDelayMs }) ?? fallbackDelayMs
        );
        continue;
      }
      return result;
    } catch (error) {
      if (
        attempt < maxAttempts - 1 &&
        (options.shouldRetryError?.(error) ?? isRetriableNetworkError(error))
      ) {
        const fallbackDelayMs = options.delaysMs[attempt] ?? 0;
        await sleep(
          options.getDelayMs?.({ error, attempt, fallbackDelayMs }) ?? fallbackDelayMs
        );
        continue;
      }
      throw error;
    }
  }

  throw new Error("Retry exhausted");
}
