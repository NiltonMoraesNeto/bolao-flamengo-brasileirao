export class UpstreamError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code?: string) {
    super("Falha na comunicação com Supabase");
    this.status = status;
    this.code = code;
  }
}

export interface SupabaseGateway {
  request(path: string, token?: string, body?: unknown, method?: string): Promise<unknown>;
}

export function createSupabaseGateway(url: string, key: string): SupabaseGateway {
  return {
    async request(path, token, body, method = body === undefined ? "GET" : "POST") {
      let response: Response;
      try {
        response = await fetch(`${url}${path}`, {
          method,
          headers: {
            apikey: key,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        throw new UpstreamError(503);
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code = data && typeof data === "object" && "code" in data ? String(data.code) : undefined;
        throw new UpstreamError(response.status, code);
      }
      return data;
    },
  };
}
