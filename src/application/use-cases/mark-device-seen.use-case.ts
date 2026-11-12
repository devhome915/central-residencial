import type { DeviceRepositoryPort } from '../../ports/device-repository.port.js';

export class MarkDeviceSeenUseCase {
  constructor(private readonly deviceRepository: DeviceRepositoryPort) {}

  execute(id: string): void {
    const marked = this.deviceRepository.markSeen(id, new Date().toISOString());

    if (!marked) {
      throw new Error('Dispositivo não encontrado');
    }
  }
}
