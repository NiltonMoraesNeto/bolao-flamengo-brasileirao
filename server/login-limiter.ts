import { createHash } from "node:crypto";
import { z } from "zod";
import type { SupabaseGateway } from "./supabase.ts";

export interface LoginLimiter {
  consume(address: string): Promise<number>;
}

// Contagem atômica no PostgreSQL, compartilhada entre todas as funções/instâncias.
// O banco recebe somente um hash; nunca senha, email ou endereço IP em texto.
export function createLoginLimiter(gateway: SupabaseGateway): LoginLimiter {
  return {
    async consume(address) {
      const key = createHash("sha256").update(`bolao-login:${address}`).digest("hex");
      return z.number().int().min(0).max(900).parse(await gateway.request(
        "/rest/v1/rpc/consume_login_attempt", undefined, { p_key: key },
      ));
    },
  };
}
