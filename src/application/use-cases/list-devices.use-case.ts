import type { HomeDevice } from '../../domain/device.js';
import type { EventRepositoryPort } from '../../ports/event-repository.port.js';
import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';

const ONLINE_TIMEOUT_MS = 2 * 60 * 1000;

export class ListDevicesUseCase {
  constructor(
    private readonly deviceRepository: DeviceRepositoryPort,
    private readonly eventRepository: EventRepositoryPort,
  ) {}

  execute(): HomeDevice[] {
    const now = Date.now();

    return this.deviceRepository.list().map((device) => {
      const lastEvent = this.eventRepository.findLatestForDevice(device.id, device.name);
      const lastSeenTime = device.last_seen_at ? Date.parse(device.last_seen_at) : Number.NaN;
      const elapsedSinceLastSeen = now - lastSeenTime;
      const connectionStatus = Number.isNaN(lastSeenTime)
        ? 'unknown'
        : elapsedSinceLastSeen >= 0 && elapsedSinceLastSeen <= ONLINE_TIMEOUT_MS
          ? 'online'
          : elapsedSinceLastSeen < 0
            ? 'unknown'
            : 'offline';

      let state: HomeDevice['state'] = 'unknown';
      if (device.kind === 'door') {
        if (lastEvent?.type === 'door_open') {
          state = 'open';
        } else if (lastEvent?.type === 'door_closed') {
          state = 'closed';
        }
      } else if (device.kind === 'sensor' && lastEvent?.type === 'motion') {
        state = 'motion_detected';
      }

      return {
        ...device,
        state,
        connection_status: connectionStatus,
        last_event_type: lastEvent?.type ?? null,
      };
    });
  }
}
