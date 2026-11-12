import type { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import { validToken } from '../../config/env.js';
import { WebSocketEventPublisher } from './websocket-event.publisher.js';

export class WebSocketServerAdapter {
  public readonly publisher: WebSocketEventPublisher;

  constructor(server: Server) {
    const socketServer = new WebSocketServer({ server, path: '/ws' });
    this.publisher = new WebSocketEventPublisher(socketServer);

    socketServer.on('connection', (socket, request) => {
      const protocols =
        request.headers['sec-websocket-protocol']?.split(',').map((value) => value.trim()) ?? [];

      const supplied = protocols.find((protocol) => protocol.startsWith('auth.'))?.slice(5);

      if (!validToken(supplied)) {
        socket.close(1008, 'Nao autorizado');
        return;
      }

      socket.send(JSON.stringify({ kind: 'ready' }));
    });
  }
}

export function createWebSocketServer(server: Server): WebSocketServerAdapter {
  return new WebSocketServerAdapter(server);
}
