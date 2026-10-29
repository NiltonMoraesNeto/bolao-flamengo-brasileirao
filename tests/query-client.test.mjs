import { test } from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";
import { createQueryClient, bolaoKeys } from "../src/lib/query-client.ts";

test("Query reutiliza leitura recente e invalida recursos alterados", async () => {
  const client = createQueryClient();
  let calls = 0;
  const query = { queryKey: bolaoKeys.predictions, queryFn: async () => { calls++; return [{ id: "p1" }]; } };
  try {
    await client.fetchQuery(query);
    await client.fetchQuery(query);
    assert.equal(calls, 1);
    await client.invalidateQueries({ queryKey: bolaoKeys.predictions });
    await client.fetchQuery(query);
    assert.equal(calls, 2);
  } finally { client.clear(); }
});

test("Query mantém jogos separados e limpa dados privados ao encerrar sessão", () => {
  const client = createQueryClient();
  client.setQueryData(bolaoKeys.game("34"), { predictions: ["a"] });
  client.setQueryData(bolaoKeys.game("35"), { predictions: [] });
  assert.deepEqual(client.getQueryData(bolaoKeys.game("34")), { predictions: ["a"] });
  assert.deepEqual(client.getQueryData(bolaoKeys.game("35")), { predictions: [] });
  client.clear();
  assert.equal(client.getQueryData(bolaoKeys.game("34")), undefined);
});

test("Query não repete acesso recusado nem mutação com resposta incerta", async () => {
  const client = createQueryClient();
  let reads = 0;
  let writes = 0;
  try {
    const error = new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, { status: 401 });
    await assert.rejects(client.fetchQuery({ queryKey: bolaoKeys.games, queryFn: async () => { reads++; throw error; } }));
    assert.equal(reads, 1);
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => { writes++; throw new Error("Connection lost"); },
    });
    await assert.rejects(mutation.execute({}));
    assert.equal(writes, 1);
  } finally { client.clear(); }
});
