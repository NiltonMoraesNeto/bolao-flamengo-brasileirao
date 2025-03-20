import jsonServer from 'json-server';
import path from 'path';
import { fileURLToPath } from 'url';

// Esses dois comandos são necessários para obter o caminho do arquivo em um módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, '..', '..', 'db.json')); // Caminho para o arquivo db.json na raiz do projeto
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

export default server;