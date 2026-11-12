import type { HomeEvent } from '../domain/event.js';

export interface EventPublisherPort {
  publish(event: HomeEvent): void;
}
