import { readConfig } from "./config.ts";
import { createRuntimeApp } from "./runtime.ts";

const env = readConfig(process.env);
const server = createRuntimeApp().listen(env.PORT, () => console.log(`API disponível na porta ${env.PORT}`));
server.requestTimeout = 15000;
server.headersTimeout = 10000;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
