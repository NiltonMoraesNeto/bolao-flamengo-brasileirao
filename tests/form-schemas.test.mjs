import { test } from "node:test";
import assert from "node:assert/strict";
import { FormApi, FieldApi } from "@tanstack/react-form";
import { loginFormSchema, resultFormSchema, correctionFormSchema, predictionDraftFormSchema } from "../src/domain/form-schemas.ts";
import { createPredictionDraft } from "../src/domain/prediction-batch.ts";

test("Zod valida login sem alterar a senha e normaliza somente o email", () => {
  assert.equal(loginFormSchema.safeParse({ email: "inválido", password: "x" }).success, false);
  assert.equal(loginFormSchema.safeParse({ email: "admin@example.com", password: "" }).success, false);
  assert.deepEqual(loginFormSchema.parse({ email: " admin@example.com ", password: " senha com espaços " }), {
    email: "admin@example.com", password: " senha com espaços ",
  });
});

test("resultado exige dois gols válidos e justificativa somente em correção", () => {
  assert.equal(resultFormSchema(false).safeParse({ home: "0", away: "0", reason: "" }).success, true);
  for (const home of ["", "-1", "1.5", "100", "1e1"]) {
    assert.equal(resultFormSchema(false).safeParse({ home, away: "0", reason: "" }).success, false);
  }
  assert.equal(resultFormSchema(true).safeParse({ home: "0", away: "0", reason: "" }).success, false);
  assert.equal(resultFormSchema(true).safeParse({ home: "0", away: "0", reason: "Correção conferida" }).success, true);
});

test("TanStack Form aplica o schema Zod antes de permitir a conferência", async () => {
  let submissions = 0;
  const form = new FormApi({
    defaultValues: { rows: createPredictionDraft([{ id: "a", nome: "AMIGO" }], []) },
    validators: { onChange: predictionDraftFormSchema, onSubmit: predictionDraftFormSchema },
    onSubmit: () => { submissions++; },
  });
  const unmount = form.mount();
  const home = new FieldApi({ form, name: "rows[0].golsCasa" });
  const away = new FieldApi({ form, name: "rows[0].golsFora" });
  const unmountHome = home.mount();
  const unmountAway = away.mount();
  try {
    home.handleChange("2");
    await form.handleSubmit();
    assert.equal(submissions, 0, "placar parcial não chega ao onSubmit");
    away.handleChange("0");
    await form.handleSubmit();
    assert.equal(submissions, 1);
    form.reset();
    assert.equal(form.state.values.rows[0].golsCasa, "");
    assert.equal(form.state.values.rows[0].golsFora, "");
  } finally { unmountAway(); unmountHome(); unmount(); }
});

test("TanStack Form bloqueia justificativa curta antes de chamar a gravação", async () => {
  let writes = 0;
  const form = new FormApi({
    defaultValues: { reason: "" }, validators: { onChange: correctionFormSchema(true), onSubmit: correctionFormSchema(true) },
    onSubmit: () => { writes++; },
  });
  const unmount = form.mount();
  const field = new FieldApi({ form, name: "reason" });
  const unmountField = field.mount();
  try {
    await form.handleSubmit();
    assert.equal(writes, 0);
    field.handleChange("Transcrição conferida");
    await form.handleSubmit();
    assert.equal(writes, 1);
  } finally { unmountField(); unmount(); }
});
