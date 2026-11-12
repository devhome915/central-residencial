import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';

export class DeleteDeviceUseCase {
  constructor(private readonly deviceRepository: DeviceRepositoryPort) {}

  execute(id: string): void {
    const deleted = this.deviceRepository.delete(id);

    if (!deleted) {
      throw new Error('Dispositivo não encontrado');
    }
  }
}
