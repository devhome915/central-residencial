import { WebSocket } from 'ws';
import type { EventPublisherPort } from '../../ports/event-publisher.port.js';
import type { HomeEvent } from '../../domain/event.js';

type WebSocketClient = {
  readyState: number;
  send: (data: string) => void;
};

type WebSocketServerLike = {
  clients: Set<WebSocketClient>;
};

export class WebSocketEventPublisher implements EventPublisherPort {
  constructor(private readonly socketServer: WebSocketServerLike | null = null) {}

  setServer(socketServer: WebSocketServerLike | null): void {
    Object.assign(this, { socketServer });
  }

  publish(event: HomeEvent): void {
    if (!this.socketServer) {
      return;
    }

    for (const client of this.socketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ kind: 'event', data: event }));
      }
    }
  }
}
