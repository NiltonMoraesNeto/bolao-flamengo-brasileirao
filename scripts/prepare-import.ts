import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { convertLegacy } from "../server/legacy.ts";

const seasons = [
  convertLegacy(JSON.parse(readFileSync("src/services/db.json", "utf8")), 2026),
  convertLegacy(JSON.parse(readFileSync("src/services/db copy.json", "utf8")), 2025),
];
// Gera um artefato privado; nenhuma conexão ou escrita é feita na nuvem.
mkdirSync(".local", { recursive: true });
writeFileSync(".local/import-legacy.sql", `begin;\n${seasons.map(s => s.sql).join("\n")}\ncommit;\n`, { mode: 0o600 });
console.log(JSON.stringify({ file: ".local/import-legacy.sql", seasons: seasons.map(s => s.summary) }, null, 2));
