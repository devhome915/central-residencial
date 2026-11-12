import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createWebSocketServer } from './adapters/websocket/websocket-server.js';

const server = createServer();
const webSocketServer = createWebSocketServer(server);
const app = createApp(webSocketServer.publisher);

server.on('request', app);

server.listen(env.port, env.host, () => {
  console.log(`Central ativa em http://${env.host}:${env.port}`);
});
