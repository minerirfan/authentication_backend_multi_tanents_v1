import { ISystemConfigRepository, SystemConfig } from '../../domain/repositories/isystem-config-repository';
import { prisma } from '../config/database';

export class SystemConfigRepository implements ISystemConfigRepository {
  async findFirst(): Promise<SystemConfig | null> {
    const config = await prisma.systemConfig.findFirst();
    if (!config) return null;

    return {
      id: config.id,
      isInitialized: config.isInitialized,
      initializedAt: config.initializedAt,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  async create(config: Omit<SystemConfig, 'createdAt' | 'updatedAt'>): Promise<SystemConfig> {
    const created = await prisma.systemConfig.create({
      data: {
        id: config.id,
        isInitialized: config.isInitialized,
        initializedAt: config.initializedAt,
      },
    });

    return {
      id: created.id,
      isInitialized: created.isInitialized,
      initializedAt: created.initializedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(id: string, data: Partial<SystemConfig>): Promise<SystemConfig> {
    const updated = await prisma.systemConfig.update({
      where: { id },
      data: {
        isInitialized: data.isInitialized,
        initializedAt: data.initializedAt,
      },
    });

    return {
      id: updated.id,
      isInitialized: updated.isInitialized,
      initializedAt: updated.initializedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

