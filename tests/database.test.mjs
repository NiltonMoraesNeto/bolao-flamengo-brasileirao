import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL: RLS, lote, temporadas e upgrade para bloqueio de jogos", async () => {
  const db = new PGlite();
  const admin = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  try {
    // Apenas o contexto Auth é simulado; políticas e transações executam em PostgreSQL real.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `);
    await db.exec(readFileSync(new URL("../supabase/migrations/202610290001_initial.sql", import.meta.url), "utf8"));
    await db.exec(`
      insert into auth.users values ('${admin}'), ('${other}');
      insert into public.admins (user_id) values ('${admin}');
      insert into public.seasons (id) values (2026), (2025);
      insert into public.participants values (2026, '1', 'AMIGO'), (2025, '1', 'AMIGO');
      insert into public.games values
        (2026, '1', 1, now() + interval '1 day', 'Flamengo', 'Vasco'),
        (2026, '2', 2, now() - interval '1 day', 'Vasco', 'Flamengo'),
        (2025, '1', 1, now() - interval '1 year', 'Flamengo', 'Vasco');
    `);
    const asUser = async (id, role = "authenticated") => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec(`set role ${role}`);
    };
    const rows = [{ jogoId: "1", usuario: "AMIGO", golsCasa: 2, golsFora: 1 }];
    const save = (input, reason = null, season = 2026) => db.query(
      "select public.save_predictions($1, $2::jsonb, $3)", [season, JSON.stringify(input), reason],
    );
    const count = async table => Number((await db.query(`select count(*) as n from public.${table}`)).rows[0].n);

    await asUser(other);
    assert.equal(await count("games"), 0);
    await assert.rejects(save(rows));
    await asUser("", "anon");
    await assert.rejects(db.query("select * from public.games_view"));
    await asUser(admin);
    assert.equal(await count("games_view"), 3);
    await assert.rejects(db.query("insert into public.results values (2026, '1', 2, 0)"));
    await save(rows);
    assert.equal(await count("predictions"), 1);
    await save([{ ...rows[0], golsCasa: 3 }]);
    assert.equal(await count("predictions"), 1, "upsert não duplica palpites");
    const beforeAudit = await count("audit_events");
    await assert.rejects(save([rows[0], { ...rows[0], usuario: "INEXISTENTE" }]));
    assert.equal(await count("audit_events"), beforeAudit, "auditoria também reverte");
    assert.equal((await db.query("select gols_casa from public.predictions")).rows[0].gols_casa, 3);
    await assert.rejects(save([rows[0], rows[0]]));
    await assert.rejects(save([{ ...rows[0], golsCasa: -1 }]));
    await assert.rejects(save([{ ...rows[0], golsCasa: 1.5 }]));
    await assert.rejects(save([{ ...rows[0], jogoId: "2" }]));
    await save([{ ...rows[0], jogoId: "2" }], "Transcrição tardia de mensagem anterior");
    await save(rows, "Importação do histórico de temporada", 2025);
    assert.equal(await count("predictions"), 3);
    await assert.rejects(db.query("select public.save_result(2026, '1', 2, 1, null)"));
    await db.query("select public.save_result(2026, '2', 0, 2, null)");
    assert.equal((await db.query("select placar, resultado from public.games_view where season_id = 2026 and id = '2'")).rows[0].resultado, "V");
    await assert.rejects(db.query("select public.save_result(2026, '2', 1, 2, null)"));
    await db.query("select public.save_result(2026, '2', 1, 2, 'Correção conferida com o placar oficial')");
    const prediction = (await db.query("select id from public.predictions where season_id = 2026 and game_id = '2'")).rows[0];
    await assert.rejects(db.query("select public.delete_prediction(2026, $1, null)", [prediction.id]));
    await db.query("select public.delete_prediction(2026, $1, 'Correção solicitada pelo administrador')", [prediction.id]);
    assert.equal(await count("predictions"), 2);

    // Upgrade de um banco já configurado: não modifica o histórico existente.
    const history = await db.query("select * from public.results order by season_id, game_id");
    const picksBefore = await db.query("select * from public.predictions order by id");
    await db.exec("reset role");
    await db.exec(readFileSync(new URL("../supabase/migrations/202610300003_lock_finished_games.sql", import.meta.url), "utf8"));
    await asUser(admin);
    assert.deepEqual((await db.query("select * from public.results order by season_id, game_id")).rows, history.rows);
    assert.deepEqual((await db.query("select * from public.predictions order by id")).rows, picksBefore.rows);
    await assert.rejects(save([{ ...rows[0], jogoId: "2" }], "Justificativa não destrava jogo encerrado"));
    await assert.rejects(save(rows, "Justificativa não destrava temporada passada", 2025));
    await assert.rejects(db.query("select public.save_result(2026, '2', 9, 9, 'Tentativa de correção de resultado final')"));
    assert.equal((await db.query("select gols_casa from public.results where season_id=2026 and game_id='2'")).rows[0].gols_casa, 1);
    const historicalPick = (await db.query("select id from public.predictions where season_id=2025")).rows[0];
    await assert.rejects(db.query("select public.delete_prediction(2025, $1, 'Justificativa não destrava jogo passado')", [historicalPick.id]));
    const auditBefore = await count("audit_events");
    await assert.rejects(save([{ ...rows[0], golsCasa: 9 }, { ...rows[0], jogoId: "2" }], "Lote contém jogo bloqueado"));
    assert.equal(await count("audit_events"), auditBefore, "lote com jogo bloqueado reverte auditoria");
    assert.equal((await db.query("select gols_casa from public.predictions where season_id=2026 and game_id='1'")).rows[0].gols_casa, 3);
    const futurePick = (await db.query("select id from public.predictions where season_id=2026 and game_id='1'")).rows[0];
    await db.query("select public.delete_prediction(2026, $1, null)", [futurePick.id]);
    await save(rows);

    await db.exec("reset role");
    await db.exec(`insert into public.games values
      (2026, '3', 3, now() + interval '1 day', 'Flamengo', 'Vasco'),
      (2026, '4', 4, now() - interval '1 day', 'Flamengo', 'Vasco');
      insert into public.results values (2026, '3', 2, 0);
      insert into public.predictions (season_id,game_id,participant_id,gols_casa,gols_fora)
        values (2026,'3','1',2,0);`);
    await asUser(admin);
    await assert.rejects(save([{ ...rows[0], jogoId: "3" }]), "resultado fecha palpites mesmo com data futura");
    const finishedPick = (await db.query("select id from public.predictions where game_id='3'")).rows[0];
    await assert.rejects(db.query("select public.delete_prediction(2026, $1, 'Mesmo com justificativa continua bloqueado')", [finishedPick.id]));
    await db.query("select public.save_result(2026, '4', 0, 0, null)");
    await assert.rejects(db.query("select public.save_result(2026, '4', 1, 0, 'Correção não permitida após resultado final')"));
    await assert.rejects(db.query("update public.results set gols_casa=9 where game_id='4'"));
    await asUser(other);
    await assert.rejects(save(rows));
    await asUser("", "anon");
    await assert.rejects(db.query("select public.save_result(2026, '4', 0, 0, null)"));
  } finally {
    await db.close();
  }
});
